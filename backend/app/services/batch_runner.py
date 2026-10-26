import asyncio
import json
import logging
import uuid
from datetime import UTC, datetime
from typing import Any

from app.core.config import config
from app.repositories.batch_repository import (
    get_batch_by_id,
    refresh_batch_aggregates,
    save_batch,
)
from app.repositories.job_repository import (
    get_jobs_by_batch_id,
    save_jobs_bulk,
    update_job_progress,
)
from app.repositories.question_repository import save_question
from app.schemas import GenerationBatch, GenerationJob, GenerationRequest, Question
from app.workflow.engine import run_workflow_stream

logger = logging.getLogger(__name__)

# Active background tasks dictionary to track running batch tasks
_active_batch_tasks: dict[str, asyncio.Task[Any]] = {}

# In-memory store for generation requests to support 1-click retries
_batch_requests: dict[str, GenerationRequest] = {}

# Global worker pool semaphore governing concurrent jobs across ALL running batches
_GLOBAL_JOB_SEMAPHORE: asyncio.Semaphore | None = None


def get_global_job_semaphore() -> asyncio.Semaphore:
    """Returns the singleton global worker pool semaphore, lazily initialized."""
    global _GLOBAL_JOB_SEMAPHORE
    if _GLOBAL_JOB_SEMAPHORE is None:
        _GLOBAL_JOB_SEMAPHORE = asyncio.Semaphore(config.GLOBAL_MAX_CONCURRENT_JOBS)
    return _GLOBAL_JOB_SEMAPHORE


async def _run_single_job(
    batch_id: str,
    job: GenerationJob,
    base_req: GenerationRequest,
    semaphore: asyncio.Semaphore,
) -> None:
    """Executes a single job generating 5 questions, saving them directly to the database."""
    async with semaphore:
        now_iso = datetime.now(UTC).isoformat()
        logger.info(f"Starting Job {job.job_number}/10 (ID: {job.id}) for Batch {batch_id}...")
        await update_job_progress(job.id, status="running", started_at=now_iso)

        is_cars = (
            base_req.section.value if hasattr(base_req.section, "value") else str(base_req.section)
        )
        is_cars = is_cars in ("cars", "CARS")
        is_passage_mode = (
            is_cars
            or base_req.passage_mode == "single_passage"
            or str(base_req.passage_required).lower() in ("yes", "true", "1")
        )

        passage_id_for_job = str(uuid.uuid4()) if is_passage_mode else None

        job_req = base_req.model_copy(
            update={
                "run_id": job.id,
                "batch_id": batch_id,
                "job_id": job.id,
                "passing_threshold": config.BATCH_PASSING_SCORE_THRESHOLD,
                "questions_to_generate": 5,
                "passage_mode": "single_passage" if is_passage_mode else "independent",
                "passage_required": "Yes" if is_passage_mode else "No",
                "passage_id": passage_id_for_job,
                "shared_stimulus": None,  # Each job gets a dedicated fresh passage
            }
        )

        job_questions: list[Question] = []
        job_tokens = 0
        job_prompt_tokens = 0
        job_completion_tokens = 0
        job_cost = 0.0

        try:
            async for raw_chunk in run_workflow_stream(job_req):
                line = raw_chunk.strip()
                if not line.startswith("data: "):
                    continue
                try:
                    evt_data = json.loads(line[6:])
                    etype = evt_data.get("event_type")
                    data = evt_data.get("data") or {}

                    if etype == "question_generated" and data.get("question"):
                        raw_q = data["question"]
                        try:
                            q_obj = Question(**raw_q)
                            q_obj.batch_id = batch_id
                            q_obj.job_id = job.id
                            q_obj.run_id = job.id
                            final_score = q_obj.final_score or 0
                            if final_score > 90:
                                q_obj.status = "ai_validated"
                            elif final_score > 85:
                                q_obj.status = "batch_only"
                            else:
                                q_obj.status = "below_threshold"
                            # Check if batch still exists before saving question
                            curr_b = await get_batch_by_id(batch_id)
                            if not curr_b:
                                logger.info(
                                    f"Batch {batch_id} no longer exists; aborting job {job.id}."
                                )
                                return
                            if passage_id_for_job and not q_obj.passage_id:
                                q_obj.passage_id = passage_id_for_job
                            saved_q = await save_question(q_obj)
                            if not any(existing.id == saved_q.id for existing in job_questions):
                                job_questions.append(saved_q)
                                # Update job progress count
                                await update_job_progress(job.id, actual_count=len(job_questions))
                        except Exception as q_err:
                            logger.error(f"Error saving question for job {job.id}: {q_err}")

                    elif etype == "workflow_complete":
                        completed_qs = data.get("questions") or []
                        for raw_q in completed_qs:
                            try:
                                q_obj = Question(**raw_q)
                                q_obj.batch_id = batch_id
                                q_obj.job_id = job.id
                                q_obj.run_id = job.id
                                final_score = q_obj.final_score or 0
                                if final_score > 90:
                                    q_obj.status = "ai_validated"
                                elif final_score > 85:
                                    q_obj.status = "batch_only"
                                else:
                                    q_obj.status = "below_threshold"
                                curr_b = await get_batch_by_id(batch_id)
                                if not curr_b:
                                    logger.info(
                                        f"Batch {batch_id} no longer exists; aborting job {job.id}."
                                    )
                                    return
                                if passage_id_for_job and not q_obj.passage_id:
                                    q_obj.passage_id = passage_id_for_job
                                if not any(existing.id == q_obj.id for existing in job_questions):
                                    saved_q = await save_question(q_obj)
                                    job_questions.append(saved_q)
                            except Exception as q_err:
                                logger.error(f"Error saving workflow_complete question: {q_err}")

                        usage = data.get("cumulative_usage") or {}
                        job_tokens = usage.get("total_tokens", 0)
                        job_prompt_tokens = usage.get("total_prompt_tokens", 0)
                        job_completion_tokens = usage.get("total_completion_tokens", 0)
                        job_cost = float(usage.get("total_cost_usd", 0.0))

                    elif etype == "workflow_error":
                        raise RuntimeError(data.get("error", "Unknown workflow error"))

                except json.JSONDecodeError:
                    continue

            # Mark job status based on questions saved
            completed_now = datetime.now(UTC).isoformat()
            job_status = "completed" if len(job_questions) > 0 else "failed"
            await update_job_progress(
                job.id,
                status=job_status,
                actual_count=len(job_questions),
                passage_id=passage_id_for_job,
                total_tokens=job_tokens,
                prompt_tokens=job_prompt_tokens,
                completion_tokens=job_completion_tokens,
                cost_usd=job_cost,
                completed_at=completed_now,
            )

            # Atomic database-level aggregation to prevent lost updates
            await refresh_batch_aggregates(batch_id)

            logger.info(
                f"Job {job.job_number}/10 (ID: {job.id}) finished: generated {len(job_questions)} questions."
            )

        except asyncio.CancelledError:
            logger.info(f"Job {job.job_number}/10 (ID: {job.id}) was cancelled.")
            await update_job_progress(
                job.id,
                status="cancelled",
                actual_count=len(job_questions),
                completed_at=datetime.now(UTC).isoformat(),
            )
            await refresh_batch_aggregates(batch_id)
            raise
        except Exception as exc:
            logger.error(
                f"Job {job.job_number}/10 (ID: {job.id}) failed with error: {exc}", exc_info=True
            )
            failed_now = datetime.now(UTC).isoformat()
            await update_job_progress(
                job.id,
                status="failed",
                error_message=str(exc),
                actual_count=len(job_questions),
                completed_at=failed_now,
            )
            await refresh_batch_aggregates(batch_id)


