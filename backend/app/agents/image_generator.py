import asyncio
import logging
from typing import Any

import httpx

from app.core.config import config
from app.schemas import GenerationRequest, QuestionDraft

logger = logging.getLogger(__name__)


def calculate_flux_image_cost(
    width: int | None = None,
    height: int | None = None,
    iters: int | None = None,
    base_rate: float | None = None,
) -> float:
    """
    Calculates DeepInfra FLUX-1-schnell image generation cost using official formula:
    Price = $0.0005 * (width / 1024) * (height / 1024) * iters
    """
    w = width if width is not None else config.IMAGE_WIDTH
    h = height if height is not None else config.IMAGE_HEIGHT
    it = iters if iters is not None else config.IMAGE_ITERS
    rate = base_rate if base_rate is not None else config.IMAGE_COST_PER_BASE_UNIT
    return round(rate * (w / 1024.0) * (h / 1024.0) * it, 6)


async def call_deepinfra_flux(
    prompt: str,
    width: int,
    height: int,
    iters: int,
    api_key: str,
    model: str | None = None,
) -> str | None:
    """
    Calls DeepInfra API for dedicated AI image generation (default: black-forest-labs/FLUX-1-schnell).
    Supports both native inference endpoint and OpenAI-compatible endpoint with automated retry & backoff.
    """
    model_id = (model or config.DEFAULT_IMAGE_MODEL).replace("deepinfra/", "").strip()
    if not model_id:
        model_id = "black-forest-labs/FLUX-1-schnell"

    max_retries = 2
    for attempt in range(max_retries + 1):
        try:
            async with httpx.AsyncClient(timeout=35.0) as client:
                # 1. Native DeepInfra inference endpoint
                try:
                    native_url = f"https://api.deepinfra.com/v1/inference/{model_id}"
                    payload = {
                        "prompt": prompt,
                        "width": width,
                        "height": height,
                        "num_inference_steps": iters,
                    }
                    res = await client.post(
                        native_url, json=payload, headers={"Authorization": f"Bearer {api_key}"}
                    )
                    if res.status_code == 200:
                        data = res.json()
                        if "images" in data and len(data["images"]) > 0:
                            return data["images"][0]
                        if "output" in data and len(data["output"]) > 0:
                            return data["output"][0]
                    else:
                        logger.warning(
                            f"DeepInfra native FLUX inference status {res.status_code}: {res.text[:200]}"
                        )
                except Exception as e:
                    logger.warning(f"DeepInfra native FLUX inference error: {e}")

                # 2. OpenAI-compatible endpoint on DeepInfra
                try:
                    openai_url = "https://api.deepinfra.com/v1/openai/images/generations"
                    payload = {
                        "model": model_id,
                        "prompt": prompt,
                        "size": f"{width}x{height}",
                        "n": 1,
                    }
                    res = await client.post(
                        openai_url, json=payload, headers={"Authorization": f"Bearer {api_key}"}
                    )
                    if res.status_code == 200:
                        data = res.json()
                        if "data" in data and len(data["data"]) > 0:
                            item = data["data"][0]
                            return item.get("url") or (
                                f"data:image/jpeg;base64,{item.get('b64_json')}"
                                if item.get("b64_json")
                                else None
                            )
                    else:
                        logger.warning(
                            f"DeepInfra OpenAI-compatible FLUX status {res.status_code}: {res.text[:200]}"
                        )
                except Exception as e:
                    logger.warning(f"DeepInfra OpenAI-compatible FLUX endpoint error: {e}")

        except Exception as client_err:
            logger.warning(
                f"HTTP client error in FLUX call (attempt {attempt + 1}/{max_retries + 1}): {client_err}"
            )

        if attempt < max_retries:
            backoff_secs = 1.0 * (attempt + 1)
            logger.info(f"Retrying AI image model generation in {backoff_secs}s...")
            await asyncio.sleep(backoff_secs)

    logger.error(f"AI image model ({model_id}) generation failed after {max_retries + 1} attempts.")
    return None


