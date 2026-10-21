import logging
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import delete, func, or_, select

from app.db.session import async_session_factory
from app.models.batch import GenerationBatchModel
from app.models.passage import PassageModel
from app.models.question import QuestionModel
from app.schemas import OptionChoice, Question, ReviewScore

logger = logging.getLogger(__name__)


def _model_to_schema(m: QuestionModel) -> Question:
    """Converts a SQLAlchemy QuestionModel to a Pydantic Question schema."""
    options = [OptionChoice(**o) for o in m.options]
    rubric = ReviewScore(**m.review_rubric) if m.review_rubric else None

    answer_ids = m.correct_answer_ids
    if not answer_ids and m.correct_answer_id:
        answer_ids = [k.strip().upper() for k in m.correct_answer_id.split(",") if k.strip()]

    return Question(
        id=m.id,
        run_id=m.run_id,
        batch_id=m.batch_id,
        section=m.section,
        section_label=m.section_label,
        subtopic=m.subtopic,
        difficulty=m.difficulty,
        stimulus_text=m.stimulus_text or "",
        question_stem=m.question_stem,
        options=options,
        correct_answer_id=m.correct_answer_id,
        correct_answer_ids=answer_ids or [],
        explanation=m.explanation,
        image_url=m.image_url,
        image_svg=m.image_svg,
        image_description=m.image_description,
        final_score=m.final_score,
        review_rubric=rubric,
        iteration_count=m.iteration_count,
        iterations_history=m.iterations_history or [],
        created_at=m.created_at,
        updated_at=getattr(m, "updated_at", None),
        total_tokens=m.total_tokens or 0,
        prompt_tokens=m.prompt_tokens or 0,
        completion_tokens=m.completion_tokens or 0,
        cost_usd=float(m.cost_usd) if m.cost_usd is not None else 0.0,
        token_usage_details=m.token_usage_details or [],
        combination_id=m.combination_id,
        content_domain=m.content_domain,
        question_type=m.question_type,
        interaction_type=m.interaction_type or "single_choice",
        primary_trap=m.primary_trap,
        passage_required=m.passage_required,
        passage_questions=m.passage_questions,
        passage_id=getattr(m, "passage_id", None),
        passage_mode=getattr(m, "passage_mode", None),
        visual_type=m.visual_type or "None",
        stage_outcomes=m.stage_outcomes or {},
    )


def _schema_to_model(q: Question) -> QuestionModel:
    """Converts a Pydantic Question schema to a SQLAlchemy QuestionModel."""
    options_data = [opt.model_dump() for opt in q.options]
    rubric_data = q.review_rubric.model_dump() if q.review_rubric else None

    return QuestionModel(
        id=q.id,
        run_id=q.run_id,
        batch_id=q.batch_id,
        section=q.section,
        section_label=q.section_label,
        subtopic=q.subtopic,
        difficulty=q.difficulty,
        stimulus_text=q.stimulus_text,
        question_stem=q.question_stem,
        options=options_data,
        correct_answer_id=q.correct_answer_id,
        correct_answer_ids=q.correct_answer_ids,
        explanation=q.explanation,
        image_url=q.image_url,
        image_svg=q.image_svg,
        image_description=q.image_description,
        final_score=q.final_score,
        review_rubric=rubric_data,
        iteration_count=q.iteration_count,
        iterations_history=q.iterations_history,
        created_at=q.created_at,
        updated_at=q.updated_at or datetime.now(UTC).isoformat(),
        total_tokens=q.total_tokens,
        prompt_tokens=q.prompt_tokens,
        completion_tokens=q.completion_tokens,
        cost_usd=q.cost_usd,
        token_usage_details=q.token_usage_details,
        combination_id=q.combination_id,
        content_domain=q.content_domain,
        question_type=q.question_type,
        interaction_type=q.interaction_type,
        primary_trap=q.primary_trap,
        passage_required=q.passage_required,
        passage_questions=q.passage_questions,
        passage_id=q.passage_id,
        passage_mode=q.passage_mode,
        visual_type=q.visual_type,
        stage_outcomes=q.stage_outcomes,
    )


