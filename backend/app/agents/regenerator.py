import json
import logging

from app.agents.base import calculate_token_cost, call_llm, clean_json_text
from app.agents.mock_fixtures import improve_draft_heuristically
from app.agents.prompts import REGENERATOR_SYSTEM_PROMPT
from app.schemas.question import OptionChoice, QuestionDraft, ReviewScore
from app.schemas.token import TokenUsage
from app.schemas.ucat import UCAT_SECTION_LABELS
from app.schemas.workflow import GenerationRequest

logger = logging.getLogger(__name__)


async def regenerate_question(
    draft: QuestionDraft, review: ReviewScore, req: GenerationRequest, iteration: int = 2
) -> tuple[QuestionDraft, TokenUsage]:
    """Invokes the Question Re-Generator Agent to refine a draft that scored <= 90."""
    section_name = UCAT_SECTION_LABELS.get(req.section, req.section.value)
    options_formatted = "\n".join([f"{opt.id}: {opt.text}" for opt in draft.options])

    weaknesses_text = (
        "\n".join([f"- {w}" for w in review.weaknesses]) or "General refinement needed"
    )
    recommendations_text = (
        "\n".join([f"- {r}" for r in review.recommendations])
        or "Elevate distractor quality and explanation depth"
    )

    user_prompt = f"""The following candidate UCAT question received a score of {review.total_score}/100 and needs to be re-generated to score > 90.

Section: {section_name}
Subtopic: {req.subtopic or "General"}
Target Difficulty: {req.difficulty.value}
Iteration: {iteration}

--- ORIGINAL CANDIDATE DRAFT ---
Stimulus:
{draft.stimulus_text}

Stem:
{draft.question_stem}

Options:
{options_formatted}

Key: {draft.correct_answer_id}

Explanation:
{draft.explanation}

--- REVIEWER CRITIQUE & DEFICIENCIES ---
Current Total Score: {review.total_score}/100
Weaknesses identified:
{weaknesses_text}

Actionable Recommendations:
{recommendations_text}
---------------------------------------

Please re-generate and refine this question to resolve all weaknesses and produce a publication-grade UCAT question. Output valid JSON only."""

    try:
        raw_output, usage = await call_llm(
            prompt=user_prompt,
            system_prompt=REGENERATOR_SYSTEM_PROMPT,
            model=req.model_name,
            api_key=req.api_key,
            temperature=0.6,
            max_tokens=2000,
        )
        cleaned = clean_json_text(raw_output)
        data = json.loads(cleaned)

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
            keys_list = draft.correct_answer_ids or [options[0].id]

        correct_id_str = ", ".join(keys_list)

        re_draft = QuestionDraft(
            stimulus_text=data.get("stimulus_text", draft.stimulus_text),
            question_stem=data["question_stem"],
            options=options,
            correct_answer_id=correct_id_str,
            correct_answer_ids=keys_list,
            explanation=data["explanation"],
            image_needed=data.get("image_needed", draft.image_needed),
            image_prompt_or_type=data.get("image_prompt_or_type", draft.image_prompt_or_type),
        )
        return re_draft, usage
    except Exception as e:
        logger.warning(
            f"Re-Generator LLM failed or not configured, using heuristic remediation: {e}"
        )
        mock_p_tokens = 510
        mock_c_tokens = 390
        mock_usage = TokenUsage(
            prompt_tokens=mock_p_tokens,
            completion_tokens=mock_c_tokens,
            total_tokens=mock_p_tokens + mock_c_tokens,
            cost_usd=calculate_token_cost(mock_p_tokens, mock_c_tokens),
        )
        return improve_draft_heuristically(draft, review, iteration), mock_usage