def generate_abstract_reasoning_svg(title: str = "Abstract Reasoning - Pattern Sets") -> str:
    """Generates an authentic, crisp light-mode SVG diagram for Abstract Reasoning Set A / Set B."""
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 340" width="100%" height="100%" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;">
  <defs>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.08"/>
    </filter>
  </defs>

  <!-- Title Bar -->
  <text x="380" y="32" fill="#0f172a" font-size="13" font-weight="700" text-anchor="middle" letter-spacing="1">UK UCAT ABSTRACT REASONING: SET A vs SET B</text>

  <!-- SET A CONTAINER -->
  <g transform="translate(30, 48)" filter="url(#softShadow)">
    <rect width="210" height="235" rx="10" fill="#f8fafc" stroke="#0284c7" stroke-width="2" />
    <rect x="0" y="0" width="210" height="34" rx="8" fill="#0284c7" />
    <text x="105" y="23" fill="#ffffff" font-size="13" font-weight="700" text-anchor="middle" letter-spacing="0.5">SET A</text>
    
    <!-- Set A shapes: 2 filled blue circles, 3 hollow dark triangles -->
    <circle cx="55" cy="85" r="16" fill="#0284c7" stroke="#0369a1" stroke-width="1.5" />
    <circle cx="155" cy="85" r="16" fill="#0284c7" stroke="#0369a1" stroke-width="1.5" />
    <polygon points="65,185 90,140 115,185" fill="#ffffff" stroke="#1e293b" stroke-width="2.5" />
    <polygon points="125,200 145,160 165,200" fill="#ffffff" stroke="#1e293b" stroke-width="2.5" />
    <polygon points="150,145 170,110 190,145" fill="#ffffff" stroke="#1e293b" stroke-width="2.5" />
    <text x="105" y="252" fill="#64748b" font-size="11" font-weight="600" text-anchor="middle">Rule: 2 Filled Circles, 3 Hollow Triangles</text>
  </g>

  <!-- SET B CONTAINER -->
  <g transform="translate(275, 48)" filter="url(#softShadow)">
    <rect width="210" height="235" rx="10" fill="#f8fafc" stroke="#7c3aed" stroke-width="2" />
    <rect x="0" y="0" width="210" height="34" rx="8" fill="#7c3aed" />
    <text x="105" y="23" fill="#ffffff" font-size="13" font-weight="700" text-anchor="middle" letter-spacing="0.5">SET B</text>
    
    <!-- Set B shapes: 3 filled violet circles, 2 hollow dark triangles -->
    <circle cx="48" cy="85" r="14" fill="#7c3aed" stroke="#6d28d9" stroke-width="1.5" />
    <circle cx="105" cy="80" r="14" fill="#7c3aed" stroke="#6d28d9" stroke-width="1.5" />
    <circle cx="162" cy="85" r="14" fill="#7c3aed" stroke="#6d28d9" stroke-width="1.5" />
    <polygon points="65,185 90,140 115,185" fill="#ffffff" stroke="#1e293b" stroke-width="2.5" />
    <polygon points="130,190 155,145 180,190" fill="#ffffff" stroke="#1e293b" stroke-width="2.5" />
    <text x="105" y="252" fill="#64748b" font-size="11" font-weight="600" text-anchor="middle">Rule: 3 Filled Circles, 2 Hollow Triangles</text>
  </g>

  <!-- TEST SHAPE CONTAINER -->
  <g transform="translate(520, 48)" filter="url(#softShadow)">
    <rect width="210" height="235" rx="10" fill="#f0fdf4" stroke="#059669" stroke-width="2.5" stroke-dasharray="6,4" />
    <rect x="0" y="0" width="210" height="34" rx="8" fill="#059669" />
    <text x="105" y="23" fill="#ffffff" font-size="13" font-weight="700" text-anchor="middle" letter-spacing="0.5">TEST SHAPE</text>
    
    <!-- Test Shape: 2 filled circles, 3 hollow triangles -->
    <circle cx="65" cy="88" r="16" fill="#0284c7" stroke="#0369a1" stroke-width="1.5" />
    <circle cx="145" cy="88" r="16" fill="#0284c7" stroke="#0369a1" stroke-width="1.5" />
    <polygon points="55,185 80,140 105,185" fill="#ffffff" stroke="#1e293b" stroke-width="2.5" />
    <polygon points="110,195 130,155 150,195" fill="#ffffff" stroke="#1e293b" stroke-width="2.5" />
    <polygon points="140,152 160,117 180,152" fill="#ffffff" stroke="#1e293b" stroke-width="2.5" />
    <text x="105" y="252" fill="#059669" font-size="12" font-weight="700" text-anchor="middle">Which Set does this belong to?</text>
  </g>
