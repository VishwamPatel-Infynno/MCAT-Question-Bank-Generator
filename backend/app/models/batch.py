from sqlalchemy import Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class GenerationBatchModel(Base):
    __tablename__ = "generation_batches"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    section: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    subtopic: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    difficulty: Mapped[str | None] = mapped_column(String(32), nullable=True)
    passage_mode: Mapped[str | None] = mapped_column(String(32), nullable=True)
    target_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    actual_count: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    total_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    cost_usd: Mapped[float | None] = mapped_column(Float, nullable=True, default=0.0)
    status: Mapped[str | None] = mapped_column(String(32), nullable=True, default="completed")
    total_jobs: Mapped[int | None] = mapped_column(Integer, nullable=True, default=10)
    completed_jobs: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    failed_jobs: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    updated_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
