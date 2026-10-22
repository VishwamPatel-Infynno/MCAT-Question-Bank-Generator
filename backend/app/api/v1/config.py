import logging

from fastapi import APIRouter

from app.core.config import config

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Configuration & Settings"])


@router.get("/config")
async def get_settings():
    """Retrieves current runtime configuration and pricing constants."""
    return {
        "default_text_model": config.DEFAULT_TEXT_MODEL,
        "default_image_model": config.DEFAULT_IMAGE_MODEL,
        "has_deepinfra_key": bool(config.DEEPINFRA_API_KEY),
        "has_gemini_key": bool(config.GEMINI_API_KEY),
        "has_openai_key": bool(config.OPENAI_API_KEY),
        "has_anthropic_key": bool(config.ANTHROPIC_API_KEY),
        "has_groq_key": bool(config.GROQ_API_KEY),
        "max_regenerations": config.MAX_REGENERATION_ATTEMPTS,
        "passing_threshold": config.PASSING_SCORE_THRESHOLD,
        "default_max_tokens": config.DEFAULT_MAX_TOKENS,
        "reviewer_max_tokens": config.REVIEWER_MAX_TOKENS,
        "cost_per_million_input": config.COST_PER_MILLION_INPUT_TOKENS,
        "cost_per_million_output": config.COST_PER_MILLION_OUTPUT_TOKENS,
        "image_width": config.IMAGE_WIDTH,
        "image_height": config.IMAGE_HEIGHT,
        "image_iters": config.IMAGE_ITERS,
        "image_cost_base_rate": config.IMAGE_COST_PER_BASE_UNIT,
        "current_image_cost_usd": config.calculate_flux_image_cost(),
    }
