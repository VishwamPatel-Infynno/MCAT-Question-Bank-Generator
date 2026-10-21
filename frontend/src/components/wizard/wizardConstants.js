import {
  BookOpen,
  BrainCircuit,
  Calculator,
  Shapes,
  Scale
} from 'lucide-react';

export const SECTION_METADATA = {
  verbal_reasoning: {
    id: 'verbal_reasoning',
    label: 'Verbal Reasoning',
    shortCode: 'VR',
    icon: BookOpen,
    tag: 'Reading & Logic',
    color: '#3B82F6',
    desc: 'Read concise academic passages and answer questions under real exam timing.',
    coachTip: '⚡ Exam Coach Tip: In Verbal Reasoning (~28s / Q), focus on speed! Watch out for subtle differences between "often", "sometimes", and "always".'
  },
  decision_making: {
    id: 'decision_making',
    label: 'Decision Making',
    shortCode: 'DM',
    icon: BrainCircuit,
    tag: 'Logic & Puzzles',
    color: '#8B5CF6',
    desc: 'Solve logic puzzles, Venn diagrams, and probability problems to deduce correct answers.',
    coachTip: '⚡ Exam Coach Tip: In Decision Making (~64s / Q), sketching quick diagrams or truth tables on your whiteboard saves huge amounts of time!'
  },
  quantitative_reasoning: {
    id: 'quantitative_reasoning',
    label: 'Quantitative Reasoning',
    shortCode: 'QR',
    icon: Calculator,
    tag: 'Math & Data',
    color: '#10B981',
    desc: 'Solve practical math problems involving clinical dosages, percentages, geometry, and graphs.',
    coachTip: '⚡ Exam Coach Tip: In Quantitative Reasoning (~41s / Q), check the units first and estimate before calculating to rule out bad answers quickly.'
  },
  abstract_reasoning: {
    id: 'abstract_reasoning',
    label: 'Abstract Reasoning',
    shortCode: 'AR',
    icon: Shapes,
    tag: 'Shape Patterns',
    color: '#F59E0B',
    desc: 'Spot geometric rules, rotational symmetry, shape counts, and Set A vs Set B patterns.',
    coachTip: '⚡ Exam Coach Tip: In Abstract Reasoning (~14s / Q), test simple rules first: count shapes, count sides, and look for color alternation.'
  },
  situational_judgement: {
    id: 'situational_judgement',
    label: 'Situational Judgement',
    shortCode: 'SJT',
    icon: Scale,
    tag: 'Medical Ethics',
    color: '#EC4899',
    desc: 'Evaluate real-life clinical scenarios and patient ethics based on official GMC guidance.',
    coachTip: '⚡ Exam Coach Tip: In Situational Judgement (~22s / Q), patient safety, honesty, and immediate clinical escalation are top priorities in GMC ethics.'
  }
};

export const CONTENT_DOMAINS = [
  'Medicine & Clinical Care',
  'Biomedical Science',
  'Public Health & Policy',
  'Medical Ethics & Law',
  'Technology & Diagnostics',
  'General Academia'
];

export const DIFFICULTY_TIERS = [
  { id: 'easy', title: 'Foundational (Beginner)', desc: 'Direct clues and straightforward reasoning, ideal for learning the concepts.' },
  { id: 'medium', title: 'Standard Exam', desc: 'Matches official UCAT test-day timing and authentic distractor complexity.' },
  { id: 'hard', title: 'Top Percentile (Challenging)', desc: 'Subtle traps and multi-layered deductions for top-decile scorers.' }
];

export const SINGLE_ANSWER_FORMATS = [
  { id: 'single_choice', label: 'Single Best Answer (A to D)' },
  { id: 'multi_choice', label: 'Multiple Statements (True / False)' }
];

export const COGNITIVE_TRAPS = [
  { id: 'Automatic', label: 'Automatic (Smart AI Choice)', desc: 'The AI picks the most realistic trap for this question type.' },
  { id: 'Keyword_Trap', label: 'Keyword Match Trap', desc: 'Uses exact words from the passage, but twists the meaning to fool fast readers.' },
  { id: 'Scope_Shift', label: 'Scope Shift Trap', desc: 'Sounds completely true, but goes slightly beyond what the text actually stated.' },
  { id: 'Correlation_Causation', label: 'Correlation vs. Causation', desc: 'Tricks you into thinking that because two events happened together, one caused the other.' },
  { id: 'Extreme_Language', label: 'Extreme Language Trap', desc: 'Uses rigid words like "always", "never", or "must" that make the statement incorrect.' }
];
