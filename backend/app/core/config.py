import json
from pathlib import Path

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Base paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent

    # Active LLM Provider: 'deepinfra' or 'anthropic'
    ACTIVE_LLM_PROVIDER: str = "deepinfra"

    # PostgreSQL Database URL
    DATABASE_URL: str = "postgresql+asyncpg://mcat_user:mcat_password@localhost:5432/mcat_db"

    # Primary LLM for multi-agent reasoning: DeepSeek V4.1 Flash 1017 via DeepInfra
    DEFAULT_TEXT_MODEL: str = "deepinfra/deepseek-ai/DeepSeek-V4.1-Flash-1017"

    # Dedicated Anthropic settings
    ANTHROPIC_MODEL: str = "claude-haiku-5-5"
    ANTHROPIC_COST_PER_MILLION_INPUT_TOKENS: float = 0.10
    ANTHROPIC_COST_PER_MILLION_OUTPUT_TOKENS: float = 0.50
    ANTHROPIC_API_KEY: str = ""

    # Dedicated DeepInfra settings
    DEEPINFRA_MODEL: str = "deepinfra/deepseek-ai/DeepSeek-V4.1-Flash-1017"
    DEEPINFRA_COST_PER_MILLION_INPUT_TOKENS: float = 0.098
    DEEPINFRA_COST_PER_MILLION_OUTPUT_TOKENS: float = 0.294
    DEEPINFRA_API_KEY: str = ""

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

    # API Keys - loaded automatically from .env by pydantic-settings
    DEEPINFRA_API_KEY: str = ""

    @model_validator(mode="after")
    def sync_active_provider_defaults(self) -> "Settings":
        provider = (self.ACTIVE_LLM_PROVIDER or "").strip().lower()
        if provider == "anthropic":
            if self.DEFAULT_TEXT_MODEL == "deepinfra/deepseek-ai/DeepSeek-V4.1-Flash-1017":
                self.DEFAULT_TEXT_MODEL = self.ANTHROPIC_MODEL
            if self.COST_PER_MILLION_INPUT_TOKENS == 0.098:
                self.COST_PER_MILLION_INPUT_TOKENS = self.ANTHROPIC_COST_PER_MILLION_INPUT_TOKENS
            if self.COST_PER_MILLION_OUTPUT_TOKENS == 0.294:
                self.COST_PER_MILLION_OUTPUT_TOKENS = self.ANTHROPIC_COST_PER_MILLION_OUTPUT_TOKENS
        elif provider == "deepinfra":
            if self.DEFAULT_TEXT_MODEL == "claude-haiku-5-5":
                self.DEFAULT_TEXT_MODEL = self.DEEPINFRA_MODEL
        return self

    def is_anthropic_model(self, model: str | None = None) -> bool:
        """Determines if the provided or default model is an Anthropic Claude model."""
        target = (model or self.DEFAULT_TEXT_MODEL).strip().lower()
        return "claude" in target or target.startswith("anthropic/")

    def get_active_provider(self, model: str | None = None) -> str:
        """Returns the primary provider ('anthropic' or 'deepinfra') for the active or given model."""
        if model:
            return "anthropic" if self.is_anthropic_model(model) else "deepinfra"
        if self.ACTIVE_LLM_PROVIDER and self.ACTIVE_LLM_PROVIDER.strip().lower() == "anthropic":
            return "anthropic"
        return "anthropic" if self.is_anthropic_model() else "deepinfra"

    def get_default_pricing_rates(self, model: str | None = None) -> tuple[float, float]:
        """
        Returns default (cost_per_million_input, cost_per_million_output) based on active/given model:
        1. If COST_PER_MILLION_* have been customized away from default DeepInfra rates (0.098 / 0.294)
           and model is not DeepInfra, prioritize the user's custom environment rates.
        2. If model is Claude Haiku 5.5: returns official $0.10 / $0.50 per 1M tokens.
        3. If model is another Claude model (e.g. Sonnet, Opus): queries LiteLLM model_cost registry.
        4. Fallbacks: Sonnet ($3.00/$15.00), Opus ($15.00/$75.00), Haiku 3.5 ($0.80/$4.00), DeepInfra ($0.098/$0.294).
        """
        target = (model or self.DEFAULT_TEXT_MODEL).strip().lower()

        # If user explicitly overrode rates in .env away from DeepInfra defaults, respect them
        is_custom_env_rate = (
            self.COST_PER_MILLION_INPUT_TOKENS != 0.098
            or self.COST_PER_MILLION_OUTPUT_TOKENS != 0.294
        )
        if is_custom_env_rate:
            return self.COST_PER_MILLION_INPUT_TOKENS, self.COST_PER_MILLION_OUTPUT_TOKENS

        if self.is_anthropic_model(target):
            # Claude Haiku 5.5
            if "haiku-5-5" in target or target == "claude-haiku-5-5":
                return 0.10, 0.50

            # Dynamic LiteLLM model_cost registry lookup
            try:
                import litellm

                bare_target = target.replace("anthropic/", "").replace("anthropic.", "")
                candidates = [
                    target,
                    bare_target,
                    f"anthropic/{bare_target}",
                    f"anthropic.{bare_target}",
                ]
                for cand in candidates:
                    info = litellm.model_cost.get(cand)
                    if info and "input_cost_per_token" in info and "output_cost_per_token" in info:
                        in_rate = round(float(info["input_cost_per_token"]) * 1_000_000.0, 4)
                        out_rate = round(float(info["output_cost_per_token"]) * 1_000_000.0, 4)
                        return in_rate, out_rate
            except Exception:
                pass

            # Known Anthropic family heuristics
            if "sonnet" in target:
                return 3.00, 15.00
            if "opus" in target:
                return 15.00, 75.00
            if "haiku" in target:
                return 0.80, 4.00

            # Default generic Claude rate
            return 3.00, 15.00

        return self.COST_PER_MILLION_INPUT_TOKENS, self.COST_PER_MILLION_OUTPUT_TOKENS

    # CORS Trusted Origins (extra origins beyond localhost defaults, comma-separated or JSON list in .env)
    ALLOWED_ORIGINS: list[str] | str = []

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: object) -> list[str]:
        if isinstance(v, str):
            v_str = v.strip()
            if v_str.startswith("[") and v_str.endswith("]"):
                try:
                    parsed = json.loads(v_str)
                    if isinstance(parsed, list):
                        return [str(x).strip() for x in parsed if str(x).strip()]
                except (json.JSONDecodeError, ValueError):
                    pass  # Fall through to comma-split parsing
            return [x.strip() for x in v_str.split(",") if x.strip()]
        if isinstance(v, list):
            return [str(x).strip() for x in v if str(x).strip()]
        return []

    @property
    def effective_allowed_origins(self) -> list[str]:
        """Merges hardcoded localhost dev origins with any runtime ALLOWED_ORIGINS overrides."""
        defaults = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        origins = (
            self.ALLOWED_ORIGINS
            if isinstance(self.ALLOWED_ORIGINS, list)
            else [self.ALLOWED_ORIGINS]
        )
        return list(set(defaults + [o for o in origins if o]))

    # Multi-Agent Workflow Parameters
    MAX_REGENERATION_ATTEMPTS: int = 3
    PASSING_SCORE_THRESHOLD: int = 90
    BATCH_PASSING_SCORE_THRESHOLD: int = 85
    DEFAULT_MAX_TOKENS: int = 3000
    REVIEWER_MAX_TOKENS: int = 1800

    # Strict Temperature Parameters for High Instruction Fidelity
    DEFAULT_TEMPERATURE: float = 0.2
    GENERATOR_TEMPERATURE: float = 0.2
    REGENERATOR_TEMPERATURE: float = 0.2
    REVIEWER_TEMPERATURE: float = 0.1
    BLIND_SOLVER_TEMPERATURE: float = 0.1

    # Dedicated DeepInfra Model Cascade List
    FAST_MODEL_CASCADE: list[str] | str = [
        "deepinfra/deepseek-ai/DeepSeek-V4.1-Flash-1017",
    ]

    @field_validator("FAST_MODEL_CASCADE", mode="before")
    @classmethod
    def parse_fast_model_cascade(cls, v: object) -> list[str]:
        if isinstance(v, str):
            v_str = v.strip()
            if v_str.startswith("[") and v_str.endswith("]"):
                try:
                    parsed = json.loads(v_str)
                    if isinstance(parsed, list):
                        return [str(x).strip() for x in parsed if str(x).strip()]
                except (json.JSONDecodeError, ValueError):
                    pass
            return [x.strip() for x in v_str.split(",") if x.strip()]
        if isinstance(v, list):
            return [str(x).strip() for x in v if str(x).strip()]
        return ["deepinfra/deepseek-ai/DeepSeek-V4.1-Flash-1017"]

    def get_effective_cascade(self, primary_model: str | None = None) -> list[str]:
        """Returns candidate models for fallback, aware of the active provider."""
        p_model = primary_model or self.DEFAULT_TEXT_MODEL
        if self.FAST_MODEL_CASCADE and self.FAST_MODEL_CASCADE != [
            "deepinfra/deepseek-ai/DeepSeek-V4.1-Flash-1017"
        ]:
            return (
                self.FAST_MODEL_CASCADE
                if isinstance(self.FAST_MODEL_CASCADE, list)
                else [self.FAST_MODEL_CASCADE]
            )
        if self.is_anthropic_model(p_model):
            return [p_model]
        return (
            self.FAST_MODEL_CASCADE
            if isinstance(self.FAST_MODEL_CASCADE, list)
            else [self.FAST_MODEL_CASCADE]
        )

    # Blind-Solver Dual Validation Agent
    ENABLE_BLIND_SOLVER: bool = True
    BLIND_SOLVER_CONFIDENCE_THRESHOLD: int = 88
    BLIND_SOLVER_MAX_TOKENS: int = 1200

    # Global Multi-Batch Concurrency & Rate Limiting Controls
    GLOBAL_MAX_CONCURRENT_JOBS: int = 4
    GLOBAL_MAX_CONCURRENT_LLM_CALLS: int = 10
    LLM_MAX_RETRIES: int = 4
    LLM_BASE_BACKOFF_SECONDS: float = 1.5
    # Per-worker retry attempts for individual question generation jobs within a batch
    WORKFLOW_MAX_WORKER_RETRIES: int = 2

    # Production Database Connection Pool Settings
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 30
    DB_POOL_TIMEOUT: int = 60
    DB_POOL_RECYCLE: int = 1800

    model_config = SettingsConfigDict(
        env_file=[str(Path(__file__).resolve().parent.parent.parent.parent / ".env"), ".env"],
        extra="allow",
    )


config = Settings()
