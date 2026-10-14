import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Base paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    SQLITE_PATH: Path = BASE_DIR / "question_bank.db"

    # PostgreSQL Database URL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://ucat_user:ucat_password@localhost:5432/ucat_db"
    )

    # Primary LLM for multi-agent reasoning: Meta Llama 3.3 70B Instruct Turbo via DeepInfra
    DEFAULT_TEXT_MODEL: str = os.getenv(
        "DEFAULT_TEXT_MODEL",
        "deepinfra/meta-llama/Llama-3.3-70B-Instruct-Turbo"
    )
    
    # Official DeepInfra Pricing (USD per 1,000,000 tokens)
    COST_PER_MILLION_INPUT_TOKENS: float = float(os.getenv("COST_PER_MILLION_INPUT_TOKENS", "0.10"))
    COST_PER_MILLION_OUTPUT_TOKENS: float = float(os.getenv("COST_PER_MILLION_OUTPUT_TOKENS", "0.32"))

    # Image generation model: black-forest-labs/FLUX-1-schnell via DeepInfra
    DEFAULT_IMAGE_MODEL: str = os.getenv(
        "DEFAULT_IMAGE_MODEL",
        "black-forest-labs/FLUX-1-schnell"
    )
    IMAGE_WIDTH: int = int(os.getenv("IMAGE_WIDTH", "1024"))
    IMAGE_HEIGHT: int = int(os.getenv("IMAGE_HEIGHT", "1024"))
    IMAGE_ITERS: int = int(os.getenv("IMAGE_ITERS", "4"))
    IMAGE_COST_PER_BASE_UNIT: float = float(os.getenv("IMAGE_COST_PER_BASE_UNIT", "0.0005"))

    def calculate_flux_image_cost(self, width: int = None, height: int = None, iters: int = None) -> float:
        """
        Calculates FLUX-1-schnell image generation cost using DeepInfra formula:
        Cost = $0.0005 * (width / 1024) * (height / 1024) * iters
        """
        w = width if width is not None else self.IMAGE_WIDTH
        h = height if height is not None else self.IMAGE_HEIGHT
        it = iters if iters is not None else self.IMAGE_ITERS
        return round(self.IMAGE_COST_PER_BASE_UNIT * (w / 1024.0) * (h / 1024.0) * it, 6)


    # API Keys
    DEEPINFRA_API_KEY: str = os.getenv("DEEPINFRA_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    # Multi-Agent Workflow Parameters
    MAX_REGENERATION_ATTEMPTS: int = int(os.getenv("MAX_REGENERATION_ATTEMPTS", "3"))
    PASSING_SCORE_THRESHOLD: int = int(os.getenv("PASSING_SCORE_THRESHOLD", "90"))

    model_config = SettingsConfigDict(env_file=".env", extra="allow")

config = Settings()
Config = Settings  # Backward-compatible alias
