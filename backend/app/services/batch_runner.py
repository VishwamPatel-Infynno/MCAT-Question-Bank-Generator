import asyncio
import contextlib
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
from app.repositories.question_repository import (
    batch_update_question_status,
    get_questions,
    save_question,
)
from app.schemas import (
    GenerationBatch,
    GenerationJob,
    GenerationRequest,
    Question,
    determine_question_status,
)
from app.services.deduplication import cluster_questions
from app.workflow.engine import run_workflow_stream

logger = logging.getLogger(__name__)

# NOTE: These module-level dicts are process-local and will be lost on restart.
# For multi-process or distributed deployments, migrate to a Redis-backed store.
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


async def _persist_job_question(
    batch_id: str,
    job_id: str,
    passage_id: str | None,
    raw_q: dict[str, Any],
    job_questions: list[Question],
) -> tuple[Question | None, bool]:
    """
    Serializes, tags, verifies batch existence, and persists a job question.
    Returns: (saved_question, batch_aborted_flag)
    """
    try:
        q_obj = Question(**raw_q)
        q_obj.batch_id = batch_id
        q_obj.job_id = job_id
        q_obj.run_id = job_id
        q_obj.status = determine_question_status(q_obj.final_score)

        curr_b = await get_batch_by_id(batch_id)
        if not curr_b:
            logger.info(f"Batch {batch_id} no longer exists; aborting job {job_id}.")
            return (None, True)

        if passage_id and not q_obj.passage_id:
            q_obj.passage_id = passage_id

        if not any(existing.id == q_obj.id for existing in job_questions):
            saved_q = await save_question(q_obj)
            job_questions.append(saved_q)
            return (saved_q, False)
        return (None, False)
    except Exception as q_err:
        logger.error(f"Error saving question for job {job_id}: {q_err}")
        return (None, False)


BATCH_THEMATIC_ANGLES = [
    "Experimental & Analytical Instrumentation (e.g. Mass Spectrometry, deflection in electric/magnetic fields, detectors)",
    "Biomedical, Clinical & Pharmacological Diagnostics (e.g. PET radiotracers, radioactive decay therapy, cellular imaging)",
    "Nuclear Forces, Binding Energy & Stability (e.g. Strong nuclear force vs Coulomb repulsion, N/Z stability valley, decay modes)",
    "Chemical Reactivity, Bonding & Kinetic Isotope Effects (e.g. Rate-limiting transitions, zero-point energy, deuterated substrates)",
    "Historical Experiments & Foundational Atomic Models (e.g. Rutherford alpha-scattering, Thomson cathode rays, Chadwick neutrons)",
    "Metabolic Pathways & Enzyme Catalysis Mechanisms (e.g. Substrate binding, transition-state theory, cofactor kinetics)",
    "Spectroscopic Analysis & Quantum Transitions (e.g. Atomic emission/absorption, orbital transitions, selection rules)",
    "Cellular & Membrane Transport Dynamics (e.g. Ion channels, electrochemical gradients, isotopic flux)",
    "Thermodynamics, Phase Equilibria & Collisional Dynamics (e.g. Kinetic theory, vapor pressure isotope effects)",
    "Radiation Biophysics & Molecular Damage (e.g. Ionizing radiation, reactive oxygen species, DNA repair mechanisms)",
]