</svg>"""


def generate_venn_diagram_svg(title: str = "Decision Making - Set Deductions") -> str:
    """Generates an authentic light-mode Venn diagram for Decision Making syllogisms."""
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 320" width="100%" height="100%" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;">
  <text x="340" y="32" fill="#0f172a" font-size="13" font-weight="700" text-anchor="middle" letter-spacing="1">LOGICAL DEDUCTIONS &amp; SET RELATIONSHIPS</text>

  <!-- Left Set: Neurologists -->
  <circle cx="250" cy="170" r="95" fill="#e0f2fe" fill-opacity="0.8" stroke="#0284c7" stroke-width="2.5" />
  <text x="210" y="145" fill="#0369a1" font-size="13" font-weight="700">Neurologists</text>
  <text x="210" y="165" fill="#0284c7" font-size="11" font-weight="600">(All are MRI</text>
  <text x="210" y="180" fill="#0284c7" font-size="11" font-weight="600">certified)</text>

  <!-- Right Set: Psychometric Administrators -->
  <circle cx="430" cy="170" r="95" fill="#ffe4e6" fill-opacity="0.8" stroke="#e11d48" stroke-width="2.5" />
  <text x="440" y="145" fill="#be123c" font-size="13" font-weight="700">Psychometric</text>
  <text x="440" y="165" fill="#e11d48" font-size="11" font-weight="600">Administrators</text>

  <!-- Middle Separation Symbol (Disjoint) -->
  <line x1="340" y1="90" x2="340" y2="250" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="6,6" />
  <rect x="295" y="155" width="90" height="30" rx="6" fill="#ffffff" stroke="#dc2626" stroke-width="2" />
  <text x="340" y="175" fill="#dc2626" font-size="12" font-weight="700" text-anchor="middle">DISJOINT</text>

  <!-- Clinical GMC Note -->
  <text x="340" y="295" fill="#64748b" font-size="11" font-weight="500" text-anchor="middle">No Neurologist (MRI Certified) may administer psychometric battery tests.</text>
</svg>"""


def generate_quantitative_chart_svg(title: str = "Dosage & Volume Distribution") -> str:
    """Generates an authentic light-mode clinical dosage table visual for Quantitative Reasoning."""
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 300" width="100%" height="100%" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;">
  <text x="340" y="32" fill="#0f172a" font-size="13" font-weight="700" text-anchor="middle" letter-spacing="1">CLINICAL DOSAGE &amp; INFUSION SCHEDULE</text>

  <!-- Data Grid Container -->
  <g transform="translate(60, 56)">
    <!-- Header Row -->
    <rect x="0" y="0" width="560" height="38" rx="6" fill="#f1f5f9" stroke="#e2e8f0" />
    <text x="20" y="24" fill="#0284c7" font-size="12" font-weight="700">PARAMETER</text>
    <text x="240" y="24" fill="#0284c7" font-size="12" font-weight="700">CLINICAL VALUE</text>
    <text x="420" y="24" fill="#0284c7" font-size="12" font-weight="700">FORMULA REF</text>

    <!-- Row 1 -->
    <rect x="0" y="44" width="560" height="36" fill="#ffffff" stroke="#e2e8f0" />
    <text x="20" y="67" fill="#1e293b" font-size="12">Patient Weight</text>
    <text x="240" y="67" fill="#0f172a" font-weight="700" font-size="12">72 kg</text>
    <text x="420" y="67" fill="#64748b" font-size="11">Standard adult metric</text>

    <!-- Row 2 -->
    <rect x="0" y="84" width="560" height="36" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="20" y="107" fill="#1e293b" font-size="12">Daily Prescribed Dosage</text>
    <text x="240" y="107" fill="#059669" font-weight="700" font-size="12">15 mg / kg / day</text>
    <text x="420" y="107" fill="#64748b" font-size="11">Total: 1,080 mg/day</text>

    <!-- Row 3 -->
    <rect x="0" y="124" width="560" height="36" fill="#ffffff" stroke="#e2e8f0" />
    <text x="20" y="147" fill="#1e293b" font-size="12">Infusion Interval</text>
    <text x="240" y="147" fill="#0f172a" font-weight="600" font-size="12">Every 8 hours (3 equal doses)</text>
    <text x="420" y="147" fill="#64748b" font-size="11">360 mg / dose</text>

    <!-- Row 4 -->
    <rect x="0" y="164" width="560" height="36" fill="#f8fafc" stroke="#e2e8f0" />
    <text x="20" y="187" fill="#1e293b" font-size="12">Stock Concentration</text>
    <text x="240" y="187" fill="#d97706" font-weight="700" font-size="12">500 mg in 20 mL vial</text>
    <text x="420" y="187" fill="#64748b" font-size="11">25 mg / mL</text>
  </g>
