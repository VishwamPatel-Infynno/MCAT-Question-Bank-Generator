import asyncio
import json
import logging
import uuid
from datetime import UTC, datetime
from typing import Any

from app.repositories.batch_repository import get_batch_by_id, save_batch
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
                            q_obj.status = (
                                "ai_validated"
                                if (q_obj.final_score or 0) > 90
                                else "below_threshold"
                            )
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
                        # In case questions weren't caught in question_generated
                        completed_qs = data.get("questions") or []
                        for raw_q in completed_qs:
                            try:
                                q_obj = Question(**raw_q)
                                q_obj.batch_id = batch_id
                                q_obj.job_id = job.id
                                q_obj.run_id = job.id
                                q_obj.status = (
                                    "ai_validated"
                                    if (q_obj.final_score or 0) > 90
                                    else "below_threshold"
                                )
                                # Check if batch still exists before saving question
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

            # Mark job as completed
            completed_now = datetime.now(UTC).isoformat()
            await update_job_progress(
                job.id,
                status="completed",
                actual_count=len(job_questions),
                passage_id=passage_id_for_job,
                total_tokens=job_tokens,
                prompt_tokens=job_prompt_tokens,
                completion_tokens=job_completion_tokens,
                cost_usd=job_cost,
                completed_at=completed_now,
            )

            # Update batch progress atomically
            b = await get_batch_by_id(batch_id)
            if b:
                b.completed_jobs = (b.completed_jobs or 0) + 1
                b.actual_count = (b.actual_count or 0) + len(job_questions)
                b.total_tokens = (b.total_tokens or 0) + job_tokens
                b.cost_usd = round((b.cost_usd or 0.0) + job_cost, 6)
                await save_batch(b)

            logger.info(
                f"Job {job.job_number}/10 (ID: {job.id}) completed: generated {len(job_questions)} questions."
            )

        except asyncio.CancelledError:
            logger.info(f"Job {job.job_number}/10 (ID: {job.id}) was cancelled.")
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
                completed_at=failed_now,
            )
            b = await get_batch_by_id(batch_id)
            if b:
                b.failed_jobs = (b.failed_jobs or 0) + 1
                await save_batch(b)


async def _execute_batch_workflow(batch_id: str, req: GenerationRequest) -> None:
    """Coordinates the execution of all 10 jobs within a batch using 2-worker concurrency."""
    tasks: list[asyncio.Task[Any]] = []
    try:
        jobs = await get_jobs_by_batch_id(batch_id)
        if not jobs:
            logger.error(f"No jobs found for batch {batch_id}")
            return

        # 2 concurrent jobs
        semaphore = asyncio.Semaphore(2)
        tasks = [
            asyncio.create_task(_run_single_job(batch_id, job, req, semaphore)) for job in jobs
        ]
        await asyncio.gather(*tasks, return_exceptions=False)

        # Finalize batch state
        b = await get_batch_by_id(batch_id)
        if b:
            if (b.completed_jobs == b.total_jobs) or (
                (b.actual_count or 0) >= (b.target_count or 0) and (b.actual_count or 0) > 0
            ):
                b.status = "completed"
            elif (b.completed_jobs or 0) > 0:
                b.status = "partially_completed"
            else:
                b.status = "failed"
            await save_batch(b)
            logger.info(
                f"Batch {batch_id} finished execution. Status: {b.status} ({b.completed_jobs}/{b.total_jobs} jobs, {b.actual_count}/{b.target_count} questions)."
            )

    except asyncio.CancelledError:
        logger.info(f"Batch {batch_id} execution was cancelled; terminating all sub-tasks...")
        for t in tasks:
            if not t.done():
                t.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
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


async def cancel_background_batch(batch_id: str) -> bool:
    """Cancels an active background batch runner task if running."""
    task = _active_batch_tasks.pop(batch_id, None)
    if task and not task.done():
        task.cancel()
        try:
            await task
        except (asyncio.CancelledError, Exception):
            pass
        return True
    return False


async def cancel_all_background_batches() -> None:
    """Cancels all currently active background batch runner tasks."""
    tasks = list(_active_batch_tasks.values())
    _active_batch_tasks.clear()
    for task in tasks:
        if not task.done():
            task.cancel()
            try:
                await task
            except (asyncio.CancelledError, Exception):
                pass


async def launch_background_batch(
    req: GenerationRequest,
    batch_id: str | None = None,
) -> tuple[GenerationBatch, list[GenerationJob]]:
    """
    Initializes a 50-question batch with 10 jobs in PostgreSQL and launches
    the background runner task with 2-job concurrency.
    """
    b_id = batch_id or str(uuid.uuid4())
    now_iso = datetime.now(UTC).isoformat()

    sec_val = req.section.value if hasattr(req.section, "value") else str(req.section)
    diff_val = req.difficulty.value if hasattr(req.difficulty, "value") else str(req.difficulty)

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

    # 3. Spawn background asyncio task
    task = asyncio.create_task(_execute_batch_workflow(b_id, req))
    _active_batch_tasks[b_id] = task

    return batch, jobs
