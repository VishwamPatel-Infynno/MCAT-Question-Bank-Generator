import os
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Base paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    SQLITE_PATH: Path = BASE_DIR / "question_bank.db"

    # PostgreSQL Database URL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql+asyncpg://mcat_user:mcat_password@localhost:5432/mcat_db"
    )

    # Primary LLM for multi-agent reasoning: DeepSeek V4.1 Flash 1017 via DeepInfra
    DEFAULT_TEXT_MODEL: str = os.getenv(
        "DEFAULT_TEXT_MODEL", "deepinfra/deepseek-ai/DeepSeek-V4.1-Flash-1017"
    )

    # Official DeepInfra Pricing (USD per 1,000,000 tokens)
    COST_PER_MILLION_INPUT_TOKENS: float = float(os.getenv("COST_PER_MILLION_INPUT_TOKENS", "0.098"))
    COST_PER_MILLION_OUTPUT_TOKENS: float = float(
        os.getenv("COST_PER_MILLION_OUTPUT_TOKENS", "0.294")
    )

    # Image generation model: black-forest-labs/FLUX-2-klein-4b via DeepInfra
    DEFAULT_IMAGE_MODEL: str = os.getenv("DEFAULT_IMAGE_MODEL", "black-forest-labs/FLUX-2-klein-4b")
    IMAGE_WIDTH: int = int(os.getenv("IMAGE_WIDTH", "1024"))
    IMAGE_HEIGHT: int = int(os.getenv("IMAGE_HEIGHT", "1024"))
    IMAGE_ITERS: int = int(os.getenv("IMAGE_ITERS", "0"))
    IMAGE_COST_PER_BASE_UNIT: float = float(os.getenv("IMAGE_COST_PER_BASE_UNIT", "0.014"))

    def calculate_flux_image_cost(
        self,
        width: int | None = None,
        height: int | None = None,
        iters: int | None = None,
        model: str | None = None,
    ) -> float:
        """
        Calculates image generation cost using DeepInfra model pricing:
        - FLUX-2-klein-4b (flat rate): Flat $0.014 per image (at 1024x1024 base unit)
        - Step-based (iters > 0): rate * (width / 1024) * (height / 1024) * iters
        """
        w = width if width is not None else self.IMAGE_WIDTH
        h = height if height is not None else self.IMAGE_HEIGHT

        # If iters is explicitly passed (>0), compute per-step rate (FLUX-1-schnell standard)
        if iters is not None and iters > 0:
            rate = (
                0.0005 if self.IMAGE_COST_PER_BASE_UNIT == 0.014 else self.IMAGE_COST_PER_BASE_UNIT
            )
            return round(rate * (w / 1024.0) * (h / 1024.0) * iters, 6)

        rate = self.IMAGE_COST_PER_BASE_UNIT
        return round(rate * (w / 1024.0) * (h / 1024.0), 6)

    # API Keys
    DEEPINFRA_API_KEY: str = os.getenv("DEEPINFRA_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    # Multi-Agent Workflow Parameters
    MAX_REGENERATION_ATTEMPTS: int = int(os.getenv("MAX_REGENERATION_ATTEMPTS", "3"))
    PASSING_SCORE_THRESHOLD: int = int(os.getenv("PASSING_SCORE_THRESHOLD", "90"))
    DEFAULT_MAX_TOKENS: int = int(os.getenv("DEFAULT_MAX_TOKENS", "3000"))
    REVIEWER_MAX_TOKENS: int = int(os.getenv("REVIEWER_MAX_TOKENS", "1800"))

    model_config = SettingsConfigDict(
        env_file=[str(Path(__file__).resolve().parent.parent.parent.parent / ".env"), ".env"],
        extra="allow",
    )


config = Settings()
Config = Settings  # Backward-compatible alias
