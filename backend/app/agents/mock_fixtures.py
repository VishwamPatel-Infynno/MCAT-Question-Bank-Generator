"""Isolated mock drafts and heuristic evaluation fixtures for offline testing and graceful fallback."""

import re

from app.schemas.mcat import MCATSection, normalize_section
from app.schemas.question import OptionChoice, QuestionDraft, ReviewScore
from app.schemas.workflow import GenerationRequest


def _build_raw_mock_draft(req: GenerationRequest) -> QuestionDraft:
    """Provides high-caliber, authentic fallback AAMC MCAT questions across all 4 sections."""
    sec = normalize_section(req.section)
    is_direct_independent = (
        req.passage_required is not None
        and str(req.passage_required).lower() in ("no", "false")
        and not (req.shared_stimulus and req.shared_stimulus.strip())
        and sec != MCATSection.CARS  # CARS is strictly passage-based
    )

    if sec == MCATSection.CHEM_PHYS:
        if is_direct_independent:
            return QuestionDraft(
                stimulus_text="",
                question_stem=(
                    "A researcher measures the rate of an enzymatic reaction catalyzed by alkaline phosphatase at 37°C. "
                    "When the substrate concentration is equal to three times the Michaelis constant (3 Km), "
                    "what fraction of the maximal velocity (Vmax) is the observed reaction velocity?"
                ),
                options=[
                    OptionChoice(id="A", text="0.25 Vmax"),
                    OptionChoice(id="B", text="0.50 Vmax"),
                    OptionChoice(id="C", text="0.75 Vmax"),
                    OptionChoice(id="D", text="0.90 Vmax"),
                ],
                correct_answer_id="C",
                correct_answer_ids=["C"],
                aamc_skill="Skill_1",
                primary_trap="Calculation_Formula_Trap",
                explanation=(
                    "Core Intuition:\n"
                    "The relationship between reaction velocity (v0), maximal velocity (Vmax), substrate concentration [S], "
                    "and the Michaelis constant (Km) is governed by the Michaelis-Menten equation: v0 = (Vmax * [S]) / (Km + [S]).\n\n"
                    "Why Option C is Correct:\n"
                    "Substitute [S] = 3 Km into the Michaelis-Menten rate law:\n"
                    "v0 = (Vmax * 3 Km) / (Km + 3 Km) = (3 * Vmax * Km) / (4 Km) = 3/4 Vmax = 0.75 Vmax.\n"
                    "Therefore, at [S] = 3 Km, the enzyme operates at exactly 75% of its maximal catalytic capacity.\n\n"
                    "Why Other Options are Incorrect (Distractor & Trap Breakdown):\n"
                    "- Option A is INCORRECT (Calculation / Inversion Trap): 0.25 Vmax corresponds to [S] = 1/3 Km, resulting from inverting the numerator and denominator coefficients.\n"
                    "- Option B is INCORRECT (Formula Misapplication): 0.50 Vmax occurs when [S] = Km by definition of the Michaelis constant.\n"
                    "- Option D is INCORRECT (Distortion Trap): 0.90 Vmax requires [S] = 9 Km, representing an enzyme operating much closer to complete active site saturation."
                ),
                image_needed=False,
            )

        return QuestionDraft(
            stimulus_text=(
                "Carbonic anhydrase (CA) is a zinc metalloenzyme that catalyzes the reversible hydration of carbon dioxide: "
                "CO2 + H2O ⇌ H2CO3 ⇌ H+ + HCO3-. This equilibrium is critical for maintaining systemic arterial blood pH at 7.40 ± 0.02. "
                "In renal proximal convoluted tubule (PCT) cells, apical membrane-bound CA-IV facilitates bicarbonate reabsorption by converting luminal "
                "bicarbonate into carbon dioxide, which readily diffuses across the hydrophobic apical lipid bilayer. Once inside the cytoplasm, "
                "soluble CA-II regenerates bicarbonate and protons; bicarbonate is subsequently transported into the peritubular capillaries "
                "via the basolateral Na+/HCO3- cotransporter (NBCe1).\n\n"
                "To evaluate the pharmacology of a novel non-competitive sulfonamide inhibitor (Compound X), investigators measured renal tubular "
                "CA-II activity across increasing substrate (CO2) concentrations in the absence and presence of 10 μM Compound X at physiological pH. "
                "Kinetic analysis revealed that Compound X reduced the apparent maximal reaction velocity (Vmax) from 1.4 × 10^5 μmol/(mg·min) to "
                "0.6 × 10^5 μmol/(mg·min), while the Michaelis constant (Km) remained unchanged at 12.0 mM CO2."
            ),
            question_stem=(
                "Based on the kinetic data described in the passage, how does the addition of Compound X alter a Lineweaver-Burk "
                "(double-reciprocal) plot of CA-II catalytic activity?"
            ),
            options=[
                OptionChoice(
                    id="A",
                    text="The y-intercept increases while the x-intercept remains identical.",
                ),
                OptionChoice(
                    id="B",
                    text="The x-intercept shifts rightward closer to zero while the y-intercept remains identical.",
                ),
                OptionChoice(
                    id="C",
                    text="Both the x-intercept and the y-intercept shift to significantly higher absolute values.",
                ),
                OptionChoice(
                    id="D",
                    text="The slope of the Lineweaver-Burk line decreases while the y-intercept increases.",
                ),
            ],
            correct_answer_id="A",
            correct_answer_ids=["A"],
            aamc_skill="Skill_2",
            primary_trap="Distortion_Opposite",
            explanation=(
                "Core Intuition:\n"
                "A non-competitive inhibitor binds with equal affinity to both the free enzyme (E) and the enzyme-substrate complex (ES) "
                "at an allosteric site. Consequently, it lowers Vmax without altering substrate binding affinity (Km remains constant).\n\n"
                "Why Option A is Correct:\n"
                "In a Lineweaver-Burk double-reciprocal transformation (1/v0 = (Km/Vmax)(1/[S]) + 1/Vmax):\n"
                "1. The y-intercept represents 1/Vmax. Because Compound X decreases Vmax, 1/Vmax increases (shifts upward along the y-axis).\n"
                "2. The x-intercept represents -1/Km. Because Km is unchanged by non-competitive inhibition, the x-intercept remains identical.\n"
                "3. The slope equals Km/Vmax; because Vmax decreases and Km is unchanged, the slope increases.\n"
                "Thus, Option A accurately and definitively describes the graphical transformation.\n\n"
                "Why Other Options are Incorrect (Distractor & Trap Breakdown):\n"
                "- Option B is INCORRECT (Distortion / Competitive Trap): A rightward shift in the x-intercept with an unchanged y-intercept describes competitive inhibition (Km increases, Vmax unchanged).\n"
                "- Option C is INCORRECT (Uncompetitive Trap): Parallel shifts in both intercepts characterize uncompetitive inhibition, where both Km and Vmax decrease proportionally.\n"
                "- Option D is INCORRECT (Mathematical Slip): The slope is Km/Vmax. Because Vmax decreases in the denominator, the slope MUST increase, not decrease."
            ),
            image_needed=False,
        )

    elif sec == MCATSection.CARS:
        return QuestionDraft(
            stimulus_text=(
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
            ),
            question_stem=(
                "Based on the author's argument in the passage, with which of the following statements would the author most likely agree "
                "regarding Pierre Bourdieu's critique of Kantian aesthetics?"
            ),
            options=[
                OptionChoice(
                    id="A",
                    text="Bourdieu correctly demonstrates that aesthetic value is strictly determined by innate neurobiological reward circuitry.",
                ),
                OptionChoice(
                    id="B",
                    text="Bourdieu accurately identifies the social conditioning of taste, but improperly diminishes the disruptive psychological power of art.",
                ),
                OptionChoice(
                    id="C",
                    text="Bourdieu's analysis completely validates Kant's assertion of a universal, disinterested aesthetic consensus.",
                ),
                OptionChoice(
                    id="D",
                    text="Bourdieu's doctrine of cultural capital is inapplicable to modern fine arts due to widespread democratizing digital access.",
                ),
            ],
            correct_answer_id="B",
            correct_answer_ids=["B"],
            aamc_skill="CARS_Skill_2",
            primary_trap="Distortion_Opposite",
            explanation=(
                "Core Intuition:\n"
                "The author introduces Kant's concept of universal disinterested beauty, presents Bourdieu's sociological counterargument that taste "
                "is socialized class distinction ('cultural capital'), and then qualifies both: while Bourdieu exposes the social conditioning of taste, "
                "he goes too far by reducing art to mere social signaling, missing its capacity to elicit cognitive disequilibrium and disrupt habitual perception.\n\n"
                "Why Option B is Correct:\n"
                "Paragraph 3 begins: 'Yet to reduce all aesthetic appraisal to socio-economic positioning is to ignore the transformative phenomenology of art itself.' "
                "The author affirms that genuine encounters with art can unsettle entrenched beliefs across diverse cultural strata, directly supporting "
                "the view that Bourdieu's model is valuable yet overly reductive.\n\n"
                "Why Other Options are Incorrect (Distractor & Trap Breakdown):\n"
                "- Option A is INCORRECT (Outside Knowledge Trap): The passage never mentions neurobiology or reward circuitry; introducing neurological claims violates strict CARS textual evidence boundaries.\n"
                "- Option C is INCORRECT (Opposite / Distortion): Bourdieu explicitly rejects Kantian aesthetics as a 'bourgeois illusion,' the exact antithesis of validating it.\n"
                "- Option D is INCORRECT (Out of Scope Trap): The passage makes no mention of digital media, modern internet democratization, or contemporary technology."
            ),
            image_needed=False,
        )

    elif sec == MCATSection.BIO_BIOCHEM:
        if is_direct_independent:
            return QuestionDraft(
                stimulus_text="",
                question_stem=(
                    "In the human body, the mitochondrial pyruvate dehydrogenase complex (PDC) catalyzes the irreversible decarboxylation of pyruvate to acetyl-CoA. "
                    "Which of the following cellular conditions will most effectively INHIBIT the activity of the pyruvate dehydrogenase complex?"
                ),
                options=[
                    OptionChoice(id="A", text="High intracellular ratio of NAD+ to NADH"),
                    OptionChoice(id="B", text="High intracellular concentration of ADP"),
                    OptionChoice(id="C", text="High intracellular ratio of acetyl-CoA to free CoA"),
                    OptionChoice(
                        id="D", text="Elevated intramitochondrial concentration of free Ca2+"
                    ),
                ],
                correct_answer_id="C",
                correct_answer_ids=["C"],
                aamc_skill="Skill_1",
                primary_trap="Distortion_Opposite",
                explanation=(
                    "Core Intuition:\n"
                    "Pyruvate dehydrogenase (PDC) commits carbohydrate carbon skeletons to the citric acid cycle or fatty acid synthesis. "
                    "Like most catabolic gateway enzymes, it is allosterically regulated by cellular energy charge: activated by signs of energy depletion "
                    "(ADP, NAD+, free CoA) and inhibited by products signaling cellular energy abundance (ATP, NADH, acetyl-CoA).\n\n"
                    "Why Option C is Correct:\n"
                    "Acetyl-CoA and NADH are direct enzymatic products of the PDC reaction. A high ratio of acetyl-CoA to free CoA directly exerts allosteric "
                    "feedback inhibition and activates pyruvate dehydrogenase kinase (PDK), which phosphorylates and inactivates the E1 subunit.\n\n"
                    "Why Other Options are Incorrect (Distractor & Trap Breakdown):\n"
                    "- Option A is INCORRECT (Opposite Distortion): A high NAD+/NADH ratio signals low energy charge and substrate availability, allosterically activating PDC.\n"
                    "- Option B is INCORRECT (Opposite Distortion): Elevated ADP signals that cellular ATP is depleted, stimulating PDC and citric acid cycle flux.\n"
                    "- Option D is INCORRECT (Physiological Misconception): Calcium (Ca2+) activates pyruvate dehydrogenase phosphatase (PDP), which dephosphorylates and activates PDC during muscle contraction."
                ),
                image_needed=False,
            )

        return QuestionDraft(
            stimulus_text=(
                "G-protein coupled receptors (GPCRs) represent the largest superfamily of cell-surface signaling receptors in humans. "
                "Upon agonist binding, GPCRs catalyze the exchange of GDP for GTP on the Gα subunit of heterotrimeric G proteins, promoting dissociation "
                "of Gα from the Gβγ dimer. In cardiac myocytes, β1-adrenergic receptors couple primarily to Gαs, which stimulates adenylyl cyclase (AC) "
                "to convert ATP into cyclic adenosine monophosphate (cAMP). Elevated intracellular cAMP allosterically activates protein kinase A (PKA), "
                "which phosphorylates L-type Ca2+ channels (Cav1.2) and phospholamban (PLN), enhancing myocardial contractility (inotropy) and relaxation.\n\n"
                "To investigate the pathophysiological mechanism of Vibrio cholerae enterotoxin, researchers exposed cultured intestinal epithelial cells "
                "to purified cholera toxin. Cholera toxin is an AB5 subunit enzyme whose catalytic A1 peptide catalyzes the irreversible NAD+-dependent "
                "ADP-ribosylation of an arginine residue in the GTPase active site of Gαs. Analysis of membrane lysates by Western blot confirmed sustained "
                "adenylyl cyclase activation and persistent elevation of intracellular cAMP (>10-fold baseline) even in the complete absence of extracellular hormone."
            ),
            question_stem=(
                "Which biochemical consequence directly results from the ADP-ribosylation of the Gαs subunit by cholera toxin?"
            ),
            options=[
                OptionChoice(
                    id="A",
                    text="Inhibition of intrinsic Gαs GTPase activity, locking the subunit into a persistently active GTP-bound state.",
                ),
                OptionChoice(
                    id="B",
                    text="Destabilization of the Gαs-adenylyl cyclase complex, preventing generation of secondary messenger cAMP.",
                ),
                OptionChoice(
                    id="C",
                    text="Accelerated hydrolysis of GTP to GDP by Gαs, causing premature reassociation of the heterotrimeric complex.",
                ),
                OptionChoice(
                    id="D",
                    text="Competitive blockade of the β-adrenergic ligand-binding pocket on the extracellular GPCR surface.",
                ),
            ],
            correct_answer_id="A",
            correct_answer_ids=["A"],
            aamc_skill="Skill_2",
            primary_trap="Distortion_Opposite",
            explanation=(
                "Core Intuition:\n"
                "The intrinsic GTPase activity of Gαs acts as an internal 'molecular timer' that hydrolyzes GTP to GDP, terminating its stimulation "
                "of adenylyl cyclase. By covalently ADP-ribosylating the catalytic arginine residue of Gαs, cholera toxin prevents GTP hydrolysis, "
                "locking Gαs permanently into its active, effector-stimulating conformation.\n\n"
                "Why Option A is Correct:\n"
                "Because Gαs cannot hydrolyze its bound GTP, it remains constitutively bound to and activates adenylyl cyclase, producing continuous, "
                "uncontrolled cAMP accumulation without requiring upstream receptor stimulation.\n\n"
                "Why Other Options are Incorrect (Distractor & Trap Breakdown):\n"
                "- Option B is INCORRECT (Contradicted by Mechanism): Cholera toxin causes sustained activation, not destabilization or inhibition, of adenylyl cyclase.\n"
                "- Option C is INCORRECT (Exact Opposite): Cholera toxin inhibits GTP hydrolysis; accelerated hydrolysis would terminate cAMP production rather than causing the observed 10-fold surge.\n"
                "- Option D is INCORRECT (Location Misattribution): Cholera toxin acts intracellularly on the Gαs protein in the cytoplasm, not on the extracellular ligand-binding domain of the receptor."
            ),
            image_needed=False,
        )

    else:  # MCATSection.PSYCH_SOC
        if is_direct_independent:
            return QuestionDraft(
                stimulus_text="",
                question_stem=(
                    "A patient diagnosed with major depressive disorder reports that although they successfully secured a prestigious clinical promotion, "
                    "they attribute the success entirely to 'sheer luck and an easy interview panel.' However, when their manuscript was recently rejected, "
                    "they concluded that they are 'fundamentally incompetent and doomed to fail.' Which cognitive attributional pattern does this patient demonstrate?"
                ),
                options=[
                    OptionChoice(id="A", text="Actor-observer asymmetry"),
                    OptionChoice(
                        id="B",
                        text="Depressive attributional style (internalizing failure, externalizing success)",
                    ),
                    OptionChoice(
                        id="C",
                        text="Self-serving bias (externalizing failure, internalizing success)",
                    ),
                    OptionChoice(
                        id="D", text="Fundamental attribution error regarding group members"
                    ),
                ],
                correct_answer_id="B",
                correct_answer_ids=["B"],
                aamc_skill="Skill_1",
                primary_trap="Distortion_Opposite",
                explanation=(
                    "Core Intuition:\n"
                    "Attribution theory categorizes causes of behavior as internal (dispositional) or external (situational). In healthy individuals, "
                    "the self-serving bias protects self-esteem by attributing successes to internal factors and failures to external factors. In depression, "
                    "this pattern is characteristically inverted.\n\n"
                    "Why Option B is Correct:\n"
                    "A depressive attributional style involves attributing negative outcomes to internal, global, and stable factors ('I am incompetent'), "
                    "while attributing positive outcomes to external, unstable factors ('sheer luck'). This matches the patient's behavior precisely.\n\n"
                    "Why Other Options are Incorrect (Distractor & Trap Breakdown):\n"
                    "- Option C is INCORRECT (Exact Opposite): Self-serving bias is the reverse pattern (crediting oneself for success and blaming external circumstances for failure).\n"
                    "- Option A is INCORRECT (Misapplied Concept): Actor-observer bias refers to attributing one's own actions to situational causes while attributing others' actions to dispositional traits.\n"
                    "- Option D is INCORRECT (Misapplied Concept): The fundamental attribution error is the tendency to overestimate dispositional influences when evaluating another individual's behavior."
                ),
                image_needed=False,
            )

        return QuestionDraft(
            stimulus_text=(
                "Cognitive dissonance theory posits that individuals experience uncomfortable psychological tension when their beliefs, attitudes, "
                "or actions are mutually contradictory, motivating them to alter their cognitions or behaviors to restore equilibrium. "
                "In a randomized controlled trial investigating medical trainee burnout and institutional adherence, 120 first-year residents were asked "
                "to draft an essay advocating for an 80-hour work week policy that they privately opposed. Participants were assigned to either a "
                "Low-Incentive Condition ($5 honorarium) or a High-Incentive Condition ($50 honorarium).\n\n"
                "Post-experiment psychological evaluations revealed that residents in the Low-Incentive Condition experienced significant dissonance, "
                "exhibiting a substantial positive shift in their actual personal attitudes toward the policy compared to baseline (p < 0.01). "
                "In contrast, residents in the High-Incentive Condition demonstrated negligible attitude change toward the policy, maintaining their "
                "pre-experimental opposition. Researchers concluded that external financial justification attenuated perceived dissonance in the high-incentive cohort."
            ),
            question_stem=(
                "According to cognitive dissonance theory, why did residents in the Low-Incentive Condition exhibit a greater attitude change "
                "than residents in the High-Incentive Condition?"
            ),
            options=[
                OptionChoice(
                    id="A",
                    text="Lacking sufficient external justification, low-incentive residents resolved internal tension by aligning their personal attitudes with their counter-attitudinal behavior.",
                ),
                OptionChoice(
                    id="B",
                    text="The $5 incentive was perceived as insulting, causing residents to develop psychological reactance and reject the experimental premise.",
                ),
                OptionChoice(
                    id="C",
                    text="High-incentive residents experienced cognitive overload due to monetary distraction, preventing cognitive dissonance resolution.",
                ),
                OptionChoice(
                    id="D",
                    text="Residents in the low-incentive condition experienced greater intrinsic social desirability bias when interacting with senior evaluators.",
                ),
            ],
            correct_answer_id="A",
            correct_answer_ids=["A"],
            aamc_skill="Skill_2",
            primary_trap="Scope_Shift",
            explanation=(
                "Core Intuition:\n"
                "When individuals perform counter-attitudinal behavior under minimal external reward (insufficient justification), they cannot rationalize "
                "their action as having been done 'for the money.' To eliminate the resulting cognitive dissonance, they psychologically reconcile the discrepancy "
                "by genuinely shifting their internal attitudes toward the behavior.\n\n"
                "Why Option A is Correct:\n"
                "Residents in the High-Incentive cohort had strong external justification ($50), allowing them to attribute their essay to the reward without "
                "experiencing dissonance. The Low-Incentive cohort ($5) lacked sufficient external justification, forcing internal attitude modification "
                "to alleviate psychological tension.\n\n"
                "Why Other Options are Incorrect (Distractor & Trap Breakdown):\n"
                "- Option B is INCORRECT (Misapplied Concept): Psychological reactance would lead participants to rebel against the advocated position, not adopt it.\n"
                "- Option C is INCORRECT (Out of Scope Trap): Cognitive overload was neither measured nor supported by the theory of cognitive dissonance.\n"
                "- Option D is INCORRECT (Distortion Trap): Social desirability bias was controlled by anonymized evaluations and does not account for the incentive discrepancy."
            ),
            image_needed=False,
        )


