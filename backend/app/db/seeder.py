import logging

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.models.question import QuestionModel

logger = logging.getLogger(__name__)


async def cleanup_legacy_questions(session_factory: async_sessionmaker):
    """
    Cleans up legacy UCAT questions if present.
    Does not auto-seed mock questions so a fresh database/Docker instance remains clean.
    """
    try:
        async with session_factory() as session:
            # Clean up legacy UCAT questions directly via DELETE without fetching all columns
            await session.execute(
                delete(QuestionModel).where(
                    QuestionModel.section.in_(
                        [
                            "verbal_reasoning",
                            "decision_making",
                            "quantitative_reasoning",
                            "abstract_reasoning",
                            "situational_judgement",
                            "VR",
                            "DM",
                            "QR",
                            "AR",
                            "SJT",
                        ]
                    )
                )
            )
            await session.commit()
    except Exception as e:
        logger.warning(f"Could not clean legacy questions: {e}")


# Backward-compatible alias
seed_mcat_questions_if_empty = cleanup_legacy_questions

__all__ = ["cleanup_legacy_questions", "seed_mcat_questions_if_empty"]
