import logging

from app.agents.base import calculate_token_cost, call_llm, safe_json_loads
from app.agents.mock_fixtures import evaluate_heuristically, get_mock_draft
from app.agents.option_balancer import balance_and_shuffle_options
from app.agents.prompts import FUSED_GENERATOR_SYSTEM_PROMPT, GENERATOR_SYSTEM_PROMPT
from app.core.config import config
from app.schemas.mcat import MCAT_SECTION_LABELS, MCATSection
from app.schemas.question import OptionChoice, QuestionDraft, ReviewScore
from app.schemas.token import TokenUsage
from app.schemas.workflow import GenerationRequest

logger = logging.getLogger(__name__)


def _build_generator_user_prompt(req: GenerationRequest, fused: bool = False) -> str:
    section_val = req.section.value if hasattr(req.section, "value") else str(req.section)
    section_name = MCAT_SECTION_LABELS.get(req.section, section_val)

    user_prompt = f"""Generate an official-caliber AAMC MCAT Multiple Choice Question with 4 options (A, B, C, D) and exactly ONE correct answer.

Section: {section_name}"""
    if req.subject:
        user_prompt += f"\nSubject: {req.subject}"
    if req.unit:
        user_prompt += f"\nUnit: {req.unit}"
    if req.topic:
        user_prompt += f"\nTopic: {req.topic}"
    user_prompt += f"\nSubtopic: {req.subtopic or 'Foundational Syllabus Focus'}"
    user_prompt += f"\nTarget Difficulty: {req.difficulty.value}"
    user_prompt += "\nInteraction Format: Single Choice (4 options: A, B, C, D)"

    if req.aamc_skill:
        user_prompt += f"\nAAMC Reasoning Skill: {req.aamc_skill}"
    if req.subskill:
        user_prompt += f"\nGranular Subskill Focus: {req.subskill}"
    if req.combination_id:
        user_prompt += f"\nCombination ID: {req.combination_id}"
    if req.content_domains:
        user_prompt += f"\nContent Domains: {', '.join(req.content_domains)}"
    elif req.content_domain:
        user_prompt += f"\nContent Domain: {req.content_domain}"
    if req.question_type:
        user_prompt += f"\nQuestion Type Format: {req.question_type}"
    if req.likely_mistake_pattern:
        user_prompt += (
            f"\nTarget Student Misconception / Mistake Pattern: {req.likely_mistake_pattern}\n"
            "CRITICAL DISTRACTOR DESIGN: Engineer at least one distractor option specifically designed "
            "to attract students who commit this exact mistake, and explain this in the distractor breakdown."
        )
    if req.primary_trap and req.primary_trap != "Automatic":
        user_prompt += f"\nPrimary Distractor Trap to Emphasize: {req.primary_trap}"
    else:
        user_prompt += (
            "\nPrimary Distractor Trap: Automatic (Smart AI Choice)\n"
            "Analyze the section, passage/stimulus, and question stem to intelligently choose the most realistic "
            "AAMC cognitive distractor trap from the official 25 traps (e.g. CONCEPT_CONFUSION, WRONG_BASE, "
            "UNIT_CONVERSION, FORMULA_MISAPPLICATION, SIGN_CONVENTION, PROPORTIONALITY_ERROR, ASSUMPTION_MISSED, "
            "CAUSE_EFFECT_CONFUSION, CORRELATION_CAUSATION, CONTROL_GROUP_CONFUSION, VARIABLE_CONFUSION, "
            "SAMPLE_SIZE_BIAS, STATISTICAL_SIGNIFICANCE, GRAPH_AXIS_MISREADING, TABLE_COMPARISON_ERROR, "
            "TREND_EXTRAPOLATION, MECHANISM_CONFUSION, EXCEPTION_OVERLOOKED, NEGATION_MISREAD, SCOPE_SHIFT, "
            "UNSUPPORTED_INFERENCE, PASSAGE_CONTRADICTION, OVERGENERALIZATION, DISTRACTOR_OVERINTERPRETATION, "
            "ANSWER_CHOICE_CONFLATION) and populate the 'primary_trap' JSON field with your selected trap."
        )

    # Section-specific CARS warning
    if req.section in (MCATSection.CARS, "CARS", "cars"):
        user_prompt += (
            "\nCRITICAL CARS RULE: Strictly test ONLY what is justified directly by the passage text. "
            "Do NOT test or permit any outside scientific, clinical, or unmentioned real-world knowledge. "
            "Assess Foundations of Comprehension, Reasoning Within the Text, or Reasoning Beyond the Text."
        )

    # Handle pre-existing shared passage (Single Passage Set) vs new passage
    if req.shared_stimulus and req.shared_stimulus.strip():
        user_prompt += f"""\nCRITICAL PASSAGE INSTRUCTION:
You MUST formulate this question strictly and exclusively based on the following PRE-EXISTING READING PASSAGE.
Do NOT write a new passage. Formulate your question stem, options, correct key, and explanation directly against this text:
---
{req.shared_stimulus.strip()}
---"""
    elif req.is_passage_active:
        user_prompt += (
            "\nPassage Required: Yes - Provide a rigorous, substantive 300-500 word experimental/biomedical study "
            "(or 500-600 word humanities/social sciences essay for CARS) with clear paragraphing and empirical data descriptions."
        )
    else:
        user_prompt += (
            "\nPassage Required: No - Standalone discrete question ONLY. Do NOT write any reading passage, scenario, or vignette in stimulus_text. "
            'Leave stimulus_text strictly as an empty string (""). Pose the complete problem directly in question_stem.'
        )

    if req.visual_type and req.visual_type != "None":
        user_prompt += f"\nVisual Stimulus Type: {req.visual_type}"
    if req.custom_prompt:
        user_prompt += f"\nCustom Focus Context: {req.custom_prompt}"

    user_prompt += (
        "\nANTI-GUESSABILITY & OPTION SYMMETRY MANDATE:\n"
        "- All options MUST have roughly equal length and word count (strictly within ±15% or 2-4 words of each other).\n"
        "- The correct option MUST NOT be the longest choice or the most qualified/hedged statement.\n"
        "- Use parallel grammatical syntax across all choices (identical part of speech and structural format).\n"
        "- Ensure distractors represent authentic, highly plausible cognitive reasoning traps."
    )

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
    raw_options = data.get("options", [])
    if isinstance(raw_options, dict):
        options = [OptionChoice(id=str(k).upper(), text=str(v)) for k, v in raw_options.items()]
    elif isinstance(raw_options, list):
        options = [
            OptionChoice(
                id=str(opt.get("id", chr(65 + i))).upper(),
                text=str(opt.get("text", "")),
            )
            if isinstance(opt, dict)
            else OptionChoice(id=chr(65 + i), text=str(opt))
            for i, opt in enumerate(raw_options)
        ]
    else:
        options = []

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

    # Determine primary trap: model selection, request override, or auto-detect from explanation
    primary_trap = data.get("primary_trap")
    if not primary_trap or primary_trap == "Automatic":
        if req.primary_trap and req.primary_trap != "Automatic":
            primary_trap = req.primary_trap
        else:
            expl = data.get("explanation", "")
            detected = None
            taxonomies = [
                ("Scope_Shift", r"Scope\s*Shift"),
                ("Keyword_Trap", r"Keyword\s*(?:Match\s*)?Trap"),
                ("Extreme_Language", r"Extreme\s*(?:Language|Quantifier|Word)"),
                ("Correlation_vs_Causation", r"Correlation\s*(?:vs\.?|and)\s*Causation"),
                ("Partial_Match", r"Partial\s*Match"),
                ("Half_Truth", r"Half-?Truth"),
                ("Unwarranted_Assumption", r"Unwarranted\s*Assumption"),
                ("Calculation_Trap", r"Calculation\s*(?:Trap|Error)"),
                ("Out_of_Scope", r"Out\s*of\s*Scope"),
            ]
            import re

            for trap_key, pattern in taxonomies:
                if re.search(pattern, expl, re.IGNORECASE):
                    detected = trap_key
                    break
            primary_trap = detected or "Scope_Shift"

    # Enforce reading passage vs direct independent question
    if not req.is_passage_active:
        effective_stimulus = ""
    else:
        effective_stimulus = (
            req.shared_stimulus.strip()
            if req.shared_stimulus
            else data.get("stimulus_text", "").strip()
        )

    aamc_skill = data.get("aamc_skill") or req.aamc_skill or ("CARS_Skill_1" if req.section in (MCATSection.CARS, "CARS", "cars") else "Skill_2")

    return QuestionDraft(
        stimulus_text=effective_stimulus,
        question_stem=data["question_stem"],
        options=options,
        correct_answer_id=correct_id_str,
        correct_answer_ids=keys_list,
        explanation=data["explanation"],
        primary_trap=primary_trap,
        aamc_skill=aamc_skill,
        subject=req.subject,
        unit=req.unit,
        topic=req.topic,
        subskill=req.subskill,
        likely_mistake_pattern=req.likely_mistake_pattern,
        image_needed=(
            False
            if (req.section in (MCATSection.CARS, "CARS", "cars") and not req.require_image)
            else data.get(
                "image_needed",
                req.requires_visual_stimulus,
            )
        ),
        image_prompt_or_type=data.get("image_prompt_or_type"),
    )


