import logging
from typing import List, Optional
from sqlalchemy import select, delete, or_

from app.db.session import async_session_factory
from app.models.question import QuestionModel
from app.schemas import Question, OptionChoice, ReviewScore

logger = logging.getLogger(__name__)

def _model_to_schema(m: QuestionModel) -> Question:
    """Converts a SQLAlchemy QuestionModel to a Pydantic Question schema."""
    options = [OptionChoice(**o) for o in m.options]
    rubric = ReviewScore(**m.review_rubric) if m.review_rubric else None
    
    return Question(
        id=m.id,
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
        token_usage_details=m.token_usage_details or []
    )

async def save_question(q: Question) -> Question:
    """Inserts or updates a question in PostgreSQL using native JSONB columns."""
    async with async_session_factory() as session:
        options_data = [opt.model_dump() for opt in q.options]
        rubric_data = q.review_rubric.model_dump() if q.review_rubric else None

        model = QuestionModel(
            id=q.id,
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
            token_usage_details=q.token_usage_details
        )

        await session.merge(model)
        await session.commit()
        return q

async def get_questions(
    section: Optional[str] = None,
    difficulty: Optional[str] = None,
    search: Optional[str] = None
) -> List[Question]:
    """Retrieves questions from PostgreSQL with optional filtering and full-text search."""
    async with async_session_factory() as session:
        stmt = select(QuestionModel)

        if section:
            stmt = stmt.where(QuestionModel.section == section)
        if difficulty:
            stmt = stmt.where(QuestionModel.difficulty == difficulty)
        if search:
            wildcard = f"%{search}%"
            stmt = stmt.where(
                or_(
                    QuestionModel.question_stem.ilike(wildcard),
                    QuestionModel.stimulus_text.ilike(wildcard),
                    QuestionModel.subtopic.ilike(wildcard)
                )
            )

        stmt = stmt.order_by(QuestionModel.created_at.desc())
        result = await session.execute(stmt)
        models = result.scalars().all()
        return [_model_to_schema(m) for m in models]

async def get_question_by_id(question_id: str) -> Optional[Question]:
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
