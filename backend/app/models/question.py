from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Text, Integer, Float
from sqlalchemy.dialects.postgresql import JSONB

from app.db.base import Base

class QuestionModel(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    section: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    section_label: Mapped[str] = mapped_column(String(128), nullable=False)
    subtopic: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    difficulty: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    stimulus_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    question_stem: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB, nullable=False)
    correct_answer_id: Mapped[str] = mapped_column(String(8), nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_svg: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    final_score: Mapped[int] = mapped_column(Integer, nullable=False)
    review_rubric: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    iteration_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    iterations_history: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    
    # Token usage & cost tracking
    total_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=0)
    prompt_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=0)
    completion_tokens: Mapped[Optional[int]] = mapped_column(Integer, nullable=True, default=0)
    cost_usd: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=0.0)
    token_usage_details: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSONB, nullable=True)
