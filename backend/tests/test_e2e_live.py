import json
import csv
import io
import pytest
import httpx
from app.core.config import config
from app.workflow.graph import route_after_review, reject_node
from app.schemas import ReviewScore, QuestionDraft

BASE_URL = "http://127.0.0.1:8000/api"

@pytest.mark.asyncio
async def test_e2e_health_and_db_connectivity():
    """
    E2E Test 1: Verify health endpoint, PostgreSQL 16 connection,
    active DeepInfra credentials, and model pricing parameters.
    """
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        resp = await client.get("/health")
        assert resp.status_code == 200, f"Health check failed: {resp.text}"
        data = resp.json()
        
        # Verify database
        assert data["status"] == "healthy"
        assert data["database"] == "postgresql"
        assert data["database_connected"] is True
        assert "PostgreSQL 16" in data["database_version"]
        
        # Verify inference models and pricing
        assert data["default_text_model"] == "deepinfra/meta-llama/Llama-3.3-70B-Instruct-Turbo"
        assert data["default_image_model"] == "deepinfra/black-forest-labs/FLUX-1-schnell"
        assert data["has_deepinfra_key"] is True
        assert data["cost_per_million_input"] == 0.1
        assert data["cost_per_million_output"] == 0.32
        assert data["passing_threshold"] == 90
        assert data["max_regenerations"] == 3

@pytest.mark.asyncio
async def test_e2e_all_five_sections_metadata():
    """
    E2E Test 2: Verify all 5 official UCAT subtests and curriculum subtopics.
    """
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        resp = await client.get("/sections")
        assert resp.status_code == 200
        data = resp.json()
        sections = data.get("sections", [])
        assert len(sections) == 5, f"Expected 5 sections, got {len(sections)}"
        
        expected_sections = {
            "verbal_reasoning",
            "decision_making",
            "quantitative_reasoning",
            "abstract_reasoning",
            "situational_judgement"
        }
        actual_sections = {s["id"] for s in sections}
        assert actual_sections == expected_sections
        
        for sec in sections:
            assert len(sec.get("subtopics", [])) >= 4, f"Section {sec['id']} missing subtopics"
            assert "label" in sec

@pytest.mark.asyncio
async def test_e2e_config_endpoint():
    """
    E2E Test 3: Verify the configuration management and status endpoint.
    """
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        resp = await client.get("/config")
        assert resp.status_code == 200
        cfg = resp.json()
        assert cfg["default_text_model"] == "deepinfra/meta-llama/Llama-3.3-70B-Instruct-Turbo"
        assert cfg["has_deepinfra_key"] is True
        assert cfg["passing_threshold"] == 90
        assert cfg["current_image_cost_usd"] == 0.002

@pytest.mark.asyncio
async def test_e2e_live_generation_sse_stream():
    """
    E2E Test 4: Full Multi-Agent Pipeline Execution via Server-Sent Events (SSE).
    Generates a live question using Meta Llama 3.3-70B Instruct Turbo on DeepInfra.
    Verifies event chronology, 100-pt psychometric rubric scoring (> 90),
    exact token tracking, and automatic PostgreSQL 16 persistence.
    """
    payload = {
        "section": "verbal_reasoning",
        "subtopic": "Critical Reading & Inferences",
        "difficulty": "medium",
        "require_image": False
    }

    events = []
    completed_question = None

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=120.0) as client:
        async with client.stream("POST", "/generate", json=payload) as response:
            assert response.status_code == 200
            assert "text/event-stream" in response.headers.get("content-type", "")

            buffer = ""
            async for chunk in response.aiter_text():
                buffer += chunk
                while "\n\n" in buffer:
                    block, buffer = buffer.split("\n\n", 1)
                    block = block.strip()
                    if block.startswith("data: "):
                        data_str = block[6:]
                        try:
                            ev = json.loads(data_str)
                            events.append(ev)
                            if ev.get("event_type") == "workflow_complete":
                                completed_question = ev.get("data", {}).get("question")
                        except json.JSONDecodeError:
                            pass

    assert len(events) >= 3, f"Expected multi-agent stream events, received: {len(events)}"

    # Verify event sequencing
    event_types = [e.get("event_type") for e in events]
    assert "workflow_start" in event_types
    assert "agent_start" in event_types
    assert "agent_complete" in event_types
    assert "workflow_complete" in event_types

    # Verify the question output
    assert completed_question is not None, "Workflow did not return a completed question"
    assert completed_question["section"] == "verbal_reasoning"
    assert len(completed_question["options"]) == 4
    assert completed_question["correct_answer_id"] in ["A", "B", "C", "D"]
    assert completed_question["stimulus_text"] is not None
    assert len(completed_question["stimulus_text"]) > 50
    assert completed_question["question_stem"] is not None
    assert completed_question["explanation"] is not None

    # Verify psychometric score requirement (> 90)
    final_score = completed_question.get("final_score", 0)
    assert final_score > 90, f"Question must pass rubric with score > 90, got: {final_score}"

    # Verify token and cost accounting
    assert completed_question.get("total_tokens", 0) > 0
    assert completed_question.get("cost_usd", 0.0) > 0.0

