import json
import uuid

import pytest
from app.agents.generator import get_mock_draft
from app.agents.image_generator import calculate_flux_image_cost, generate_image_stimulus
from app.agents.reviewer import evaluate_heuristically
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
    run_workflow_stream,
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

    # Test batch limit <= 5 constraint
    valid_batch_req = GenerationRequest(
        section=UCATSection.VERBAL_REASONING,
        questions_to_generate=5,
        single_choice_count=3,
        multi_choice_count=2,
    )
    assert valid_batch_req.questions_to_generate == 5

    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        GenerationRequest(
            section=UCATSection.VERBAL_REASONING,
            questions_to_generate=6,
        )


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
    _img_url, img_svg, _img_desc, usage = await generate_image_stimulus(draft_ar, req_ar)

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
async def test_visual_stimulus_persistence_in_finalize_node():
    """Verifies that finalize_node preserves image_svg, image_url, and image_description in final_question and stage_outcomes."""
    req = GenerationRequest(
        section=UCATSection.QUANTITATIVE_REASONING,
        difficulty=Difficulty.MEDIUM,
        visual_type="svg_diagram",
    )
    draft = get_mock_draft(req)
    mock_svg = '<svg viewBox="0 0 400 300"><circle cx="200" cy="150" r="80" fill="#0284c7"/></svg>'
    mock_desc = "Scatter diagram showing correlation between patient dosage and response."

    state = {
        "request": req.model_dump(),
        "current_draft": draft.model_dump(),
        "current_review": None,
        "iteration_count": 1,
        "iterations_history": [],
        "total_tokens": 850,
        "total_cost_usd": 0.0003,
        "image_svg": mock_svg,
        "image_url": None,
        "image_description": mock_desc,
        "stage_outcomes": {},
    }

    res = await finalize_node(state)
    final_q = res["final_question"]
    assert final_q["image_svg"] == mock_svg
    assert final_q["image_url"] is None
    assert final_q["image_description"] == mock_desc

    final_payload = res["stage_outcomes"]["final_payload"]
    assert final_payload["image_svg"] == mock_svg
    assert final_payload["image_url"] is None
    assert final_payload["image_description"] == mock_desc


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
async def test_workflow_token_accumulation(monkeypatch):
    monkeypatch.setattr(config, "DEEPINFRA_API_KEY", "")
    monkeypatch.delenv("DEEPINFRA_API_KEY", raising=False)
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

    from app.api.v1.questions import (
        BatchDeleteRequest,
        approve_and_save_question,
        batch_approve_and_save_questions,
        remove_questions_batch,
    )
    from app.repositories.question_repo import (
        delete_question,
        delete_questions_batch,
        get_question_by_id,
    )
    from app.schemas import OptionChoice, Question

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

    # Clean up single test question
    del_single = await delete_question(cand_id)
    assert del_single is True
    assert await get_question_by_id(cand_id) is None

    # Test atomic batch deletion endpoint
    del_batch_res = await remove_questions_batch(BatchDeleteRequest(ids=[batch_q1.id, batch_q2.id]))
    assert del_batch_res["success"] is True
    assert del_batch_res["deleted_count"] == 2
    assert await get_question_by_id(batch_q1.id) is None
    assert await get_question_by_id(batch_q2.id) is None
    assert await delete_questions_batch([]) == 0


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
    draft = get_mock_draft(req)

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
async def test_batch_generation_and_staging_flow(monkeypatch):
    import json

    from app.core.config import config
    from app.repositories.question_repo import get_question_by_id, save_questions_batch
    from app.workflow.graph import run_workflow_stream

    monkeypatch.setattr(config, "DEEPINFRA_API_KEY", "")
    monkeypatch.delenv("DEEPINFRA_API_KEY", raising=False)

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


