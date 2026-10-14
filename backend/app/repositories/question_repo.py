import logging
from typing import List, Optional

from sqlalchemy import delete, or_, select

from app.db.session import async_session_factory
from app.models.question import QuestionModel
from app.schemas import OptionChoice, Question, ReviewScore

logger = logging.getLogger(__name__)


def _model_to_schema(m: QuestionModel) -> Question:
    """Converts a SQLAlchemy QuestionModel to a Pydantic Question schema."""
    options = [OptionChoice(**o) for o in m.options]
    rubric = ReviewScore(**m.review_rubric) if m.review_rubric else None

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
        explanation=m.explanation,
        image_url=m.image_url,
        image_svg=m.image_svg,
        image_description=m.image_description,
        final_score=m.final_score,
        review_rubric=rubric,
        iteration_count=m.iteration_count,
        iterations_history=m.iterations_history or [],
        created_at=m.created_at,
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
        visual_type=m.visual_type or "None",
        stage_outcomes=m.stage_outcomes or {},
    )


async def save_question(q: Question) -> Question:
    """Inserts or updates a question in PostgreSQL using native JSONB columns."""
    async with async_session_factory() as session:
        options_data = [opt.model_dump() for opt in q.options]
        rubric_data = q.review_rubric.model_dump() if q.review_rubric else None

        model = QuestionModel(
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
            explanation=q.explanation,
            image_url=q.image_url,
            image_svg=q.image_svg,
            image_description=q.image_description,
            final_score=q.final_score,
            review_rubric=rubric_data,
            iteration_count=q.iteration_count,
            iterations_history=q.iterations_history,
            created_at=q.created_at,
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
            visual_type=q.visual_type,
            stage_outcomes=q.stage_outcomes,
        )

        await session.merge(model)
        await session.commit()
        return q


async def get_questions(
    section: str | None = None,
    difficulty: str | None = None,
    search: str | None = None,
    combination_id: str | None = None,
    run_id: str | None = None,
    batch_id: str | None = None,
) -> list[Question]:
    """Retrieves questions from PostgreSQL with optional filtering and full-text search."""
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
        if search:
            wildcard = f"%{search}%"
            stmt = stmt.where(
                or_(
                    QuestionModel.question_stem.ilike(wildcard),
                    QuestionModel.stimulus_text.ilike(wildcard),
                    QuestionModel.subtopic.ilike(wildcard),
                    QuestionModel.combination_id.ilike(wildcard),
                    QuestionModel.content_domain.ilike(wildcard),
                    QuestionModel.run_id.ilike(wildcard),
                    QuestionModel.batch_id.ilike(wildcard),
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
