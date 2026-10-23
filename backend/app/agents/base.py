import json
import logging
import os
import re
from typing import Any

import litellm

try:
    import json_repair
except ImportError:
    json_repair = None

from app.core.config import config
from app.schemas import TokenUsage

logger = logging.getLogger(__name__)

# Configure litellm behavior
litellm.suppress_debug_info = True


def clean_json_text(text: str) -> str:
    """Extract and sanitize JSON from model output that might contain markdown fences or extra text."""
    text = text.strip()

    # Check for markdown code fences
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
    if fence_match:
        text = fence_match.group(1).strip()
    elif text.startswith("```"):
        lines = text.splitlines()
        if len(lines) > 1 and lines[0].startswith("```"):
            text = "\n".join(lines[1:]).strip()

    # Try to locate the outermost { ... } or [ ... ]
    start_brace = text.find("{")
    start_bracket = text.find("[")

    if start_brace != -1 and (start_bracket == -1 or start_brace < start_bracket):
        end_brace = text.rfind("}")
        if end_brace != -1 and end_brace > start_brace:
            text = text[start_brace : end_brace + 1]
    elif start_bracket != -1:
        end_bracket = text.rfind("]")
        if end_bracket != -1 and end_bracket > start_bracket:
            text = text[start_bracket : end_bracket + 1]

    return text


def safe_json_loads(text: str) -> Any:
    """
    Safely parses JSON from LLM outputs with multi-stage resilient parsing:
    1. Standard json.loads with strict=False (handles unescaped control characters like literal \\n and \\t inside strings)
    2. json_repair on cleaned text (fixes missing quotes, unescaped quotes, trailing commas, truncated brackets)
    3. json_repair on raw uncleaned text
    4. Sanitization of non-printable control characters (< 0x20 except \\t, \\n, \\r) with strict=False retry
    """
    cleaned = clean_json_text(text)

    # 1. Primary: json.loads with strict=False
    try:
        return json.loads(cleaned, strict=False)
    except Exception as e1:
        # 2. Resilient fallback: json_repair
        if json_repair is not None:
            try:
                res = json_repair.loads(cleaned)
                if isinstance(res, (dict, list)) and res:
                    return res
            except Exception:
                pass

            try:
                res = json_repair.loads(text)
                if isinstance(res, (dict, list)) and res:
                    return res
            except Exception:
                pass

        # 3. Clean low ASCII control characters (0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F) and retry
        try:
            sanitized = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", cleaned)
            return json.loads(sanitized, strict=False)
        except Exception:
            pass

        raise e1


def calculate_token_cost(prompt_tokens: int, completion_tokens: int) -> float:
    """
    Calculate USD expenditure based on exact DeepInfra rates:
    - Input: $0.098 / 1M tokens ($0.000000098 per token)
    - Output: $0.294 / 1M tokens ($0.000000294 per token)
    """
    in_rate = config.COST_PER_MILLION_INPUT_TOKENS
    out_rate = config.COST_PER_MILLION_OUTPUT_TOKENS

    in_cost = (prompt_tokens / 1_000_000.0) * in_rate
    out_cost = (completion_tokens / 1_000_000.0) * out_rate
    return round(in_cost + out_cost, 7)


def _resolve_api_key(model: str, explicit_key: str | None) -> str | None:
    """
    Resolves the correct API key for the given model identifier.

    Priority order:
    1. Explicitly passed ``explicit_key`` (caller override)
    2. Provider-specific key from Settings (loaded from .env)
    3. Ambient environment key already set (litellm picks it up)
    4. Raises ValueError if no key is available for models that require one.

    Args:
        model: The litellm model string, e.g. ``deepinfra/deepseek-ai/…``.
        explicit_key: Caller-supplied API key override, or ``None``.

    Returns:
        Resolved API key string, or ``None`` if litellm should use its ambient env key.
    """
    if explicit_key:
        return explicit_key

    model_lower = model.lower()

    if "deepinfra" in model_lower:
        key = config.DEEPINFRA_API_KEY or os.getenv("DEEPINFRA_API_KEY")
        if not key:
            raise ValueError(
                "AI Gateway API Key is required. Please configure it in Settings or set the server environment key."
            )
        return key

    if "gemini" in model_lower and config.GEMINI_API_KEY:
        return config.GEMINI_API_KEY

    if ("gpt" in model_lower or "openai" in model_lower) and config.OPENAI_API_KEY:
        return config.OPENAI_API_KEY

    if "claude" in model_lower and config.ANTHROPIC_API_KEY:
        return config.ANTHROPIC_API_KEY

    if "groq" in model_lower and config.GROQ_API_KEY:
        return config.GROQ_API_KEY

    # Fall through — check if any ambient env key exists; if not, raise
    has_env_key = (
        os.getenv("DEEPINFRA_API_KEY")
        or os.getenv("GEMINI_API_KEY")
        or os.getenv("OPENAI_API_KEY")
        or os.getenv("ANTHROPIC_API_KEY")
        or os.getenv("GROQ_API_KEY")
    )
    if not has_env_key:
        raise ValueError(
            f"No API key configured for {model}. Please set in Settings or .env"
        )
    return None


async def call_llm(
    prompt: str,
    system_prompt: str,
    model: str | None = None,
    api_key: str | None = None,
    temperature: float = 0.7,
    max_tokens: int | None = None,
) -> tuple[str, TokenUsage]:
    """Universal LLM caller via LiteLLM returning content and TokenUsage metrics."""
    chosen_model = model or config.DEFAULT_TEXT_MODEL
    effective_max_tokens = max_tokens if max_tokens is not None else config.DEFAULT_MAX_TOKENS

    # Configure API key in litellm or environment
    kwargs: dict[str, Any] = {
        "model": chosen_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "temperature": temperature,
        "max_tokens": effective_max_tokens,
        "request_timeout": 90.0,
        "num_retries": 2,
    }

    resolved_key = _resolve_api_key(chosen_model, api_key)
    if resolved_key:
        kwargs["api_key"] = resolved_key

    try:
        response = await litellm.acompletion(**kwargs)
        content = response.choices[0].message.content

        # Extract token usage
        usage_obj = getattr(response, "usage", None)
        prompt_tokens = int(getattr(usage_obj, "prompt_tokens", 0) or 0)
        completion_tokens = int(getattr(usage_obj, "completion_tokens", 0) or 0)
        total_tokens = int(
            getattr(usage_obj, "total_tokens", prompt_tokens + completion_tokens)
            or (prompt_tokens + completion_tokens)
        )

        cost_usd = calculate_token_cost(prompt_tokens, completion_tokens)
        usage = TokenUsage(
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens,
            cost_usd=cost_usd,
        )
        logger.info(
            f"LLM Call [{chosen_model}]: {prompt_tokens} in + {completion_tokens} out = {total_tokens} tokens (${cost_usd:.5f})"
        )
        return content, usage
    except Exception as e:
        logger.warning(f"LiteLLM call error on model {chosen_model}: {str(e)}")
        raise e
