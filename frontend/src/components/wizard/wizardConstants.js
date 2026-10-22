import {
  FlaskConical,
  BookOpen,
  Dna,
  Brain
} from 'lucide-react';

export const SECTION_METADATA = {
  chem_phys: {
    id: 'chem_phys',
    label: 'Chemical and Physical Foundations',
    shortCode: 'CP',
    icon: FlaskConical,
    tag: 'Chemistry & Physics',
    color: '#0284c7',
    desc: 'Solve chemical mechanisms, thermodynamics, fluid dynamics, and physics problems in biological systems.',
    coachTip: '⚡ MCAT Coach Tip: In Chem/Phys (~96s / Q), check dimensional units and estimate orders of magnitude before doing exact arithmetic!'
  },
  cars: {
    id: 'cars',
    label: 'Critical Analysis and Reasoning Skills',
    shortCode: 'CARS',
    icon: BookOpen,
    tag: 'Critical Reasoning',
    color: '#e11d48',
    desc: 'Analyze dense scholarly arguments in humanities and social sciences with zero external knowledge.',
    coachTip: '⚡ MCAT Coach Tip: In CARS (~101s / Q), strictly avoid outside knowledge! Every correct answer is anchored solely in the author’s tone and textual evidence.'
  },
  bio_biochem: {
    id: 'bio_biochem',
    label: 'Biological and Biochemical Foundations',
    shortCode: 'BB',
    icon: Dna,
    tag: 'Biology & Biochem',
    color: '#059669',
    desc: 'Analyze metabolic pathways, enzyme inhibition kinetics, genetics, and organ physiology experiments.',
    coachTip: '⚡ MCAT Coach Tip: In Bio/Biochem (~96s / Q), map experimental figures and identify controls before reading the question stem.'
  },
  psych_soc: {
    id: 'psych_soc',
    label: 'Psychological, Social, and Biological Foundations',
    shortCode: 'PS',
    icon: Brain,
    tag: 'Behavioral Sciences',
    color: '#7c3aed',
    desc: 'Evaluate psychological paradigms, sociological theories, cognitive biases, and health disparities.',
    coachTip: '⚡ MCAT Coach Tip: In Psych/Soc (~96s / Q), distinguish subtle nuances between related sociological theories (e.g., Conflict Theory vs. Functionalism).'
  }
};

export const CONTENT_DOMAINS = [
  'General & Organic Chemistry',
  'Biochemistry & Metabolism',
  'Classical & Modern Physics',
  'Cellular & Molecular Biology',
  'Organ Systems & Human Physiology',
  'Cognitive & Behavioral Psychology',
  'Sociology & Social Stratification',
  'Humanities & Philosophy'
];

export const DIFFICULTY_TIERS = [
  { id: 'easy', title: 'Foundational (~500 MCAT)', desc: 'Direct clues and straightforward scientific concepts, ideal for foundational mastery.' },
  { id: 'medium', title: 'Standard Exam (~508-512 MCAT)', desc: 'Matches authentic AAMC test-day experimental density and distractor complexity.' },
  { id: 'hard', title: '99th Percentile Elite (~518-528 MCAT)', desc: 'Subtle data interpretation and multi-step biochemical deductions for top-decile scorers.' }
];

export const SINGLE_ANSWER_FORMATS = [
  { id: 'single_choice', label: 'Single Best Answer (A to D)' },
  { id: 'roman_numerals', label: 'Roman Numeral Deductions (I, II, III)' }
];

export const COGNITIVE_TRAPS = [
  { id: 'Automatic', label: 'Automatic (Smart AI Choice)', desc: 'The AI picks the most realistic AAMC trap for this question type.' },
  { id: 'Out_of_Scope', label: 'Out of Scope Trap', desc: 'Introduces claims completely absent from the passage or experimental data.' },
  { id: 'Distortion_Opposite', label: 'Distortion / Opposite Trap', desc: 'Twists or inverts an experimental finding, enzyme mechanism, or author premise.' },
  { id: 'Outside_Knowledge_in_CARS', label: 'Outside Knowledge in CARS', desc: 'Lures candidates into using external scientific facts not stated in the passage.' },
  { id: 'Extreme_Language', label: 'Extreme Language Trap', desc: 'Uses unhedged absolutes like "always", "never", or "only" that are rarely supported.' },
  { id: 'Correlation_vs_Causation', label: 'Correlation vs. Causation', desc: 'Mistakes an observational correlation for a proven cause-and-effect mechanism.' },
  { id: 'Calculation_Formula_Trap', label: 'Calculation / Formula Inversion', desc: 'Mirrors common intermediate math slips (omitted unit conversion or inverted terms).' },
  { id: 'Scope_Shift', label: 'Scope Shift Trap', desc: 'Improperly generalizes a finding beyond what the study actually proved.' }
];

export const AAMC_SKILLS_LIST = [
  { id: 'Skill_1', code: 'Skill 1', label: 'Knowledge of Scientific Concepts & Principles' },
  { id: 'Skill_2', code: 'Skill 2', label: 'Scientific Reasoning & Problem Solving' },
  { id: 'Skill_3', code: 'Skill 3', label: 'Reasoning About Design & Execution of Research' },
  { id: 'Skill_4', code: 'Skill 4', label: 'Data-based & Statistical Reasoning' },
  { id: 'CARS_Skill_1', code: 'CARS 1', label: 'Foundations of Comprehension' },
  { id: 'CARS_Skill_2', code: 'CARS 2', label: 'Reasoning Within the Text' },
  { id: 'CARS_Skill_3', code: 'CARS 3', label: 'Reasoning Beyond the Text' }
];
