import json
import logging

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

    is_multi = req.interaction_type == "multi_choice"
    option_desc = (
        "4 or 5 options with MULTIPLE correct keys and an explicit stem instruction (e.g. 'Which TWO...', 'Select all that apply')"
        if is_multi
        else "4 options (A, B, C, D) with exactly ONE correct key"
    )

    user_prompt = f"""Generate an official-caliber UK UCAT Multiple Choice Question with {option_desc}.

Subtest: {section_name}
Subtopic: {req.subtopic or "Core Syllabus Focus"}
Target Difficulty: {req.difficulty.value}
Interaction Format: {"Multi-Choice (Multiple Correct Keys)" if is_multi else "Single Choice"}
Image Required: {"Yes - formulate visual pattern requirements" if req.require_image or req.section == UCATSection.ABSTRACT_REASONING else "No"}
"""
    if req.combination_id:
        user_prompt += f"\nCombination ID: {req.combination_id}"
    if req.content_domain:
        user_prompt += f"\nContent Domain: {req.content_domain}"
    if req.question_type:
        user_prompt += f"\nQuestion Type Format: {req.question_type}"
    if req.primary_trap and req.primary_trap != "Automatic":
        user_prompt += f"\nPrimary Distractor Trap to Emphasize: {req.primary_trap}"
    if req.passage_required and str(req.passage_required).lower() in ("yes", "true"):
        user_prompt += "\nPassage Required: Yes - Provide a rigorous, substantive 250-400 word academic or clinical passage with dense data and structured paragraphs."
    elif req.passage_required and str(req.passage_required).lower() in ("no", "false"):
        user_prompt += (
            "\nPassage Required: No - Keep stimulus brief (1-3 sentences or direct vignette)."
        )
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

        # Validate options (4 or 5 allowed)
        options = [OptionChoice(id=opt["id"].upper(), text=opt["text"]) for opt in data["options"]]
        if len(options) not in (4, 5):
            raise ValueError(f"Expected 4 or 5 options, got {len(options)}")

        raw_id = data.get("correct_answer_id")
        raw_ids = data.get("correct_answer_ids")
        if isinstance(raw_ids, list) and raw_ids:
            keys_list = [str(k).strip().upper() for k in raw_ids if str(k).strip()]
        elif isinstance(raw_id, str) and raw_id:
            keys_list = [str(k).strip().upper() for k in raw_id.split(",") if str(k).strip()]
        else:
            keys_list = [options[0].id]

        correct_id_str = ", ".join(keys_list)

        draft = QuestionDraft(
            stimulus_text=data.get("stimulus_text", ""),
            question_stem=data["question_stem"],
            options=options,
            correct_answer_id=correct_id_str,
            correct_answer_ids=keys_list,
            explanation=data["explanation"],
            image_needed=(
                False
                if (
                    req.section in (UCATSection.VERBAL_REASONING, UCATSection.SITUATIONAL_JUDGEMENT)
                    and not req.require_image
                )
                else data.get(
                    "image_needed",
                    req.require_image or req.section == UCATSection.ABSTRACT_REASONING,
                )
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
