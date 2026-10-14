import json
import logging
import os
import re
from typing import Any, Dict, Optional, Tuple

import litellm

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
    else:
        # Try to locate the outermost { ... }
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            text = text[start : end + 1]

    return text


def calculate_token_cost(prompt_tokens: int, completion_tokens: int) -> float:
    """
    Calculate USD expenditure based on exact DeepInfra rates:
    - Input: $0.10 / 1M tokens ($0.00000010 per token)
    - Output: $0.32 / 1M tokens ($0.00000032 per token)
    """
    in_rate = config.COST_PER_MILLION_INPUT_TOKENS
    out_rate = config.COST_PER_MILLION_OUTPUT_TOKENS

    in_cost = (prompt_tokens / 1_000_000.0) * in_rate
    out_cost = (completion_tokens / 1_000_000.0) * out_rate
    return round(in_cost + out_cost, 7)


async def call_llm(
    prompt: str,
    system_prompt: str,
    model: str | None = None,
    api_key: str | None = None,
    temperature: float = 0.7,
    max_tokens: int = 2500,
) -> tuple[str, TokenUsage]:
    """Universal LLM caller via LiteLLM returning content and TokenUsage metrics."""
    chosen_model = model or config.DEFAULT_TEXT_MODEL

    # Configure API key in litellm or environment
    kwargs: dict[str, Any] = {
        "model": chosen_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    if api_key:
        kwargs["api_key"] = api_key
    elif "deepinfra" in chosen_model.lower():
        effective_key = config.DEEPINFRA_API_KEY or os.getenv("DEEPINFRA_API_KEY")
        if not effective_key:
            raise ValueError(
                "DeepInfra API Key is required. Please configure it in Settings or set DEEPINFRA_API_KEY in your .env file."
            )
        kwargs["api_key"] = effective_key
    elif "gemini" in chosen_model.lower() and config.GEMINI_API_KEY:
        kwargs["api_key"] = config.GEMINI_API_KEY
    elif (
        "gpt" in chosen_model.lower() or "openai" in chosen_model.lower()
    ) and config.OPENAI_API_KEY:
        kwargs["api_key"] = config.OPENAI_API_KEY
    elif "claude" in chosen_model.lower() and config.ANTHROPIC_API_KEY:
        kwargs["api_key"] = config.ANTHROPIC_API_KEY
    elif "groq" in chosen_model.lower() and config.GROQ_API_KEY:
        kwargs["api_key"] = config.GROQ_API_KEY
    else:
        # Check if environment already has relevant key
        has_env_key = (
            os.getenv("DEEPINFRA_API_KEY")
            or os.getenv("GEMINI_API_KEY")
            or os.getenv("OPENAI_API_KEY")
            or os.getenv("ANTHROPIC_API_KEY")
            or os.getenv("GROQ_API_KEY")
        )
        if not has_env_key:
            raise ValueError(
                f"No API key configured for {chosen_model}. Please set in Settings or .env"
            )

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
