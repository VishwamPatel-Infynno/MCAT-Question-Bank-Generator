import { FileText, Compass, Calculator, Grid, HeartPulse } from 'lucide-react';

export const SECTION_ICONS = {
  verbal_reasoning: FileText,
  decision_making: Compass,
  quantitative_reasoning: Calculator,
  abstract_reasoning: Grid,
  situational_judgement: HeartPulse
};

export const PACING_INFO = {
  verbal_reasoning: { target: '~28s / question', desc: '44 questions in 21 mins' },
  decision_making: { target: '~64s / question', desc: '29 questions in 31 mins' },
  quantitative_reasoning: { target: '~41s / question', desc: '36 questions in 25 mins' },
  abstract_reasoning: { target: '~14s / question', desc: '50 questions in 12 mins' },
  situational_judgement: { target: '~23s / question', desc: '66 questions in 26 mins' }
};

export const UCAT_SECTIONS_FALLBACK = [
  {
    id: 'verbal_reasoning',
    label: 'Verbal Reasoning',
    subtopics: [
      'Critical Reading & Inferences',
      'Direct Fact Retrieval',
      'Author Tone & Argumentation',
      'Comparative Evaluation'
    ]
  },
  {
    id: 'decision_making',
    label: 'Decision Making',
    subtopics: [
      'Logical Syllogisms',
      'Venn Diagrams & Set Logic',
      'Probabilistic Reasoning',
      'Argument Evaluation',
      'Recognising Assumptions'
    ]
  },
  {
    id: 'quantitative_reasoning',
    label: 'Quantitative Reasoning',
    subtopics: [
      'Rates, Work & Concentration',
      'Percentage Yield & Margins',
      'Geometric & Clinical Scaling',
      'Statistical Tables & Data Interpretation',
      'Currency & Unit Conversions'
    ]
  },
  {
    id: 'abstract_reasoning',
    label: 'Abstract Reasoning',
    subtopics: [
      'Set A vs Set B Patterns',
      'Transformation & Reflection',
      'Counting, Number & Geometry',
      'Arrangement & Conditional Shading'
    ]
  },
  {
    id: 'situational_judgement',
    label: 'Situational Judgement',
    subtopics: [
      'Patient Safety & Escalation',
      'Patient Autonomy & Consent',
      'Team Dynamics & Whistleblowing',
      'Academic & Professional Integrity',
      'Confidentiality & Social Media'
    ]
  }
];

export const CONTENT_DOMAINS = [
  'Science',
  'Healthcare',
  'Social_Science',
  'History',
  'Ethics',
  'Clinical_Governance',
  'Business',
  'Education'
];

export const QUESTION_TYPES = [
  'Passage_MCQ',
  'True_False_Cant_Tell',
  'Syllogism_Yes_No',
  'Assumption_Evaluation',
  'Data_Calculation',
  'Pattern_Set_A_B'
];

export const PRIMARY_TRAPS = [
  'Keyword_Trap',
  'Partial_Match',
  'Extreme_Language',
  'Correlation_vs_Causation',
  'Scope_Shift',
  'Half_Truth',
  'Out_of_Scope'
];
