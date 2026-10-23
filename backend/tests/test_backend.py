import json
import uuid

import pytest
from app.agents.generator import get_mock_draft
from app.agents.image_generator import calculate_flux_image_cost, generate_image_stimulus
from app.agents.reviewer import evaluate_heuristically
from app.core.config import config
from app.db.session import init_db
from app.repositories.question_repository import delete_question, get_questions, save_question
from app.schemas import (
    Difficulty,
    GenerationRequest,
    MCATSection,
    OptionChoice,
    Question,
    QuestionDraft,
    ReviewScore,
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
        stimulus_text="Sample MCAT reading passage.",
        question_stem="Which option follows?",
        options=opts,
        correct_answer_id="B",
        explanation="Option B is correct because...",
        image_needed=False,
    )
    assert len(draft.options) == 4
    assert draft.correct_answer_id == "B"

    # Test batch limit <= 10 constraint
    valid_batch_req = GenerationRequest(
        section=MCATSection.CHEM_PHYS,
        questions_to_generate=10,
        single_choice_count=5,
        multi_choice_count=5,
    )
    assert valid_batch_req.questions_to_generate == 10

    from pydantic import ValidationError

    # Test batch limit <= 50 constraint
    with pytest.raises(ValidationError):
        GenerationRequest(
            section=MCATSection.CHEM_PHYS,
            questions_to_generate=51,
        )


@pytest.mark.asyncio
async def test_all_mcat_sections_mock():
    for sec in MCATSection:
        req = GenerationRequest(
            section=sec,
            subtopic="Core Syllabus",
            difficulty=Difficulty.MEDIUM,
            passage_required="Yes" if sec == MCATSection.CARS else "No",
            require_image=(sec == MCATSection.CHEM_PHYS),
        )
        draft = get_mock_draft(req)
        assert len(draft.options) == 4
        assert draft.correct_answer_id in ["A", "B", "C", "D"]
        assert len(draft.explanation) > 20


@pytest.mark.asyncio
async def test_reviewer_heuristic_and_loop_routing():
    req = GenerationRequest(section=MCATSection.CHEM_PHYS, difficulty=Difficulty.MEDIUM)
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

    req = GenerationRequest(
        section=MCATSection.CARS, difficulty=Difficulty.HARD, passage_required="Yes"
    )
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
async def test_strict_ai_image_generator(monkeypatch):
    """
    Verifies strict AI image model policy:
    1. Returns error and NO SVG when API key is missing.
    2. Returns pure AI-generated image (image_url) and NO SVG when model succeeds.
    """
    req_ar = GenerationRequest(
        section=MCATSection.CHEM_PHYS, difficulty=Difficulty.HARD, require_image=True
    )
    draft_ar = get_mock_draft(req_ar)

    # 1. Missing API key -> strict error, never fall back to SVG
    monkeypatch.setattr(config, "DEEPINFRA_API_KEY", "")
    _img_url, img_svg, _img_desc, usage = await generate_image_stimulus(draft_ar, req_ar)

    assert _img_url is None
    assert img_svg is None
    assert usage is not None
    assert usage["agent_name"] == "Image Generator"
    assert "error" in usage["details"]

    # 2. Valid API key & mocked FLUX call -> returns image_url, img_svg is strictly None
    monkeypatch.setattr(config, "DEEPINFRA_API_KEY", "mock_key")

    async def mock_call_flux(*args, **kwargs):
        return "data:image/jpeg;base64,mock_flux_binary"

    from app.agents import image_generator

    monkeypatch.setattr(image_generator, "call_deepinfra_flux", mock_call_flux)

    img_url, img_svg, img_desc, usage_success = await generate_image_stimulus(draft_ar, req_ar)
    assert img_url == "data:image/jpeg;base64,mock_flux_binary"
    assert img_svg is None
    assert usage_success["cost_usd"] > 0.0
    assert usage_success["details"]["type"] == "ai_generated_image"


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

    # FLUX-2-klein-4b flat rate testing
    assert (
        calculate_flux_image_cost(1024, 1024, 0, model="black-forest-labs/FLUX-2-klein-4b") == 0.014
    )
    assert (
        config.calculate_flux_image_cost(1024, 1024, 0, model="black-forest-labs/FLUX-2-klein-4b")
        == 0.014
    )
    assert (
        calculate_flux_image_cost(512, 512, 0, model="black-forest-labs/FLUX-2-klein-4b") == 0.0035
    )


