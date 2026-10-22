from enum import Enum


class MCATSection(str, Enum):
    CHEM_PHYS = "chem_phys"
    CARS = "cars"
    BIO_BIOCHEM = "bio_biochem"
    PSYCH_SOC = "psych_soc"


MCAT_SECTION_LABELS = {
    MCATSection.CHEM_PHYS: "Chemical and Physical Foundations of Biological Systems",
    MCATSection.CARS: "Critical Analysis and Reasoning Skills",
    MCATSection.BIO_BIOCHEM: "Biological and Biochemical Foundations of Living Systems",
    MCATSection.PSYCH_SOC: "Psychological, Social, and Biological Foundations of Behavior",
}

MCAT_SECTION_SHORT_LABELS = {
    MCATSection.CHEM_PHYS: "Chem / Phys",
    MCATSection.CARS: "CARS",
    MCATSection.BIO_BIOCHEM: "Bio / Biochem",
    MCATSection.PSYCH_SOC: "Psych / Soc",
}

MCAT_SECTION_CODES = {
    MCATSection.CHEM_PHYS: "CP",
    MCATSection.CARS: "CARS",
    MCATSection.BIO_BIOCHEM: "BB",
    MCATSection.PSYCH_SOC: "PS",
}

MCAT_PACING = {
    MCATSection.CHEM_PHYS: {"target": "~96s / question", "desc": "59 questions in 95 mins"},
    MCATSection.CARS: {"target": "~101s / question", "desc": "53 questions in 90 mins"},
    MCATSection.BIO_BIOCHEM: {"target": "~96s / question", "desc": "59 questions in 95 mins"},
    MCATSection.PSYCH_SOC: {"target": "~96s / question", "desc": "59 questions in 95 mins"},
}

MCAT_SUBTOPICS = {
    MCATSection.CHEM_PHYS: [
        "General Chemistry (Stoichiometry, Equilibrium & Electrochemistry)",
        "Organic Chemistry (Reaction Mechanisms, Functional Groups & Separations)",
        "Classical & Fluid Mechanics (Kinematics, Fluids, Work & Energy)",
        "Thermodynamics & Kinetics (Enthalpy, Entropy & Reaction Rates)",
        "Waves, Sound, Optics & Light",
        "Biochemical Solutions, Buffers & Acid-Base Chemistry",
    ],
    MCATSection.CARS: [
        "Humanities (Philosophy, Ethics & Epistemology)",
        "Humanities (Art, Literature & Cultural Studies)",
        "Social Sciences (History, Sociology & Political Theory)",
        "Social Sciences (Anthropology & Economic Systems)",
        "Foundations of Comprehension (Direct Inferences & Thesis Extraction)",
        "Reasoning Within the Text (Argument Evaluation & Author Tone)",
        "Reasoning Beyond the Text (New Evidence & Analogous Scenarios)",
    ],
    MCATSection.BIO_BIOCHEM: [
        "Biochemistry & Enzyme Kinetics (Michaelis-Menten & Allosteric Regulation)",
        "Metabolic Pathways & Cellular Bioenergetics (Glycolysis, Krebs, OxPhos)",
        "Molecular Genetics, DNA Replication & Gene Expression",
        "Cellular Biology, Membrane Transport & Microbiology",
        "Organ Systems Physiology (Cardiovascular, Renal, Endocrine & Nervous)",
        "Laboratory Methods & Experimental Research Design",
    ],
    MCATSection.PSYCH_SOC: [
        "Sensation, Perception & Cognitive Psychology",
        "Behavioral Neuroscience & Biological Bases of Behavior",
        "Social Psychology, Social Cognition & Group Dynamics",
        "Sociological Theories, Social Institutions & Stratification",
        "Demographic Changes, Culture & Health Disparities",
    ],
}

AAMC_REASONING_SKILLS = {
    "Skill_1": "Knowledge of Scientific Concepts and Principles",
    "Skill_2": "Scientific Reasoning and Problem Solving",
    "Skill_3": "Reasoning About the Design and Execution of Research",
    "Skill_4": "Data-based and Statistical Reasoning",
    "CARS_Skill_1": "Foundations of Comprehension",
    "CARS_Skill_2": "Reasoning Within the Text",
    "CARS_Skill_3": "Reasoning Beyond the Text",
}

