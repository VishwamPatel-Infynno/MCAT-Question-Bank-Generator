from enum import Enum

class UCATSection(str, Enum):
    VERBAL_REASONING = "verbal_reasoning"
    DECISION_MAKING = "decision_making"
    QUANTITATIVE_REASONING = "quantitative_reasoning"
    ABSTRACT_REASONING = "abstract_reasoning"
    SITUATIONAL_JUDGEMENT = "situational_judgement"

UCAT_SECTION_LABELS = {
    UCATSection.VERBAL_REASONING: "Verbal Reasoning",
    UCATSection.DECISION_MAKING: "Decision Making",
    UCATSection.QUANTITATIVE_REASONING: "Quantitative Reasoning",
    UCATSection.ABSTRACT_REASONING: "Abstract Reasoning",
    UCATSection.SITUATIONAL_JUDGEMENT: "Situational Judgement",
}

UCAT_SUBTOPICS = {
    UCATSection.VERBAL_REASONING: [
        "Critical Reading & Inferences",
        "Direct Fact Retrieval",
        "Author Tone & Argumentation",
        "Comparative Evaluation"
    ],
    UCATSection.DECISION_MAKING: [
        "Logical Syllogisms",
        "Venn Diagrams & Set Logic",
        "Probabilistic Reasoning",
        "Argument Evaluation",
        "Recognising Assumptions"
    ],
    UCATSection.QUANTITATIVE_REASONING: [
        "Rates, Work & Concentration",
        "Percentage Yield & Margins",
        "Geometric & Clinical Scaling",
        "Statistical Tables & Data Interpretation",
        "Currency & Unit Conversions"
    ],
    UCATSection.ABSTRACT_REASONING: [
        "Set A vs Set B Patterns",
        "Transformation & Reflection",
        "Counting, Number & Geometry",
        "Arrangement & Conditional Shading"
    ],
    UCATSection.SITUATIONAL_JUDGEMENT: [
        "Patient Safety & Escalation",
        "Patient Autonomy & Consent",
        "Team Dynamics & Whistleblowing",
        "Academic & Professional Integrity",
        "Confidentiality & Social Media"
    ]
}

class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