async def _execute_batch_workflow(
    batch_id: str,
    req: GenerationRequest,
    target_jobs: list[GenerationJob] | None = None,
) -> None:
    """Coordinates the execution of jobs within a batch using the global worker semaphore."""
    tasks: list[asyncio.Task[Any]] = []
    try:
        jobs = target_jobs or await get_jobs_by_batch_id(batch_id)
        if not jobs:
            logger.error(f"No jobs found for batch {batch_id}")
            return

        # Execute jobs that need work (pending or running or failed/cancelled on retry)
        executable_jobs = [
            j for j in jobs if j.status in ("pending", "running", "failed", "cancelled")
        ]
        if not executable_jobs:
            logger.info(f"Batch {batch_id} has no pending jobs to execute.")
            await refresh_batch_aggregates(batch_id)
            return

        # Acquire slots from the shared global worker pool
        semaphore = get_global_job_semaphore()
        tasks = [
            asyncio.create_task(_run_single_job(batch_id, job, req, semaphore))
            for job in executable_jobs
        ]
        await asyncio.gather(*tasks, return_exceptions=True)

        # Finalize batch state atomically
        updated_batch = await refresh_batch_aggregates(batch_id)
        if updated_batch:
            logger.info(
                f"Batch {batch_id} finished execution. Status: {updated_batch.status} "
                f"({updated_batch.completed_jobs}/{updated_batch.total_jobs} jobs, "
                f"{updated_batch.actual_count}/{updated_batch.target_count} questions)."
            )

    except asyncio.CancelledError:
        logger.info(f"Batch {batch_id} execution was cancelled; terminating all sub-tasks...")
        for t in tasks:
            if not t.done():
                t.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        await refresh_batch_aggregates(batch_id)
        raise
    except Exception as e:
        logger.error(f"Fatal error in batch {batch_id} execution: {e}", exc_info=True)
        b = await get_batch_by_id(batch_id)
        if b:
            b.status = "failed"
            b.error_message = str(e)
            await save_batch(b)
    finally:
        _active_batch_tasks.pop(batch_id, None)