@pytest.mark.asyncio
async def test_section_image_guard_routing():
    # 1. Verbal Reasoning: score 95 > 90, image_needed=True in draft, require_image=False
    # Should route to finalize, bypassing image_generator
    vr_state = {
        "request": {
            "section": "verbal_reasoning",
            "require_image": False,
            "visual_type": "None",
        },
        "current_review": {"total_score": 95},
        "current_draft": {"image_needed": True},
        "iteration_count": 1,
    }
    assert route_after_review(vr_state) == "finalize"

    # 2. Situational Judgement: score 94 > 90, require_image=False
    sjt_state = {
        "request": {
            "section": "situational_judgement",
            "require_image": False,
            "visual_type": "None",
        },
        "current_review": {"total_score": 94},
        "current_draft": {"image_needed": True},
        "iteration_count": 1,
    }
    assert route_after_review(sjt_state) == "finalize"

    # 3. Verbal Reasoning with explicit require_image=True
    vr_explicit_state = {
        "request": {
            "section": "verbal_reasoning",
            "require_image": True,
            "visual_type": "None",
        },
        "current_review": {"total_score": 95},
        "current_draft": {"image_needed": True},
        "iteration_count": 1,
    }
    assert route_after_review(vr_explicit_state) == "image_generator"

    # 4. Abstract Reasoning: score 95 > 90, should route to image_generator
    ar_state = {
        "request": {
            "section": "abstract_reasoning",
            "require_image": False,
            "visual_type": "None",
        },
        "current_review": {"total_score": 95},
        "current_draft": {"image_needed": False},
        "iteration_count": 1,
    }
    assert route_after_review(ar_state) == "image_generator"


@pytest.mark.asyncio
async def test_per_question_stage_metadata_in_events(monkeypatch):
    import json

    from app.core.config import config
    from app.workflow.graph import run_workflow_stream

    monkeypatch.setattr(config, "DEEPINFRA_API_KEY", "")
    monkeypatch.delenv("DEEPINFRA_API_KEY", raising=False)

    req = GenerationRequest(
        section=UCATSection.DECISION_MAKING,
        difficulty=Difficulty.MEDIUM,
        questions_to_generate=2,
    )

    events = []
    async for chunk in run_workflow_stream(req):
        line = chunk.strip()
        if line.startswith("data: "):
            events.append(json.loads(line[6:]))

    # Assert agent_start events carry index, total, and stage
    gen_starts = [
        e
        for e in events
        if e["event_type"] == "agent_start"
        and e["agent_name"] in ("Question Writer", "Question Generator")
    ]
    assert len(gen_starts) == 2
    for e in gen_starts:
        assert e["data"]["index"] in (1, 2)
        assert e["data"]["total"] == 2
        assert e["data"]["stage"] == "drafting"

    rev_starts = [
        e
        for e in events
        if e["event_type"] == "agent_start"
        and e["agent_name"] in ("Quality Reviewer", "Question Reviewer")
    ]
    assert len(rev_starts) >= 2
    for e in rev_starts:
        assert e["data"]["index"] in (1, 2)
        assert e["data"]["total"] == 2
        assert e["data"]["stage"] == "reviewing"
        assert e["data"]["iteration"] >= 1

    q_gens = [e for e in events if e["event_type"] == "question_generated"]
    assert len(q_gens) == 2
    for e in q_gens:
        assert e["data"]["index"] in (1, 2)
        assert e["data"]["total"] == 2
        assert e["data"]["stage"] == "completed"
        assert e["data"]["question"]["index"] in (1, 2)