AAMC_SKILL_LABELS = {
    "Skill_1": "AAMC Skill 1: Scientific Concepts",
    "Skill_2": "AAMC Skill 2: Scientific Reasoning",
    "Skill_3": "AAMC Skill 3: Research Design",
    "Skill_4": "AAMC Skill 4: Data & Statistics",
    "CARS_Skill_1": "CARS Skill 1: Comprehension",
    "CARS_Skill_2": "CARS Skill 2: Reasoning In-Text",
    "CARS_Skill_3": "CARS Skill 3: Reasoning Beyond",
}


class Difficulty(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


SECTION_CODE_MAP = {
    # Official MCAT codes & keys
    "CP": MCATSection.CHEM_PHYS,
    "CARS": MCATSection.CARS,
    "BB": MCATSection.BIO_BIOCHEM,
    "PS": MCATSection.PSYCH_SOC,
    "chem_phys": MCATSection.CHEM_PHYS,
    "cars": MCATSection.CARS,
    "bio_biochem": MCATSection.BIO_BIOCHEM,
    "psych_soc": MCATSection.PSYCH_SOC,
    "chemical_and_physical_foundations": MCATSection.CHEM_PHYS,
    "critical_analysis_and_reasoning_skills": MCATSection.CARS,
    "biological_and_biochemical_foundations": MCATSection.BIO_BIOCHEM,
    "psychological_social_and_biological_foundations": MCATSection.PSYCH_SOC,
}


def normalize_section(val: str) -> MCATSection:
    """Normalizes 'CP', 'CARS', 'BB', 'PS', or full names into MCATSection."""
    if isinstance(val, MCATSection):
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
    return MCATSection.CHEM_PHYS


def calculate_mcat_scaled_score(audit_total: int, difficulty: str = "medium") -> dict:
    """
    Calibrates internal 100-point psychometric audit score into official AAMC MCAT scaled score.
    Returns:
        section_score: 118 - 132 scale (125 is 50th percentile)
        composite_score: 472 - 528 scale (500 is 50th percentile)
        percentile: Estimated percentile rank e.g. "96th Percentile"
    """
    diff = str(difficulty).lower()

    # Determine baseline section score (118-132)
    if audit_total >= 96:
        base_sec = 132 if diff == "hard" else 131
        percentile = "99th+ Percentile (Elite)"
    elif audit_total >= 92:
        base_sec = 130 if diff == "hard" else 129
        percentile = "96th Percentile (Top Tier)"
    elif audit_total >= 88:
        base_sec = 128 if diff == "hard" else 127
        percentile = "88th Percentile (Competitive)"
    elif audit_total >= 82:
        base_sec = 126
        percentile = "72nd Percentile (Solid)"
    elif audit_total >= 75:
        base_sec = 125
        percentile = "50th Percentile (Median)"
    elif audit_total >= 65:
        base_sec = 123
        percentile = "35th Percentile"
    else:
        base_sec = max(118, 118 + int((audit_total / 100.0) * 5))
        percentile = "Below Average"

    composite = base_sec * 4
    return {
        "section_score": base_sec,
        "composite_score": composite,
        "percentile": percentile,
    }


CONTENT_DOMAINS = [
    "General_Chemistry",
    "Organic_Chemistry",
    "Biochemistry",
    "Physics",
    "Molecular_Biology",
    "Microbiology",
    "Human_Physiology",
    "Cognitive_Psychology",
    "Behavioral_Neuroscience",
    "Sociology",
    "Humanities_Philosophy",
    "Social_Sciences",
]

QUESTION_TYPES = [
    "Passage_Based_Set",
    "Independent_Discrete",
    "Data_and_Graph_Interpretation",
    "Experimental_Design_Evaluation",
    "Roman_Numeral_Combinations",
    "Thesis_and_Argument_Analysis",
]

PRIMARY_TRAPS = [
    "Out_of_Scope",
    "Distortion_Opposite",
    "Outside_Knowledge_in_CARS",
    "Extreme_Language",
    "Correlation_vs_Causation",
    "Calculation_Formula_Trap",
    "Half_Right_False_Premise",
    "Scope_Shift",
]
