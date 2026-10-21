import asyncio

from app.db.session import init_db
from app.repositories.question_repo import save_question
from app.schemas import OptionChoice, Question


async def seed():
    await init_db()

    q1 = Question(
        section="verbal_reasoning",
        section_label="Verbal Reasoning",
        subtopic="Critical Inference",
        difficulty="medium",
        stimulus_text=(
            "Microplastics have now been detected in remote alpine glaciers and deep marine trenches, "
            "indicating atmospheric transport plays a significant role in dispersing airborne particles. "
            "While terrestrial runoff was previously thought to be the dominant contributor to ocean plastics, "
            "recent meteorological modeling demonstrates that wind patterns carry synthetic microfiber particulates "
            "thousands of kilometers before precipitation washes them into surface waterways."
        ),
        question_stem="Which of the following statements is directly supported by the passage?",
        options=[
            OptionChoice(
                id="A",
                text="Terrestrial runoff is no longer considered a contributor to marine microplastics.",
            ),
            OptionChoice(
                id="B",
                text="Precipitation is responsible for removing airborne synthetic fibers from atmospheric transport.",
            ),
            OptionChoice(
                id="C",
                text="Alpine glaciers contain a greater concentration of microplastics than deep marine trenches.",
            ),
            OptionChoice(
                id="D",
                text="Wind patterns carry natural fibers significantly further than synthetic fibers.",
            ),
        ],
        correct_answer_id="B",
        explanation="The passage explicitly states that 'precipitation washes them [synthetic microfiber particulates] into surface waterways' after wind patterns carry them. Option B directly reflects this text.",
        cognitive_trap="Keyword Match Trap (Terrestrial Runoff)",
        final_score=96,
        iteration_count=1,
    )

    q2 = Question(
        section="decision_making",
        section_label="Decision Making",
        subtopic="Logical Syllogisms",
        difficulty="hard",
        stimulus_text=(
            "In a clinical cohort study, all participants who exhibited elevated biomarker Alpha also demonstrated "
            "increased serum ferritin levels. None of the participants with increased serum ferritin levels "
            "developed acute myocardial inflammation during the observation window. Some participants who did not develop "
            "acute myocardial inflammation were prescribed preventative beta-blockers."
        ),
        question_stem="Which conclusion definitely follows from the premises provided?",
        options=[
            OptionChoice(
                id="A",
                text="No participant with elevated biomarker Alpha developed acute myocardial inflammation.",
            ),
            OptionChoice(
                id="B",
                text="All participants who were prescribed beta-blockers had elevated biomarker Alpha.",
            ),
            OptionChoice(
                id="C",
                text="Some participants with acute myocardial inflammation had increased serum ferritin levels.",
            ),
            OptionChoice(
                id="D",
                text="Every participant prescribed beta-blockers exhibited increased serum ferritin levels.",
            ),
        ],
        correct_answer_id="A",
        explanation="All Alpha -> Ferritin. No Ferritin -> Acute Myocardial Inflammation. By chain of deductive logic: All Alpha -> No Acute Myocardial Inflammation. Thus, no participant with elevated biomarker Alpha developed acute myocardial inflammation.",
        cognitive_trap="Scope Shift Trap",
        final_score=98,
        iteration_count=1,
    )

    q3 = Question(
        section="quantitative_reasoning",
        section_label="Quantitative Reasoning",
        subtopic="Dosage & Infusion Rates",
        difficulty="medium",
        stimulus_text=(
            "A pediatric patient weighing 24 kg is prescribed antibiotic Ceftriaxone at a dosage of 50 mg/kg/day, "
            "divided into two equal infusions administered every 12 hours. The reconstitution vial provides "
            "a concentration of 40 mg/mL."
        ),
        question_stem="What volume (in mL) of reconstituted solution should be administered per individual infusion?",
        options=[
            OptionChoice(id="A", text="12.0 mL"),
            OptionChoice(id="B", text="15.0 mL"),
            OptionChoice(id="C", text="24.0 mL"),
            OptionChoice(id="D", text="30.0 mL"),
        ],
        correct_answer_id="B",
        explanation="Total daily dose = 24 kg * 50 mg/kg = 1,200 mg/day. Each of the two equal infusions = 1,200 mg / 2 = 600 mg per infusion. Concentration = 40 mg/mL. Volume per infusion = 600 mg / (40 mg/mL) = 15.0 mL.",
        cognitive_trap="Extreme Language Trap",
        final_score=95,
        iteration_count=1,
    )

    for q in [q1, q2, q3]:
        saved = await save_question(q)
        print(f"Seeded: {saved.id} - {saved.section_label}")


if __name__ == "__main__":
    asyncio.run(seed())
