import logging
from datetime import UTC, datetime

from sqlalchemy import func, select

from app.db.base import to_datetime, to_iso_str
from app.db.session import async_session_factory
from app.models.batch import GenerationBatchModel
from app.models.job import GenerationJobModel
from app.schemas import GenerationBatch

logger = logging.getLogger(__name__)


def _batch_model_to_schema(m: GenerationBatchModel) -> GenerationBatch:
    """Converts a SQLAlchemy GenerationBatchModel to a Pydantic GenerationBatch schema."""
    return GenerationBatch(
        id=m.id,
        section=m.section,
        subtopic=m.subtopic,
        difficulty=m.difficulty,
        passage_mode=m.passage_mode,
        target_count=m.target_count or 0,
        actual_count=m.actual_count or 0,
        total_jobs=m.total_jobs or 10,
        completed_jobs=m.completed_jobs or 0,
        failed_jobs=m.failed_jobs or 0,
        error_message=m.error_message,
        total_tokens=m.total_tokens or 0,
        cost_usd=float(m.cost_usd) if m.cost_usd is not None else 0.0,
        status=m.status or "completed",
        created_at=to_iso_str(m.created_at),
        updated_at=to_iso_str(m.updated_at) if m.updated_at else None,
    )


def _batch_schema_to_model(b: GenerationBatch) -> GenerationBatchModel:
    """Converts a Pydantic GenerationBatch schema to a SQLAlchemy GenerationBatchModel."""
    return GenerationBatchModel(
        id=b.id,
        section=b.section,
        subtopic=b.subtopic,
        difficulty=b.difficulty,
        passage_mode=b.passage_mode,
        target_count=b.target_count,
        actual_count=b.actual_count,
        total_jobs=b.total_jobs,
        completed_jobs=b.completed_jobs,
        failed_jobs=b.failed_jobs,
        error_message=b.error_message,
        total_tokens=b.total_tokens,
        cost_usd=b.cost_usd,
        status=b.status,
        created_at=to_datetime(b.created_at),
        updated_at=to_datetime(b.updated_at) if b.updated_at else datetime.now(UTC),
    )


async def get_batches(
    section: str | None = None,
    status: str | None = None,
) -> list[GenerationBatch]:
    """Retrieves generation batch logs with optional section and status filtering."""
    async with async_session_factory() as session:
        stmt = select(GenerationBatchModel)
        if section:
            stmt = stmt.where(GenerationBatchModel.section == section)
        if status:
            stmt = stmt.where(GenerationBatchModel.status == status)

        stmt = stmt.order_by(GenerationBatchModel.created_at.desc())
        result = await session.execute(stmt)
        models = result.scalars().all()
        return [_batch_model_to_schema(m) for m in models]


async def get_batch_by_id(batch_id: str) -> GenerationBatch | None:
    """Retrieves a single generation batch by primary key ID."""
    async with async_session_factory() as session:
        model = await session.get(GenerationBatchModel, batch_id)
        if not model:
            return None
        return _batch_model_to_schema(model)


async def save_batch(batch: GenerationBatch) -> GenerationBatch:
    """Creates or updates a generation batch record."""
    batch.updated_at = datetime.now(UTC).isoformat()
    async with async_session_factory() as session:
        model = _batch_schema_to_model(batch)
        await session.merge(model)
        await session.commit()
        return batch


async def delete_batch(batch_id: str) -> bool:
    """Deletes a batch and cascades delete to related jobs."""
    async with async_session_factory() as session:
        model = await session.get(GenerationBatchModel, batch_id)
        if not model:
            return False
        await session.delete(model)
        await session.commit()
        return True


async def refresh_batch_aggregates(batch_id: str) -> GenerationBatch | None:
    """
    Recalculates completed_jobs, failed_jobs, actual_count, total_tokens, and cost_usd
    directly from the generation_jobs table in a single atomic database operation.
    Guarantees zero lost updates from concurrent jobs.
    """
    async with async_session_factory() as session:
        batch_model = await session.get(GenerationBatchModel, batch_id)
        if not batch_model:
            return None

        stmt = select(
            func.count().filter(GenerationJobModel.status == "completed").label("completed_jobs"),
            func.count().filter(GenerationJobModel.status == "failed").label("failed_jobs"),
            func.coalesce(func.sum(GenerationJobModel.actual_count), 0).label("actual_count"),
            func.coalesce(func.sum(GenerationJobModel.total_tokens), 0).label("total_tokens"),
            func.coalesce(func.sum(GenerationJobModel.cost_usd), 0.0).label("cost_usd"),
        ).where(GenerationJobModel.batch_id == batch_id)

        res = await session.execute(stmt)
        row = res.one()

        completed_jobs = int(row.completed_jobs or 0)
        failed_jobs = int(row.failed_jobs or 0)
        actual_count = int(row.actual_count or 0)
        total_tokens = int(row.total_tokens or 0)
        cost_usd = round(float(row.cost_usd or 0.0), 6)

        batch_model.completed_jobs = completed_jobs
        batch_model.failed_jobs = failed_jobs
        batch_model.actual_count = actual_count
        batch_model.total_tokens = total_tokens
        batch_model.cost_usd = cost_usd
        batch_model.updated_at = datetime.now(UTC)

        total_jobs = batch_model.total_jobs or 10
        target_count = batch_model.target_count or 50

        # Preserve terminal or user-stopped status unless transitioning upon completion
        if batch_model.status not in ("cancelled", "stopped"):
            if completed_jobs >= total_jobs or (actual_count >= target_count and actual_count > 0):
                batch_model.status = "completed"
            elif completed_jobs + failed_jobs >= total_jobs:
                batch_model.status = "partially_completed" if completed_jobs > 0 else "failed"

        await session.commit()
        await session.refresh(batch_model)
        return _batch_model_to_schema(batch_model)
