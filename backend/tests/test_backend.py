import asyncio
import uuid

import pytest
from app.agents.generator import generate_question, get_mock_draft
from app.agents.image_generator import calculate_flux_image_cost, generate_image_stimulus
from app.agents.regenerator import improve_draft_heuristically, regenerate_question
from app.agents.reviewer import evaluate_heuristically, review_question
from app.core.config import config
from app.db.session import init_db
from app.repositories.question_repo import delete_question, get_questions, save_question
from app.schemas import (
    Difficulty,
    GenerationRequest,
    OptionChoice,
    Question,
    QuestionDraft,
    ReviewScore,
    UCATSection,
)
from app.workflow.graph import (
    finalize_node,
    generator_node,
    image_node,
    reviewer_node,
    route_after_review,
)


@pytest.mark.asyncio
async def test_schemas_validation():
    # Test valid options
    opts = [
        OptionChoice(id="A", text="Option A"),
        OptionChoice(id="B", text="Option B"),
        OptionChoice(id="C", text="Option C"),
        OptionChoice(id="D", text="Option D"),
    ]
    draft = QuestionDraft(
        stimulus_text="Sample UCAT reading passage.",
        question_stem="Which option follows?",
        options=opts,
        correct_answer_id="B",
        explanation="Option B is correct because...",
        image_needed=False,
    )
    assert len(draft.options) == 4
    assert draft.correct_answer_id == "B"


@pytest.mark.asyncio
async def test_all_ucat_sections_mock():
    for sec in UCATSection:
        req = GenerationRequest(
            section=sec,
            subtopic="Core Syllabus",
            difficulty=Difficulty.MEDIUM,
            require_image=(sec == UCATSection.ABSTRACT_REASONING),
        )
        draft = get_mock_draft(req)
        assert len(draft.options) == 4
        assert draft.correct_answer_id in ["A", "B", "C", "D"]
        assert len(draft.explanation) > 20


@pytest.mark.asyncio
async def test_reviewer_heuristic_and_loop_routing():
    req = GenerationRequest(section=UCATSection.VERBAL_REASONING, difficulty=Difficulty.MEDIUM)
    draft = get_mock_draft(req)

    # Iteration 1 score should be <= 90 to test re-generation loop
    rev1 = evaluate_heuristically(draft, req, iteration=1)
    assert rev1.total_score <= 90
    assert not rev1.passed

    # Test route_after_review sends to regenerator
    state1 = {
        "request": req.model_dump(),
        "current_draft": draft.model_dump(),
        "current_review": rev1.model_dump(),
        "iteration_count": 1,
    }
    next_node = route_after_review(state1)
    assert next_node == "regenerator"

    # Iteration 2 should score > 90 and pass
    rev2 = evaluate_heuristically(draft, req, iteration=2)
    assert rev2.total_score > 90
    assert rev2.passed

    state2 = {
        "request": req.model_dump(),
        "current_draft": draft.model_dump(),
        "current_review": rev2.model_dump(),
        "iteration_count": 2,
    }
    next_node2 = route_after_review(state2)
    assert next_node2 in ["image_generator", "finalize"]


@pytest.mark.asyncio
async def test_strict_rejection_routing_when_score_le_90():
    from app.core.config import config
    from app.workflow.graph import reject_node

    req = GenerationRequest(section=UCATSection.DECISION_MAKING, difficulty=Difficulty.HARD)
    draft = get_mock_draft(req)

    # Reviewer score of 82 (<= 90) at maximum iteration attempt (3)
    rev_failing = ReviewScore(
        authenticity_score=20,
        clarity_score=20,
        distractor_score=20,
        explanation_score=22,
        total_score=82,
        strengths=["Good topic"],
        weaknesses=["Distractor A is trivial"],
        recommendations=["Improve Distractor A"],
        passed=False,
    )

    state_failing = {
        "request": req.model_dump(),
        "current_draft": draft.model_dump(),
        "current_review": rev_failing.model_dump(),
        "iteration_count": config.MAX_REGENERATION_ATTEMPTS,
    }

    # At max attempts, route_after_review MUST route to 'reject'
    next_node = route_after_review(state_failing)
    assert next_node == "reject"

    # Executing reject_node must produce rejection diagnostic payload without persisting
    reject_res = await reject_node(state_failing)
    assert reject_res["status"] == "rejected_below_threshold"
    assert reject_res["rejection_data"]["final_score"] == 82
    assert "reason" in reject_res["rejection_data"]


