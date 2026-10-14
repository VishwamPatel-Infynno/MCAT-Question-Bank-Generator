import json
import logging
from typing import Tuple

from app.schemas.ucat import UCAT_SECTION_LABELS
from app.schemas.question import QuestionDraft, ReviewScore
from app.schemas.token import TokenUsage
from app.schemas.workflow import GenerationRequest
from app.agents.base import call_llm, clean_json_text, calculate_token_cost
from app.agents.prompts import REVIEWER_SYSTEM_PROMPT
from app.agents.mock_fixtures import evaluate_heuristically

logger = logging.getLogger(__name__)

async def review_question(
    draft: QuestionDraft,
    req: GenerationRequest,
    iteration: int = 1
) -> Tuple[ReviewScore, TokenUsage]:
    """Invokes the Question Reviewer Agent to score a candidate draft against the 100-point rubric."""
    section_name = UCAT_SECTION_LABELS.get(req.section, req.section.value)
    options_formatted = "\n".join([f"{opt.id}: {opt.text}" for opt in draft.options])
    
    user_prompt = f"""Review the following candidate UK UCAT Multiple Choice Question:

Metadata:
- Subtest: {section_name}
- Subtopic: {req.subtopic or 'General'}
- Target Difficulty: {req.difficulty.value}
- Iteration Attempt: {iteration}

--- CANDIDATE QUESTION ---
Stimulus:
{draft.stimulus_text}

Question Stem:
{draft.question_stem}

Options:
{options_formatted}

Correct Answer Key:
{draft.correct_answer_id}

Explanation:
{draft.explanation}
--------------------------
Evaluate this question thoroughly and return your 100-point rubric breakdown as JSON."""

    try:
        raw_output, usage = await call_llm(
            prompt=user_prompt,
            system_prompt=REVIEWER_SYSTEM_PROMPT,
            model=req.model_name,
            api_key=req.api_key,
            temperature=0.3
        )
        cleaned = clean_json_text(raw_output)
        data = json.loads(cleaned)
        
        auth = int(data["authenticity_score"])
        clarity = int(data["clarity_score"])
        distractor = int(data["distractor_score"])
        explanation = int(data["explanation_score"])
        total = auth + clarity + distractor + explanation
        
        passed = total > 90
        
        review = ReviewScore(
            authenticity_score=auth,
            clarity_score=clarity,
            distractor_score=distractor,
            explanation_score=explanation,
            total_score=total,
            strengths=data.get("strengths", []),
            weaknesses=data.get("weaknesses", []),
            recommendations=data.get("recommendations", []),
            passed=passed
        )
        return review, usage
    except Exception as e:
        logger.warning(f"Reviewer LLM failed or not configured, using heuristic review: {e}")
        mock_p_tokens = 380
        mock_c_tokens = 210
        mock_usage = TokenUsage(
            prompt_tokens=mock_p_tokens,
            completion_tokens=mock_c_tokens,
            total_tokens=mock_p_tokens + mock_c_tokens,
            cost_usd=calculate_token_cost(mock_p_tokens, mock_c_tokens)
        )
        return evaluate_heuristically(draft, req, iteration), mock_usage
