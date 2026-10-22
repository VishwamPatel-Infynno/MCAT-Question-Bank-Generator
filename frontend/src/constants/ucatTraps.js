/**
 * Standard UK UCAT Cognitive Trap Taxonomy & Student Advice Reference.
 */
export const UCAT_TRAP_DEFINITIONS = {
  Scope_Shift: {
    label: 'Scope Shift Trap',
    advice: 'Subtly expands or narrows the author’s premise beyond what the passage strictly proves. Never assume unmentioned generalizations.'
  },
  Keyword_Trap: {
    label: 'Keyword Match Trap',
    advice: 'Recycles exact words from the text to lure speed-readers, while twisting or inverting the actual logical relationship.'
  },
  Extreme_Language: {
    label: 'Extreme Language Trap',
    advice: 'Introduces unhedged absolutes like "always", "never", "only", or "invariably". In official UCAT, absolute statements are rarely supported.'
  },
  Correlation_vs_Causation: {
    label: 'Correlation vs. Causation',
    advice: 'Mistakes two correlated variables for a causal link. Association in observational data does not prove a cause-and-effect mechanism.'
  },
  Partial_Match: {
    label: 'Partial Match Trap',
    advice: 'Starts with an accurate statement from the text but injects a false or unverified clause at the end. Check every clause thoroughly.'
  },
  Half_Truth: {
    label: 'Half-Truth Trap',
    advice: 'Contains an element of truth from the scenario but conflates conditions or overlooks crucial exclusionary criteria.'
  },
  Unwarranted_Assumption: {
    label: 'Unwarranted Assumption',
    advice: 'Relies on plausible real-world clinical knowledge not provided in the scenario. Judge solely on the explicit evidence given.'
  },
  Calculation_Trap: {
    label: 'Calculation Trap',
    advice: 'Mirrors common intermediate math slips (omitted unit conversion, inverted ratio, or off-by-one errors). Check dimensional units.'
  },
  Out_of_Scope: {
    label: 'Out of Scope Trap',
    advice: 'Introduces plausible-sounding medical claims that are completely absent from the stimulus.'
  },
  False_Dichotomy: {
    label: 'False Dichotomy Trap',
    advice: 'Presents an artificial either-or choice when the scenario allows intermediate or multiple alternative outcomes.'
  },
  Over_generalisation: {
    label: 'Over-generalisation Trap',
    advice: 'Takes a finding specific to a narrow clinical subgroup and improperly applies it to all patients or general populations.'
  }
};

/**
 * Known UCAT cognitive trap keywords to match in inline explanations.
 */
export const TRAP_PATTERN_STR = '\\b(?:Keyword Trap|Keyword Match(?: Trap)?|Partial Match(?: Trap)?|Extreme Language(?: Trap)?|Extreme Quantifier(?: Trap)?|Extreme Word(?: Trap)?|Correlation vs\\.? Causation|Correlation and Causation|Scope Shift(?: Trap)?|Half-?Truth(?: Trap)?|Unwarranted Assumption(?: Trap)?|Opposite/Contradiction|Out of Scope(?: Trap)?|Calculation (?:Trap|Error)|Over-generalisation(?: Trap)?|Over-generalization(?: Trap)?|False Dichotomy(?: Trap)?|Contradicted by (?:Protocol|Data|Premise))\\b';

/**
 * Resolves a normalized trap key to user-friendly label and advice.
 */
export function resolveTrapInfo(trapKeyOrName) {
  if (!trapKeyOrName) return null;
  const clean = String(trapKeyOrName).trim();
  if (clean === 'Automatic' || clean === 'None') return null;

  // Direct lookup
  if (UCAT_TRAP_DEFINITIONS[clean]) {
    return { key: clean, ...UCAT_TRAP_DEFINITIONS[clean] };
  }

  // Look up by matching label or partial key
  for (const [k, info] of Object.entries(UCAT_TRAP_DEFINITIONS)) {
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
    advice: 'Watch out for subtle cognitive distortions and unwarranted inferential leaps under tight exam timing.'
  };
}

/**
 * Detects the most prominent trap mentioned in explanation text.
 */
export function detectTrapFromText(text) {
  if (!text) return null;
  for (const [k, info] of Object.entries(UCAT_TRAP_DEFINITIONS)) {
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