@pytest.mark.asyncio
async def test_image_generator_svg(monkeypatch):
    monkeypatch.setattr(config, "DEEPINFRA_API_KEY", "")
    req_ar = GenerationRequest(section=UCATSection.ABSTRACT_REASONING, difficulty=Difficulty.HARD)
    draft_ar = get_mock_draft(req_ar)
    img_url, img_svg, img_desc, usage = await generate_image_stimulus(draft_ar, req_ar)

    assert img_svg is not None
    assert "<svg" in img_svg
    assert "</svg>" in img_svg
    assert usage is not None
    assert usage["agent_name"] == "Image Generator"
    assert usage["cost_usd"] == 0.0


def test_flux_image_cost_formula():
    """
    Verifies mathematical pricing:
    Cost = $0.0005 * (width / 1024) * (height / 1024) * iters
    """
    # Baseline: 1024x1024, 4 iters -> 0.0005 * 1 * 1 * 4 = $0.0020
    assert calculate_flux_image_cost(1024, 1024, 4) == 0.002
    assert config.calculate_flux_image_cost(1024, 1024, 4) == 0.002

    # Resolution 768x768, 4 iters -> 0.0005 * 0.75 * 0.75 * 4 = $0.001125
    assert calculate_flux_image_cost(768, 768, 4) == 0.001125

    # Resolution 512x512, 1 iter -> 0.0005 * 0.5 * 0.5 * 1 = $0.000125
    assert calculate_flux_image_cost(512, 512, 1) == 0.000125

    # Resolution 512x512, 4 iters -> 0.0005 * 0.5 * 0.5 * 4 = $0.0005
    assert calculate_flux_image_cost(512, 512, 4) == 0.0005

    # Resolution 1024x1024, 1 iter -> 0.0005 * 1 * 1 * 1 = $0.0005
    assert calculate_flux_image_cost(1024, 1024, 1) == 0.0005


@pytest.mark.asyncio
async def test_image_node_workflow_accumulation():
    """Verifies that image_node accurately accumulates usage into workflow state."""
    req = GenerationRequest(section=UCATSection.ABSTRACT_REASONING, difficulty=Difficulty.MEDIUM)
    draft = get_mock_draft(req)
    state = {
        "request": req.model_dump(),
        "current_draft": draft.model_dump(),
        "total_cost_usd": 0.0015,
        "agent_usage_breakdown": [
            {"agent_name": "Question Generator", "cost_usd": 0.0010},
            {"agent_name": "Question Reviewer", "cost_usd": 0.0005},
        ],
    }
    res = await image_node(state)
    assert res["active_agent"] == "Image Generator"
    assert res["status"] == "image_generated"
    assert len(res["agent_usage_breakdown"]) == 3
    assert res["agent_usage_breakdown"][-1]["agent_name"] == "Image Generator"
    assert "latest_usage" in res


@pytest.mark.asyncio
async def test_database_crud():
    await init_db()
    opts = [
        OptionChoice(id="A", text="Option A"),
        OptionChoice(id="B", text="Option B"),
        OptionChoice(id="C", text="Option C"),
        OptionChoice(id="D", text="Option D"),
    ]
    test_q = Question(
        section="decision_making",
        section_label="Decision Making",
        subtopic="Logical Syllogisms",
        difficulty="medium",
        stimulus_text="Test stimulus",
        question_stem="Test question stem?",
        options=opts,
        correct_answer_id="C",
        explanation="Step-by-step test explanation",
        final_score=94,
        iteration_count=2,
    )

    saved = await save_question(test_q)
    assert saved.id == test_q.id

    retrieved = await get_questions(section="decision_making")
    assert any(q.id == test_q.id for q in retrieved)

    deleted = await delete_question(test_q.id)
    assert deleted is True


