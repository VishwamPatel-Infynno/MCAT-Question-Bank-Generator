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


def _resolve_api_key(model: str, explicit_key: str | None) -> str:
    """
    Resolves the DeepInfra API key.

    Priority order:
    1. Explicitly passed ``explicit_key`` (caller override)
    2. DeepInfra key from Settings (loaded from .env)
    3. Ambient DEEPINFRA_API_KEY environment variable
    4. Raises ValueError if no DeepInfra key is configured.

    Args:
        model: The litellm model string, e.g. ``deepinfra/deepseek-ai/…``.
        explicit_key: Caller-supplied API key override, or ``None``.

    Returns:
        Resolved DeepInfra API key string.
    """
    if explicit_key:
        return explicit_key

    key = config.DEEPINFRA_API_KEY or os.getenv("DEEPINFRA_API_KEY")
    if not key:
        raise ValueError(
            "AI Gateway API Key is required. Please configure it in Settings or set the server environment key."
        )
    return key


def _get_available_fallback_models(primary_model: str) -> list[str]:
    """Builds an ordered list of candidate models for which valid API credentials exist."""
    candidates = [primary_model]
    for model_name in config.FAST_MODEL_CASCADE:
        if model_name != primary_model and model_name not in candidates:
            try:
                if _resolve_api_key(model_name, None):
                    candidates.append(model_name)
            except Exception:
                continue
    return candidates


async def call_llm(
    prompt: str,
    system_prompt: str,
    model: str | None = None,
    api_key: str | None = None,
    temperature: float | None = None,
    max_tokens: int | None = None,
) -> tuple[str, TokenUsage]:
    """Universal LLM caller via LiteLLM targeting DeepInfra models."""
    initial_model = model or config.DEFAULT_TEXT_MODEL
    effective_max_tokens = max_tokens if max_tokens is not None else config.DEFAULT_MAX_TOKENS
    effective_temperature = temperature if temperature is not None else config.DEFAULT_TEMPERATURE

    # If caller explicitly provided an api_key, stick to that specific model
    candidate_models = [initial_model] if api_key else _get_available_fallback_models(initial_model)

    last_error: Exception | None = None

    for candidate in candidate_models:
        try:
            resolved_key = _resolve_api_key(candidate, api_key)
        except Exception as key_err:
            last_error = key_err
            continue

        kwargs: dict[str, Any] = {
            "model": candidate,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt},
            ],
            "temperature": effective_temperature,
            "max_tokens": effective_max_tokens,
            "request_timeout": 60.0,
            "num_retries": 1,
        }
        if resolved_key:
            kwargs["api_key"] = resolved_key

        try:
            response = await litellm.acompletion(**kwargs)
            content = response.choices[0].message.content

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
                f"LLM Call Succeeded [{candidate}]: {prompt_tokens} in + {completion_tokens} out = {total_tokens} tokens (${cost_usd:.5f})"
            )
            return content, usage
        except Exception as err:
            logger.warning(
                f"DeepInfra LLM error on model '{candidate}': {err}. Attempting candidate retry..."
            )
            last_error = err

    logger.error(f"DeepInfra LLM call failed for prompt. Last error: {last_error}")
    if isinstance(last_error, ValueError):
        raise last_error
    raise RuntimeError(
        f"AI Generation Failed: DeepInfra model unreachable or encountered errors. Details: {last_error}"
    )
