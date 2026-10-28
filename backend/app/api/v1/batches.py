import logging
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query, status

from app.repositories.batch_repository import (
    delete_batch,
    get_batch_by_id,
    get_batches,
    save_batch,
)
from app.repositories.job_repository import get_jobs_by_batch_id
from app.repositories.question_repository import get_questions
from app.schemas import GenerationBatch, GenerationRequest
from app.services.batch_runner import (
    cancel_all_background_batches,
    cancel_background_batch,
    get_active_batch_metrics,
    launch_background_batch,
    retry_incomplete_jobs_for_batch,
    stop_background_batch,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Generation Batches"])


@router.post("/batches/start", status_code=status.HTTP_202_ACCEPTED)
async def start_batch_generation(req: GenerationRequest):
    """
    Launches an asynchronous background batch generation.
    Creates 1 batch record and constituent job records (1 job producing 5 questions for a mini-batch,
    or 10 jobs producing 5 questions each for a 50-question full mock section).
    Returns immediately with batch and job details while generation runs in the background.
    """
    try:
        batch, jobs = await launch_background_batch(req)
        return {
            "success": True,
            "message": f"Background batch {batch.id} launched with {len(jobs)} {'job' if len(jobs) == 1 else 'jobs'} ({batch.target_count} questions total).",
            "batch": batch.model_dump(),
            "jobs": [j.model_dump() for j in jobs],
        }
    except Exception as e:
        logger.error(f"Failed to start background batch: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, detail=f"Failed to initialize background batch: {e}"
        ) from e


@router.get("/batches")
async def list_batches(
    section: Annotated[str | None, Query()] = None,
    status: Annotated[str | None, Query()] = None,
):
    """Lists generation batches in the question bank with job progress counts and concurrency metrics."""
    batches = await get_batches(section=section, status=status)
    active_count = sum(1 for b in batches if b.status == "in_progress")
    metrics = get_active_batch_metrics()
    return {
        "batches": [b.model_dump() for b in batches],
        "active_running_batches": active_count,
        "concurrency_metrics": metrics,
    }


@router.get("/batches/{batch_id}")
async def get_single_batch(batch_id: str):
    """
    Retrieves a single generation batch along with its 10 jobs and all generated questions.
    Questions are organized so the client can easily view questions per job.
    """
    b = await get_batch_by_id(batch_id)
    if not b:
        raise HTTPException(status_code=404, detail="Batch not found")

    jobs = await get_jobs_by_batch_id(batch_id)
    linked_questions = await get_questions(batch_id=batch_id)

    # Group questions by job_id or run_id
    questions_by_job: dict[str, list[dict]] = {}
    for q in linked_questions:
        q_dump = q.model_dump()
        j_key = q.job_id or q.run_id or "unassigned"
        questions_by_job.setdefault(j_key, []).append(q_dump)

    # Augment jobs with their questions
    jobs_with_questions = []
    for j in jobs:
        j_dump = j.model_dump()
        j_dump["questions"] = questions_by_job.get(j.id, [])
        jobs_with_questions.append(j_dump)

    return {
        "batch": b.model_dump(),
        "jobs": jobs_with_questions,
        "questions": [q.model_dump() for q in linked_questions],
        "total_questions_count": len(linked_questions),
    }


@router.post("/batches/{batch_id}/stop")
async def stop_single_batch(batch_id: str):
    """Gracefully halts active background jobs for a batch without deleting saved questions."""
    b = await get_batch_by_id(batch_id)
    if not b:
        raise HTTPException(status_code=404, detail="Batch not found")
    await stop_background_batch(batch_id)
    refreshed = await get_batch_by_id(batch_id)
    return {
        "success": True,
        "message": f"Batch {batch_id} execution stopped.",
        "batch": refreshed.model_dump() if refreshed else None,
    }


@router.post("/batches/{batch_id}/retry")
async def retry_single_batch(batch_id: str, req: GenerationRequest | None = None):
    """Re-launches failed or cancelled jobs for a batch into the global worker pool."""
    b = await get_batch_by_id(batch_id)
    if not b:
        raise HTTPException(status_code=404, detail="Batch not found")
    batch, jobs = await retry_incomplete_jobs_for_batch(batch_id, req)
    return {
        "success": True,
        "message": f"Retrying incomplete jobs for batch {batch_id}.",
        "batch": batch.model_dump() if batch else None,
        "jobs": [j.model_dump() for j in jobs],
    }


@router.post("/batches/cancel-all")
async def cancel_all_batches():
    """Gracefully halts all active background batches."""
    stopped_count = await cancel_all_background_batches()
    return {
        "success": True,
        "message": f"Successfully stopped {stopped_count} running batches.",
        "stopped_count": stopped_count,
    }


@router.delete("/batches/{batch_id}")
async def delete_single_batch(batch_id: str):
    """Deletes a generation batch and cascades delete to jobs and questions."""
    await cancel_background_batch(batch_id)
    deleted = await delete_batch(batch_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Batch not found")
    return {"success": True, "message": f"Batch {batch_id} deleted successfully."}


@router.post("/batches")
async def create_or_update_batch(batch: GenerationBatch):
    """Admin endpoint to create or update a generation batch record."""
    saved = await save_batch(batch)
    return {"success": True, "batch": saved.model_dump()}
