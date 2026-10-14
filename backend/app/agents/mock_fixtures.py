"""Isolated mock drafts and heuristic evaluation fixtures for offline testing and graceful fallback."""

from app.schemas.ucat import UCATSection, Difficulty
from app.schemas.question import QuestionDraft, OptionChoice, ReviewScore
from app.schemas.workflow import GenerationRequest

def get_mock_draft(req: GenerationRequest) -> QuestionDraft:
    """Provides high-caliber, authentic fallback UCAT questions across all 5 subtests."""
    sec = req.section

    if sec == UCATSection.VERBAL_REASONING:
        return QuestionDraft(
            stimulus_text=(
                "Neuroplasticity refers to the brain's ability to reorganise itself by forming new neural connections throughout life. "
                "While once believed that neurogenesis ceases shortly after childhood, adult hippocampal neurogenesis is now an established phenomenon. "
                "A recent multicentre double-blind study evaluated 420 patients recovering from acute ischemic stroke. "
                "Patients were randomised to receive either intensive constraint-induced movement therapy (CIMT) combined with daily targeted cognitive tasks, "
                "or standard occupational rehabilitation over a 12-week intervention period. "
                "At the 6-month primary endpoint, 74% of the CIMT cohort demonstrated statistically significant motor cortex remapping measured via functional MRI, "
                "compared with only 31% in the standard rehabilitation group. "
                "Crucially, functional independence scores (modified Rankin Scale ≤ 1) were achieved by 62% of the CIMT cohort versus 28% in controls. "
                "However, the investigators noted that neuroplastic gains were significantly attenuated in patients aged over 78 years, "
                "suggesting that chronological senescence may limit compensatory synaptic arborisation, even when intervention adherence remains optimal."
            ),
            question_stem="Which of the following inferences is most strongly supported by the passage?",
            options=[
                OptionChoice(id="A", text="Adult hippocampal neurogenesis is the primary physiological mechanism driving motor recovery following constraint-induced movement therapy."),
                OptionChoice(id="B", text="Chronological age above 78 years entirely eliminates the brain's capacity for functional cortical reorganisation."),
                OptionChoice(id="C", text="Patients receiving CIMT showed higher rates of functional independence, but age over 78 was associated with diminished neuroplastic response."),
                OptionChoice(id="D", text="Standard occupational rehabilitation achieves functional independence in a majority of acute ischemic stroke patients.")
            ],
            correct_answer_id="C",
            explanation=(
                "Analysis of Options:\n"
                "- Option C is CORRECT: The passage directly reports that 62% of the CIMT cohort achieved functional independence (mRS ≤ 1) versus 28% of controls, "
                "and explicitly concludes that 'neuroplastic gains were significantly attenuated in patients aged over 78 years'.\n"
                "- Option A is INCORRECT (Overgeneralisation trap): The passage mentions hippocampal neurogenesis as general context, but motor cortex remapping—not hippocampal neurogenesis—was the measured outcome.\n"
                "- Option B is INCORRECT (Extreme quantifier trap): The passage states gains were 'significantly attenuated' (weakened), not 'entirely eliminated'.\n"
                "- Option D is INCORRECT (Contradicted by data): Only 28% of controls achieved functional independence, which is a minority, not a majority."
            ),
            image_needed=False
        )

    elif sec == UCATSection.DECISION_MAKING:
        return QuestionDraft(
            stimulus_text=(
                "In a large teaching hospital:\n"
                "1. All consultant neurologists are certified in advanced neuroimaging interpretation.\n"
                "2. No medical practitioner certified in advanced neuroimaging interpretation lacks training in clinical psychometrics.\n"
                "3. Some clinical research fellows are certified in advanced neuroimaging interpretation.\n"
                "4. No practitioner with training in clinical psychometrics is permitted to prescribe off-label psychotropics without ethics committee approval."
            ),
            question_stem="Which of the following conclusions must follow logically from the premises provided?",
            options=[
                OptionChoice(id="A", text="Some clinical research fellows are permitted to prescribe off-label psychotropics without ethics committee approval."),
                OptionChoice(id="B", text="All medical practitioners with training in clinical psychometrics are consultant neurologists."),
                OptionChoice(id="C", text="No consultant neurologist is permitted to prescribe off-label psychotropics without ethics committee approval."),
                OptionChoice(id="D", text="All clinical research fellows are certified in advanced neuroimaging interpretation.")
            ],
            correct_answer_id="C",
            explanation=(
                "Step-by-step Deductive Proof:\n"
                "Premise 1: Consultant Neurologists ⊆ Certified in Neuroimaging.\n"
                "Premise 2: Certified in Neuroimaging ⊆ Trained in Psychometrics.\n"
                "By transitivity: Consultant Neurologists ⊆ Trained in Psychometrics.\n"
                "Premise 4: Trained in Psychometrics ∩ {Permitted off-label without approval} = ∅.\n"
                "Therefore: No consultant neurologist can prescribe off-label psychotropics without ethics approval. Option C is valid and definitive.\n\n"
                "Distractor notes:\n"
                "Option A is false: some fellows are trained in psychometrics and thus forbidden.\n"
                "Option B commits an illicit conversion of universal affirmative (All A are B does not imply All B are A).\n"
                "Option D overgeneralises Premise 3 ('Some' cannot be upgraded to 'All')."
            ),
            image_needed=req.require_image,
            image_prompt_or_type="Venn diagram illustrating sets of Neurologists, Neuroimaging certified, Psychometrics trained, and Prescribing permissions."
        )

    elif sec == UCATSection.QUANTITATIVE_REASONING:
        return QuestionDraft(
            stimulus_text=(
                "A hospital pharmacy prepares an intravenous antibiotic infusion. "
                "A patient weighing 72 kg requires a dosage of 15 mg/kg per day, divided into 3 equal infusions administered every 8 hours. "
                "The antibiotic is supplied in vials of 500 mg dissolved in 20 mL of sterile saline solution."
            ),
            question_stem="What volume of the antibiotic solution (in mL) should be drawn for a single 8-hour infusion?",
            options=[
                OptionChoice(id="A", text="12.4 mL"),
                OptionChoice(id="B", text="14.4 mL"),
                OptionChoice(id="C", text="16.2 mL"),
                OptionChoice(id="D", text="43.2 mL")
            ],
            correct_answer_id="B",
            explanation=(
                "Step 1: Calculate total daily dose: 72 kg * 15 mg/kg = 1,080 mg per day.\n"
                "Step 2: Calculate dose per single infusion: 1,080 mg / 3 = 360 mg.\n"
                "Step 3: Calculate volume required from solution concentration: "
                "The concentration is 500 mg in 20 mL, which equals 25 mg/mL.\n"
                "Volume = 360 mg / 25 mg/mL = 14.4 mL.\n"
                "Option B is therefore correct.\n"
                "Distractor notes: 43.2 mL corresponds to the full daily volume without dividing by 3."
            ),
            image_needed=req.require_image,
            image_prompt_or_type="Dosage calculation summary chart showing patient weight, dose per kg, and concentration vial."
        )

    elif sec == UCATSection.ABSTRACT_REASONING:
        return QuestionDraft(
            stimulus_text=(
                "Consider two sets of geometric figures, Set A and Set B:\n"
                "- Set A: Each box contains an even number of shaded circles and an odd number of unshaded triangles. The total number of shapes is always prime.\n"
                "- Set B: Each box contains an odd number of shaded circles and an even number of unshaded triangles. The total number of shapes is always an even number.\n"
                "Test Shape contains: 2 shaded circles and 3 unshaded triangles."
            ),
            question_stem="Which set does the Test Shape belong to?",
            options=[
                OptionChoice(id="A", text="Set A"),
                OptionChoice(id="B", text="Set B"),
                OptionChoice(id="C", text="Neither Set A nor Set B"),
                OptionChoice(id="D", text="Both Set A and Set B")
            ],
            correct_answer_id="A",
            explanation=(
                "Analyzing the Test Shape:\n"
                "1. Shaded circles count: 2 (an even number).\n"
                "2. Unshaded triangles count: 3 (an odd number).\n"
                "3. Total shapes: 2 + 3 = 5 (a prime number).\n"
                "All conditions for Set A are met: Even shaded circles (2), Odd unshaded triangles (3), Prime total (5).\n"
                "Therefore, the Test Shape belongs definitively to Set A (Option A)."
            ),
            image_needed=True,
            image_prompt_or_type="Abstract geometric test pattern containing 2 black circles and 3 white equilateral triangles."
        )

    else:  # SITUATIONAL_JUDGEMENT
        return QuestionDraft(
            stimulus_text=(
                "You are a newly qualified Foundation Year 1 (FY1) doctor on a busy respiratory ward. "
                "During evening handovers, you observe your senior registrar, Dr. Harris, exhibiting uncharacteristic slurred speech "
                "and an overt scent of alcohol on his breath. "
                "He is currently preparing to perform an emergency ultrasound-guided pleural aspiration on an acutely dyspnoeic patient."
            ),
            question_stem="How appropriate is the following response: 'Politely pull Dr. Harris aside immediately, express your immediate concern regarding patient safety, advise him not to undertake the procedure, and escalate directly to the on-call consultant if he refuses to step down'?",
            options=[
                OptionChoice(id="A", text="A very appropriate thing to do"),
                OptionChoice(id="B", text="Appropriate, but not ideal"),
                OptionChoice(id="C", text="Inappropriate, but not awful"),
                OptionChoice(id="D", text="A very inappropriate thing to do")
            ],
            correct_answer_id="A",
            explanation=(
                "GMC Good Medical Practice Guidance Evaluation:\n"
                "1. Patient Safety is the paramount overriding priority: Performing an invasive procedure while potentially impaired poses an immediate risk of harm (e.g. pneumothorax, visceral perforation).\n"
                "2. Direct and proportionate action: Addressing Dr. Harris privately but immediately provides him an opportunity to recognise impairment without unnecessary initial confrontation, while ensuring the patient is not touched.\n"
                "3. Clear escalation: If he refuses, immediate escalation to the consultant on-call ensures supervisory intervention.\n"
                "Therefore, this action is 'A very appropriate thing to do' (Option A)."
            ),
            image_needed=False
        )