</svg>"""


async def generate_image_stimulus(
    draft: QuestionDraft, req: GenerationRequest
) -> tuple[str | None, str | None, str | None, dict[str, Any]]:
    """
    Invokes the Image Generator Agent strictly using the AI Image Model (FLUX-1-schnell via DeepInfra).
    Strict policy: Never uses SVG mock fallbacks. Returns: (image_url, None, image_description, usage_dict).
    """
    width = config.IMAGE_WIDTH
    height = config.IMAGE_HEIGHT
    iters = config.IMAGE_ITERS
    model_id = (
        config.DEFAULT_IMAGE_MODEL.replace("deepinfra/", "").strip()
        or "black-forest-labs/FLUX-1-schnell"
    )

    if not config.DEEPINFRA_API_KEY:
        logger.error(
            "AI Gateway Key is not configured. Strict image generation policy prohibits SVG mock fallbacks."
        )
        error_usage = {
            "agent_name": "Image Generator",
            "model": model_id,
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
            "cost_usd": 0.0,
            "details": {
                "error": "AI Gateway Key is not configured. Visual stimuli strictly require an active AI image engine.",
                "type": "error",
            },
        }
        return (None, None, None, error_usage)

    prompt_for_image = (
        draft.image_prompt_or_type
        or f"UK UCAT clinical medical aptitude exam stimulus diagram for {req.section.value}: {draft.question_stem}"
    )
    flux_prompt = (
        f"Medical educational test diagram on clean white background, high contrast, "
        f"clear labeling for UK UCAT medical test: {prompt_for_image}"
    )
    logger.info(f"Generating AI image with {model_id} ({width}x{height}, {iters} iters)...")

    img_data = await call_deepinfra_flux(
        prompt=flux_prompt,
        width=width,
        height=height,
        iters=iters,
        api_key=config.DEEPINFRA_API_KEY,
        model=model_id,
    )

    if img_data:
        cost = calculate_flux_image_cost(width, height, iters)
        usage_dict = {
            "agent_name": "Image Generator",
            "model": model_id,
            "prompt_tokens": 0,
            "completion_tokens": 0,
            "total_tokens": 0,
            "cost_usd": cost,
            "details": {
                "provider": "deepinfra",
                "width": width,
                "height": height,
                "iters": iters,
                "cost_formula": "$0.0005 * (width/1024) * (height/1024) * iters",
                "type": "ai_generated_image",
            },
        }
        return (img_data, None, prompt_for_image, usage_dict)

    # If call_deepinfra_flux returns None after all retries:
    logger.error(
        f"AI Image Model ({model_id}) failed to generate an image. Strictly returning failure without SVG mock fallback."
    )
    failure_usage = {
        "agent_name": "Image Generator",
        "model": model_id,
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "total_tokens": 0,
        "cost_usd": 0.0,
        "details": {
            "error": f"Failed to generate image via {model_id} after retries.",
            "type": "error",
        },
    }
    return (None, None, prompt_for_image, failure_usage)
