import logging

from fastapi import APIRouter

from app.core.config import config
from app.db.session import check_db_health
from app.schemas.mcat import (
    AAMC_REASONING_SKILLS,
    MCAT_PACING,
    MCAT_SECTION_CODES,
    MCAT_SECTION_LABELS,
    MCAT_SUBTOPICS,
    MCATSection,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health & Metadata"])


@router.get("/health")
async def health_check():
    """Health check reporting database status, exam standard, and active pricing."""
    db_status = await check_db_health()
    return {
        "status": "healthy",
        "exam": "AAMC MCAT",
        "database": "connected" if db_status.get("connected") else "disconnected",
        "database_connected": db_status.get("connected", False),
        "database_status": db_status.get(
            "status", "ready" if db_status.get("connected") else "unavailable"
        ),
        "default_text_model": config.DEFAULT_TEXT_MODEL,
        "default_image_model": config.DEFAULT_IMAGE_MODEL,
        "has_deepinfra_key": bool(config.DEEPINFRA_API_KEY),
        "has_gemini_key": bool(config.GEMINI_API_KEY),
        "has_openai_key": bool(config.OPENAI_API_KEY),
        "max_regenerations": config.MAX_REGENERATION_ATTEMPTS,
        "passing_threshold": config.PASSING_SCORE_THRESHOLD,
        "cost_per_million_input": config.COST_PER_MILLION_INPUT_TOKENS,
        "cost_per_million_output": config.COST_PER_MILLION_OUTPUT_TOKENS,
        "image_width": config.IMAGE_WIDTH,
        "image_height": config.IMAGE_HEIGHT,
        "image_iters": config.IMAGE_ITERS,
        "current_image_cost_usd": config.calculate_flux_image_cost(),
    }


_CACHED_SECTIONS_PAYLOAD = {
    "exam": "MCAT",
    "exam_full_name": "Medical College Admission Test (AAMC)",
    "sections": [
        {
            "id": sec.value,
            "code": MCAT_SECTION_CODES[sec],
            "label": MCAT_SECTION_LABELS[sec],
            "pacing": MCAT_PACING[sec],
            "subtopics": MCAT_SUBTOPICS[sec],
        }
        for sec in MCATSection
    ],
    "aamc_skills": AAMC_REASONING_SKILLS,
}


@router.get("/sections")
async def get_sections():
    """Returns official AAMC MCAT sections and their categorized subtopics (in-memory pre-cached)."""
    return _CACHED_SECTIONS_PAYLOAD
