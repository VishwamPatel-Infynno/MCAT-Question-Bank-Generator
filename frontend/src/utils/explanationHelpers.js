/**
 * Extracts individual distractor items and trap chips from distractor breakdown text.
 * Pure JavaScript utility without React/JSX dependencies.
 *
 * @param {string} rawText - Raw text block containing distractor items
 * @returns {Array<{label: string|null, trap: string|null, body: string}>}
 */
export function extractDistractorLines(rawText) {
  if (!rawText) return [];

  const OPTION_PREFIX_REGEX = /^(?:[-•*]\s*)?((?:Options?|Choices?|Distractors?|Statements?)\s+[A-E](?:\s*(?:and|&|,)\s*(?:(?:Options?|Choices?|Distractors?|Statements?)\s+)?[A-E])*(?:\s*(?:\([^)\n]{2,40}\)|\[[^\]\n]{2,40}\]))?)(?:\s*[:\-–—;,]\s*|\s+)(.*)/is;
  const SOLO_OPTION_REGEX = /^(?:[-•*]\s*)?((?:Options?|Choices?|Distractors?|Statements?)\s+[A-E](?:\s*(?:and|&|,)\s*(?:(?:Options?|Choices?|Distractors?|Statements?)\s+)?[A-E])*(?:\s*(?:\([^)\n]{2,40}\)|\[[^\]\n]{2,40}\]))?)\s*$/i;

  // Split either by newlines or by option item boundary
  const chunks = rawText
    .split(/(?:\r?\n+)|(?<=[.!?])\s+(?=(?:[-•*]\s*)?(?:Options?|Choices?|Distractors?|Statements?)\s+[A-E]\b)/i)
    .map(line => line.trim())
    .filter(Boolean);

  const items = [];

  for (const chunk of chunks) {
    const match = chunk.match(OPTION_PREFIX_REGEX);
    const solo = !match ? chunk.match(SOLO_OPTION_REGEX) : null;

    if (match || solo) {
      const rawLabel = (match ? match[1] : solo[1]).trim();
      let body = match ? match[2].trim() : '';

      // Check if body begins with "is INCORRECT" or similar qualifier
      let trapChip = null;

      // Extract bracketed or parenthesized trap like "(Extreme Language Trap)"
      const trapInParens = body.match(/\(([^)\n]*(?:Trap|Error|Language|Assumption|Scope|Correlation|Truth|Match)[^)\n]*)\)/i) ||
                           rawLabel.match(/\(([^)\n]*(?:Trap|Error|Language|Assumption|Scope|Correlation|Truth|Match)[^)\n]*)\)/i);
      if (trapInParens) {
        trapChip = trapInParens[1].trim();
        // Remove from body to avoid repeating
        body = body.replace(trapInParens[0], '').trim();
      }

      // Clean label
      const cleanLabel = rawLabel
        .replace(/\s*\[DISTRACTOR\]/i, '')
        .replace(/\s*\([^)]*\)/, '')
        .trim();

      items.push({
        label: cleanLabel,
        trap: trapChip,
        body
      });
    } else {
      // Freeform distractor line
      items.push({
        label: null,
        trap: null,
        body: chunk
      });
    }
  }

  return items;
}