@pytest.mark.asyncio
async def test_image_node_workflow_accumulation(monkeypatch):
    """Verifies that image_node accurately accumulates usage into workflow state with AI image model."""

    async def mock_gen_img(*args, **kwargs):
        return (
            "data:image/jpeg;base64,mock_flux",
            None,
            "Mock visual prompt",
            {
                "agent_name": "Image Generator",
                "cost_usd": 0.0020,
                "model": "black-forest-labs/FLUX-1-schnell",
            },
        )

    from app.workflow import graph

    monkeypatch.setattr(graph, "generate_image_stimulus", mock_gen_img)

    req = GenerationRequest(
        section=MCATSection.CHEM_PHYS, difficulty=Difficulty.MEDIUM, require_image=True
    )
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
    assert res["image_url"] == "data:image/jpeg;base64,mock_flux"
    assert res["image_svg"] is None
    assert len(res["agent_usage_breakdown"]) == 3
    assert res["agent_usage_breakdown"][-1]["agent_name"] == "Image Generator"
    assert "latest_usage" in res


@pytest.mark.asyncio
async def test_visual_stimulus_persistence_in_finalize_node():
    """Verifies that finalize_node preserves image_svg, image_url, and image_description in final_question and stage_outcomes."""
    req = GenerationRequest(
        section=MCATSection.CHEM_PHYS,
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
    assert "DeepSeek-V4.1-Flash-1017" in config.DEFAULT_TEXT_MODEL
    assert config.COST_PER_MILLION_INPUT_TOKENS == 0.098
    assert config.COST_PER_MILLION_OUTPUT_TOKENS == 0.294


@pytest.mark.asyncio
async def test_token_and_cost_calculation(monkeypatch):
    from app.agents.base import calculate_token_cost
    from app.core.config import config

    monkeypatch.setattr(config, "COST_PER_MILLION_INPUT_TOKENS", 0.098)
    monkeypatch.setattr(config, "COST_PER_MILLION_OUTPUT_TOKENS", 0.294)

    # 1,000 prompt tokens @ $0.098/1M = $0.000098
    # 1,000 completion tokens @ $0.294/1M = $0.000294
    # Total = $0.000392
    cost = calculate_token_cost(prompt_tokens=1000, completion_tokens=1000)
    assert cost == 0.000392

    # 1,000,000 input tokens = $0.098
    cost_in = calculate_token_cost(prompt_tokens=1_000_000, completion_tokens=0)
    assert cost_in == 0.098

    # 1,000,000 output tokens = $0.294
    cost_out = calculate_token_cost(prompt_tokens=0, completion_tokens=1_000_000)
    assert cost_out == 0.294


@pytest.mark.asyncio
async def test_workflow_token_accumulation(monkeypatch):
    monkeypatch.setattr(config, "DEEPINFRA_API_KEY", "")
    monkeypatch.delenv("DEEPINFRA_API_KEY", raising=False)
    req = GenerationRequest(section=MCATSection.BIO_BIOCHEM, difficulty=Difficulty.MEDIUM)
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
                model="deepinfra/deepseek-ai/DeepSeek-V4.1-Flash-1017",
            )
        assert "AI Gateway API Key is required" in str(excinfo.value)
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
    from app.repositories.question_repository import (
        delete_question,
        delete_questions_batch,
        get_question_by_id,
    )
    from app.schemas import OptionChoice, Question

    # 1. Test finalize_node with auto_save=False (Default for Admin Review)
    req = GenerationRequest(
        section=MCATSection.PSYCH_SOC, difficulty=Difficulty.MEDIUM, auto_save=False
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
    from app.repositories.question_repository import get_question_by_id, save_question

    # 1. Test multi-choice GenerationRequest with passage and trap
    req = GenerationRequest(
        section=MCATSection.CARS,
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
        section="cars",
        section_label="Critical Analysis and Reasoning Skills (CARS)",
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
    from app.repositories.question_repository import get_question_by_id, save_questions_batch
    from app.workflow.graph import run_workflow_stream

    monkeypatch.setattr(config, "DEEPINFRA_API_KEY", "")
    monkeypatch.delenv("DEEPINFRA_API_KEY", raising=False)

    # Request batch of 5 questions
    req = GenerationRequest(
        section=MCATSection.BIO_BIOCHEM,
        difficulty=Difficulty.MEDIUM,
        questions_to_generate=5,
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
    assert event_types.count("question_generated") == 5
    assert "workflow_complete" in event_types

    # Verify workflow_complete contains all 5 staged questions
    complete_evt = next(e for e in events if e["event_type"] == "workflow_complete")
    staged_qs = complete_evt["data"]["questions"]
    assert len(staged_qs) == 5

    # Check that candidates are NOT automatically saved to DB
    for q_data in staged_qs:
        in_db = await get_question_by_id(q_data["id"])
        assert in_db is None  # Not saved until user confirms!

    # Test user selecting 2 of the 5 questions to save (Confirmation Simulation)
    chosen_to_approve = [Question(**staged_qs[0]), Question(**staged_qs[1])]
    saved_count = await save_questions_batch(chosen_to_approve)
    assert saved_count == 2

    # Verify the 2 approved are now in DB, and unapproved are not
    assert await get_question_by_id(staged_qs[0]["id"]) is not None
    assert await get_question_by_id(staged_qs[1]["id"]) is not None
    assert await get_question_by_id(staged_qs[2]["id"]) is None

    # Clean up
    await delete_question(staged_qs[0]["id"])
    await delete_question(staged_qs[1]["id"])


@pytest.mark.asyncio
async def test_section_image_guard_routing():
    # 1. CARS: score 95 > 90, image_needed=True in draft, require_image=False
    # Should route to finalize, strictly bypassing image_generator (CARS has no images)
    cars_state = {
        "request": {
            "section": "cars",
            "require_image": False,
            "visual_type": "None",
        },
        "current_review": {"total_score": 95},
        "current_draft": {"image_needed": True},
        "iteration_count": 1,
    }
    assert route_after_review(cars_state) == "finalize"

    # 2. CARS with require_image=False routes to finalize
    cars_no_img_state = {
        "request": {
            "section": "critical_analysis_and_reasoning_skills",
            "require_image": False,
            "visual_type": "None",
        },
        "current_review": {"total_score": 94},
        "current_draft": {"image_needed": False},
        "iteration_count": 1,
    }
    assert route_after_review(cars_no_img_state) == "finalize"

    # 3. Chem/Phys with explicit require_image=True routes to image_generator
    cp_explicit_state = {
        "request": {
            "section": "chem_phys",
            "require_image": True,
            "visual_type": "None",
        },
        "current_review": {"total_score": 95},
        "current_draft": {"image_needed": True},
        "iteration_count": 1,
    }
    assert route_after_review(cp_explicit_state) == "image_generator"

    # 4. Chem/Phys with image_needed=True routes to image_generator
    cp_needed_state = {
        "request": {
            "section": "chem_phys",
            "require_image": False,
            "visual_type": "None",
        },
        "current_review": {"total_score": 95},
        "current_draft": {"image_needed": True},
        "iteration_count": 1,
    }
    assert route_after_review(cp_needed_state) == "image_generator"


@pytest.mark.asyncio
async def test_per_question_stage_metadata_in_events(monkeypatch):
    import json

    from app.core.config import config
    from app.workflow.graph import run_workflow_stream

    monkeypatch.setattr(config, "DEEPINFRA_API_KEY", "")
    monkeypatch.delenv("DEEPINFRA_API_KEY", raising=False)

    req = GenerationRequest(
        section=MCATSection.CHEM_PHYS,
        difficulty=Difficulty.MEDIUM,
        questions_to_generate=5,
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
        and e["agent_name"]
        in ("Question Writer & Reviewer", "Question Writer", "Question Generator")
    ]
    assert len(gen_starts) == 5
    for e in gen_starts:
        assert e["data"]["index"] in (1, 2, 3, 4, 5)
        assert e["data"]["total"] == 5
        assert e["data"]["stage"] == "drafting"

    rev_starts = [
        e
        for e in events
        if e["event_type"] == "agent_start"
        and e["agent_name"] in ("Quality Reviewer", "Question Reviewer")
    ]
    assert len(rev_starts) >= 5
    for e in rev_starts:
        assert e["data"]["index"] in (1, 2, 3, 4, 5)
        assert e["data"]["total"] == 5
        assert e["data"]["stage"] == "reviewing"
        assert e["data"]["iteration"] >= 1

    q_gens = [e for e in events if e["event_type"] == "question_generated"]
    assert len(q_gens) == 5
    for e in q_gens:
        assert e["data"]["index"] in (1, 2, 3, 4, 5)
        assert e["data"]["total"] == 5
        assert e["data"]["stage"] == "completed"
        assert e["data"]["question"]["index"] in (1, 2, 3, 4, 5)


@pytest.mark.asyncio
async def test_single_passage_multi_question_set(monkeypatch):
    """Verifies that 1 shared reading passage is generated for multiple linked questions (Single & Multi-choice)."""
    monkeypatch.setattr(config, "DEEPINFRA_API_KEY", "")
    monkeypatch.delenv("DEEPINFRA_API_KEY", raising=False)

    req = GenerationRequest(
        section=MCATSection.CARS,
        difficulty=Difficulty.MEDIUM,
        questions_to_generate=5,
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
    assert len(questions) == 5

    # Verify all questions share the exact same passage_id and stimulus_text
    single_count = 0
    for q in questions:
        assert q["passage_id"] == shared_passage_id
        assert q["stimulus_text"] == shared_passage_text
        assert q["final_score"] > 90
        if q["interaction_type"] == "single_choice":
            single_count += 1

    assert single_count == 5


@pytest.mark.asyncio
async def test_binary_passage_and_independent_batches(monkeypatch):
    """Verifies clean binary passage mode: either all 5 linked to 1 passage or all 5 independent discretes."""
    monkeypatch.setattr(config, "DEEPINFRA_API_KEY", "")
    monkeypatch.delenv("DEEPINFRA_API_KEY", raising=False)

    # Mode A: 5 Questions all linked to 1 shared passage
    req_passage = GenerationRequest(
        section=MCATSection.BIO_BIOCHEM,
        difficulty=Difficulty.MEDIUM,
        questions_to_generate=5,
        passage_mode="single_passage",
        passage_required="Yes",
    )

    events_a = []
    async for chunk in run_workflow_stream(req_passage):
        line = chunk.strip()
        if line.startswith("data: "):
            events_a.append(json.loads(line[6:]))

    complete_a = next(e for e in events_a if e["event_type"] == "workflow_complete")
    assert complete_a["data"]["is_mixed_set"] is False
    qs_a = complete_a["data"]["questions"]
    assert len(qs_a) == 5
    shared_pid = complete_a["data"]["passage_id"]
    assert shared_pid is not None
    for q in qs_a:
        assert q["passage_id"] == shared_pid
        assert q["passage_required"] == "Yes"
        assert len(q["stimulus_text"]) > 50

    # Mode B: 5 Independent Discretes (No shared passage)
    req_indep = GenerationRequest(
        section=MCATSection.CHEM_PHYS,
        difficulty=Difficulty.MEDIUM,
        questions_to_generate=5,
        passage_mode="independent",
        passage_required="No",
    )

    events_b = []
    async for chunk in run_workflow_stream(req_indep):
        line = chunk.strip()
        if line.startswith("data: "):
            events_b.append(json.loads(line[6:]))

    complete_b = next(e for e in events_b if e["event_type"] == "workflow_complete")
    assert complete_b["data"]["is_mixed_set"] is False
    qs_b = complete_b["data"]["questions"]
    assert len(qs_b) == 5
    for q in qs_b:
        assert q.get("passage_id") is None
        assert q["passage_required"] == "No"
        assert q["stimulus_text"] == ""


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
        section=MCATSection.PSYCH_SOC,
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
    req = GenerationRequest(
        section=MCATSection.CARS, difficulty=Difficulty.MEDIUM, passage_required="Yes"
    )
    failing_state = {
        "request": req.model_dump(),
        "fused_self_passed": False,
        "current_review": {"total_score": 88},
    }
    assert route_after_fused_generation(failing_state) == "reviewer"

    # 2. Passing self-critique (score > 90) for CARS (textual, no image) -> routes to finalize
    passing_vr_state = {
        "request": req.model_dump(),
        "fused_self_passed": True,
        "current_review": {"total_score": 96},
        "current_draft": {"image_needed": False},
    }
    assert route_after_fused_generation(passing_vr_state) == "finalize"

    # 3. Passing self-critique for Chem/Phys with image -> routes to image_generator
    req_ar = GenerationRequest(
        section=MCATSection.CHEM_PHYS, difficulty=Difficulty.HARD, require_image=True
    )
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
        section=MCATSection.BIO_BIOCHEM,
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

    # Separate Quality Reviewer complete event is NOT emitted because Step 1 fused engine handles review
    rev_completes = [
        e
        for e in events
        if e["event_type"] == "agent_complete"
        and e["agent_name"] in ("Quality Reviewer", "Question Reviewer")
    ]
    assert len(rev_completes) == 0, (
        "Separate Quality Reviewer complete should not be emitted on fused pass!"
    )

    # Step 1 Question Writer & Reviewer emitted complete event carrying the self-critique score
    fused_completes = [
        e
        for e in events
        if e["event_type"] == "agent_complete" and e["agent_name"] == "Question Writer & Reviewer"
    ]
    assert len(fused_completes) == 1
    assert fused_completes[0]["data"]["score"] == 96
    assert "Score: 96/100" in fused_completes[0]["message"]


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


@pytest.mark.asyncio
async def test_independent_question_direct_no_stimulus(monkeypatch):
    """Verifies that independent questions (passage_required='No') enforce empty stimulus_text and direct question stems."""
    from app.agents.generator import _build_generator_user_prompt, _parse_question_draft_data
    from app.agents.mock_fixtures import get_mock_draft
    from app.core.config import config
    from app.schemas.workflow import GenerationRequest
    from app.workflow.graph import run_workflow_stream

    # 1. Verify user prompt instructions
    req_no_passage = GenerationRequest(
        section=MCATSection.CHEM_PHYS,
        difficulty=Difficulty.MEDIUM,
        passage_required="No",
    )
    prompt_str = _build_generator_user_prompt(req_no_passage)
    assert "Passage Required: No - Standalone discrete question ONLY" in prompt_str
    assert "Leave stimulus_text strictly as an empty string" in prompt_str

    # 2. Verify _parse_question_draft_data enforces empty stimulus when passage_required='No'
    raw_data = {
        "stimulus_text": "Unexpected lingering vignette text that LLM might return.",
        "question_stem": "A 72 kg patient requires 15 mg/kg per day. What is the single dose?",
        "options": [
            {"id": "A", "text": "12.4 mL"},
            {"id": "B", "text": "14.4 mL"},
            {"id": "C", "text": "16.2 mL"},
            {"id": "D", "text": "43.2 mL"},
        ],
        "correct_answer_id": "B",
        "explanation": "Calculated dose is 14.4 mL.",
    }
    draft = _parse_question_draft_data(raw_data, req_no_passage)
    assert draft.stimulus_text == "", (
        "Independent questions must strictly force stimulus_text to empty string"
    )
    assert "72 kg patient" in draft.question_stem

    # When passage_required is 'Yes', stimulus_text is preserved
    req_yes_passage = GenerationRequest(
        section=MCATSection.BIO_BIOCHEM,
        difficulty=Difficulty.MEDIUM,
        passage_required="Yes",
    )
    draft_yes = _parse_question_draft_data(raw_data, req_yes_passage)
    assert draft_yes.stimulus_text == "Unexpected lingering vignette text that LLM might return."

    # 3. Verify get_mock_draft outputs empty stimulus for all subtests when passage_required='No'
    for sec in MCATSection:
        r = GenerationRequest(section=sec, difficulty=Difficulty.MEDIUM, passage_required="No")
        md = get_mock_draft(r)
        if sec == MCATSection.CARS:
            # CARS is strictly 100% passage-based in official MCAT
            continue
        assert md.stimulus_text == "", (
            f"Mock draft for {sec} with passage_required='No' must have empty stimulus_text"
        )
        assert len(md.question_stem) > 10, f"Mock draft for {sec} must have a direct question stem"

    # Multi-choice direct question mock
    r_mc = GenerationRequest(
        section=MCATSection.BIO_BIOCHEM,
        difficulty=Difficulty.HARD,
        interaction_type="multi_choice",
        passage_required="No",
    )
    md_mc = get_mock_draft(r_mc)
    assert md_mc.stimulus_text == ""
    assert "Which" in md_mc.question_stem

    # 4. End-to-end workflow SSE stream: Verify independent discrete batch (5 questions)
    import json

    monkeypatch.setattr(config, "DEEPINFRA_API_KEY", "")
    monkeypatch.delenv("DEEPINFRA_API_KEY", raising=False)
    batch_req = GenerationRequest(
        section=MCATSection.CHEM_PHYS,
        difficulty=Difficulty.MEDIUM,
        questions_to_generate=5,
        passage_mode="independent",
        passage_required="No",
    )
    events = []
    async for chunk in run_workflow_stream(batch_req):
        line = chunk.strip()
        if line.startswith("data: "):
            events.append(json.loads(line[6:]))

    # Check worker progress message for independent question items
    batch_progress_events = [e for e in events if e.get("event_type") == "batch_progress"]
    assert len(batch_progress_events) == 5
    for b_evt in batch_progress_events:
        assert (
            "independent" in b_evt["message"].lower()
            or "direct question" in b_evt["message"].lower()
        )

    # Verify final staged questions
    complete_evt = next(e for e in events if e.get("event_type") == "workflow_complete")
    staged = complete_evt["data"]["questions"]
    assert len(staged) == 5
    for q in staged:
        assert q["passage_required"] == "No"
        assert q["stimulus_text"] == ""


@pytest.mark.asyncio
async def test_passage_set_with_passage_level_visual_stimulus(monkeypatch):
    """Verifies that in passage-type sets, visual stimulus is generated once for the passage and not duplicated question-wise."""
    monkeypatch.setattr(config, "DEEPINFRA_API_KEY", "")
    monkeypatch.delenv("DEEPINFRA_API_KEY", raising=False)

    async def mock_passage_img(*args, **kwargs):
        return (
            "data:image/jpeg;base64,mock_passage_flux",
            None,
            "Passage visual stimulus",
            {
                "agent_name": "Image Generator",
                "cost_usd": 0.0020,
                "model": "black-forest-labs/FLUX-1-schnell",
            },
        )

    from app.workflow import graph

    monkeypatch.setattr(graph, "generate_image_stimulus", mock_passage_img)

    req = GenerationRequest(
        section=MCATSection.CHEM_PHYS,
        difficulty=Difficulty.MEDIUM,
        questions_to_generate=5,
        passage_mode="single_passage",
        passage_required="Yes",
        require_image=True,
    )

    events = []
    async for chunk in run_workflow_stream(req):
        line = chunk.strip()
        if line.startswith("data: "):
            events.append(json.loads(line[6:]))

    # 1. Diagram & Chart Maker runs once for the passage
    passage_img_completes = [
        e
        for e in events
        if e.get("agent_name") == "Diagram & Chart Maker"
        and e.get("event_type") == "agent_complete"
        and e.get("data", {}).get("stage") == "passage_image"
    ]
    assert len(passage_img_completes) == 1
    assert (
        passage_img_completes[0]["data"]["image_url"] == "data:image/jpeg;base64,mock_passage_flux"
    )
    assert passage_img_completes[0]["data"]["image_svg"] is None

    # 2. workflow_complete has shared passage image
    complete_evt = next(e for e in events if e.get("event_type") == "workflow_complete")
    assert (
        complete_evt["data"]["shared_passage_image_url"]
        == "data:image/jpeg;base64,mock_passage_flux"
    )
    assert complete_evt["data"]["shared_passage_image_svg"] is None

    # 3. Questions have passage_visual_stimulus in outcomes and do NOT run question-wise image generation
    questions = complete_evt["data"]["questions"]
    assert len(questions) == 5
    for q in questions:
        assert (
            q["stage_outcomes"]["passage_visual_stimulus"]["note"]
            == "Visual stimulus belongs to shared reading passage"
        )


@pytest.mark.asyncio
async def test_smart_ai_trap_and_explanation_breakdown(monkeypatch):
    import app.agents.generator as gen_mod
    import app.agents.regenerator as regen_mod
    import app.agents.reviewer as rev_mod
    from app.agents.mock_fixtures import get_mock_draft
    from app.schemas.mcat import Difficulty, MCATSection
    from app.schemas.workflow import GenerationRequest
    from app.workflow.graph import run_workflow

    async def mock_fail_call_llm(*args, **kwargs):
        raise RuntimeError("Fast fallback to mock draft in unit test")

    monkeypatch.setattr(gen_mod, "call_llm", mock_fail_call_llm)
    monkeypatch.setattr(rev_mod, "call_llm", mock_fail_call_llm)
    monkeypatch.setattr(regen_mod, "call_llm", mock_fail_call_llm)

    # 1. Automatic Smart AI Trap Choice resolution on draft
    req_auto = GenerationRequest(
        section=MCATSection.CARS,
        difficulty=Difficulty.HARD,
        primary_trap="Automatic",
        passage_required="Yes",
    )
    draft_auto = get_mock_draft(req_auto)
    assert draft_auto.primary_trap is not None
    assert draft_auto.primary_trap != "Automatic"
    assert "Winning Strategy" not in draft_auto.explanation

    # 2. End-to-end workflow assigns Smart AI primary trap to final Question
    res = await run_workflow(req_auto)
    assert res.question is not None
    assert res.question.primary_trap is not None
    assert res.question.primary_trap != "Automatic"
    assert "Winning Strategy" not in res.question.explanation

    # 3. Explicit trap selection is preserved
    req_explicit = GenerationRequest(
        section=MCATSection.CHEM_PHYS,
        difficulty=Difficulty.MEDIUM,
        primary_trap="Calculation_Formula_Trap",
        passage_required="No",
    )
    res_explicit = await run_workflow(req_explicit)
    assert res_explicit.question is not None
    assert res_explicit.question.primary_trap == "Calculation_Formula_Trap"


def test_safe_json_loads_and_resilient_parsing():
    from app.agents.base import safe_json_loads
    from app.agents.generator import _parse_question_draft_data

    # 1. Unescaped literal newlines in JSON strings (exact terminal error)
    raw_with_literal_newlines = (
        "{\n"
        '  "stimulus_text": "Paragraph 1 has content.\nParagraph 2 has content on a new line.",\n'
        '  "question_stem": "Which option is correct?",\n'
        '  "options": [\n'
        '    {"id": "A", "text": "Option A"},\n'
        '    {"id": "B", "text": "Option B"},\n'
        '    {"id": "C", "text": "Option C"},\n'
        '    {"id": "D", "text": "Option D"}\n'
        "  ],\n"
        '  "correct_answer_id": "B",\n'
        '  "explanation": "Why B is correct:\nLine 1 proof\nLine 2 proof"\n'
        "}"
    )
    parsed = safe_json_loads(raw_with_literal_newlines)
    assert "Paragraph 2" in parsed["stimulus_text"]
    assert "Line 2 proof" in parsed["explanation"]

    # 2. Markdown fence wrapped in conversational prose
    raw_with_fence = (
        "Here is the requested question:\n"
        "```json\n"
        "{\n"
        '  "stimulus_text": "Sample stimulus",\n'
        '  "question_stem": "Sample stem",\n'
        '  "options": [\n'
        '    {"id": "A", "text": "Option A"},\n'
        '    {"id": "B", "text": "Option B"},\n'
        '    {"id": "C", "text": "Option C"},\n'
        '    {"id": "D", "text": "Option D"}\n'
        "  ],\n"
        '  "correct_answer_id": "A",\n'
        '  "explanation": "Rationale"\n'
        "}\n"
        "```\n"
        "I hope this satisfies the psychometric standard."
    )
    parsed2 = safe_json_loads(raw_with_fence)
    assert parsed2["correct_answer_id"] == "A"

    # 3. Trailing comma in JSON
    raw_trailing_comma = (
        "{\n"
        '  "stimulus_text": "",\n'
        '  "question_stem": "Stem",\n'
        '  "options": [\n'
        '    {"id": "A", "text": "A"},\n'
        '    {"id": "B", "text": "B"},\n'
        '    {"id": "C", "text": "C"},\n'
        '    {"id": "D", "text": "D"},\n'
        "  ],\n"
        '  "correct_answer_id": "A",\n'
        '  "explanation": "Exp",\n'
        "}"
    )
    parsed3 = safe_json_loads(raw_trailing_comma)
    assert len(parsed3["options"]) == 4

    # 4. Parse draft data with dict options
    req = GenerationRequest(
        section=MCATSection.PSYCH_SOC,
        difficulty=Difficulty.MEDIUM,
        passage_required="No",
    )
    dict_options_data = {
        "stimulus_text": "",
        "question_stem": "Stem",
        "options": {"A": "Choice A", "B": "Choice B", "C": "Choice C", "D": "Choice D"},
        "correct_answer_id": "C",
        "explanation": "Option C is correct",
    }
    draft = _parse_question_draft_data(dict_options_data, req)
    assert len(draft.options) == 4
    assert draft.correct_answer_id == "C"


@pytest.mark.asyncio
async def test_max_tokens_settings_and_config_endpoint():
    """Verify that DEFAULT_MAX_TOKENS and REVIEWER_MAX_TOKENS are properly set in config and returned by /config."""
    from app.api.v1.config import get_settings
    from app.core.config import config

    assert config.DEFAULT_MAX_TOKENS == 3000
    assert config.REVIEWER_MAX_TOKENS == 1800

    settings_data = await get_settings()
    assert settings_data["default_max_tokens"] == 3000
    assert settings_data["reviewer_max_tokens"] == 1800


@pytest.mark.asyncio
async def test_call_llm_effective_max_tokens(monkeypatch):
    """Verify call_llm uses config.DEFAULT_MAX_TOKENS by default and respects explicit overrides."""
    from unittest.mock import MagicMock

    import litellm
    from app.agents.base import call_llm
    from app.core.config import config

    captured_kwargs = []

    async def mock_acompletion(**kwargs):
        captured_kwargs.append(kwargs)
        mock_resp = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = '{"result": "ok"}'
        mock_resp.choices = [mock_choice]
        mock_resp.usage = MagicMock(prompt_tokens=10, completion_tokens=20, total_tokens=30)
        return mock_resp

    monkeypatch.setattr(litellm, "acompletion", mock_acompletion)

    # 1. Default invocation (max_tokens=None) should use config.DEFAULT_MAX_TOKENS (3000)
    await call_llm(
        prompt="test prompt",
        system_prompt="test system",
        model="deepinfra/deepseek-ai/DeepSeek-V4.1-Flash-1017",
        api_key="mock_key",
    )
    assert len(captured_kwargs) == 1
    assert captured_kwargs[0]["max_tokens"] == config.DEFAULT_MAX_TOKENS
    assert captured_kwargs[0]["max_tokens"] == 3000

    # 2. Explicit invocation with custom max_tokens (e.g. config.REVIEWER_MAX_TOKENS = 1800)
    await call_llm(
        prompt="test prompt 2",
        system_prompt="test system 2",
        model="deepinfra/deepseek-ai/DeepSeek-V4.1-Flash-1017",
        api_key="mock_key",
        max_tokens=config.REVIEWER_MAX_TOKENS,
    )
    assert len(captured_kwargs) == 2
    assert captured_kwargs[1]["max_tokens"] == 1800


@pytest.mark.asyncio
async def test_manager_dependent_taxonomy_integration():
    """Validates the official manager-provided MCAT Dependent Taxonomy integration."""
    from app.main import app
    from app.schemas.mcat import (
        CONTENT_DOMAINS,
        PRIMARY_TRAPS,
        QUESTION_TYPES,
        get_skills_for_section,
        get_taxonomy_data,
    )
    from app.schemas.workflow import GenerationRequest
    from httpx import ASGITransport, AsyncClient

    # 1. Verify Taxonomy Data Structure
    tax = get_taxonomy_data()
    assert tax["schema_version"] == "1.0"
    assert tax["exam"]["id"] == "MCAT"
    assert len(tax["sections"]) == 4

    # 2. Verify Skills Mapping
    cp_skills = get_skills_for_section("CP")
    assert len(cp_skills) == 4
    cp_skill_ids = [s["id"] for s in cp_skills]
    assert cp_skill_ids == ["S1", "S2", "S3", "S4"]

    cars_skills = get_skills_for_section("CARS")
    assert len(cars_skills) == 3
    cars_skill_ids = [s["id"] for s in cars_skills]
    assert cars_skill_ids == ["CARS1", "CARS2", "CARS3"]

    # 3. Verify Options Counts
    assert len(CONTENT_DOMAINS) == 33
    assert len(PRIMARY_TRAPS) == 25
    assert len(QUESTION_TYPES) == 8

    # 4. Verify API Endpoints
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # GET /api/taxonomy
        resp_tax = await client.get("/api/taxonomy")
        assert resp_tax.status_code == 200
        tax_payload = resp_tax.json()
        assert tax_payload["exam"]["id"] == "MCAT"
        assert len(tax_payload["sections"]) == 4

        # GET /api/sections
        resp_sec = await client.get("/api/sections")
        assert resp_sec.status_code == 200
        sec_payload = resp_sec.json()
        sections = sec_payload["sections"]
        assert len(sections) == 4
        cp_sec = next(s for s in sections if s["code"] == "CP")
        assert len(cp_sec["subjects"]) == 5
        assert len(cp_sec["skills"]) == 4

    # 5. Verify GenerationRequest Hierarchy Lineage & Dynamic Batch Size
    req = GenerationRequest(
        section="chem_phys",
        subject="General Chemistry",
        unit="Atomic Structure and Periodicity",
        topic="Atomic Structure",
        subtopic="Protons, neutrons, and electrons",
        aamc_skill="S1",
        subskill="Identify or recognize a scientific concept",
        question_type="DISCRETE_MCQ",
        likely_mistake_pattern="Uses the wrong reference value in a calculation",
        content_domains=["Atomic and Molecular Structure"],
        questions_to_generate=3,
    )
    assert req.questions_to_generate == 3
    assert req.single_choice_count == 3
    assert req.subject == "General Chemistry"
    assert req.subskill == "Identify or recognize a scientific concept"


def test_taxonomy_json_parity_between_backend_and_frontend():
    """Verify that backend and frontend taxonomy JSON files stay 100% in sync with zero drift."""
    from pathlib import Path

    backend_path = (
        Path(__file__).resolve().parent.parent / "app" / "data" / "mcat_dependent_taxonomy.json"
    )
    frontend_path = (
        Path(__file__).resolve().parent.parent.parent
        / "frontend"
        / "src"
        / "constants"
        / "mcat_dependent_taxonomy.json"
    )

    assert backend_path.exists(), f"Backend taxonomy JSON file must exist at {backend_path}"
    assert frontend_path.exists(), f"Frontend taxonomy JSON file must exist at {frontend_path}"

    backend_content = backend_path.read_text(encoding="utf-8")
    frontend_content = frontend_path.read_text(encoding="utf-8")

    assert (
        backend_content == frontend_content
    ), "Taxonomy JSON in backend/app/data and frontend/src/constants must be byte-for-byte identical"


@pytest.mark.asyncio
async def test_question_status_lifecycle_and_counts():
    """Verifies question status filtering, counts aggregation, and status transitions."""
    import uuid
    from app.repositories.question_repository import (
        batch_update_question_status,
        delete_question,
        get_question_status_counts,
        get_questions,
        save_question,
        update_question_status,
    )
    from app.schemas.question import OptionChoice, Question

    uid1 = str(uuid.uuid4())
    uid2 = str(uuid.uuid4())

    q1 = Question(
        id=uid1,
        section="chem_phys",
        section_label="Chemical and Physical Foundations",
        subtopic="Acid-Base Equilibrium",
        difficulty="Hard",
        question_stem="What is the pH?",
        options=[
            OptionChoice(id="A", text="3.0"),
            OptionChoice(id="B", text="4.0"),
            OptionChoice(id="C", text="5.0"),
            OptionChoice(id="D", text="7.0"),
        ],
        correct_answer_id="A",
        explanation="Calculated pH is 3.0",
        final_score=96,
        status="ai_validated",
    )

    q2 = Question(
        id=uid2,
        section="bio_biochem",
        section_label="Biological and Biochemical Foundations",
        subtopic="Enzyme Kinetics",
        difficulty="Medium",
        question_stem="What is Km?",
        options=[
            OptionChoice(id="A", text="Vmax/2"),
            OptionChoice(id="B", text="Substrate concentration at half Vmax"),
            OptionChoice(id="C", text="Turnover rate"),
            OptionChoice(id="D", text="Inhibition constant"),
        ],
        correct_answer_id="B",
        explanation="Km definition",
        final_score=85,
        status="below_threshold",
    )

    await save_question(q1)
    await save_question(q2)

    # Verify filtering
    validated_qs = await get_questions(status="ai_validated")
    assert any(q.id == uid1 for q in validated_qs)
    assert not any(q.id == uid2 for q in validated_qs)

    below_qs = await get_questions(status="below_threshold")
    assert any(q.id == uid2 for q in below_qs)
    assert not any(q.id == uid1 for q in below_qs)

    # Test counts
    counts = await get_question_status_counts()
    assert counts["ai_validated"] >= 1
    assert counts["below_threshold"] >= 1

    # Update single status (e.g. promote to in_bank)
    res_single = await update_question_status(uid1, "in_bank")
    assert res_single is True

    bank_qs = await get_questions(status="in_bank")
    assert any(q.id == uid1 for q in bank_qs)

    # Batch update status (e.g. discard)
    res_batch = await batch_update_question_status([uid1, uid2], "discarded")
    assert res_batch == 2

    discarded_qs = await get_questions(status="discarded")
    assert any(q.id == uid1 for q in discarded_qs)
    assert any(q.id == uid2 for q in discarded_qs)

    # Cleanup
    await delete_question(uid1)
    await delete_question(uid2)

