import {
  FlaskConical,
  BookOpen,
  Dna,
  Brain
} from 'lucide-react';

import {
  CONTENT_DOMAINS as TAXONOMY_DOMAINS,
  COGNITIVE_TRAPS as TAXONOMY_TRAPS,
  QUESTION_TYPES as TAXONOMY_QUESTION_TYPES,
  LIKELY_MISTAKE_PATTERNS as TAXONOMY_MISTAKE_PATTERNS,
  AAMC_REASONING_SKILLS as TAXONOMY_SKILLS
} from '../../constants/mcat';

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

export const CONTENT_DOMAINS = TAXONOMY_DOMAINS;
export const COGNITIVE_TRAPS = TAXONOMY_TRAPS;
export const QUESTION_TYPES = TAXONOMY_QUESTION_TYPES;
export const LIKELY_MISTAKE_PATTERNS = TAXONOMY_MISTAKE_PATTERNS;
export const AAMC_SKILLS_LIST = TAXONOMY_SKILLS;

export const DIFFICULTY_TIERS = [
  { id: 'easy', title: 'Foundational (~500 MCAT)', desc: 'Direct clues and straightforward scientific concepts, ideal for foundational mastery.' },
  { id: 'medium', title: 'Standard Exam (~508-512 MCAT)', desc: 'Matches authentic AAMC test-day experimental density and distractor complexity.' },
  { id: 'hard', title: '99th Percentile Elite (~518-528 MCAT)', desc: 'Subtle data interpretation and multi-step biochemical deductions for top-decile scorers.' }
];

export const SINGLE_ANSWER_FORMATS = [
  { id: 'single_choice', label: 'Single Best Answer (A to D)' },
  { id: 'roman_numerals', label: 'Roman Numeral Deductions (I, II, III)' }
];