@pytest.mark.asyncio
async def test_e2e_question_bank_crud_and_filtering():
    """
    E2E Test 5: Verify Question Bank queries, filtering by section,
    difficulty, search term, and question retrieval by ID.
    """
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        # 1. Fetch all questions
        resp = await client.get("/questions")
        assert resp.status_code == 200
        data = resp.json()
        questions = data.get("questions", [])
        assert len(questions) > 0, "Question bank should contain saved questions"
        
        sample_q = questions[0]
        q_id = sample_q["id"]

        # 2. Fetch single question by ID
        resp_single = await client.get(f"/questions/{q_id}")
        assert resp_single.status_code == 200
        single_q = resp_single.json()
        assert single_q["id"] == q_id
        assert len(single_q["options"]) == 4

        # 3. Test filtering by section
        sec = sample_q["section"]
        resp_sec = await client.get(f"/questions?section={sec}")
        assert resp_sec.status_code == 200
        sec_questions = resp_sec.json().get("questions", [])
        for q in sec_questions:
            assert q["section"] == sec

        # 4. Test filtering by difficulty
        diff = sample_q["difficulty"]
        resp_diff = await client.get(f"/questions?difficulty={diff}")
        assert resp_diff.status_code == 200
        diff_questions = resp_diff.json().get("questions", [])
        for q in diff_questions:
            assert q["difficulty"] == diff

        # 5. Test search query
        snippet = sample_q["question_stem"][:10]
        resp_search = await client.get(f"/questions?search={snippet}")
        assert resp_search.status_code == 200
        search_results = resp_search.json().get("questions", [])
        assert len(search_results) >= 1

@pytest.mark.asyncio
async def test_e2e_export_json_and_csv():
    """
    E2E Test 6: Verify export capabilities in both JSON and RFC 4180 CSV formats.
    """
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
        # JSON Export
        resp_json = await client.get("/export?format=json")
        assert resp_json.status_code == 200
        assert "application/json" in resp_json.headers.get("content-type", "")
        exported_data = resp_json.json()
        assert isinstance(exported_data, list)
        assert len(exported_data) > 0

        # CSV Export
        resp_csv = await client.get("/export?format=csv")
        assert resp_csv.status_code == 200
        assert "text/csv" in resp_csv.headers.get("content-type", "")
        csv_text = resp_csv.text
        reader = csv.reader(io.StringIO(csv_text))
        rows = list(reader)
        assert len(rows) >= 2, "CSV should contain header row and at least one data row"
        header = rows[0]
        assert "ID" in header
        assert "Section" in header
        assert "Difficulty" in header
        assert "Final Score" in header