async def save_question(q: Question) -> Question:
    """Inserts or updates a question in PostgreSQL, auto-syncing passages and batches."""
    now_iso = datetime.now(UTC).isoformat()
    q.updated_at = now_iso

    async with async_session_factory() as session:
        # 1. Auto-sync Passage record if passage_id and stimulus_text exist
        if q.passage_id and q.stimulus_text and q.stimulus_text.strip():
            existing_passage = await session.get(PassageModel, q.passage_id)
            if not existing_passage:
                p_model = PassageModel(
                    id=q.passage_id,
                    title=f"{q.subtopic or q.section} Passage",
                    text=q.stimulus_text.strip(),
                    word_count=len(q.stimulus_text.split()),
                    section=q.section,
                    subtopic=q.subtopic,
                    image_url=q.image_url,
                    image_svg=q.image_svg,
                    image_description=q.image_description,
                    created_at=q.created_at or now_iso,
                    updated_at=now_iso,
                )
                session.add(p_model)
            else:
                existing_passage.text = q.stimulus_text.strip()
                existing_passage.word_count = len(q.stimulus_text.split())
                if q.image_svg and not existing_passage.image_svg:
                    existing_passage.image_svg = q.image_svg
                if q.image_url and not existing_passage.image_url:
                    existing_passage.image_url = q.image_url
                if q.image_description and not existing_passage.image_description:
                    existing_passage.image_description = q.image_description
                existing_passage.updated_at = now_iso

        # 2. Auto-sync GenerationBatch record if batch_id exists
        if q.batch_id:
            existing_batch = await session.get(GenerationBatchModel, q.batch_id)
            if not existing_batch:
                b_model = GenerationBatchModel(
                    id=q.batch_id,
                    section=q.section,
                    subtopic=q.subtopic,
                    difficulty=q.difficulty,
                    passage_mode=q.passage_mode,
                    target_count=1,
                    actual_count=1,
                    total_tokens=q.total_tokens or 0,
                    cost_usd=q.cost_usd or 0.0,
                    status="completed",
                    created_at=q.created_at or now_iso,
                    updated_at=now_iso,
                )
                session.add(b_model)
            else:
                existing_batch.actual_count = (existing_batch.actual_count or 0) + 1
                existing_batch.total_tokens = (existing_batch.total_tokens or 0) + (
                    q.total_tokens or 0
                )
                existing_batch.cost_usd = (existing_batch.cost_usd or 0.0) + (q.cost_usd or 0.0)
                existing_batch.updated_at = now_iso

        # 3. Save QuestionModel
        model = _schema_to_model(q)
        await session.merge(model)
        await session.commit()
        return q


class BatchSaveResult(list):
    """List of saved question IDs that also evaluates equality against integer count for backwards compatibility."""

    def __eq__(self, other: Any) -> bool:
        if isinstance(other, int):
            return len(self) == other
        return super().__eq__(other)


async def save_questions_batch(questions: list[Question]) -> BatchSaveResult:
    """Inserts or updates an array of questions in PostgreSQL within a single atomic transaction, auto-syncing passages and batches."""
    if not questions:
        return BatchSaveResult()

    now_iso = datetime.now(UTC).isoformat()
    saved_ids = []

    async with async_session_factory() as session:
        # Pre-group passages and batches to optimize DB roundtrips
        passages_to_upsert: dict[str, PassageModel] = {}
        batches_to_upsert: dict[str, dict[str, Any]] = {}

        for q in questions:
            q.updated_at = now_iso

            # Aggregate passages
            if (
                q.passage_id
                and q.stimulus_text
                and q.stimulus_text.strip()
                and q.passage_id not in passages_to_upsert
            ):
                passages_to_upsert[q.passage_id] = PassageModel(
                    id=q.passage_id,
                    title=f"{q.subtopic or q.section} Passage",
                    text=q.stimulus_text.strip(),
                    word_count=len(q.stimulus_text.split()),
                    section=q.section,
                    subtopic=q.subtopic,
                    image_url=q.image_url,
                    image_svg=q.image_svg,
                    image_description=q.image_description,
                    created_at=q.created_at or now_iso,
                    updated_at=now_iso,
                )

            # Aggregate batches
            if q.batch_id:
                if q.batch_id not in batches_to_upsert:
                    batches_to_upsert[q.batch_id] = {
                        "section": q.section,
                        "subtopic": q.subtopic,
                        "difficulty": q.difficulty,
                        "passage_mode": q.passage_mode,
                        "count": 0,
                        "tokens": 0,
                        "cost": 0.0,
                        "created_at": q.created_at or now_iso,
                    }
                b_info = batches_to_upsert[q.batch_id]
                b_info["count"] += 1
                b_info["tokens"] += q.total_tokens or 0
                b_info["cost"] += q.cost_usd or 0.0

        # Upsert passages
        for pid, p_mod in passages_to_upsert.items():
            existing_p = await session.get(PassageModel, pid)
            if not existing_p:
                session.add(p_mod)
            else:
                existing_p.text = p_mod.text
                existing_p.word_count = p_mod.word_count
                if p_mod.image_svg and not existing_p.image_svg:
                    existing_p.image_svg = p_mod.image_svg
                if p_mod.image_url and not existing_p.image_url:
                    existing_p.image_url = p_mod.image_url
                if p_mod.image_description and not existing_p.image_description:
                    existing_p.image_description = p_mod.image_description
                existing_p.updated_at = now_iso

        # Upsert batches
        for bid, b_info in batches_to_upsert.items():
            existing_b = await session.get(GenerationBatchModel, bid)
            if not existing_b:
                b_model = GenerationBatchModel(
                    id=bid,
                    section=b_info["section"],
                    subtopic=b_info["subtopic"],
                    difficulty=b_info["difficulty"],
                    passage_mode=b_info["passage_mode"],
                    target_count=b_info["count"],
                    actual_count=b_info["count"],
                    total_tokens=b_info["tokens"],
                    cost_usd=b_info["cost"],
                    status="completed",
                    created_at=b_info["created_at"],
                    updated_at=now_iso,
                )
                session.add(b_model)
            else:
                existing_b.actual_count = (existing_b.actual_count or 0) + b_info["count"]
                existing_b.total_tokens = (existing_b.total_tokens or 0) + b_info["tokens"]
                existing_b.cost_usd = (existing_b.cost_usd or 0.0) + b_info["cost"]
                existing_b.updated_at = now_iso

        # Upsert questions
        for q in questions:
            model = _schema_to_model(q)
            await session.merge(model)
            saved_ids.append(q.id)

        await session.commit()

    return BatchSaveResult(saved_ids)