@pytest.mark.asyncio
async def test_single_passage_multi_question_set(monkeypatch):
    """Verifies that 1 shared reading passage is generated for multiple linked questions (Single & Multi-choice)."""
    monkeypatch.setattr(config, "DEEPINFRA_API_KEY", "")
    monkeypatch.delenv("DEEPINFRA_API_KEY", raising=False)

    req = GenerationRequest(
        section=UCATSection.VERBAL_REASONING,
        difficulty=Difficulty.MEDIUM,
        questions_to_generate=3,
        single_choice_count=2,
        multi_choice_count=1,
        passage_required="Yes",
        passage_mode="single_passage",
    )

    events = []
    async for chunk in run_workflow_stream(req):
        line = chunk.strip()
        if line.startswith("data: "):
            events.append(json.loads(line[6:]))

    # Assert Passage Writer events exist
    passage_starts = [
        e
        for e in events
        if e["agent_name"] == "Passage Writer" and e["event_type"] == "agent_start"
    ]
    passage_completes = [
        e
        for e in events
        if e["agent_name"] == "Passage Writer" and e["event_type"] == "agent_complete"
    ]
    assert len(passage_starts) == 1
    assert len(passage_completes) == 1

    shared_passage_text = passage_completes[0]["data"]["passage_text"]
    shared_passage_id = passage_completes[0]["data"]["passage_id"]
    assert shared_passage_text and len(shared_passage_text.split()) > 100
    assert shared_passage_id

    # Check workflow_complete
    complete_events = [e for e in events if e["event_type"] == "workflow_complete"]
    assert len(complete_events) == 1
    data = complete_events[0]["data"]
    questions = data["questions"]
    assert len(questions) == 3

    # Verify all questions share the exact same passage_id and stimulus_text
    single_count = 0
    multi_count = 0
    for q in questions:
        assert q["passage_id"] == shared_passage_id
        assert q["stimulus_text"] == shared_passage_text
        assert q["final_score"] > 90
        if q["interaction_type"] == "multi_choice":
            multi_count += 1
        elif q["interaction_type"] == "single_choice":
            single_count += 1

    assert single_count == 2
    assert multi_count == 1


@pytest.mark.asyncio
async def test_mixed_passage_and_independent_batch(monkeypatch):
    """Verifies hybrid batch with 2 questions on a shared passage and 3 independent questions (Single & Multi-choice)."""
    monkeypatch.setattr(config, "DEEPINFRA_API_KEY", "")
    monkeypatch.delenv("DEEPINFRA_API_KEY", raising=False)

    req = GenerationRequest(
        section=UCATSection.VERBAL_REASONING,
        difficulty=Difficulty.MEDIUM,
        questions_to_generate=5,
        passage_mode="single_passage",
        passage_question_count=2,
        passage_single_count=1,
        passage_multi_count=1,
        independent_single_count=2,
        independent_multi_count=1,
    )

    events = []
    async for chunk in run_workflow_stream(req):
        line = chunk.strip()
        if line.startswith("data: "):
            events.append(json.loads(line[6:]))

    # Verify workflow_start metadata
    start_events = [e for e in events if e["event_type"] == "workflow_start"]
    assert len(start_events) == 1
    start_data = start_events[0]["data"]
    assert start_data["is_mixed_set"] is True
    assert start_data["passage_question_count"] == 2
    assert start_data["independent_question_count"] == 3
    assert start_data["passage_single_count"] == 1
    assert start_data["passage_multi_count"] == 1
    assert start_data["independent_single_count"] == 2
    assert start_data["independent_multi_count"] == 1

    # Verify workflow_complete
    complete_events = [e for e in events if e["event_type"] == "workflow_complete"]
    assert len(complete_events) == 1
    comp_data = complete_events[0]["data"]
    assert comp_data["is_mixed_set"] is True
    questions = comp_data["questions"]
    assert len(questions) == 5

    shared_passage_id = comp_data["passage_id"]
    shared_passage_text = comp_data["shared_passage"]
    assert shared_passage_id is not None
    assert shared_passage_text is not None

    # First 2 questions belong to the shared passage
    p_questions = questions[:2]
    for q in p_questions:
        assert q["passage_id"] == shared_passage_id
        assert q["stimulus_text"] == shared_passage_text
        assert q["final_score"] > 90

    p_singles = sum(1 for q in p_questions if q["interaction_type"] == "single_choice")
    p_multis = sum(1 for q in p_questions if q["interaction_type"] == "multi_choice")
    assert p_singles == 1
    assert p_multis == 1

    # Remaining 3 questions are independent
    ind_questions = questions[2:]
    for q in ind_questions:
        assert q.get("passage_id") is None
        assert q.get("stimulus_text") != shared_passage_text
        assert q["final_score"] > 90

    ind_singles = sum(1 for q in ind_questions if q["interaction_type"] == "single_choice")
    ind_multis = sum(1 for q in ind_questions if q["interaction_type"] == "multi_choice")
    assert ind_singles == 2
    assert ind_multis == 1


