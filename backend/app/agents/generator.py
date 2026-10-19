import json
import logging

from app.agents.base import calculate_token_cost, call_llm, clean_json_text
from app.agents.mock_fixtures import evaluate_heuristically, get_mock_draft
from app.agents.prompts import FUSED_GENERATOR_SYSTEM_PROMPT, GENERATOR_SYSTEM_PROMPT
from app.schemas.question import OptionChoice, QuestionDraft, ReviewScore
from app.schemas.token import TokenUsage
from app.schemas.ucat import UCAT_SECTION_LABELS, UCATSection
from app.schemas.workflow import GenerationRequest

logger = logging.getLogger(__name__)


def _build_generator_user_prompt(req: GenerationRequest, fused: bool = False) -> str:
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

    # Handle pre-existing shared passage (Single Passage Set) vs new passage
    if req.shared_stimulus and req.shared_stimulus.strip():
        user_prompt += f"""\nCRITICAL PASSAGE INSTRUCTION:
You MUST formulate this question strictly and exclusively based on the following PRE-EXISTING READING PASSAGE.
Do NOT write a new passage. Formulate your question stem, options, correct key(s), and explanation directly against this text:
---
{req.shared_stimulus.strip()}
---"""
    elif req.passage_required and str(req.passage_required).lower() in ("yes", "true"):
        user_prompt += "\nPassage Required: Yes - Provide a rigorous, substantive 250-400 word academic or clinical passage with dense data and structured paragraphs."
    elif req.passage_required and str(req.passage_required).lower() in ("no", "false"):
        user_prompt += (
            "\nPassage Required: No - Keep stimulus brief (1-3 sentences or direct vignette)."
        )

    if req.visual_type and req.visual_type != "None":
        user_prompt += f"\nVisual Stimulus Type: {req.visual_type}"
    if req.custom_prompt:
        user_prompt += f"\nCustom Focus Context: {req.custom_prompt}"

    if fused:
        user_prompt += (
            "\nCRITICAL SELF-CRITIQUE INSTRUCTION:\n"
            "After composing the question, options, and explanation, perform an immediate, strict psychometric self-critique.\n"
            "Fill the 'self_critique' object with 0-25 point scores for authenticity, clarity, distractor quality, and explanation.\n"
            "Output ONLY valid JSON matching the specified fused schema."
        )
    else:
        user_prompt += "\nOutput ONLY valid JSON matching the specified schema."

    return user_prompt


