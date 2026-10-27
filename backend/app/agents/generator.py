import logging
import re

from app.agents.base import calculate_token_cost, call_llm, safe_json_loads
from app.agents.mock_fixtures import evaluate_heuristically, get_mock_draft
from app.agents.option_balancer import balance_and_shuffle_options
from app.agents.prompt_builder import _build_generator_user_prompt
from app.agents.prompts import FUSED_GENERATOR_SYSTEM_PROMPT, GENERATOR_SYSTEM_PROMPT
from app.core.config import config
from app.schemas.mcat import (
    MCAT_SECTION_LABELS,
    MCATSection,
    normalize_mistake_pattern,
    normalize_primary_trap,
)
from app.schemas.question import OptionChoice, QuestionDraft, ReviewScore
from app.schemas.token import TokenUsage
from app.schemas.workflow import GenerationRequest

logger = logging.getLogger(__name__)



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
    raw_trap = data.get("primary_trap")
    normalized_trap = normalize_primary_trap(raw_trap)
    if not normalized_trap or normalized_trap == "Automatic":
        if req.primary_trap and req.primary_trap != "Automatic":
            primary_trap = normalize_primary_trap(req.primary_trap) or req.primary_trap
        else:
            expl = data.get("explanation", "")
            detected = None
            taxonomies = [
                ("CONCEPT_CONFUSION", r"Concept\s*Confusion"),
                ("WRONG_BASE", r"Wrong\s*Base|Reference\s*Value"),
                ("UNIT_CONVERSION", r"Unit\s*Conversion"),
                ("FORMULA_MISAPPLICATION", r"Formula\s*Misapplication"),
                ("SIGN_CONVENTION", r"Sign\s*Convention|Direction"),
                ("PROPORTIONALITY_ERROR", r"Proportionality\s*Error"),
                ("ASSUMPTION_MISSED", r"Missed\s*Assumption|Assumption\s*Missed"),
                ("CAUSE_EFFECT_CONFUSION", r"Cause[- ]Effect|Causality"),
                (
                    "CORRELATION_CAUSATION",
                    r"Correlation\s*(?:vs\.?|and|mistaken\s*for)\s*Causation",
                ),
                ("CONTROL_GROUP_CONFUSION", r"Control[- ]Group"),
                ("VARIABLE_CONFUSION", r"Variable\s*Confusion|Independent\s*and\s*Dependent"),
                ("SAMPLE_SIZE_BIAS", r"Sample\s*Size|Sampling\s*Bias"),
                ("STATISTICAL_SIGNIFICANCE", r"Statistical\s*Significance|p-value"),
                ("GRAPH_AXIS_MISREADING", r"Axis\s*Misread|Graph\s*Axis"),
                ("TABLE_COMPARISON_ERROR", r"Table\s*Comparison"),
                ("TREND_EXTRAPOLATION", r"Trend\s*Extrapolation"),
                ("MECHANISM_CONFUSION", r"Mechanism\s*Confusion"),
                ("EXCEPTION_OVERLOOKED", r"Exception\s*Overlooked|Qualifier"),
                ("NEGATION_MISREAD", r"Negation|NOT/EXCEPT|LEAST\s*likely"),
                ("SCOPE_SHIFT", r"Scope\s*Shift"),
                ("UNSUPPORTED_INFERENCE", r"Unsupported\s*Inference"),
                ("PASSAGE_CONTRADICTION", r"Passage\s*Contradiction|Directly\s*contradicts"),
                ("OVERGENERALIZATION", r"Overgeneralization|Extreme\s*(?:Language|Quantifier)"),
                ("DISTRACTOR_OVERINTERPRETATION", r"Distractor\s*Overinterpretation"),
                ("ANSWER_CHOICE_CONFLATION", r"Answer\s*Choice\s*Conflation"),
            ]

            for trap_key, pattern in taxonomies:

                if re.search(pattern, expl, re.IGNORECASE):
                    detected = trap_key
                    break
            primary_trap = detected or "SCOPE_SHIFT"
    else:
        primary_trap = normalized_trap

    # Determine target student misconception / likely mistake pattern
    raw_mistake = data.get("likely_mistake_pattern")
    if req.likely_mistake_pattern and req.likely_mistake_pattern not in ("Automatic", ""):
        if req.likely_mistake_pattern == "None":
            effective_mistake = None
        else:
            effective_mistake = (
                normalize_mistake_pattern(req.likely_mistake_pattern) or req.likely_mistake_pattern
            )
    else:
        # Automatic (Smart AI Choice)
        normalized_mistake = normalize_mistake_pattern(raw_mistake)
        effective_mistake = normalized_mistake or (
            str(raw_mistake).strip() if raw_mistake else None
        )
        if not effective_mistake:
            expl = data.get("explanation", "")
            m_match = re.search(
                r"(?:misconception|mistake\s*pattern|common\s*error)[:\s]+([^\n.,;]+)",
                expl,
                re.IGNORECASE,
            )
            if m_match:
                effective_mistake = m_match.group(1).strip()
            else:
                effective_mistake = (
                    "Confuses closely related concepts or misreads reference baseline"
                )

    # Enforce reading passage vs direct independent question
    if not req.is_passage_active:
        effective_stimulus = ""
    else:
        effective_stimulus = (
            req.shared_stimulus.strip()
            if req.shared_stimulus
            else data.get("stimulus_text", "").strip()
        )

    aamc_skill = (
        data.get("aamc_skill")
        or req.aamc_skill
        or ("CARS_Skill_1" if req.section in (MCATSection.CARS, "CARS", "cars") else "Skill_2")
    )

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
        likely_mistake_pattern=effective_mistake,
        image_needed=(
            False
            if (
                req.section in (MCATSection.CARS, "CARS", "cars")
                or not (req.allow_ai_images or req.require_image)
            )
            else bool(data.get("image_needed", False))
        ),
        image_prompt_or_type=data.get("image_prompt_or_type"),
    )


