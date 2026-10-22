/**
 * Standard AAMC MCAT Cognitive Trap Taxonomy & Student Advice Reference.
 */
export const MCAT_TRAP_DEFINITIONS = {
  Out_of_Scope: {
    label: 'Out of Scope Trap',
    advice: 'Introduces claims or extrapolations that sound plausible, but are completely absent from the passage or experimental data.'
  },
  Distortion_Opposite: {
    label: 'Distortion / Opposite Trap',
    advice: 'Twists, inverts, or reverses an experimental finding, enzymatic effect, or author premise. Verify direct cause-and-effect relationships.'
  },
  Outside_Knowledge_in_CARS: {
    label: 'Outside Knowledge Trap',
    advice: 'Lures candidates into using external scientific or real-world facts not stated in the passage. In CARS, external facts are strictly prohibited.'
  },
  Extreme_Language: {
    label: 'Extreme Language Trap',
    advice: 'Introduces unhedged absolutes like "always", "never", "only", or "invariably". In official AAMC items, extreme claims are rarely supported.'
  },
  Correlation_vs_Causation: {
    label: 'Correlation vs. Causation',
    advice: 'Mistakes an observational association for a proven mechanistic cause-and-effect mechanism.'
  },
  Calculation_Formula_Trap: {
    label: 'Calculation / Formula Inversion',
    advice: 'Mirrors common quantitative slips (omitted unit conversion, inverted Michaelis-Menten terms, or sign errors). Always verify dimensional units.'
  },
  Half_Right_False_Premise: {
    label: 'Half-Right / False Premise',
    advice: 'Begins with an accurate statement from the text, but injects a false premise or unverified conclusion at the end.'
  },
  Scope_Shift: {
    label: 'Scope Shift Trap',
    advice: 'Takes a finding specific to a narrow experimental condition and improperly generalizes it beyond what the study actually proved.'
  }
};

/**
 * Known MCAT cognitive trap keywords to match in inline explanations.
 */
export const TRAP_PATTERN_STR = '\\b(?:Out of Scope(?: Trap)?|Distortion(?: / Opposite)?(?: Trap)?|Opposite(?: Finding)?|Outside Knowledge(?: in CARS)?|Extreme Language(?: Trap)?|Extreme Quantifier(?: Trap)?|Correlation vs\\.? Causation|Calculation (?:Trap|Error|Slip)|Formula Inversion|Half-?Right(?: Trap)?|False Premise|Scope Shift(?: Trap)?)\\b';

/**
 * Resolves a normalized trap key to user-friendly label and advice.
 */
export function resolveTrapInfo(trapKeyOrName) {
  if (!trapKeyOrName) return null;
  const clean = String(trapKeyOrName).trim();
  if (clean === 'Automatic' || clean === 'None') return null;

  // Direct lookup
  if (MCAT_TRAP_DEFINITIONS[clean]) {
    return { key: clean, ...MCAT_TRAP_DEFINITIONS[clean] };
  }

  // Look up by matching label or partial key
  for (const [k, info] of Object.entries(MCAT_TRAP_DEFINITIONS)) {
    const normKey = k.toLowerCase().replace(/_/g, ' ');
    const normClean = clean.toLowerCase().replace(/_/g, ' ');
    if (normKey === normClean || info.label.toLowerCase() === normClean || normClean.includes(normKey)) {
      return { key: k, ...info };
    }
  }

  // Fallback to formatted string
  return {
    key: clean,
    label: clean.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    advice: 'Watch out for subtle cognitive traps and unwarranted inferential leaps under MCAT timing pressure.'
  };
}

/**
 * Detects the most prominent trap mentioned in explanation text.
 */
export function detectTrapFromText(text) {
  if (!text) return null;
  for (const [k, info] of Object.entries(MCAT_TRAP_DEFINITIONS)) {
    const pattern = new RegExp(info.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + `|${k.replace(/_/g, '\\s*')}`, 'i');
    if (pattern.test(text)) {
      return { key: k, ...info };
    }
  }
  return null;
}

/**
 * Derives the effective primary trap info (key, label, advice) for a question.
 */
export function getEffectiveTrapInfo(question) {
  if (!question) return null;
  const t = question.primary_trap;
  if (!t || t === 'Automatic' || t === 'None') {
    return detectTrapFromText(question.explanation || '');
  }
  return resolveTrapInfo(t);
}
