import logging

from fastapi import APIRouter

from app.core.config import config
from app.db.session import check_db_health
from app.schemas.ucat import UCAT_SECTION_LABELS, UCAT_SUBTOPICS, UCATSection

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health & Metadata"])


@router.get("/health")
async def health_check():
    """Health check reporting database status and active pricing."""
    db_status = await check_db_health()
    return {
        "status": "healthy",
        "database": "postgresql",
        "database_connected": db_status.get("connected", False),
        "database_version": db_status.get("version"),
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
    "sections": [
        {"id": sec.value, "label": UCAT_SECTION_LABELS[sec], "subtopics": UCAT_SUBTOPICS[sec]}
        for sec in UCATSection
    ]
}


@router.get("/sections")
async def get_sections():
    """Returns official UK UCAT sections and their categorized subtopics (in-memory pre-cached)."""
    return _CACHED_SECTIONS_PAYLOAD