def evaluate_heuristically(
    draft: QuestionDraft, _req: GenerationRequest, iteration: int
) -> ReviewScore:
    """Provides authentic mock evaluation for test suites and offline resilience."""
    if iteration == 1:
        # Intentionally scores 88 (<= 90) on iteration 1 to activate Re-Generator loop in tests
        return ReviewScore(
            authenticity_score=22,
            clarity_score=23,
            distractor_score=21,
            explanation_score=22,
            total_score=88,
            strengths=[
                (
                    "Authentic experimental research vignette conforming to AAMC MCAT standards"
                    if draft.stimulus_text
                    else "Direct question stem with self-contained premises conforming to AAMC discrete standards"
                ),
                "Question stem is clear and scientifically rigorous",
            ],
            weaknesses=[
                "Distractor options could feature deeper experimental cognitive traps",
                "Explanation could further elaborate on why each distractor is definitively ruled out",
            ],
            recommendations=[
                "Elevate distractor sophistication by incorporating realistic biochemical or calculation traps",
                "Explicitly refute all 3 incorrect choices in the pedagogical explanation",
            ],
            passed=False,
        )
    else:
        # Iteration 2+ scores 95 (> 90) to certify publication quality
        return ReviewScore(
            authenticity_score=24,
            clarity_score=24,
            distractor_score=23,
            explanation_score=24,
            total_score=95,
            strengths=[
                "Distractors refined into sophisticated cognitive traps",
                "Comprehensive step-by-step scientific proof with distractor counter-analysis",
                "Flawless adherence to AAMC medical admissions conventions",
            ],
            weaknesses=[],
            recommendations=[],
            passed=True,
        )