@pytest.mark.asyncio
async def test_generate_question_with_self_critique_structure(monkeypatch):
    """Verifies that generate_question_with_self_critique returns a valid draft, review score, and usage."""
    import app.agents.generator as gen_mod
    from app.agents.generator import generate_question_with_self_critique
    from app.core.config import config
    from app.schemas.question import QuestionDraft, ReviewScore
    from app.schemas.token import TokenUsage

    # 1. Fallback mode (no API key configured)
    monkeypatch.setattr(config, "DEEPINFRA_API_KEY", "")
    monkeypatch.delenv("DEEPINFRA_API_KEY", raising=False)

    req = GenerationRequest(
        section=UCATSection.DECISION_MAKING,
        difficulty=Difficulty.MEDIUM,
    )
    draft, review, usage = await generate_question_with_self_critique(req)

    assert isinstance(draft, QuestionDraft)
    assert len(draft.options) in (4, 5)
    assert draft.correct_answer_id is not None
    assert isinstance(review, ReviewScore)
    assert usage.prompt_tokens > 0
    assert usage.completion_tokens > 0

    # 2. Mock successful LLM response with valid self_critique json
    fused_json = """{
      "stimulus_text": "Clinical context here...",
      "question_stem": "Which option is definitive?",
      "options": [
        {"id": "A", "text": "First choice"},
        {"id": "B", "text": "Second choice"},
        {"id": "C", "text": "Third choice"},
        {"id": "D", "text": "Fourth choice"}
      ],
      "correct_answer_id": "C",
      "correct_answer_ids": ["C"],
      "explanation": "Option C is correct because of rule 1.",
      "image_needed": false,
      "image_prompt_or_type": null,
      "self_critique": {
        "authenticity_score": 25,
        "clarity_score": 24,
        "distractor_score": 24,
        "explanation_score": 25,
        "strengths": ["Authentic clinical vignette"],
        "weaknesses": [],
        "recommendations": []
      }
    }"""
    mock_usage = TokenUsage(
        prompt_tokens=420, completion_tokens=310, total_tokens=730, cost_usd=0.001
    )

    async def mock_call_llm(*args, **kwargs):
        return fused_json, mock_usage

    monkeypatch.setattr(gen_mod, "call_llm", mock_call_llm)

    draft2, review2, _usage2 = await generate_question_with_self_critique(req)
    assert draft2.question_stem == "Which option is definitive?"
    assert draft2.correct_answer_id in ("A", "B", "C", "D")
    assert f"Option {draft2.correct_answer_id} is correct" in draft2.explanation
    assert review2 is not None
    assert review2.total_score == 98
    assert review2.passed is True


@pytest.mark.asyncio
async def test_fused_generator_node_passing_and_routing():
    """Verifies that fused_generator_node and route_after_fused_generation route properly."""
    from app.workflow.graph import route_after_fused_generation

    # 1. Failing/unverified self-critique (score <= 90) -> routes to reviewer
    req = GenerationRequest(section=UCATSection.VERBAL_REASONING, difficulty=Difficulty.MEDIUM)
    failing_state = {
        "request": req.model_dump(),
        "fused_self_passed": False,
        "current_review": {"total_score": 88},
    }
    assert route_after_fused_generation(failing_state) == "reviewer"

    # 2. Passing self-critique (score > 90) for Verbal Reasoning (textual, no image) -> routes to finalize
    passing_vr_state = {
        "request": req.model_dump(),
        "fused_self_passed": True,
        "current_review": {"total_score": 96},
        "current_draft": {"image_needed": False},
    }
    assert route_after_fused_generation(passing_vr_state) == "finalize"

    # 3. Passing self-critique for Abstract Reasoning -> routes to image_generator
    req_ar = GenerationRequest(section=UCATSection.ABSTRACT_REASONING, difficulty=Difficulty.HARD)
    passing_ar_state = {
        "request": req_ar.model_dump(),
        "fused_self_passed": True,
        "current_review": {"total_score": 94},
        "current_draft": {"image_needed": True},
    }
    assert route_after_fused_generation(passing_ar_state) == "image_generator"