@pytest.mark.asyncio
async def test_deepinfra_model_configuration():
    from app.core.config import config

    assert "deepinfra" in config.DEFAULT_TEXT_MODEL.lower()
    assert "Llama-3.3-70B-Instruct-Turbo" in config.DEFAULT_TEXT_MODEL
    assert config.COST_PER_MILLION_INPUT_TOKENS == 0.10
    assert config.COST_PER_MILLION_OUTPUT_TOKENS == 0.32


@pytest.mark.asyncio
async def test_token_and_cost_calculation():
    from app.agents.base import calculate_token_cost

    # 1,000 prompt tokens @ $0.10/1M = $0.0001
    # 1,000 completion tokens @ $0.32/1M = $0.00032
    # Total = $0.00042
    cost = calculate_token_cost(prompt_tokens=1000, completion_tokens=1000)
    assert cost == 0.00042

    # 1,000,000 input tokens = $0.10
    cost_in = calculate_token_cost(prompt_tokens=1_000_000, completion_tokens=0)
    assert cost_in == 0.10

    # 1,000,000 output tokens = $0.32
    cost_out = calculate_token_cost(prompt_tokens=0, completion_tokens=1_000_000)
    assert cost_out == 0.32


@pytest.mark.asyncio
async def test_workflow_token_accumulation():
    req = GenerationRequest(section=UCATSection.VERBAL_REASONING, difficulty=Difficulty.MEDIUM)
    init_state = {
        "request": req.model_dump(),
        "iteration_count": 1,
        "iterations_history": [],
        "total_tokens": 0,
        "total_prompt_tokens": 0,
        "total_completion_tokens": 0,
        "total_cost_usd": 0.0,
        "agent_usage_breakdown": [],
    }
    # Test generator_node returns token usage
    gen_res = await generator_node(init_state)
    assert "total_tokens" in gen_res
    assert gen_res["total_tokens"] > 0
    assert gen_res["total_cost_usd"] > 0.0
    assert len(gen_res["agent_usage_breakdown"]) == 1

    # Merge into state and run reviewer_node
    init_state.update(gen_res)
    rev_res = await reviewer_node(init_state)
    assert rev_res["total_tokens"] > gen_res["total_tokens"]
    assert rev_res["total_cost_usd"] > gen_res["total_cost_usd"]
    assert len(rev_res["agent_usage_breakdown"]) == 2


@pytest.mark.asyncio
async def test_deepinfra_strict_api_key_enforcement():
    import os

    from app.agents.base import call_llm
    from app.core.config import config

    # Save original key
    original_key = config.DEEPINFRA_API_KEY
    original_env = os.environ.get("DEEPINFRA_API_KEY")
    try:
        config.DEEPINFRA_API_KEY = ""
        if "DEEPINFRA_API_KEY" in os.environ:
            del os.environ["DEEPINFRA_API_KEY"]

        with pytest.raises(ValueError) as excinfo:
            await call_llm(
                prompt="test prompt",
                system_prompt="test system",
                model="deepinfra/meta-llama/Llama-3.3-70B-Instruct-Turbo",
            )
        assert "DeepInfra API Key is required" in str(excinfo.value)
    finally:
        config.DEEPINFRA_API_KEY = original_key
        if original_env:
            os.environ["DEEPINFRA_API_KEY"] = original_env