def _parse_question_draft_data(data: dict, req: GenerationRequest) -> QuestionDraft:
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

    # If a shared stimulus passage was provided, enforce it on the draft
    effective_stimulus = req.shared_stimulus.strip() if req.shared_stimulus else data.get("stimulus_text", "")

    return QuestionDraft(
        stimulus_text=effective_stimulus,
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


async def generate_passage_stimulus(req: GenerationRequest) -> tuple[str, TokenUsage]:
    """Generates a standalone, publication-caliber 250-400 word UK UCAT academic/clinical reading passage."""
    section_name = UCAT_SECTION_LABELS.get(req.section, req.section.value)
    domain = req.content_domain or "Clinical & Medical Sciences"
    topic = req.subtopic or "Evidence-Based Clinical Practice & Biomedical Research"

    prompt = f"""Generate a high-yield, authentic UK UCAT Academic Reading Passage for {section_name}.
Content Domain: {domain}
Topic Focus: {topic}
Difficulty Calibration: {req.difficulty.value}
Target Length: 280 to 380 words.

STANDARDS FOR UK UCAT PASSAGES:
1. Dense, formal, intellectual academic register using flawless British English (e.g. randomised, paediatric, categorise).
2. Well-structured in 3 to 4 distinct paragraphs.
3. Contains nuanced factual claims, quantitative research figures/percentages, contrasting scientific hypotheses, and clinical or ethical considerations.
4. Provides rich material for multiple distinct reasoning questions (e.g. direct fact retrieval, negative inferences, syllogisms, and author tone).
5. DO NOT include questions, multiple choices, or answers in this output. Output ONLY the pure reading passage text."""

    system_prompt = (
        "You are a Senior UCAT Lead Passage Author for the official UK medical admissions consortium. "
        "Write authoritative, dense, high-caliber reading passages suitable for university medical and dental applicants."
    )

    try:
        raw_output, usage = await call_llm(
            prompt=prompt,
            system_prompt=system_prompt,
            model=req.model_name,
            api_key=req.api_key,
            temperature=0.7,
            max_tokens=2000,
        )
        cleaned = raw_output.strip()
        # Clean any accidental markdown or quotes
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            cleaned = "\n".join(lines[1:-1] if lines[-1].strip().startswith("```") else lines[1:])
        cleaned = cleaned.strip('" \n')
        return cleaned, usage
    except Exception as e:
        logger.warning(f"Passage generation LLM failed or not configured, using authentic fallback passage: {e}")
        fallback_passage = (
            "The emergence of multidrug-resistant pathogens represents one of the most critical threats to modern global public health, "
            "with antimicrobial resistance (AMR) directly implicated in an estimated 1.27 million deaths globally in 2019. In response, "
            "clinical guidelines across UK NHS trusts have increasingly prioritized antimicrobial stewardship programmes (ASPs), "
            "aiming to restrict empirical usage of broad-spectrum carbapenems and fluoroquinolones while optimizing targeted therapy. "
            "However, implementation across secondary care environments reveals significant operational friction between protocol adherence "
            "and clinician autonomy in acutely decompensating patients.\n\n"
            "A prospective multi-centre audit of 820 adult acute medical admissions investigated the efficacy of rapid biomarker-guided prescribing, "
            "specifically utilizing quantitative serum procalcitonin (PCT) assays alongside point-of-care multiplex polymerase chain reaction (PCR) platforms. "
            "Baseline PCT concentrations below 0.25 ng/mL demonstrated a negative predictive value of 93.8% for invasive bacterial infections, "
            "permitting early antibiotic cessation in 44% of culture-negative presentations within 36 hours. Furthermore, 30-day all-cause mortality "
            "did not differ significantly between protocol-compliant wards (6.2%) and control cohorts receiving standard care (6.8%, p = 0.58), "
            "suggesting that biomarker-guided de-escalation does not compromise patient survival.\n\n"
            "Despite these objective clinical outcomes, semi-structured interviews with attending medical consultants highlighted persistent "
            "reluctance to withdraw antimicrobial coverage in patients demonstrating persistent systemic inflammatory response syndrome (SIRS) criteria, "
            "even when serial blood cultures and microbiological swabs yielded no identifiable pathogen at 48 hours. Clinicians frequently cited "
            "diagnostic anxiety and institutional fear of rapid septic deterioration as paramount factors overruling algorithmic recommendations. "
            "Consequently, while technological diagnostics offer robust diagnostic discrimination, institutional culture and risk aversion continue "
            "to dictate empirical prescribing behaviours in acute clinical settings."
        )
        mock_p_tokens = 380
        mock_c_tokens = 290
        mock_usage = TokenUsage(
            prompt_tokens=mock_p_tokens,
            completion_tokens=mock_c_tokens,
            total_tokens=mock_p_tokens + mock_c_tokens,
            cost_usd=calculate_token_cost(mock_p_tokens, mock_c_tokens),
        )
        return fallback_passage, mock_usage


async def generate_question(req: GenerationRequest) -> tuple[QuestionDraft, TokenUsage]:
    """Invokes the Question Generator Agent to draft a publication-grade UCAT question."""
    user_prompt = _build_generator_user_prompt(req, fused=False)

    try:
        raw_output, usage = await call_llm(
            prompt=user_prompt,
            system_prompt=GENERATOR_SYSTEM_PROMPT,
            model=req.model_name,
            api_key=req.api_key,
            temperature=0.7,
            max_tokens=2000,
        )
        cleaned = clean_json_text(raw_output)
        data = json.loads(cleaned)
        draft = _parse_question_draft_data(data, req)
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
        mock_draft = get_mock_draft(req)
        if req.shared_stimulus:
            mock_draft.stimulus_text = req.shared_stimulus.strip()
        return mock_draft, mock_usage


async def generate_question_with_self_critique(
    req: GenerationRequest,
) -> tuple[QuestionDraft, ReviewScore | None, TokenUsage]:
    """
    Fused Draft-and-Critique generator:
    Generates the candidate question AND scores it with the 100-point rubric
    in a single LLM round-trip.
    """
    user_prompt = _build_generator_user_prompt(req, fused=True)

    try:
        raw_output, usage = await call_llm(
            prompt=user_prompt,
            system_prompt=FUSED_GENERATOR_SYSTEM_PROMPT,
            model=req.model_name,
            api_key=req.api_key,
            temperature=0.7,
            max_tokens=2000,
        )
        cleaned = clean_json_text(raw_output)
        data = json.loads(cleaned)

        draft = _parse_question_draft_data(data, req)

        self_review = None
        critique = data.get("self_critique")
        if isinstance(critique, dict):
            try:
                auth = int(critique.get("authenticity_score", 0))
                clarity = int(critique.get("clarity_score", 0))
                distractor = int(critique.get("distractor_score", 0))
                explanation = int(critique.get("explanation_score", 0))
                total = auth + clarity + distractor + explanation
                self_review = ReviewScore(
                    authenticity_score=auth,
                    clarity_score=clarity,
                    distractor_score=distractor,
                    explanation_score=explanation,
                    total_score=total,
                    strengths=critique.get("strengths", []),
                    weaknesses=critique.get("weaknesses", []),
                    recommendations=critique.get("recommendations", []),
                    passed=total > 90,
                )
            except Exception as parse_err:
                logger.warning(f"Failed to parse self_critique object: {parse_err}")

        return draft, self_review, usage
    except Exception as e:
        logger.warning(f"Fused Generator LLM failed or not configured, using authentic mock draft: {e}")
        mock_p_tokens = 450
        mock_c_tokens = 320
        mock_usage = TokenUsage(
            prompt_tokens=mock_p_tokens,
            completion_tokens=mock_c_tokens,
            total_tokens=mock_p_tokens + mock_c_tokens,
            cost_usd=calculate_token_cost(mock_p_tokens, mock_c_tokens),
        )
        mock_draft = get_mock_draft(req)
        if req.shared_stimulus:
            mock_draft.stimulus_text = req.shared_stimulus.strip()
        mock_review = evaluate_heuristically(mock_draft, req, 1)
        return mock_draft, mock_review, mock_usage