async def generate_passage_stimulus(
    req: GenerationRequest,
) -> tuple[str, TokenUsage, bool, str | None]:
    """Generates a standalone, publication-caliber AAMC MCAT academic/experimental reading passage."""
    section_val = req.section.value if hasattr(req.section, "value") else str(req.section)
    section_name = MCAT_SECTION_LABELS.get(req.section, section_val)
    domain = req.content_domain or (
        "Humanities & Social Sciences"
        if req.section in (MCATSection.CARS, "CARS", "cars")
        else "Biomedical & Physical Sciences"
    )
    topic = req.subtopic or "Foundational Concepts & Research Design"

    is_cars = req.section in (MCATSection.CARS, "CARS", "cars")
    target_length = "500 to 600 words" if is_cars else "320 to 450 words"
    allow_visuals = (req.allow_ai_images or req.require_image) and not is_cars

    if allow_visuals:
        prompt = f"""Generate a high-yield, authentic AAMC MCAT Reading Passage for {section_name}.
Content Domain: {domain}
Topic Focus: {topic}
Difficulty Calibration: {req.difficulty.value}
Target Length: {target_length}.

STANDARDS FOR AAMC MCAT PASSAGES:
1. Formal, intellectual scholarly register using precise American English scientific or academic vocabulary.
2. Structured in 3 to 5 coherent paragraphs.
3. Substantive experimental or biomedical study detailing a research hypothesis, experimental methods (e.g. assays, Western blots, kinetic measurements), observed quantitative data or findings, and conclusions.
4. Provides rich material for multiple distinct reasoning questions evaluating AAMC skills.
5. VISUAL STIMULUS DETERMINATION:
   - Carefully evaluate whether this passage requires an experimental data diagram, biochemical pathway chart, Lineweaver-Burk plot, or medical figure to be fully understood and tested.
   - If an image/diagram is genuinely needed or high-yield for this study, set "image_needed": true and specify a clear description of the visual stimulus in "image_prompt".
   - If the passage is self-contained and does NOT require a visual diagram, set "image_needed": false and "image_prompt": null.

OUTPUT FORMAT:
Respond ONLY with a valid JSON object matching this exact structure:
{{
  "passage_text": "The full 3 to 5 paragraph reading passage text...",
  "image_needed": false,
  "image_prompt": null
}}"""
    else:
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
            temperature=config.GENERATOR_TEMPERATURE,
            max_tokens=config.DEFAULT_MAX_TOKENS,
        )
        cleaned = raw_output.strip()
        # Clean any accidental markdown or quotes
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            cleaned = "\n".join(lines[1:-1] if lines[-1].strip().startswith("```") else lines[1:])
        cleaned = cleaned.strip('" \n')

        passage_text = cleaned
        image_needed = False
        image_prompt = None

        if allow_visuals:
            try:
                data = safe_json_loads(cleaned)
                if isinstance(data, dict) and "passage_text" in data:
                    passage_text = str(data["passage_text"]).strip()
                    image_needed = bool(data.get("image_needed", False))
                    image_prompt = data.get("image_prompt")
            except Exception:
                image_needed = False
                image_prompt = None

        return passage_text, usage, image_needed, image_prompt
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
        fallback_image_needed = bool(allow_visuals and not is_cars)
        fallback_image_prompt = (
            "Lineweaver-Burk and Michaelis-Menten plot of PFK-1 allosteric regulation by ATP and F2,6BP"
            if fallback_image_needed
            else None
        )
        return fallback_passage, mock_usage, fallback_image_needed, fallback_image_prompt


async def generate_question(
    req: GenerationRequest,
    diversity_context: str | None = None,
) -> tuple[QuestionDraft, TokenUsage]:
    """Invokes the Question Generator Agent to draft a publication-grade AAMC MCAT question."""
    user_prompt = _build_generator_user_prompt(
        req, fused=False, diversity_context=diversity_context
    )

    try:
        raw_output, usage = await call_llm(
            prompt=user_prompt,
            system_prompt=GENERATOR_SYSTEM_PROMPT,
            model=req.model_name,
            api_key=req.api_key,
            temperature=config.GENERATOR_TEMPERATURE,
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
    diversity_context: str | None = None,
) -> tuple[QuestionDraft, ReviewScore | None, TokenUsage]:
    """
    Fused Draft-and-Critique generator:
    Generates the candidate question AND scores it with the 100-point rubric
    in a single LLM round-trip.
    """
    user_prompt = _build_generator_user_prompt(req, fused=True, diversity_context=diversity_context)

    try:
        raw_output, usage = await call_llm(
            prompt=user_prompt,
            system_prompt=FUSED_GENERATOR_SYSTEM_PROMPT,
            model=req.model_name,
            api_key=req.api_key,
            temperature=config.GENERATOR_TEMPERATURE,
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