@pytest.mark.asyncio
async def test_admin_approval_and_persistence_endpoints():
    import uuid

    from app.api.v1.questions import approve_and_save_question, batch_approve_and_save_questions
    from app.repositories.question_repo import delete_question, get_question_by_id
    from app.schemas import OptionChoice, Question, ReviewScore

    # 1. Test finalize_node with auto_save=False (Default for Admin Review)
    req = GenerationRequest(
        section=UCATSection.VERBAL_REASONING, difficulty=Difficulty.MEDIUM, auto_save=False
    )
    draft_data = {
        "stimulus_text": "Clinical patient trial data on neuroprotective agents.",
        "question_stem": "Which trial finding supports the clinical efficacy?",
        "options": [
            {"id": "A", "text": "Significant reduction in infarct volume."},
            {"id": "B", "text": "Adverse events reported in high doses."},
            {"id": "C", "text": "Participant attrition rate was 12%."},
            {"id": "D", "text": "No statistical difference noted."},
        ],
        "correct_answer_id": "A",
        "explanation": "Option A directly demonstrates efficacy.",
    }
    review_data = {
        "authenticity_score": 24,
        "clarity_score": 24,
        "distractor_score": 24,
        "explanation_score": 24,
        "total_score": 96,
        "strengths": ["Clear stimulus"],
        "weaknesses": [],
        "recommendations": [],
    }
    state = {
        "request": req.model_dump(),
        "current_draft": draft_data,
        "current_review": review_data,
        "iteration_count": 1,
        "iterations_history": [],
        "total_tokens": 1200,
        "total_cost_usd": 0.00045,
        "stage_outcomes": {},
    }
    fin_res = await finalize_node(state)
    candidate = fin_res["final_question"]
    cand_id = candidate["id"]

    # Verify candidate is NOT automatically saved in database
    db_check = await get_question_by_id(cand_id)
    assert db_check is None, "Candidate question should NOT be saved in DB before Admin approval!"

    # 2. Test Admin Approval: POST /questions
    q_schema = Question(**candidate)
    approve_res = await approve_and_save_question(q_schema)
    assert approve_res["success"] is True
    assert approve_res["question"]["id"] == cand_id

    # Verify candidate is now saved in DB
    db_saved = await get_question_by_id(cand_id)
    assert db_saved is not None
    assert db_saved.id == cand_id
    assert db_saved.final_score == 96

    # 3. Test Batch Approval: POST /questions/batch
    batch_q1 = Question(
        id=str(uuid.uuid4()),
        section="decision_making",
        section_label="Decision Making",
        subtopic="Syllogisms",
        difficulty="Medium",
        stimulus_text="All doctors are certified.",
        question_stem="Is Dr. Smith certified?",
        options=[
            OptionChoice(id="A", text="Yes"),
            OptionChoice(id="B", text="No"),
            OptionChoice(id="C", text="Cannot Tell"),
            OptionChoice(id="D", text="Insufficient"),
        ],
        correct_answer_id="A",
        explanation="Yes by syllogism.",
        final_score=94,
    )
    batch_q2 = Question(
        id=str(uuid.uuid4()),
        section="quantitative_reasoning",
        section_label="Quantitative Reasoning",
        subtopic="Dosage Calculation",
        difficulty="Easy",
        stimulus_text="Dosage is 10mg/kg.",
        question_stem="What is the dose for 70kg?",
        options=[
            OptionChoice(id="A", text="700mg"),
            OptionChoice(id="B", text="500mg"),
            OptionChoice(id="C", text="100mg"),
            OptionChoice(id="D", text="350mg"),
        ],
        correct_answer_id="A",
        explanation="70 * 10 = 700mg.",
        final_score=95,
    )

    batch_res = await batch_approve_and_save_questions([batch_q1, batch_q2])
    assert batch_res["success"] is True
    assert batch_res["saved_count"] == 2

    # Clean up test questions
    await delete_question(cand_id)
    await delete_question(batch_q1.id)
    await delete_question(batch_q2.id)


