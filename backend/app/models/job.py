from sqlalchemy import Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class GenerationJobModel(Base):
    __tablename__ = "generation_jobs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    batch_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("generation_batches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    job_number: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="pending", index=True
    )  # pending, running, completed, failed
    target_count: Mapped[int] = mapped_column(Integer, nullable=False, default=5)
    actual_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    passage_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    total_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    prompt_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    completion_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    cost_usd: Mapped[float | None] = mapped_column(Float, nullable=True, default=0.0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    started_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
    completed_at: Mapped[str | None] = mapped_column(String(64), nullable=True)