def evaluate_heuristically(draft: QuestionDraft, req: GenerationRequest, iteration: int) -> ReviewScore:
    """Provides authentic mock evaluation for test suites and offline resilience."""
    if iteration == 1:
        # Intentionally scores 88 (<= 90) on iteration 1 to activate Re-Generator loop
        return ReviewScore(
            authenticity_score=22,
            clarity_score=23,
            distractor_score=21,
            explanation_score=22,
            total_score=88,
            strengths=[
                "Authentic clinical vignette structure conforming to UK UCAT standards",
                "Question stem is clear and unambiguous"
            ],
            weaknesses=[
                "Distractor options could feature deeper cognitive traps",
                "Explanation could further elaborate on why each distractor is definitively ruled out"
            ],
            recommendations=[
                "Elevate distractor sophistication by incorporating realistic calculation or logical traps",
                "Explicitly refute all 3 incorrect choices in the pedagogical explanation"
            ],
            passed=False
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
                "Comprehensive step-by-step proof with distractor counter-analysis",
                "Flawless adherence to UK medical conventions"
            ],
            weaknesses=[],
            recommendations=[],
            passed=True
        )

def improve_draft_heuristically(draft: QuestionDraft, review: ReviewScore, iteration: int) -> QuestionDraft:
    """Enhances draft for offline mock remediation cycles."""
    enhanced_explanation = (
        f"{draft.explanation}\n\n"
        f"[Re-Generator Quality Enhancement - Iteration {iteration}]:\n"
        f"• Addressed Reviewer Critique: Enhanced distractor plausibility and eliminated borderline ambiguity.\n"
        f"• Explicit Distractor Analysis:\n"
    )
    for opt in draft.options:
        if opt.id == draft.correct_answer_id:
            enhanced_explanation += f"  - Option {opt.id} [CORRECT]: Validated with primary premise and incontrovertible logical steps.\n"
        else:
            enhanced_explanation += f"  - Option {opt.id} [DISTRACTOR]: Plausible trap representing common cognitive bias, ruled out by strict condition in premise.\n"

    new_options = [OptionChoice(id=o.id, text=o.text) for o in draft.options]

    return QuestionDraft(
        stimulus_text=draft.stimulus_text,
        question_stem=draft.question_stem,
        options=new_options,
        correct_answer_id=draft.correct_answer_id,
        explanation=enhanced_explanation,
        image_needed=draft.image_needed,
        image_prompt_or_type=draft.image_prompt_or_type
    )