def improve_draft_heuristically(
    draft: QuestionDraft, _review: ReviewScore, iteration: int
) -> QuestionDraft:
    """Enhances draft for offline mock remediation cycles."""
    enhanced_explanation = (
        f"{draft.explanation}\n\n"
        f"[Re-Generator Quality Enhancement - Iteration {iteration}]:\n"
        f"• Addressed Reviewer Critique: Enhanced distractor plausibility and eliminated borderline ambiguity.\n"
        f"• Explicit Distractor Analysis:\n"
    )
    for opt in draft.options:
        is_key = opt.id in draft.correct_answer_ids or opt.id in [
            k.strip().upper() for k in draft.correct_answer_id.split(",") if k.strip()
        ]
        if is_key:
            enhanced_explanation += f"  - Option {opt.id} [CORRECT]: Validated with primary scientific premise and incontrovertible logical steps.\n"
        else:
            enhanced_explanation += f"  - Option {opt.id} [DISTRACTOR]: Plausible trap representing common conceptual error, ruled out by experimental evidence.\n"

    new_options = [OptionChoice(id=o.id, text=o.text) for o in draft.options]

    return QuestionDraft(
        stimulus_text=draft.stimulus_text,
        question_stem=draft.question_stem,
        options=new_options,
        correct_answer_id=draft.correct_answer_id,
        correct_answer_ids=draft.correct_answer_ids,
        explanation=enhanced_explanation,
        primary_trap=draft.primary_trap,
        aamc_skill=draft.aamc_skill,
        likely_mistake_pattern=draft.likely_mistake_pattern,
        image_needed=draft.image_needed,
        image_prompt_or_type=draft.image_prompt_or_type,
    )


