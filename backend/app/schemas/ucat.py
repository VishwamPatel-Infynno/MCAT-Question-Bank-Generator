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
        "Comparative Evaluation",
    ],
    UCATSection.DECISION_MAKING: [
        "Logical Syllogisms",
        "Venn Diagrams & Set Logic",
        "Probabilistic Reasoning",
        "Argument Evaluation",
        "Recognising Assumptions",
    ],
    UCATSection.QUANTITATIVE_REASONING: [
        "Rates, Work & Concentration",
        "Percentage Yield & Margins",
        "Geometric & Clinical Scaling",
        "Statistical Tables & Data Interpretation",
        "Currency & Unit Conversions",
    ],
    UCATSection.ABSTRACT_REASONING: [
        "Set A vs Set B Patterns",
        "Transformation & Reflection",
        "Counting, Number & Geometry",
        "Arrangement & Conditional Shading",
    ],
    UCATSection.SITUATIONAL_JUDGEMENT: [
        "Patient Safety & Escalation",
        "Patient Autonomy & Consent",
        "Team Dynamics & Whistleblowing",
        "Academic & Professional Integrity",
        "Confidentiality & Social Media",
    ],
}


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


SECTION_CODE_MAP = {
    "VR": UCATSection.VERBAL_REASONING,
    "DM": UCATSection.DECISION_MAKING,
    "QR": UCATSection.QUANTITATIVE_REASONING,
    "AR": UCATSection.ABSTRACT_REASONING,
    "SJT": UCATSection.SITUATIONAL_JUDGEMENT,
    "verbal_reasoning": UCATSection.VERBAL_REASONING,
    "decision_making": UCATSection.DECISION_MAKING,
    "quantitative_reasoning": UCATSection.QUANTITATIVE_REASONING,
    "abstract_reasoning": UCATSection.ABSTRACT_REASONING,
    "situational_judgement": UCATSection.SITUATIONAL_JUDGEMENT,
}


def normalize_section(val: str) -> UCATSection:
    """Normalizes 'VR', 'DM', 'QR', 'AR', 'SJT' or long section names into UCATSection."""
    if isinstance(val, UCATSection):
        return val
    cleaned = str(val).strip()
    if cleaned in SECTION_CODE_MAP:
        return SECTION_CODE_MAP[cleaned]
    upper = cleaned.upper()
    if upper in SECTION_CODE_MAP:
        return SECTION_CODE_MAP[upper]
    lower = cleaned.lower()
    if lower in SECTION_CODE_MAP:
        return SECTION_CODE_MAP[lower]
    return UCATSection.VERBAL_REASONING


CONTENT_DOMAINS = [
    "Science",
    "Healthcare",
    "Social_Science",
    "History",
    "Ethics",
    "Clinical_Governance",
    "Business",
    "Education",
]

QUESTION_TYPES = [
    "Passage_MCQ",
    "True_False_Cant_Tell",
    "Syllogism_Yes_No",
    "Assumption_Evaluation",
    "Data_Calculation",
    "Pattern_Set_A_B",
]

PRIMARY_TRAPS = [
    "Keyword_Trap",
    "Partial_Match",
    "Extreme_Language",
    "Correlation_vs_Causation",
    "Scope_Shift",
    "Half_Truth",
    "Out_of_Scope",
]