async def generate_passage_stimulus(req: GenerationRequest) -> tuple[str, TokenUsage]:
    """Generates a standalone, publication-caliber AAMC MCAT academic/experimental reading passage."""
    section_val = req.section.value if hasattr(req.section, "value") else str(req.section)
    section_name = MCAT_SECTION_LABELS.get(req.section, section_val)
    domain = req.content_domain or ("Humanities & Social Sciences" if req.section in (MCATSection.CARS, "CARS", "cars") else "Biomedical & Physical Sciences")
    topic = req.subtopic or "Foundational Concepts & Research Design"

    is_cars = req.section in (MCATSection.CARS, "CARS", "cars")
    target_length = "500 to 600 words" if is_cars else "320 to 450 words"

    prompt = f"""Generate a high-yield, authentic AAMC MCAT Reading Passage for {section_name}.
Content Domain: {domain}
Topic Focus: {topic}
Difficulty Calibration: {req.difficulty.value}
Target Length: {target_length}.

STANDARDS FOR AAMC MCAT PASSAGES:
1. Formal, intellectual scholarly register using precise American English scientific or academic vocabulary.
2. Structured in 3 to 5 coherent paragraphs.
3. {"For CARS: Dense scholarly argument in philosophy, ethics, cultural theory, or social sciences. Expresses a distinct thesis, contrasting critical viewpoints, and authorial attitude. Strictly avoid scientific jargon." if is_cars else "For Sciences: Substantive experimental or biomedical study detailing a research hypothesis, experimental methods (e.g. assays, Western blots, kinetic measurements), observed quantitative data or findings, and conclusions."}
4. Provides rich material for multiple distinct reasoning questions evaluating AAMC skills.
5. DO NOT include questions, choices, or answers in this output. Output ONLY the pure reading passage text."""

    system_prompt = (
        "You are a Senior AAMC MCAT Lead Passage Author for official medical college admissions. "
        "Write authoritative, dense, publication-grade reading passages suitable for competitive premed candidates."
    )

    try:
        raw_output, usage = await call_llm(
            prompt=prompt,
            system_prompt=system_prompt,
            model=req.model_name,
            api_key=req.api_key,
            temperature=0.7,
            max_tokens=config.DEFAULT_MAX_TOKENS,
        )
        cleaned = raw_output.strip()
        # Clean any accidental markdown or quotes
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            cleaned = "\n".join(lines[1:-1] if lines[-1].strip().startswith("```") else lines[1:])
        cleaned = cleaned.strip('" \n')
        return cleaned, usage
    except Exception as e:
        logger.warning(
            f"Passage generation LLM failed or not configured, using authentic fallback passage: {e}"
        )
        if is_cars:
            fallback_passage = (
                "The philosophical justification of aesthetic value has long struggled to reconcile subjective sensory experience "
                "with the demand for objective critical consensus. In his Critique of Judgment, Immanuel Kant attempted to bridge this chasm "
                "by positing the 'sensus communis' - a shared subjective capacity that enables individuals to expect universal agreement "
                "for their aesthetic appraisals without relying on empirical concepts. To Kant, an authentic judgment of beauty must remain "
                "disinterested, detached from both sensory gratification and practical utility. When one declares a cathedral or a sonata beautiful, "
                "one speaks with a 'universal voice,' imputing the same contemplative satisfaction to all rational observers.\n\n"
                "However, contemporary sociological critique, most notably articulated by Pierre Bourdieu, dismisses this Kantian autonomy as "
                "a bourgeois illusion. Bourdieu argues that aesthetic dispositions do not reflect pure, disinterested cognition; rather, they are "
                "socially conditioned markers of class distinction, or 'cultural capital.' The ability to appreciate abstract painting or avant-garde "
                "composition presupposes prolonged exposure and educational privilege, subtly legitimizing social hierarchies under the guise of "
                "natural refined taste. In this view, disinterested aesthetic contemplation serves primarily to demarcate elite status from "
                "the necessity-driven preferences of the working classes.\n\n"
                "Yet to reduce all aesthetic appraisal to socio-economic positioning is to ignore the transformative phenomenology of art itself. "
                "If aesthetic appreciation were merely an arbitrary exercise in social signaling, it would fail to explain the profound emotional "
                "resonance and cognitive disequilibrium that art frequently elicits across diverse cultural strata. Genuine aesthetic encounters "
                "routinely disrupt habitual perception, unsettling entrenched beliefs rather than reinforcing social complacency. The enduring power "
                "of artistic expression lies neither in absolute Kantian universality nor in reductive sociological determinism, but in its capacity "
                "to stage an open-ended dialogue between individual subjectivity and the collective imagination."
            )
        else:
            fallback_passage = (
                "Phosphofructokinase-1 (PFK-1) functions as the primary committed and rate-limiting regulatory enzyme of glycolysis, "
                "catalyzing the ATP-dependent phosphorylation of fructose-6-phosphate (F6P) to fructose-1,6-bisphosphate (F1,6BP). "
                "Under physiological conditions, PFK-1 exists in an equilibrium between a low-affinity T (tense) state and a high-affinity "
                "R (relaxed) state. To elucidate the metabolic impact of allosteric modulators on glycolytic flux during acute ischemia, "
                "researchers isolated recombinant human hepatic PFK-1 and performed in vitro kinetic assays across varying substrate and "
                "effector concentrations at pH 7.4.\n\n"
                "In the presence of physiological levels of ATP (5.0 mM), PFK-1 activity was markedly inhibited, shifting the substrate saturation "
                "curve for F6P to a sigmoidal profile with a fivefold increase in the apparent Michaelis constant (Km). This cooperative inhibition "
                "stems from ATP binding to an allosteric regulatory site distinct from the catalytic pocket, stabilizing the low-affinity T conformation. "
                "Conversely, addition of 2.0 μM fructose-2,6-bisphosphate (F2,6BP) completely abrogated ATP-mediated allosteric inhibition, restoring "
                "hyperbolic Michaelis-Menten kinetics, decreasing the Km for F6P to 0.12 mM, and increasing Vmax by 40%.\n\n"
                "Further investigation demonstrated that intracellular acidosis (pH 6.8), mirroring the microenvironment of ischemic myocardium, "
                "potentiated ATP binding to the allosteric inhibitory site, resulting in a 75% reduction in catalytic efficiency (kcat/Km). "
                "However, elevated AMP concentrations (0.8 mM) competitive with ATP at the allosteric site partially restored glycolytic turnover. "
                "These findings demonstrate that cellular energy charge (AMP/ATP ratio) coupled with local proton concentration precisely regulates "
                "glycolytic flux through coordinated conformational switching of PFK-1."
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
    """Invokes the Question Generator Agent to draft a publication-grade AAMC MCAT question."""
    user_prompt = _build_generator_user_prompt(req, fused=False)

    try:
        raw_output, usage = await call_llm(
            prompt=user_prompt,
            system_prompt=GENERATOR_SYSTEM_PROMPT,
            model=req.model_name,
            api_key=req.api_key,
            temperature=0.7,
            max_tokens=config.DEFAULT_MAX_TOKENS,
        )
        data = safe_json_loads(raw_output)
        draft = _parse_question_draft_data(data, req)
        draft, _ = balance_and_shuffle_options(draft)
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
        elif req.passage_required and str(req.passage_required).lower() in ("no", "false"):
            mock_draft.stimulus_text = ""
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
            max_tokens=config.DEFAULT_MAX_TOKENS,
        )
        data = safe_json_loads(raw_output)

        draft = _parse_question_draft_data(data, req)
        draft, _ = balance_and_shuffle_options(draft)

        self_review = None
        critique = data.get("self_critique")
        if isinstance(critique, dict):
            try:
                auth = int(float(critique.get("authenticity_score", 0)))
                clarity = int(float(critique.get("clarity_score", 0)))
                distractor = int(float(critique.get("distractor_score", 0)))
                explanation = int(float(critique.get("explanation_score", 0)))
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
        logger.warning(
            f"Fused Generator LLM failed or not configured, using authentic mock draft: {e}"
        )
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
        elif req.passage_required and str(req.passage_required).lower() in ("no", "false"):
            mock_draft.stimulus_text = ""
        mock_review = evaluate_heuristically(mock_draft, req, 1)
        return mock_draft, mock_review, mock_usage
