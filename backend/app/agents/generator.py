import json
import logging
from typing import Tuple

from app.agents.base import calculate_token_cost, call_llm, clean_json_text
from app.agents.mock_fixtures import get_mock_draft
from app.agents.prompts import GENERATOR_SYSTEM_PROMPT
from app.schemas.question import OptionChoice, QuestionDraft
from app.schemas.token import TokenUsage
from app.schemas.ucat import UCAT_SECTION_LABELS, UCATSection
from app.schemas.workflow import GenerationRequest

logger = logging.getLogger(__name__)


async def generate_question(req: GenerationRequest) -> tuple[QuestionDraft, TokenUsage]:
    """Invokes the Question Generator Agent to draft a publication-grade UCAT question."""
    section_name = UCAT_SECTION_LABELS.get(req.section, req.section.value)

    user_prompt = f"""Generate an official-caliber UK UCAT Multiple Choice Question with 4 options (A, B, C, D).

Subtest: {section_name}
Subtopic: {req.subtopic or "Core Syllabus Focus"}
Target Difficulty: {req.difficulty.value}
Image Required: {"Yes - formulate visual pattern requirements" if req.require_image or req.section == UCATSection.ABSTRACT_REASONING else "No"}
"""
    if req.combination_id:
        user_prompt += f"\nCombination ID: {req.combination_id}"
    if req.content_domain:
        user_prompt += f"\nContent Domain: {req.content_domain}"
    if req.question_type:
        user_prompt += f"\nQuestion Type Format: {req.question_type}"
    if req.primary_trap:
        user_prompt += f"\nPrimary Distractor Trap to Emphasize: {req.primary_trap}"
    if req.passage_required:
        user_prompt += f"\nPassage Required: {req.passage_required}"
    if req.visual_type and req.visual_type != "None":
        user_prompt += f"\nVisual Stimulus Type: {req.visual_type}"
    if req.custom_prompt:
        user_prompt += f"\nCustom Focus Context: {req.custom_prompt}"

    user_prompt += "\nOutput ONLY valid JSON matching the specified schema."

    try:
        raw_output, usage = await call_llm(
            prompt=user_prompt,
            system_prompt=GENERATOR_SYSTEM_PROMPT,
            model=req.model_name,
            api_key=req.api_key,
            temperature=0.7,
        )
        cleaned = clean_json_text(raw_output)
        data = json.loads(cleaned)

        # Validate options
        options = [OptionChoice(id=opt["id"], text=opt["text"]) for opt in data["options"]]
        if len(options) != 4:
            raise ValueError(f"Expected exactly 4 options, got {len(options)}")

        draft = QuestionDraft(
            stimulus_text=data.get("stimulus_text", ""),
            question_stem=data["question_stem"],
            options=options,
            correct_answer_id=data["correct_answer_id"].upper(),
            explanation=data["explanation"],
            image_needed=data.get(
                "image_needed", req.require_image or req.section == UCATSection.ABSTRACT_REASONING
            ),
            image_prompt_or_type=data.get("image_prompt_or_type"),
        )
        return draft, usage
    except Exception as e:
        logger.warning(f"Generator LLM failed or not configured, using authentic mock draft: {e}")
        mock_p_tokens = 450
        mock_c_tokens = 320
        mock_usage = TokenUsage(
            prompt_tokens=mock_p_tokens,
            completion_tokens=mock_c_tokens,
            total_tokens=mock_p_tokens + mock_c_tokens,
            cost_usd=calculate_token_cost(mock_p_tokens, mock_c_tokens),
        )
        return get_mock_draft(req), mock_usage