async def get_repository_metrics() -> dict[str, Any]:
    """Computes repository-wide metrics via native SQL aggregation with zero Python memory overhead."""
    async with async_session_factory() as session:
        stmt = select(
            func.count(QuestionModel.id).label("total_count"),
            func.coalesce(func.sum(QuestionModel.total_tokens), 0).label("total_tokens"),
            func.coalesce(func.sum(QuestionModel.cost_usd), 0.0).label("total_cost_usd"),
        )
        res = await session.execute(stmt)
        row = res.one()
        return {
            "total_count": int(row.total_count),
            "total_tokens": int(row.total_tokens),
            "total_cost_usd": round(float(row.total_cost_usd), 5),
        }


async def get_questions(
    section: str | None = None,
    difficulty: str | None = None,
    search: str | None = None,
    combination_id: str | None = None,
    run_id: str | None = None,
    batch_id: str | None = None,
    passage_id: str | None = None,
) -> list[Question]:
    """Retrieves questions from PostgreSQL with optional filtering and hybrid full-text search."""
    async with async_session_factory() as session:
        stmt = select(QuestionModel)

        if section:
            stmt = stmt.where(QuestionModel.section == section)
        if difficulty:
            stmt = stmt.where(QuestionModel.difficulty == difficulty)
        if combination_id:
            stmt = stmt.where(QuestionModel.combination_id == combination_id)
        if run_id:
            stmt = stmt.where(QuestionModel.run_id == run_id)
        if batch_id:
            stmt = stmt.where(QuestionModel.batch_id == batch_id)
        if passage_id:
            stmt = stmt.where(QuestionModel.passage_id == passage_id)

        if search:
            search_clean = search.strip()
            wildcard = f"%{search_clean}%"

            # Hybrid PostgreSQL search: tsvector full-text match + ILIKE substring fallback
            fts_vector = func.to_tsvector(
                "english",
                func.coalesce(QuestionModel.question_stem, "")
                + " "
                + func.coalesce(QuestionModel.stimulus_text, "")
                + " "
                + func.coalesce(QuestionModel.subtopic, "")
                + " "
                + func.coalesce(QuestionModel.explanation, ""),
            )
            fts_condition = fts_vector.op("@@")(func.plainto_tsquery("english", search_clean))

            stmt = stmt.where(
                or_(
                    fts_condition,
                    QuestionModel.question_stem.ilike(wildcard),
                    QuestionModel.stimulus_text.ilike(wildcard),
                    QuestionModel.subtopic.ilike(wildcard),
                    QuestionModel.explanation.ilike(wildcard),
                    QuestionModel.combination_id.ilike(wildcard),
                    QuestionModel.content_domain.ilike(wildcard),
                    QuestionModel.run_id.ilike(wildcard),
                    QuestionModel.batch_id.ilike(wildcard),
                    QuestionModel.passage_id.ilike(wildcard),
                )
            )

        stmt = stmt.order_by(QuestionModel.created_at.desc())
        result = await session.execute(stmt)
        models = result.scalars().all()
        return [_model_to_schema(m) for m in models]


async def get_question_by_id(question_id: str) -> Question | None:
    """Retrieves a single question by primary key ID."""
    async with async_session_factory() as session:
        model = await session.get(QuestionModel, question_id)
        if not model:
            return None
        return _model_to_schema(model)


async def delete_question(question_id: str) -> bool:
    """Deletes a question by primary key ID."""
    async with async_session_factory() as session:
        stmt = delete(QuestionModel).where(QuestionModel.id == question_id)
        await session.execute(stmt)
        await session.commit()
        return True


async def delete_questions_batch(question_ids: list[str]) -> int:
    """Deletes multiple questions by primary key IDs in a single atomic SQL transaction."""
    if not question_ids:
        return 0
    async with async_session_factory() as session:
        stmt = delete(QuestionModel).where(QuestionModel.id.in_(question_ids))
        result = await session.execute(stmt)
        await session.commit()
    return result.rowcount or 0


__all__ = [
    "BatchSaveResult",
    "_model_to_schema",
    "_schema_to_model",
    "delete_question",
    "delete_questions_batch",
    "get_question_by_id",
    "get_questions",
    "get_repository_metrics",
    "save_question",
    "save_questions_batch",
]