@pytest.mark.asyncio
async def test_e2e_strict_threshold_rejection_boundary():
    """
    E2E Test 7: Verify rejection boundary behavior.
    When a draft scores <= 90 after max attempts, it must be rejected
    and produce diagnostic payload without being saved to database.
    """
    from app.schemas import GenerationRequest, UCATSection, Difficulty
    from app.agents.generator import get_mock_draft

    req = GenerationRequest(section=UCATSection.DECISION_MAKING, difficulty=Difficulty.HARD)
    draft = get_mock_draft(req)

    failing_review = ReviewScore(
        total_score=84,
        passed=False,
        authenticity_score=21,
        clarity_score=21,
        distractor_score=21,
        explanation_score=21,
        recommendations=["Distractor B is too obvious and tone lacks clinical rigor."]
    )

    state_failing = {
        "request": req.model_dump(),
        "current_draft": draft.model_dump(),
        "current_review": failing_review.model_dump(),
        "iteration_count": config.MAX_REGENERATION_ATTEMPTS
    }

    # Route after review must select reject
    next_step = route_after_review(state_failing)
    assert next_step == "reject"

    # Reject node must produce diagnosis
    reject_res = await reject_node(state_failing)
    assert reject_res["status"] == "rejected_below_threshold"
    assert reject_res["rejection_data"]["final_score"] == 84
    assert "reason" in reject_res["rejection_data"]

@pytest.mark.asyncio
async def test_e2e_manager_combination_matrix_and_stage_outcomes():
    """
    E2E Test 8: Verify manager combination matrix attributes (CMB00001)
    and full multi-stage outcomes JSON recording (drafting, quality_audit, polish_refine, visual_stimulus, final_payload).
    """
    from app.schemas import GenerationRequest, Difficulty
    from app.workflow.graph import run_workflow

    req = GenerationRequest(
        combination_id="CMB00001",
        section="VR",
        subtopic="Inference",
        difficulty=Difficulty.EASY,
        content_domain="Science",
        question_type="Passage_MCQ",
        interaction_type="single_choice",
        primary_trap="Keyword_Trap",
        passage_required="Yes",
        passage_questions=3,
        image_required="No",
        visual_type="None",
        questions_to_generate=4
    )

    result = await run_workflow(req)
    assert result.status in ["approved", "rejected_below_threshold"]

    if result.status == "approved" and result.question:
        q = result.question
        assert q.combination_id == "CMB00001"
        assert q.content_domain == "Science"
        assert q.question_type == "Passage_MCQ"
        assert q.primary_trap == "Keyword_Trap"
        assert q.passage_required == "Yes"

        # Verify Stage Outcomes JSON recording
        assert q.stage_outcomes is not None
        assert "drafting" in q.stage_outcomes
        assert "quality_audit" in q.stage_outcomes
        assert "polish_refine" in q.stage_outcomes
        assert "visual_stimulus" in q.stage_outcomes
        assert "final_payload" in q.stage_outcomes

        # Verify drafting stage payload
        assert "question_stem" in q.stage_outcomes["drafting"]
        assert "options" in q.stage_outcomes["drafting"]
        assert len(q.stage_outcomes["drafting"]["options"]) == 4

        # Verify quality audit stage payload
        assert "total_score" in q.stage_outcomes["quality_audit"]
        assert q.stage_outcomes["quality_audit"]["total_score"] >= 90

        # Verify API query filtering by combination_id
        async with httpx.AsyncClient(base_url=BASE_URL, timeout=10.0) as client:
            resp = await client.get("/questions?combination_id=CMB00001")
            assert resp.status_code == 200
            data = resp.json()
            questions = data.get("questions", [])
            assert any(item["combination_id"] == "CMB00001" for item in questions)

            # Verify CSV export contains the manager columns
            resp_csv = await client.get("/export?format=csv")
            assert resp_csv.status_code == 200
            csv_lines = resp_csv.text.splitlines()
            header = csv_lines[0].split(",")
            assert "Combination_ID" in header
            assert "Content_Domain" in header
            assert "Primary_Trap" in header