@pytest.mark.asyncio
async def test_fused_workflow_bypasses_reviewer_when_self_critique_passed(monkeypatch):
    """Verifies that if the fused generator self-scores > 90, the separate Reviewer agent node is bypassed."""
    import json

    import app.workflow.graph as graph_mod
    from app.core.config import config
    from app.schemas.question import OptionChoice, QuestionDraft, ReviewScore
    from app.schemas.token import TokenUsage
    from app.workflow.graph import run_workflow_stream

    monkeypatch.setattr(config, "DEEPINFRA_API_KEY", "")
    monkeypatch.delenv("DEEPINFRA_API_KEY", raising=False)

    passing_review = ReviewScore(
        authenticity_score=24,
        clarity_score=24,
        distractor_score=24,
        explanation_score=24,
        total_score=96,
        strengths=["Top tier question"],
        weaknesses=[],
        recommendations=[],
        passed=True,
    )
    passing_draft = QuestionDraft(
        stimulus_text="A clinical trial testing drug X...",
        question_stem="Which option is correct?",
        options=[
            OptionChoice(id="A", text="Option A"),
            OptionChoice(id="B", text="Option B"),
            OptionChoice(id="C", text="Option C"),
            OptionChoice(id="D", text="Option D"),
        ],
        correct_answer_id="B",
        correct_answer_ids=["B"],
        explanation="Step by step proof...",
        image_needed=False,
    )
    mock_usage = TokenUsage(
        prompt_tokens=400, completion_tokens=300, total_tokens=700, cost_usd=0.001
    )

    async def mock_fused_gen(r):
        return passing_draft, passing_review, mock_usage

    monkeypatch.setattr(graph_mod, "generate_question_with_self_critique", mock_fused_gen)

    req = GenerationRequest(
        section=UCATSection.VERBAL_REASONING,
        difficulty=Difficulty.MEDIUM,
        questions_to_generate=1,
    )

    events = []
    async for chunk in run_workflow_stream(req):
        line = chunk.strip()
        if line.startswith("data: "):
            events.append(json.loads(line[6:]))

    # Reviewer agent_start should NOT be called (bypassed)
    rev_starts = [
        e
        for e in events
        if e["event_type"] == "agent_start"
        and e["agent_name"] in ("Quality Reviewer", "Question Reviewer")
    ]
    assert len(rev_starts) == 0, "Separate Quality Reviewer LLM call was not bypassed!"

    # But Quality Reviewer agent_complete event IS emitted with the self-critique score
    rev_completes = [
        e
        for e in events
        if e["event_type"] == "agent_complete"
        and e["agent_name"] in ("Quality Reviewer", "Question Reviewer")
    ]
    assert len(rev_completes) == 1
    assert rev_completes[0]["data"]["score"] == 96
    assert "Self-Critique: 96/100" in rev_completes[0]["message"]


