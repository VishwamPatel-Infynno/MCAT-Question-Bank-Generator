import logging
from datetime import UTC, datetime

from sqlalchemy import select

from app.db.session import async_session_factory
from app.models.batch import GenerationBatchModel
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
        total_tokens=m.total_tokens or 0,
        cost_usd=float(m.cost_usd) if m.cost_usd is not None else 0.0,
        status=m.status or "completed",
        created_at=m.created_at,
        updated_at=m.updated_at,
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
        total_tokens=b.total_tokens,
        cost_usd=b.cost_usd,
        status=b.status,
        created_at=b.created_at,
        updated_at=b.updated_at or datetime.now(UTC).isoformat(),
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
