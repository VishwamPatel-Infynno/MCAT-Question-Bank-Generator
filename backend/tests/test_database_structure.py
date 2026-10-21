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


@pytest.mark.asyncio
async def test_database_schema_initialization():
    """Verify that init_db() successfully runs without errors, creates tables, foreign keys, and indexes."""
    await init_db()


@pytest.mark.asyncio
async def test_passage_auto_sync_and_retrieval():
    """Verify that saving a question with passage_id auto-creates and updates the passage in the passages table."""
    await init_db()

    passage_uuid = f"test-passage-{uuid.uuid4()}"
    stimulus = (
        "This is a detailed UCAT stimulus text about cognitive biomechanics and memory retrieval."
    )

    q = Question(
        id=f"test-q-{uuid.uuid4()}",
        section="VR",
        section_label="Verbal Reasoning",
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
    assert passage.section == "VR"

    # Verify querying questions by passage_id
    linked_qs = await get_questions(passage_id=passage_uuid)
    assert len(linked_qs) == 1
    assert linked_qs[0].id == q.id

    # Clean up
    await delete_question(q.id)


@pytest.mark.asyncio
async def test_batch_auto_sync_and_atomic_aggregation():
    """Verify saving questions via save_questions_batch aggregates count, tokens, and cost on GenerationBatchModel."""
    await init_db()

    batch_uuid = f"test-batch-{uuid.uuid4()}"
    q1 = Question(
        id=f"test-q1-{uuid.uuid4()}",
        batch_id=batch_uuid,
        section="DM",
        section_label="Decision Making",
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
        section="DM",
        section_label="Decision Making",
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
    await init_db()

    unique_keyword = f"quasarastrophysics{uuid.uuid4().hex[:6]}"
    q = Question(
        id=f"test-fts-{uuid.uuid4()}",
        section="QR",
        section_label="Quantitative Reasoning",
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
    await init_db()

    passage_id = f"api-p-{uuid.uuid4()}"
    batch_id = f"api-b-{uuid.uuid4()}"

    q = Question(
        id=f"test-api-q-{uuid.uuid4()}",
        batch_id=batch_id,
        passage_id=passage_id,
        section="VR",
        section_label="Verbal Reasoning",
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

    # Clean up
    await delete_question(q.id)