@pytest.mark.asyncio
async def test_multichoice_and_passage_support():
    from app.repositories.question_repo import get_question_by_id, save_question

    # 1. Test multi-choice GenerationRequest with passage and trap
    req = GenerationRequest(
        section=UCATSection.VERBAL_REASONING,
        difficulty=Difficulty.HARD,
        interaction_type="multi_choice",
        passage_required="Yes",
        primary_trap="Extreme_Language",
    )
    draft, usage = await generate_question(req)

    assert len(draft.options) in (4, 5)
    assert len(draft.correct_answer_ids) >= 1
    assert draft.correct_answer_id is not None
    assert len(draft.stimulus_text) > 100

    # 2. Test Question model creation with multiple keys
    multi_q = Question(
        id=str(uuid.uuid4()),
        section="verbal_reasoning",
        section_label="Verbal Reasoning",
        subtopic="Critical Inference",
        difficulty="Hard",
        interaction_type="multi_choice",
        primary_trap="Extreme_Language",
        passage_required="Yes",
        stimulus_text="A comprehensive 300-word clinical study on pharmacology...",
        question_stem="Which TWO of the following statements are supported by the passage?",
        options=[
            OptionChoice(id="A", text="Statement A is clinically validated."),
            OptionChoice(id="B", text="Statement B is statistically confirmed."),
            OptionChoice(id="C", text="Statement C always occurs in every patient."),
            OptionChoice(id="D", text="Statement D is never applicable."),
            OptionChoice(id="E", text="Statement E represents a partial correlation."),
        ],
        correct_answer_id="A, B",
        correct_answer_ids=["A", "B"],
        explanation="Statements A and B are definitively supported. C and D commit extreme language fallacies.",
        final_score=96,
    )
    assert multi_q.correct_answer_ids == ["A", "B"]
    assert multi_q.correct_answer_id == "A, B"

    # 3. Test persistence in PostgreSQL and schema reconstruction
    saved = await save_question(multi_q)
    assert saved.id == multi_q.id

    fetched = await get_question_by_id(multi_q.id)
    assert fetched is not None
    assert fetched.interaction_type == "multi_choice"
    assert fetched.primary_trap == "Extreme_Language"
    assert fetched.passage_required == "Yes"
    assert fetched.correct_answer_ids == ["A", "B"]
    assert "A" in fetched.correct_answer_id and "B" in fetched.correct_answer_id
    assert len(fetched.options) == 5

    # Clean up
    await delete_question(multi_q.id)


@pytest.mark.asyncio
async def test_batch_generation_and_staging_flow():
    import json

    from app.repositories.question_repo import get_question_by_id, save_questions_batch
    from app.workflow.graph import run_workflow_stream

    # Request batch of 3 questions: 2 Single, 1 Multi, 1 Passage
    req = GenerationRequest(
        section=UCATSection.DECISION_MAKING,
        difficulty=Difficulty.MEDIUM,
        questions_to_generate=3,
        single_choice_count=2,
        multi_choice_count=1,
        passage_count=1,
    )

    events = []
    async for chunk in run_workflow_stream(req):
        line = chunk.strip()
        if line.startswith("data: "):
            events.append(json.loads(line[6:]))

    # Verify event stream contents
    event_types = [e["event_type"] for e in events]
    assert "workflow_start" in event_types
    assert "batch_progress" in event_types
    assert event_types.count("question_generated") == 3
    assert "workflow_complete" in event_types

    # Verify workflow_complete contains all 3 staged questions
    complete_evt = next(e for e in events if e["event_type"] == "workflow_complete")
    staged_qs = complete_evt["data"]["questions"]
    assert len(staged_qs) == 3

    # Check that candidates are NOT automatically saved to DB
    for q_data in staged_qs:
        in_db = await get_question_by_id(q_data["id"])
        assert in_db is None  # Not saved until user confirms!

    # Test user selecting 2 of the 3 questions to save (Confirmation Simulation)
    chosen_to_approve = [Question(**staged_qs[0]), Question(**staged_qs[1])]
    saved_count = await save_questions_batch(chosen_to_approve)
    assert saved_count == 2

    # Verify the 2 approved are now in DB, and unapproved is not
    assert await get_question_by_id(staged_qs[0]["id"]) is not None
    assert await get_question_by_id(staged_qs[1]["id"]) is not None
    assert await get_question_by_id(staged_qs[2]["id"]) is None

    # Clean up
    await delete_question(staged_qs[0]["id"])
    await delete_question(staged_qs[1]["id"])