def get_mock_draft(req: GenerationRequest) -> QuestionDraft:
    """Provides high-caliber, authentic fallback AAMC MCAT questions with resolved primary_trap and likely_mistake_pattern."""
    draft = _build_raw_mock_draft(req)

    # Determine or auto-detect primary trap
    if not draft.primary_trap or draft.primary_trap == "Automatic":
        if req.primary_trap and req.primary_trap != "Automatic":
            draft.primary_trap = req.primary_trap
        else:
            expl = draft.explanation or ""
            taxonomies = [
                ("Out_of_Scope", r"Out\s*of\s*Scope"),
                ("Distortion_Opposite", r"Distortion|Opposite"),
                ("Outside_Knowledge_in_CARS", r"Outside\s*Knowledge"),
                ("Extreme_Language", r"Extreme\s*(?:Language|Quantifier|Word)"),
                ("Correlation_vs_Causation", r"Correlation\s*(?:vs\.?|and)\s*Causation"),
                ("Calculation_Formula_Trap", r"Calculation|Formula"),
                ("Half_Right_False_Premise", r"Half-?Right|False\s*Premise"),
                ("Scope_Shift", r"Scope\s*Shift"),
            ]
            detected = None
            for trap_key, pattern in taxonomies:
                if re.search(pattern, expl, re.IGNORECASE):
                    detected = trap_key
                    break
            draft.primary_trap = detected or "Distortion_Opposite"

    # Determine or auto-detect student misconception / likely mistake pattern
    if req.likely_mistake_pattern and req.likely_mistake_pattern not in ("Automatic", ""):
        if req.likely_mistake_pattern == "None":
            draft.likely_mistake_pattern = None
        else:
            draft.likely_mistake_pattern = req.likely_mistake_pattern
    else:
        # Automatic (Smart AI Choice)
        draft.likely_mistake_pattern = (
            "Confuses external justification with intrinsic attitude alignment"
            if "dissonance" in (draft.question_stem or "").lower()
            else "Uses initial instead of final reference concentration in equilibrium expression"
        )

    return draft
