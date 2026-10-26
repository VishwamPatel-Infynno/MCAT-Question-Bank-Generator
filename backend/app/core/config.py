from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Base paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent

    # PostgreSQL Database URL
    DATABASE_URL: str = "postgresql+asyncpg://mcat_user:mcat_password@localhost:5432/mcat_db"

    # Primary LLM for multi-agent reasoning: DeepSeek V4.1 Flash 1017 via DeepInfra
    DEFAULT_TEXT_MODEL: str = "deepinfra/deepseek-ai/DeepSeek-V4.1-Flash-1017"

    # Official DeepInfra Pricing (USD per 1,000,000 tokens)
    COST_PER_MILLION_INPUT_TOKENS: float = 0.098
    COST_PER_MILLION_OUTPUT_TOKENS: float = 0.294

    # Image generation model: black-forest-labs/FLUX-2-klein-4b via DeepInfra
    DEFAULT_IMAGE_MODEL: str = "black-forest-labs/FLUX-2-klein-4b"
    IMAGE_WIDTH: int = 1024
    IMAGE_HEIGHT: int = 1024
    IMAGE_ITERS: int = 0
    IMAGE_COST_PER_BASE_UNIT: float = 0.014

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
        _ = model  # Reserved for future per-model rate overrides
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

    # API Keys — loaded automatically from .env by pydantic-settings
    DEEPINFRA_API_KEY: str = ""

    # CORS Trusted Origins (extra origins beyond localhost defaults, comma-separated in .env)
    ALLOWED_ORIGINS: list[str] = []

    @property
    def effective_allowed_origins(self) -> list[str]:
        """Merges hardcoded localhost dev origins with any runtime ALLOWED_ORIGINS overrides."""
        defaults = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        return list(set(defaults + self.ALLOWED_ORIGINS))

    # Multi-Agent Workflow Parameters
    MAX_REGENERATION_ATTEMPTS: int = 3
    PASSING_SCORE_THRESHOLD: int = 90
    DEFAULT_MAX_TOKENS: int = 3000
    REVIEWER_MAX_TOKENS: int = 1800

    # Strict Temperature Parameters for High Instruction Fidelity
    DEFAULT_TEMPERATURE: float = 0.2
    GENERATOR_TEMPERATURE: float = 0.2
    REGENERATOR_TEMPERATURE: float = 0.2
    REVIEWER_TEMPERATURE: float = 0.1
    BLIND_SOLVER_TEMPERATURE: float = 0.1

    # Dedicated DeepInfra Model Cascade List
    FAST_MODEL_CASCADE: list[str] = [
        "deepinfra/deepseek-ai/DeepSeek-V4.1-Flash-1017",
    ]

    # Blind-Solver Dual Validation Agent
    ENABLE_BLIND_SOLVER: bool = True
    BLIND_SOLVER_CONFIDENCE_THRESHOLD: int = 88
    BLIND_SOLVER_MAX_TOKENS: int = 1200

    model_config = SettingsConfigDict(
        env_file=[str(Path(__file__).resolve().parent.parent.parent.parent / ".env"), ".env"],
        extra="allow",
    )


config = Settings()
