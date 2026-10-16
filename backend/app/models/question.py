from typing import Any

from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class QuestionModel(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    section: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    section_label: Mapped[str] = mapped_column(String(128), nullable=False)
    subtopic: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    difficulty: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    stimulus_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    question_stem: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False)
    correct_answer_id: Mapped[str] = mapped_column(String(32), nullable=False)
    correct_answer_ids: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_svg: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    final_score: Mapped[int] = mapped_column(Integer, nullable=False)
    review_rubric: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
    iteration_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    iterations_history: Mapped[list[dict[str, Any]] | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    run_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    batch_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)

    # Token usage & cost tracking
    total_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    prompt_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    completion_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    cost_usd: Mapped[float | None] = mapped_column(Float, nullable=True, default=0.0)
    token_usage_details: Mapped[list[dict[str, Any]] | None] = mapped_column(JSONB, nullable=True)

    # Manager Combination Matrix attributes
    combination_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    content_domain: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    question_type: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    interaction_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    primary_trap: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    passage_required: Mapped[str | None] = mapped_column(String(16), nullable=True)
    passage_questions: Mapped[int | None] = mapped_column(Integer, nullable=True)
    visual_type: Mapped[str | None] = mapped_column(String(64), nullable=True)

    # Multi-Stage Raw Outcome JSON
    stage_outcomes: Mapped[dict[str, Any] | None] = mapped_column(JSONB, nullable=True)
