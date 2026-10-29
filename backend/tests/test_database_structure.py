import uuid

import httpx
import pytest
from app.db.session import init_db
from app.main import app
from app.repositories import (
    delete_question,
    get_batch_by_id,
    get_passage_by_id,
    get_questions,
    save_question,
    save_questions_batch,
)
from app.schemas import OptionChoice, Question

pytestmark = pytest.mark.requires_db


@pytest.mark.asyncio
async def test_database_schema_initialization():
    """Verify that init_db() successfully runs without errors, creates tables, foreign keys, and indexes."""
    await init_db()


@pytest.mark.asyncio
async def test_passage_auto_sync_and_retrieval():
    """Verify that saving a question with passage_id auto-creates and updates the passage in the passages table."""
    passage_uuid = f"test-passage-{uuid.uuid4()}"
    stimulus = (
        "This is a detailed MCAT stimulus text about cognitive biomechanics and memory retrieval."
    )

    q = Question(
        id=f"test-q-{uuid.uuid4()}",
        section="cars",
        section_label="Critical Analysis and Reasoning Skills",
        subtopic="Critical Reading",
        difficulty="Medium",
        stimulus_text=stimulus,
        question_stem="What is the main finding regarding memory retrieval?",
        options=[
            OptionChoice(id="A", text="Finding Alpha"),
            OptionChoice(id="B", text="Finding Beta"),
            OptionChoice(id="C", text="Finding Gamma"),
            OptionChoice(id="D", text="Finding Delta"),
        ],
        correct_answer_id="B",
        explanation="Finding Beta is supported directly in sentence two.",
        passage_id=passage_uuid,
        passage_mode="single_passage",
    )

    await save_question(q)

    # Verify passage was auto-created in passages table
    passage = await get_passage_by_id(passage_uuid)
    assert passage is not None
    assert passage.id == passage_uuid
    assert passage.text == stimulus
    assert passage.word_count == len(stimulus.split())
    assert passage.section == "cars"

    # Verify querying questions by passage_id
    linked_qs = await get_questions(passage_id=passage_uuid)
    assert len(linked_qs) == 1
    assert linked_qs[0].id == q.id

    # Clean up
    await delete_question(q.id)


@pytest.mark.asyncio
async def test_batch_auto_sync_and_atomic_aggregation():
    """Verify saving questions via save_questions_batch aggregates count, tokens, and cost on GenerationBatchModel."""
    batch_uuid = f"test-batch-{uuid.uuid4()}"
    q1 = Question(
        id=f"test-q1-{uuid.uuid4()}",
        batch_id=batch_uuid,
        section="chem_phys",
        section_label="Chemical and Physical Foundations",
        subtopic="Syllogisms",
        difficulty="Hard",
        question_stem="Does Conclusion 1 follow?",
        options=[
            OptionChoice(id="A", text="Yes"),
            OptionChoice(id="B", text="No"),
            OptionChoice(id="C", text="Neither"),
            OptionChoice(id="D", text="Both"),
        ],
        correct_answer_id="A",
        explanation="Conclusion 1 logically follows from premises.",
        total_tokens=150,
        cost_usd=0.002,
    )
    q2 = Question(
        id=f"test-q2-{uuid.uuid4()}",
        batch_id=batch_uuid,
        section="chem_phys",
        section_label="Chemical and Physical Foundations",
        subtopic="Syllogisms",
        difficulty="Hard",
        question_stem="Does Conclusion 2 follow?",
        options=[
            OptionChoice(id="A", text="Yes"),
            OptionChoice(id="B", text="No"),
            OptionChoice(id="C", text="Neither"),
            OptionChoice(id="D", text="Both"),
        ],
        correct_answer_id="B",
        explanation="Conclusion 2 is an unwarranted leap.",
        total_tokens=250,
        cost_usd=0.003,
    )

    saved_res = await save_questions_batch([q1, q2])
    assert len(saved_res) == 2

    batch = await get_batch_by_id(batch_uuid)
    assert batch is not None
    assert batch.id == batch_uuid
    assert batch.actual_count == 2
    assert batch.total_tokens == 400
    assert pytest.approx(batch.cost_usd, 0.0001) == 0.005

    # Clean up
    await delete_question(q1.id)
    await delete_question(q2.id)


@pytest.mark.asyncio
async def test_hybrid_full_text_search():
    """Verify full-text search correctly indexes and retrieves questions by distinctive keywords."""
    unique_keyword = f"quasarastrophysics{uuid.uuid4().hex[:6]}"
    q = Question(
        id=f"test-fts-{uuid.uuid4()}",
        section="bio_biochem",
        section_label="Biological and Biochemical Foundations",
        subtopic="Rates and Proportions",
        difficulty="Medium",
        stimulus_text=f"A deep sky telescope detected a rare {unique_keyword} phenomenon.",
        question_stem="Calculate the relative redshift velocity.",
        options=[
            OptionChoice(id="A", text="1200 km/s"),
            OptionChoice(id="B", text="2400 km/s"),
            OptionChoice(id="C", text="3600 km/s"),
            OptionChoice(id="D", text="4800 km/s"),
        ],
        correct_answer_id="C",
        explanation="Velocity calculation from frequency shift.",
    )

    await save_question(q)

    # Search by unique keyword
    results = await get_questions(search=unique_keyword)
    assert len(results) >= 1
    found = any(r.id == q.id for r in results)
    assert found is True

    # Clean up
    await delete_question(q.id)


