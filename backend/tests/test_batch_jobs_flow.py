import pytest
from app.db.session import init_db
from app.main import app
from app.services.batch_runner import cancel_all_background_batches
from httpx import ASGITransport, AsyncClient


@pytest.fixture(autouse=True)
async def ensure_db():
    await init_db()
    yield
    await cancel_all_background_batches()


@pytest.mark.asyncio
async def test_batch_and_jobs_lifecycle(monkeypatch):
    # Mock background execution to test REST/DB lifecycle without spawning live generation workers
    async def mock_execute(b_id, req):
        pass

    monkeypatch.setattr("app.services.batch_runner._execute_batch_workflow", mock_execute)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Start a 50-question background batch
        req_payload = {
            "section": "chem_phys",
            "subtopic": "Translational Motion",
            "difficulty": "medium",
            "questions_to_generate": 50,
            "passage_mode": "single_passage",
            "passage_required": "Yes",
        }

        resp = await ac.post("/api/batches/start", json=req_payload)
        assert resp.status_code == 202
        data = resp.json()
        assert data["success"] is True
        batch_id = data["batch"]["id"]
        assert data["batch"]["target_count"] == 50
        assert data["batch"]["total_jobs"] == 10
        assert len(data["jobs"]) == 10

        # Verify job numbers are 1 through 10
        job_numbers = [j["job_number"] for j in data["jobs"]]
        assert job_numbers == list(range(1, 11))
        for j in data["jobs"]:
            assert j["target_count"] == 5
            assert j["batch_id"] == batch_id
            assert j["status"] in ("pending", "running")

        # 2. Query batch list
        list_resp = await ac.get("/api/batches")
        assert list_resp.status_code == 200
        list_data = list_resp.json()
        assert "batches" in list_data
        matching = [b for b in list_data["batches"] if b["id"] == batch_id]
        assert len(matching) == 1
        assert matching[0]["total_jobs"] == 10

        # 3. Query single batch detail with jobs
        detail_resp = await ac.get(f"/api/batches/{batch_id}")
        assert detail_resp.status_code == 200
        detail_data = detail_resp.json()
        assert detail_data["batch"]["id"] == batch_id
        assert len(detail_data["jobs"]) == 10
        assert "questions" in detail_data

        # 4. Delete the batch
        del_resp = await ac.delete(f"/api/batches/{batch_id}")
        assert del_resp.status_code == 200

        # 5. Verify batch is gone
        get_again = await ac.get(f"/api/batches/{batch_id}")
        assert get_again.status_code == 404


@pytest.mark.asyncio
async def test_mini_batch_lifecycle(monkeypatch):
    """Verifies that launching a 5-question batch creates exactly 1 job (5 questions target) in background pool."""

    async def mock_execute(b_id, req):
        pass

    monkeypatch.setattr("app.services.batch_runner._execute_batch_workflow", mock_execute)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Start a 5-question Mini-Batch
        req_payload = {
            "section": "bio_biochem",
            "subtopic": "Enzyme Kinetics",
            "difficulty": "medium",
            "questions_to_generate": 5,
            "passage_mode": "single_passage",
            "passage_required": "Yes",
        }

        resp = await ac.post("/api/batches/start", json=req_payload)
        assert resp.status_code == 202
        data = resp.json()
        assert data["success"] is True
        batch_id = data["batch"]["id"]
        assert data["batch"]["target_count"] == 5
        assert data["batch"]["total_jobs"] == 1
        assert len(data["jobs"]) == 1

        # Verify single job attributes
        single_job = data["jobs"][0]
        assert single_job["job_number"] == 1
        assert single_job["target_count"] == 5
        assert single_job["batch_id"] == batch_id
        assert single_job["status"] in ("pending", "running")

        # 2. Query batch list and verify total_jobs == 1
        list_resp = await ac.get("/api/batches")
        assert list_resp.status_code == 200
        list_data = list_resp.json()
        matching = [b for b in list_data["batches"] if b["id"] == batch_id]
        assert len(matching) == 1
        assert matching[0]["total_jobs"] == 1
        assert matching[0]["target_count"] == 5

        # 3. Query single batch detail with job
        detail_resp = await ac.get(f"/api/batches/{batch_id}")
        assert detail_resp.status_code == 200
        detail_data = detail_resp.json()
        assert detail_data["batch"]["id"] == batch_id
        assert len(detail_data["jobs"]) == 1
        assert detail_data["jobs"][0]["job_number"] == 1

        # 4. Clean up batch
        del_resp = await ac.delete(f"/api/batches/{batch_id}")
        assert del_resp.status_code == 200
