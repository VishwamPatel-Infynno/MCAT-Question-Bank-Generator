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
        "cost_per_million_input": config.COST_PER_MILLION_INPUT_TOKENS,
        "cost_per_million_output": config.COST_PER_MILLION_OUTPUT_TOKENS,
        "image_width": config.IMAGE_WIDTH,
        "image_height": config.IMAGE_HEIGHT,
        "image_iters": config.IMAGE_ITERS,
        "image_cost_base_rate": config.IMAGE_COST_PER_BASE_UNIT,
        "current_image_cost_usd": config.calculate_flux_image_cost(),
    }


@router.post("/config")
async def update_settings(payload: dict):
    """Dynamically updates runtime settings and API credentials."""
    if "default_text_model" in payload and payload["default_text_model"]:
        config.DEFAULT_TEXT_MODEL = payload["default_text_model"]
    if "default_image_model" in payload and payload["default_image_model"]:
        config.DEFAULT_IMAGE_MODEL = payload["default_image_model"]
    if "deepinfra_api_key" in payload and payload["deepinfra_api_key"]:
        config.DEEPINFRA_API_KEY = payload["deepinfra_api_key"]
    if "gemini_api_key" in payload and payload["gemini_api_key"]:
        config.GEMINI_API_KEY = payload["gemini_api_key"]
    if "openai_api_key" in payload and payload["openai_api_key"]:
        config.OPENAI_API_KEY = payload["openai_api_key"]
    if "max_regenerations" in payload:
        config.MAX_REGENERATION_ATTEMPTS = int(payload["max_regenerations"])
    if "image_width" in payload:
        config.IMAGE_WIDTH = int(payload["image_width"])
    if "image_height" in payload:
        config.IMAGE_HEIGHT = int(payload["image_height"])
    if "image_iters" in payload:
        config.IMAGE_ITERS = int(payload["image_iters"])
    return {"status": "updated", "config": await get_settings()}
