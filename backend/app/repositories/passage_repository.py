import logging
from datetime import UTC, datetime

from sqlalchemy import delete, func, or_, select, update

from app.db.base import to_datetime, to_iso_str
from app.db.session import async_session_factory
from app.models.job import GenerationJobModel
from app.models.passage import PassageModel
from app.models.question import QuestionModel
from app.schemas import Passage

logger = logging.getLogger(__name__)


def _passage_model_to_schema(m: PassageModel, question_count: int = 0) -> Passage:
    """Converts a SQLAlchemy PassageModel to a Pydantic Passage schema."""
    return Passage(
        id=m.id,
        title=m.title,
        text=m.text,
        word_count=m.word_count,
        section=m.section,
        subtopic=m.subtopic,
        image_url=m.image_url,
        image_svg=m.image_svg,
        image_description=m.image_description,
        question_count=question_count,
        created_at=to_iso_str(m.created_at),
        updated_at=to_iso_str(m.updated_at) if m.updated_at else None,
    )


def _passage_schema_to_model(p: Passage) -> PassageModel:
    """Converts a Pydantic Passage schema to a SQLAlchemy PassageModel."""
    word_count = p.word_count or (len(p.text.split()) if p.text else 0)
    return PassageModel(
        id=p.id,
        title=p.title,
        text=p.text,
        word_count=word_count,
        section=p.section,
        subtopic=p.subtopic,
        image_url=p.image_url,
        image_svg=p.image_svg,
        image_description=p.image_description,
        created_at=to_datetime(p.created_at),
        updated_at=to_datetime(p.updated_at) if p.updated_at else datetime.now(UTC),
    )


async def get_passages(
    section: str | None = None,
    subtopic: str | None = None,
    search: str | None = None,
) -> list[Passage]:
    """Retrieves shared reading passages with optional filtering, search, and aggregated question_count."""
    async with async_session_factory() as session:
        stmt = (
            select(PassageModel, func.count(QuestionModel.id).label("q_count"))
            .outerjoin(QuestionModel, QuestionModel.passage_id == PassageModel.id)
            .group_by(PassageModel.id)
        )
        if section:
            stmt = stmt.where(PassageModel.section == section)
        if subtopic:
            stmt = stmt.where(PassageModel.subtopic == subtopic)
        if search:
            wildcard = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    PassageModel.text.ilike(wildcard),
                    PassageModel.title.ilike(wildcard),
                    PassageModel.subtopic.ilike(wildcard),
                    PassageModel.id.ilike(wildcard),
                )
            )

        stmt = stmt.order_by(PassageModel.created_at.desc())
        result = await session.execute(stmt)
        rows = result.all()
        return [_passage_model_to_schema(m, int(q_count or 0)) for m, q_count in rows]


async def get_passage_by_id(passage_id: str) -> Passage | None:
    """Retrieves a single passage by primary key ID with aggregated question count."""
    async with async_session_factory() as session:
        stmt = (
            select(PassageModel, func.count(QuestionModel.id).label("q_count"))
            .outerjoin(QuestionModel, QuestionModel.passage_id == PassageModel.id)
            .where(PassageModel.id == passage_id)
            .group_by(PassageModel.id)
        )
        result = await session.execute(stmt)
        row = result.first()
        if not row:
            return None
        m, q_count = row
        return _passage_model_to_schema(m, int(q_count or 0))


async def save_passage(passage: Passage) -> Passage:
    """Creates or updates a passage record, syncing stimulus_text to linked questions."""
    passage.updated_at = datetime.now(UTC).isoformat()
    word_count = len(passage.text.split()) if passage.text else 0
    passage.word_count = word_count
    async with async_session_factory() as session:
        model = _passage_schema_to_model(passage)
        await session.merge(model)

        # Synchronize stimulus_text and visual stimulus to all linked questions if text is present
        if passage.id and passage.text is not None:
            values_to_update: dict = {
                "stimulus_text": passage.text,
            }
            if passage.image_url is not None:
                values_to_update["image_url"] = passage.image_url
            if passage.image_svg is not None:
                values_to_update["image_svg"] = passage.image_svg
            if passage.image_description is not None:
                values_to_update["image_description"] = passage.image_description

            await session.execute(
                update(QuestionModel)
                .where(QuestionModel.passage_id == passage.id)
                .values(**values_to_update)
            )

        await session.commit()
        return passage


async def delete_passage(passage_id: str) -> tuple[bool, int]:
    """Deletes a passage record and permanently removes all associated questions, updating affected job and batch metrics."""
    async with async_session_factory() as session:
        # Check if passage exists
        passage = await session.get(PassageModel, passage_id)
        if not passage:
            return False, 0

        # Find affected batch_ids and job_ids to update their counts
        q_info_stmt = select(QuestionModel.batch_id, QuestionModel.job_id).where(
            QuestionModel.passage_id == passage_id
        )
        res_info = await session.execute(q_info_stmt)
        affected_pairs = res_info.all()
        affected_batch_ids = {b_id for b_id, _ in affected_pairs if b_id}
        affected_job_ids = {j_id for _, j_id in affected_pairs if j_id}

        # 1. Permanently delete all linked questions
        del_q_res = await session.execute(
            delete(QuestionModel).where(QuestionModel.passage_id == passage_id)
        )
        deleted_q_count = del_q_res.rowcount or 0

        # 2. Delete the passage row
        await session.execute(delete(PassageModel).where(PassageModel.id == passage_id))

        # 3. Recalculate job actual_count for affected jobs and clear dangling passage_id
        await session.execute(
            update(GenerationJobModel)
            .where(GenerationJobModel.passage_id == passage_id)
            .values(passage_id=None)
        )

        for job_id in affected_job_ids:
            j_count_stmt = select(func.count(QuestionModel.id)).where(
                QuestionModel.job_id == job_id
            )
            j_count = (await session.execute(j_count_stmt)).scalar() or 0
            await session.execute(
                update(GenerationJobModel)
                .where(GenerationJobModel.id == job_id)
                .values(actual_count=j_count)
            )

        await session.commit()

    # 4. Recalculate batch metrics for affected batches
    from app.repositories.batch_repository import refresh_batch_aggregates

    for batch_id in affected_batch_ids:
        try:
            await refresh_batch_aggregates(batch_id)
        except Exception as e:
            logger.warning(f"Failed to refresh batch aggregates for batch {batch_id}: {e}")

    logger.info(
        f"Permanently deleted passage {passage_id} and {deleted_q_count} associated question(s)."
    )
    return True, deleted_q_count
