/**
 * Official AAMC MCAT Cognitive Distractor Trap Taxonomy (25 Traps).
 * Aligned with manager-approved mcat_dependent_taxonomy.json.
 */
export const MCAT_TRAP_DEFINITIONS = {
  CONCEPT_CONFUSION: {
    label: 'Concept Confusion',
    advice: 'Conflates two closely related scientific concepts, models, or physiological mechanisms.'
  },
  WRONG_BASE: {
    label: 'Wrong Base or Reference Value',
    advice: 'Uses the incorrect initial quantity, baseline value, or denominator when computing changes.'
  },
  UNIT_CONVERSION: {
    label: 'Unit Conversion Error',
    advice: 'Forgets or mishandles dimensional unit conversions (e.g., nm to m, mL to L, or kJ to J).'
  },
  FORMULA_MISAPPLICATION: {
    label: 'Formula Misapplication',
    advice: 'Selects a formula whose underlying assumptions or physical boundary conditions are violated.'
  },
  SIGN_CONVENTION: {
    label: 'Sign or Direction Convention',
    advice: 'Reverses a vector direction, thermodynamic sign convention (+/- Delta G/H), or electrochemical potential.'
  },
  PROPORTIONALITY_ERROR: {
    label: 'Proportionality Error',
    advice: 'Mistakes an inverse relationship for direct proportionality, or overlooks a squared/square-root exponent.'
  },
  ASSUMPTION_MISSED: {
    label: 'Missed Assumption or Condition',
    advice: 'Fails to check essential boundary conditions (e.g. STP, ideal gas, steady-state enzyme kinetics).'
  },
  CAUSE_EFFECT_CONFUSION: {
    label: 'Cause-Effect Confusion',
    advice: 'Reverses the direction of causality between two biological, biochemical, or social phenomena.'
  },
  CORRELATION_CAUSATION: {
    label: 'Correlation vs. Causation',
    advice: 'Mistakes an observed statistical association for proof of a direct mechanistic cause-and-effect relationship.'
  },
  CONTROL_GROUP_CONFUSION: {
    label: 'Control-Group Confusion',
    advice: 'Confuses the negative/vehicle control with experimental manipulation groups or baseline states.'
  },
  VARIABLE_CONFUSION: {
    label: 'Independent/Dependent Variable Confusion',
    advice: 'Swaps the variable manipulated by researchers with the outcome variable being measured.'
  },
  SAMPLE_SIZE_BIAS: {
    label: 'Sampling or Sample-Size Bias',
    advice: 'Draws broad clinical or population generalizations from an underpowered or non-representative sample.'
  },
  STATISTICAL_SIGNIFICANCE: {
    label: 'Statistical Significance Misconception',
    advice: 'Equates failure to reject the null hypothesis with proof of no effect, or confuses p-values with effect magnitude.'
  },
  GRAPH_AXIS_MISREADING: {
    label: 'Graph or Axis Misreading',
    advice: 'Misreads axes, logarithmic scales, inverted coordinates, or compares mismatched experimental series.'
  },
  TABLE_COMPARISON_ERROR: {
    label: 'Table Comparison Error',
    advice: 'Misaligns rows and columns or compares treatment groups without normalizing to baseline controls.'
  },
  TREND_EXTRAPOLATION: {
    label: 'Unsupported Trend Extrapolation',
    advice: 'Extrapolates a linear or monotonic trend beyond the empirical range tested in the study.'
  },
  MECHANISM_CONFUSION: {
    label: 'Mechanism Confusion',
    advice: 'Proposes an unverified reaction pathway, enzymatic intermediate, or physiological cascade.'
  },
  EXCEPTION_OVERLOOKED: {
    label: 'Exception or Qualifier Overlooked',
    advice: 'Ignores crucial qualifying conditions in the stem such as "under aerobic conditions only" or "at physiological pH".'
  },
  NEGATION_MISREAD: {
    label: 'Negation or NOT/EXCEPT Misread',
    advice: 'Overlooks negative phrasing (e.g., "LEAST likely", "EXCEPT", "NOT supported") and picks a true statement.'
  },
  SCOPE_SHIFT: {
    label: 'Scope Shift',
    advice: 'Generalizes a finding observed in cell culture or animal models directly to whole-organism human physiology.'
  },
  UNSUPPORTED_INFERENCE: {
    label: 'Unsupported Inference',
    advice: 'Selects an answer that sounds scientifically plausible but lacks empirical proof in the supplied passage.'
  },
  PASSAGE_CONTRADICTION: {
    label: 'Passage Contradiction',
    advice: 'States a claim that directly contradicts experimental data, figures, or author arguments in the passage.'
  },
  OVERGENERALIZATION: {
    label: 'Overgeneralization',
    advice: 'Uses unhedged absolutes ("always", "never", "invariably") where only a conditional effect was shown.'
  },
  DISTRACTOR_OVERINTERPRETATION: {
    label: 'Distractor Overinterpretation',
    advice: 'Reads complex unstated motives or unwarranted biochemical consequences into simple factual data.'
  },
  ANSWER_CHOICE_CONFLATION: {
    label: 'Answer-Choice Conflation',
    advice: 'Merges elements of two distinct answer choices to form a seemingly comprehensive but erroneous hybrid.'
  }
};

/**
 * Known MCAT cognitive trap keywords to match in inline explanations.
 */
export const TRAP_PATTERN_STR = '\\b(?:Concept Confusion|Wrong Base|Unit Conversion|Formula Misapplication|Sign Convention|Proportionality Error|Missed Assumption|Cause-?Effect Confusion|Correlation (?:vs\\.?|and) Causation|Control-?Group Confusion|Variable Confusion|Sample(?:-?Size)? Bias|Statistical Significance|Graph (?:or Axis )?Misreading|Table Comparison|Trend Extrapolation|Mechanism Confusion|Exception Overlooked|Negation Misread|NOT/EXCEPT|Scope Shift|Unsupported Inference|Passage Contradiction|Overgeneralization|Distractor Overinterpretation|Answer-?Choice Conflation|Out of Scope|Distortion|Extreme Language|Calculation Trap)\\b';