async def _run_single_job(
    batch_id: str,
    job: GenerationJob,
    base_req: GenerationRequest,
    semaphore: asyncio.Semaphore,
) -> None:
    """Executes a single job generating 5 questions, saving them directly to the database."""
    async with semaphore:
        now_iso = datetime.now(UTC).isoformat()
        total_jobs = len(await get_jobs_by_batch_id(batch_id)) or 10
        logger.info(
            f"Starting Job {job.job_number}/{total_jobs} (ID: {job.id}) for Batch {batch_id}..."
        )
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
        thematic_angle = BATCH_THEMATIC_ANGLES[(job.job_number - 1) % len(BATCH_THEMATIC_ANGLES)]

        job_req = base_req.model_copy(
            update={
                "run_id": job.id,
                "batch_id": batch_id,
                "job_id": job.id,
                "passing_threshold": config.BATCH_PASSING_SCORE_THRESHOLD,
                "questions_to_generate": job.target_count or 5,
                "passage_mode": "single_passage" if is_passage_mode else "independent",
                "passage_required": "Yes" if is_passage_mode else "No",
                "passage_id": passage_id_for_job,
                "thematic_angle": thematic_angle,
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
                        saved_q, should_abort = await _persist_job_question(
                            batch_id, job.id, passage_id_for_job, data["question"], job_questions
                        )
                        if should_abort:
                            return
                        if saved_q:
                            await update_job_progress(job.id, actual_count=len(job_questions))

                    elif etype == "workflow_complete":
                        completed_qs = data.get("questions") or []
                        for raw_q in completed_qs:
                            _, should_abort = await _persist_job_question(
                                batch_id, job.id, passage_id_for_job, raw_q, job_questions
                            )
                            if should_abort:
                                return

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
                f"Job {job.job_number}/{total_jobs} (ID: {job.id}) finished: generated {len(job_questions)} questions."
            )

        except asyncio.CancelledError:
            logger.info(f"Job {job.job_number}/{total_jobs} (ID: {job.id}) was cancelled.")
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
                f"Job {job.job_number}/{total_jobs} (ID: {job.id}) failed with error: {exc}",
                exc_info=True,
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
    current_cycle: int = 1,
    max_cycles: int = 5,
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

        # Autonomous duplicate resolution and refill
        await auto_resolve_batch_and_refill(
            batch_id, current_cycle=current_cycle, max_cycles=max_cycles
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
        if _active_batch_tasks.get(batch_id) is asyncio.current_task():
            _active_batch_tasks.pop(batch_id, None)


async def auto_resolve_batch_and_refill(
    batch_id: str,
    current_cycle: int = 1,
    max_cycles: int = 5,
    threshold: float = 0.75,
) -> dict[str, Any]:
    """
    Evaluates active questions in a batch for duplicate clusters, automatically archives
    redundant duplicates in favor of the highest-scoring question in each cluster,
    and automatically triggers a resilient refill generation with buffer if a deficit exists,
    capped at max_cycles (up to 5 cycles). Also trims excess buffer questions to exact target.
    """
    b = await get_batch_by_id(batch_id)
    if not b:
        return {"resolved": False, "reason": "Batch not found"}

    linked_questions = await get_questions(batch_id=batch_id)
    active_questions = [
        q
        for q in linked_questions
        if q.status not in ("discarded", "rejected_below_threshold", "error", "failed")
    ]
    q_dumps = [q.model_dump() for q in active_questions]

    clusters = cluster_questions(q_dumps, threshold=threshold)
    duplicate_ids_to_purge: list[str] = []

    if clusters:
        for c in clusters:
            leader_id = c["leader_question"]["id"]
            for d in c["duplicates"]:
                dup_id = d["question"]["id"]
                if dup_id != leader_id:
                    duplicate_ids_to_purge.append(dup_id)

        if duplicate_ids_to_purge:
            await batch_update_question_status(duplicate_ids_to_purge, status="discarded")
            logger.info(
                f"Auto-resolved {len(clusters)} duplicate cluster(s) in batch {batch_id}; "
                f"archived {len(duplicate_ids_to_purge)} duplicate question(s)."
            )

    await refresh_batch_aggregates(batch_id)
    refreshed_b = await get_batch_by_id(batch_id)
    refreshed_questions = await get_questions(batch_id=batch_id)
    valid_active = [
        q
        for q in refreshed_questions
        if q.status not in ("discarded", "rejected_below_threshold", "error", "failed")
    ]
    remaining_active = len(valid_active)
    target = refreshed_b.target_count if refreshed_b else 50
    deficit = max(0, target - remaining_active)

    refill_launched = False
    if deficit > 0 and current_cycle < max_cycles:
        # Generate with safety buffer to ensure deficit is reliably closed
        buffer = 1 if deficit < 5 else 2
        refill_target = min(target, deficit + buffer)
        logger.info(
            f"Auto-refill triggered for batch {batch_id}: deficit={deficit}, "
            f"refill_target={refill_target} (buffer={buffer}), "
            f"cycle={current_cycle + 1}/{max_cycles}"
        )
        await refill_batch_deficit(
            batch_id, refill_target, cycle=current_cycle + 1, max_cycles=max_cycles
        )
        refill_launched = True
    elif remaining_active > target:
        # Cap to exact target count: retain the top highest-scoring questions, archive excess
        valid_active.sort(key=lambda q: (q.final_score or 0), reverse=True)
        excess_questions = valid_active[target:]
        excess_ids = [q.id for q in excess_questions]
        if excess_ids:
            await batch_update_question_status(excess_ids, status="discarded")
            logger.info(
                f"Capped batch {batch_id} to exact target {target}: archived {len(excess_ids)} excess buffer question(s)."
            )
            await refresh_batch_aggregates(batch_id)
            remaining_active = target
            deficit = 0

    return {
        "resolved": True,
        "clusters_count": len(clusters),
        "archived_duplicates_count": len(duplicate_ids_to_purge),
        "remaining_active": remaining_active,
        "deficit": deficit,
        "refill_launched": refill_launched,
        "current_cycle": current_cycle,
    }


async def stop_background_batch(batch_id: str) -> bool:
    """Gracefully stops an active batch, halts running tasks, and preserves generated questions."""
    task = _active_batch_tasks.pop(batch_id, None)
    if task and not task.done():
        task.cancel()
        with contextlib.suppress(asyncio.CancelledError, Exception):
            await task

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


async def refill_batch_deficit(
    batch_id: str,
    deficit: int,
    cycle: int = 2,
    max_cycles: int = 5,
) -> tuple[GenerationBatch | None, list[GenerationJob]]:
    """
    Creates and launches targeted background jobs to generate replacement questions
    for archived duplicates, replenishing the batch to its target capacity.
    """
    b = await get_batch_by_id(batch_id)
    if not b or deficit <= 0:
        return b, []

    existing_jobs = await get_jobs_by_batch_id(batch_id)
    start_job_num = len(existing_jobs) + 1

    # Chunk deficit into jobs of up to 5 questions
    job_chunks: list[int] = []
    remaining = deficit
    while remaining > 0:
        take = min(5, remaining)
        job_chunks.append(take)
        remaining -= take

    now_iso = datetime.now(UTC).isoformat()
    new_jobs: list[GenerationJob] = []
    for idx, count in enumerate(job_chunks):
        j_id = str(uuid.uuid4())
        job = GenerationJob(
            id=j_id,
            batch_id=batch_id,
            job_number=start_job_num + idx,
            target_count=count,
            actual_count=0,
            status="pending",
            created_at=now_iso,
        )
        new_jobs.append(job)

    await save_jobs_bulk(new_jobs)

    b.total_jobs = len(existing_jobs) + len(new_jobs)
    b.status = "in_progress"
    b.error_message = None
    await save_batch(b)

    effective_req = _batch_requests.get(batch_id)
    if not effective_req:
        effective_req = GenerationRequest(
            section=b.section,
            difficulty=b.difficulty,
            subtopic=b.subtopic,
            passage_mode=b.passage_mode,
            questions_to_generate=5,
        )

    task = asyncio.create_task(
        _execute_batch_workflow(
            batch_id,
            effective_req,
            new_jobs,
            current_cycle=cycle,
            max_cycles=max_cycles,
        )
    )
    _active_batch_tasks[batch_id] = task

    refreshed_batch = await get_batch_by_id(batch_id)
    return refreshed_batch, new_jobs


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
    Initializes a batch with constituent jobs in PostgreSQL and launches
    the background runner task governed by the global worker pool.
    5 questions = 1 job; 50 questions = 10 jobs.
    """
    b_id = batch_id or str(uuid.uuid4())
    now_iso = datetime.now(UTC).isoformat()

    sec_val = req.section.value if hasattr(req.section, "value") else str(req.section)
    diff_val = req.difficulty.value if hasattr(req.difficulty, "value") else str(req.difficulty)

    target_count = req.questions_to_generate or 50
    total_jobs = max(1, (target_count + 4) // 5)

    # Cache request for potential 1-click retries
    _batch_requests[b_id] = req

    # 1. Create GenerationBatch record
    batch = GenerationBatch(
        id=b_id,
        section=sec_val,
        subtopic=req.subtopic or f"{sec_val} Comprehensive Set",
        difficulty=diff_val,
        passage_mode=req.passage_mode or "single_passage",
        target_count=target_count,
        actual_count=0,
        total_jobs=total_jobs,
        completed_jobs=0,
        failed_jobs=0,
        status="in_progress",
        created_at=now_iso,
    )
    await save_batch(batch)

    # 2. Create GenerationJob stubs
    jobs: list[GenerationJob] = []
    for num in range(1, total_jobs + 1):
        job_target = min(5, target_count - (num - 1) * 5)
        j = GenerationJob(
            id=str(uuid.uuid4()),
            batch_id=b_id,
            job_number=num,
            status="pending",
            target_count=job_target,
            actual_count=0,
            created_at=now_iso,
        )
        jobs.append(j)

    await save_jobs_bulk(jobs)

    # 3. Spawn background asyncio task governed by global worker pool
    task = asyncio.create_task(_execute_batch_workflow(b_id, req))
    _active_batch_tasks[b_id] = task

    return batch, jobs