def test_option_symmetry_and_anti_guessability_engine():
    """Validates calculate_option_symmetry, balance_and_shuffle_options, and remap_explanation_keys."""
    from app.agents.option_balancer import (
        balance_and_shuffle_options,
        calculate_option_symmetry,
        remap_explanation_keys,
    )
    from app.schemas.question import OptionChoice, QuestionDraft

    # 1. Test balanced options (tight word counts)
    balanced_opts = [
        OptionChoice(
            id="A",
            text="Antibiotic therapy was stepped down within 48 hours for culture-negative cases.",
        ),
        OptionChoice(
            id="B",
            text="Clinical guidelines recommended procalcitonin testing to guide empirical treatment.",
        ),
        OptionChoice(
            id="C",
            text="Clinicians routinely continued broad-spectrum coverage due to diagnostic anxiety.",
        ),
        OptionChoice(
            id="D",
            text="Mortality rates showed no statistically significant difference across clinical wards.",
        ),
    ]
    sym_balanced = calculate_option_symmetry(balanced_opts, "A")
    assert sym_balanced["is_balanced"] is True
    assert sym_balanced["status"] == "Balanced"
    assert sym_balanced["disparity_ratio"] <= 1.25
    assert sym_balanced["symmetry_score"] >= 90

    # 2. Test length disparity where correct answer is the longest option (test-wiseness flaw)
    biased_opts = [
        OptionChoice(id="A", text="Brief choice."),  # 2 words
        OptionChoice(id="B", text="Another short choice here."),  # 4 words
        OptionChoice(
            id="C",
            text="This is a remarkably comprehensive, nuanced, and detailed correct answer explaining all clinical subtleties thoroughly.",
        ),  # 15 words
        OptionChoice(id="D", text="Third short item."),  # 3 words
    ]
    sym_biased = calculate_option_symmetry(biased_opts, "C")
    assert sym_biased["is_balanced"] is False
    assert sym_biased["is_correct_longest"] is True
    assert sym_biased["disparity_ratio"] > 3.0
    assert sym_biased["status"] == "High Disparity"
    assert sym_biased["symmetry_score"] <= 60

    # 3. Test explanation remapping with cyclic/swapped keys
    # Mapping: A -> C, B -> A, C -> B, D -> D
    mapping = {"A": "C", "B": "A", "C": "B", "D": "D"}
    expl_input = (
        "Analysis of choices:\n"
        "- Option A is INCORRECT (Extreme Trap).\n"
        "- Option B is CORRECT because of theorem 1.\n"
        "- Key C is INCORRECT (Partial Match).\n"
        "- Distractor D is false.\n"
        "Therefore, Choice B is the right conclusion."
    )
    remapped_expl = remap_explanation_keys(expl_input, mapping)
    assert "- Option C is INCORRECT" in remapped_expl
    assert "- Option A is CORRECT" in remapped_expl
    assert "- Key B is INCORRECT" in remapped_expl
    assert "Therefore, Choice A is the right conclusion." in remapped_expl

    # 4. Test balance_and_shuffle_options on draft
    draft = QuestionDraft(
        stimulus_text="Clinical vignette...",
        question_stem="Which option is valid?",
        options=balanced_opts,
        correct_answer_id="B",
        correct_answer_ids=["B"],
        explanation="Option B is correct because the guidelines support it.",
    )
    shuffled_draft, sym = balance_and_shuffle_options(draft, seed=42)
    assert len(shuffled_draft.options) == 4
    # Ensure options have IDs A, B, C, D in order
    assert [o.id for o in shuffled_draft.options] == ["A", "B", "C", "D"]
    # Check that correct_answer_id is one of A, B, C, D
    assert shuffled_draft.correct_answer_id in ("A", "B", "C", "D")
    # Verify explanation stays in sync with the new key letter
    assert f"Option {shuffled_draft.correct_answer_id} is correct" in shuffled_draft.explanation
    assert sym["is_balanced"] is True

    # 5. Test numeric options QR ordering (sorted numerically ascending)
    qr_opts = [
        OptionChoice(id="A", text="£45.50"),
        OptionChoice(id="B", text="£12.00"),
        OptionChoice(id="C", text="£89.99"),
        OptionChoice(id="D", text="£24.50"),
    ]
    qr_draft = QuestionDraft(
        stimulus_text="Cost calculation scenario...",
        question_stem="What is the total prescription cost?",
        options=qr_opts,
        correct_answer_id="B",
        correct_answer_ids=["B"],
        explanation="Option B is correct: £12.00 is the final total.",
    )
    balanced_qr, _qr_sym = balance_and_shuffle_options(qr_draft)
    # Check ascending numeric order: 12.00, 24.50, 45.50, 89.99
    assert balanced_qr.options[0].text == "£12.00"
    assert balanced_qr.options[0].id == "A"
    assert balanced_qr.options[1].text == "£24.50"
    assert balanced_qr.options[2].text == "£45.50"
    assert balanced_qr.options[3].text == "£89.99"
    # Old B (£12.00) is now at index 0 (letter A)
    assert balanced_qr.correct_answer_id == "A"
    assert "Option A is correct: £12.00 is the final total." in balanced_qr.explanation