@pytest.mark.asyncio
async def test_api_passages_and_batches():
    """Verify HTTP API endpoints for /api/passages and /api/batches."""
    passage_id = f"api-p-{uuid.uuid4()}"
    batch_id = f"api-b-{uuid.uuid4()}"

    q = Question(
        id=f"test-api-q-{uuid.uuid4()}",
        batch_id=batch_id,
        passage_id=passage_id,
        section="cars",
        section_label="Critical Analysis and Reasoning Skills",
        subtopic="Inference",
        difficulty="Easy",
        stimulus_text="Medical triage protocols require immediate categorization of acute trauma.",
        question_stem="What is the primary objective of triage?",
        options=[
            OptionChoice(id="A", text="Resource allocation"),
            OptionChoice(id="B", text="Documentation"),
            OptionChoice(id="C", text="Billing"),
            OptionChoice(id="D", text="Discharge"),
        ],
        correct_answer_id="A",
        explanation="Triage prioritizes care based on severity and resource utility.",
    )

    await save_question(q)

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Test GET /api/passages
        resp_p = await client.get("/api/passages")
        assert resp_p.status_code == 200
        p_data = resp_p.json()
        assert "passages" in p_data
        assert any(p["id"] == passage_id for p in p_data["passages"])

        # 2. Test GET /api/passages/{passage_id}
        resp_single_p = await client.get(f"/api/passages/{passage_id}")
        assert resp_single_p.status_code == 200
        single_p_data = resp_single_p.json()
        assert single_p_data["passage"]["id"] == passage_id
        assert len(single_p_data["questions"]) == 1
        assert single_p_data["questions"][0]["id"] == q.id

        # 3. Test GET /api/batches
        resp_b = await client.get("/api/batches")
        assert resp_b.status_code == 200
        b_data = resp_b.json()
        assert "batches" in b_data
        assert any(b["id"] == batch_id for b in b_data["batches"])

        # 4. Test GET /api/batches/{batch_id}
        resp_single_b = await client.get(f"/api/batches/{batch_id}")
        assert resp_single_b.status_code == 200
        single_b_data = resp_single_b.json()
        assert single_b_data["batch"]["id"] == batch_id
        assert len(single_b_data["questions"]) == 1

        # 5. Test updating passage via POST /api/passages and verify stimulus_text auto-syncs
        updated_passage_payload = {
            "id": passage_id,
            "title": "Updated Triage Protocol",
            "text": "Medical triage protocols require rapid and systematic categorization.",
            "section": "cars",
            "subtopic": "Inference",
        }
        resp_update_p = await client.post("/api/passages", json=updated_passage_payload)
        assert resp_update_p.status_code == 200
        # Check that question stimulus_text was synced
        resp_q_check = await client.get(f"/api/questions/{q.id}")
        assert resp_q_check.status_code == 200
        assert (
            resp_q_check.json()["stimulus_text"]
            == "Medical triage protocols require rapid and systematic categorization."
        )

        # 6. Test DELETE /api/passages/{passage_id} and verify question is unlinked (retained in bank)
        resp_del_p = await client.delete(f"/api/passages/{passage_id}")
        assert resp_del_p.status_code == 200
        assert resp_del_p.json()["success"] is True

        # Passage should now be gone (404)
        resp_gone = await client.get(f"/api/passages/{passage_id}")
        assert resp_gone.status_code == 404

        # Question should still exist in bank with passage_id == None
        resp_q_unlinked = await client.get(f"/api/questions/{q.id}")
        assert resp_q_unlinked.status_code == 200
        assert resp_q_unlinked.json()["passage_id"] is None

    # Clean up
    await delete_question(q.id)


@pytest.mark.asyncio
async def test_centralized_repository_package_exports():
    """Verify that all job, batch, question, and passage functions are correctly exported by app.repositories."""
    import app.repositories as repos

    expected_exports = [
        "get_job_by_id",
        "get_jobs_by_batch_id",
        "save_job",
        "save_jobs_bulk",
        "update_job_progress",
        "get_batch_by_id",
        "get_batches",
        "save_batch",
        "delete_batch",
        "delete_passage",
        "get_passage_by_id",
        "get_passages",
        "save_passage",
        "get_question_by_id",
        "get_questions",
        "save_question",
        "save_questions_batch",
        "delete_question",
        "delete_questions_batch",
        "get_repository_metrics",
    ]
    for fn_name in expected_exports:
        assert hasattr(repos, fn_name), f"app.repositories must export '{fn_name}'"
        assert callable(getattr(repos, fn_name)), (
            f"'{fn_name}' in app.repositories must be callable"
        )


@pytest.mark.asyncio
async def test_model_to_schema_none_options_safety():
    """Verify that _model_to_schema gracefully handles None or empty options without exception."""
    from app.models.question import QuestionModel
    from app.repositories.question_repository import _model_to_schema

    dummy_model = QuestionModel(
        id=f"test-null-opts-{uuid.uuid4()}",
        section="bb",
        section_label="Biological & Biochemical Foundations",
        subtopic="Metabolic Pathways",
        difficulty="medium",
        question_stem="What is the primary role of phosphofructokinase-1?",
        options=None,
        correct_answer_id="A",
        explanation="PFK-1 catalyzes the rate-limiting step of glycolysis.",
        final_score=92,
    )
    schema_item = _model_to_schema(dummy_model)
    assert schema_item.id == dummy_model.id
    assert schema_item.options == []
