import { FlaskConical, BookOpen, Dna, Brain } from 'lucide-react';

export const SECTION_ICONS = {
  chem_phys: FlaskConical,
  cars: BookOpen,
  bio_biochem: Dna,
  psych_soc: Brain
};

export const PACING_INFO = {
  chem_phys: { target: '~96s / question', desc: '59 questions in 95 mins' },
  cars: { target: '~101s / question', desc: '53 questions in 90 mins' },
  bio_biochem: { target: '~96s / question', desc: '59 questions in 95 mins' },
  psych_soc: { target: '~96s / question', desc: '59 questions in 95 mins' }
};

export const MCAT_SECTIONS_FALLBACK = [
  {
    id: 'chem_phys',
    code: 'CP',
    label: 'Chemical and Physical Foundations of Biological Systems',
    shortLabel: 'Chem / Phys',
    subtopics: [
      'General Chemistry (Stoichiometry, Equilibrium & Electrochemistry)',
      'Organic Chemistry (Reaction Mechanisms, Functional Groups & Separations)',
      'Classical & Fluid Mechanics (Kinematics, Fluids, Work & Energy)',
      'Thermodynamics & Kinetics (Enthalpy, Entropy & Free Energy)',
      'Waves, Sound, Optics & Light',
      'Biochemical Solutions, Buffers & Acid-Base Chemistry'
    ]
  },
  {
    id: 'cars',
    code: 'CARS',
    label: 'Critical Analysis and Reasoning Skills',
    shortLabel: 'CARS',
    subtopics: [
      'Humanities (Philosophy, Ethics & Epistemology)',
      'Humanities (Art, Literature & Cultural Studies)',
      'Social Sciences (History, Sociology & Political Theory)',
      'Social Sciences (Anthropology & Economic Systems)',
      'Foundations of Comprehension (Direct Inferences & Thesis Extraction)',
      'Reasoning Within the Text (Argument Evaluation & Author Tone)',
      'Reasoning Beyond the Text (New Evidence & Analogous Scenarios)'
    ]
  },
  {
    id: 'bio_biochem',
    code: 'BB',
    label: 'Biological and Biochemical Foundations of Living Systems',
    shortLabel: 'Bio / Biochem',
    subtopics: [
      'Biochemistry & Enzyme Kinetics (Michaelis-Menten & Allosteric Regulation)',
      'Metabolic Pathways & Cellular Bioenergetics (Glycolysis, Krebs, OxPhos)',
      'Molecular Genetics, DNA Replication & Gene Expression',
      'Cellular Biology, Membrane Transport & Microbiology',
      'Organ Systems Physiology (Cardiovascular, Renal, Endocrine & Nervous)',
      'Laboratory Methods & Experimental Research Design'
    ]
  },
  {
    id: 'psych_soc',
    code: 'PS',
    label: 'Psychological, Social, and Biological Foundations of Behavior',
    shortLabel: 'Psych / Soc',
    subtopics: [
      'Sensation, Perception & Cognitive Psychology',
      'Behavioral Neuroscience & Biological Bases of Behavior',
      'Social Psychology, Social Cognition & Group Dynamics',
      'Sociological Theories, Social Institutions & Stratification',
      'Demographic Changes, Culture & Health Disparities'
    ]
  }
];

export const AAMC_REASONING_SKILLS = [
  { id: 'Skill_1', code: 'Skill 1', label: 'Knowledge of Scientific Concepts & Principles' },
  { id: 'Skill_2', code: 'Skill 2', label: 'Scientific Reasoning & Problem Solving' },
  { id: 'Skill_3', code: 'Skill 3', label: 'Reasoning About Design & Execution of Research' },
  { id: 'Skill_4', code: 'Skill 4', label: 'Data-based & Statistical Reasoning' },
  { id: 'CARS_Skill_1', code: 'CARS 1', label: 'Foundations of Comprehension' },
  { id: 'CARS_Skill_2', code: 'CARS 2', label: 'Reasoning Within the Text' },
  { id: 'CARS_Skill_3', code: 'CARS 3', label: 'Reasoning Beyond the Text' }
];

export * from './mcatTraps';