async def stop_background_batch(batch_id: str) -> bool:
    """Gracefully stops an active batch, halts running tasks, and preserves generated questions."""
    task = _active_batch_tasks.pop(batch_id, None)
    if task and not task.done():
        task.cancel()
        try:
            await task
        except (asyncio.CancelledError, Exception):
            pass

    # Mark remaining pending/running jobs as cancelled
    jobs = await get_jobs_by_batch_id(batch_id)
    now_iso = datetime.now(UTC).isoformat()
    for j in jobs:
        if j.status in ("pending", "running"):
            await update_job_progress(j.id, status="cancelled", completed_at=now_iso)

    b = await get_batch_by_id(batch_id)
    if b:
        b.status = "cancelled" if (b.completed_jobs or 0) == 0 else "partially_completed"
        await save_batch(b)
    await refresh_batch_aggregates(batch_id)
    return True


async def cancel_background_batch(batch_id: str) -> bool:
    """Cancels an active background batch runner task if running."""
    return await stop_background_batch(batch_id)


async def cancel_all_background_batches() -> int:
    """Gracefully halts all active background batches, preserving generated questions."""
    batch_ids = list(_active_batch_tasks.keys())
    count = 0
    for b_id in batch_ids:
        stopped = await stop_background_batch(b_id)
        if stopped:
            count += 1
    return count


async def retry_incomplete_jobs_for_batch(
    batch_id: str,
    req: GenerationRequest | None = None,
) -> tuple[GenerationBatch | None, list[GenerationJob]]:
    """Re-launches failed or cancelled jobs for a batch into the global worker pool."""
    b = await get_batch_by_id(batch_id)
    if not b:
        return None, []

    # Stop any currently active task for this batch first
    await cancel_background_batch(batch_id)

    jobs = await get_jobs_by_batch_id(batch_id)
    retryable_jobs = [j for j in jobs if j.status in ("failed", "cancelled", "pending")]
    if not retryable_jobs:
        return b, jobs

    # Reset retryable jobs to pending
    for j in retryable_jobs:
        await update_job_progress(
            j.id,
            status="pending",
            error_message=None,
            started_at=None,
            completed_at=None,
        )

    b.status = "in_progress"
    b.error_message = None
    await save_batch(b)

    # Resolve GenerationRequest
    effective_req = req or _batch_requests.get(batch_id)
    if not effective_req:
        effective_req = GenerationRequest(
            section=b.section,
            difficulty=b.difficulty,
            subtopic=b.subtopic,
            passage_mode=b.passage_mode,
            questions_to_generate=5,
        )

    task = asyncio.create_task(_execute_batch_workflow(batch_id, effective_req, retryable_jobs))
    _active_batch_tasks[batch_id] = task

    refreshed_batch = await get_batch_by_id(batch_id)
    all_jobs = await get_jobs_by_batch_id(batch_id)
    return refreshed_batch, all_jobs


def get_active_batch_metrics() -> dict[str, Any]:
    """Returns real-time concurrency metrics for background batches."""
    return {
        "active_running_batches": len(_active_batch_tasks),
        "global_max_concurrent_jobs": config.GLOBAL_MAX_CONCURRENT_JOBS,
        "global_max_concurrent_llm_calls": config.GLOBAL_MAX_CONCURRENT_LLM_CALLS,
        "active_batch_ids": list(_active_batch_tasks.keys()),
    }


async def launch_background_batch(
    req: GenerationRequest,
    batch_id: str | None = None,
) -> tuple[GenerationBatch, list[GenerationJob]]:
    """
    Initializes a 50-question batch with 10 jobs in PostgreSQL and launches
    the background runner task governed by the global worker pool.
    """
    b_id = batch_id or str(uuid.uuid4())
    now_iso = datetime.now(UTC).isoformat()

    sec_val = req.section.value if hasattr(req.section, "value") else str(req.section)
    diff_val = req.difficulty.value if hasattr(req.difficulty, "value") else str(req.difficulty)

    # Cache request for potential 1-click retries
    _batch_requests[b_id] = req

    # 1. Create GenerationBatch record
    batch = GenerationBatch(
        id=b_id,
        section=sec_val,
        subtopic=req.subtopic or f"{sec_val} Comprehensive Set",
        difficulty=diff_val,
        passage_mode=req.passage_mode or "single_passage",
        target_count=50,
        actual_count=0,
        total_jobs=10,
        completed_jobs=0,
        failed_jobs=0,
        status="in_progress",
        created_at=now_iso,
    )
    await save_batch(batch)

    # 2. Create 10 GenerationJob stubs
    jobs: list[GenerationJob] = []
    for num in range(1, 11):
        j = GenerationJob(
            id=str(uuid.uuid4()),
            batch_id=b_id,
            job_number=num,
            status="pending",
            target_count=5,
            actual_count=0,
            created_at=now_iso,
        )
        jobs.append(j)

    await save_jobs_bulk(jobs)

    # 3. Spawn background asyncio task governed by global worker pool
    task = asyncio.create_task(_execute_batch_workflow(b_id, req))
    _active_batch_tasks[b_id] = task

    return batch, jobs
