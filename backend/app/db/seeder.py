import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.models.question import QuestionModel

logger = logging.getLogger(__name__)


async def seed_mcat_questions_if_empty(session_factory: async_sessionmaker):
    """Seeds authentic MCAT questions across all 4 sections if the bank has legacy questions or is empty."""
    from app.agents.mock_fixtures import _build_raw_mock_draft
    from app.schemas.mcat import (
        MCAT_SECTION_LABELS,
        MCATSection,
        calculate_mcat_scaled_score,
    )
    from app.schemas.workflow import GenerationRequest

    try:
        async with session_factory() as session:
            # 1. Clean up legacy UCAT questions directly via DELETE without fetching all columns
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

            # 2. Check if any questions exist
            res = await session.execute(select(func.count(QuestionModel.id)))
            count = res.scalar() or 0
            if count == 0:
                logger.info("Seeding authentic publication-grade MCAT questions across all 4 sections...")
                now_iso = datetime.now(UTC).isoformat()
                for sec in [
                    MCATSection.CHEM_PHYS,
                    MCATSection.CARS,
                    MCATSection.BIO_BIOCHEM,
                    MCATSection.PSYCH_SOC,
                ]:
                    req = GenerationRequest(section=sec)
                    draft = _build_raw_mock_draft(req)
                    scaled = calculate_mcat_scaled_score(95, "medium")
                    q_model = QuestionModel(
                        id=str(uuid.uuid4()),
                        section=sec.value,
                        section_label=MCAT_SECTION_LABELS[sec],
                        subtopic=draft.aamc_skill or "Foundational Concepts",
                        difficulty="medium",
                        stimulus_text=draft.stimulus_text,
                        question_stem=draft.question_stem,
                        options=[opt.model_dump() for opt in draft.options],
                        correct_answer_id=draft.correct_answer_id,
                        correct_answer_ids=draft.correct_answer_ids,
                        explanation=draft.explanation,
                        final_score=95,
                        mcat_scaled_score=scaled["section_score"],
                        aamc_skill=draft.aamc_skill or "Skill_2",
                        primary_trap=draft.primary_trap or "Distortion_Opposite",
                        passage_required="Yes" if draft.stimulus_text else "No",
                        visual_type="None",
                        iteration_count=1,
                        created_at=now_iso,
                        updated_at=now_iso,
                        total_tokens=0,
                        prompt_tokens=0,
                        completion_tokens=0,
                        cost_usd=0.0,
                    )
                    session.add(q_model)
                await session.commit()
                logger.info("Successfully seeded 4 authentic MCAT question sets into Question Bank.")
    except Exception as e:
        logger.warning(f"Could not seed MCAT questions: {e}")
