import logging
from datetime import UTC, datetime

from sqlalchemy import delete, or_, select, update

from app.db.base import to_datetime, to_iso_str
from app.db.session import async_session_factory
from app.models.passage import PassageModel
from app.models.question import QuestionModel
from app.schemas import Passage

logger = logging.getLogger(__name__)


def _passage_model_to_schema(m: PassageModel) -> Passage:
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
    """Retrieves shared reading passages with optional filtering and search."""
    async with async_session_factory() as session:
        stmt = select(PassageModel)
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
        models = result.scalars().all()
        return [_passage_model_to_schema(m) for m in models]


async def get_passage_by_id(passage_id: str) -> Passage | None:
    """Retrieves a single passage by primary key ID."""
    async with async_session_factory() as session:
        model = await session.get(PassageModel, passage_id)
        if not model:
            return None
        return _passage_model_to_schema(model)


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


async def delete_passage(passage_id: str) -> bool:
    """Deletes a passage record and safely unlinks any associated questions."""
    async with async_session_factory() as session:
        # 1. Unlink questions from this passage (retaining them as standalone questions)
        await session.execute(
            update(QuestionModel)
            .where(QuestionModel.passage_id == passage_id)
            .values(passage_id=None)
        )
        # 2. Delete the passage row
        res = await session.execute(delete(PassageModel).where(PassageModel.id == passage_id))
        await session.commit()
        return bool((res.rowcount or 0) > 0)
