import React from 'react';
import { TRAP_PATTERN_STR } from '../constants/mcatTraps';

/**
 * Lightweight inline markdown & trap highlighter.
 * Converts bold (**text**) and italic (*text*) tokens to HTML elements,
 * and highlights recognized AAMC cognitive trap names.
 *
 * @param {string} text - Raw input text
 * @param {object} options - Options object
 * @param {boolean} options.highlightTraps - Whether to highlight cognitive traps
 * @returns {Array<React.ReactNode>|null}
 */
export function renderFormattedText(text, { highlightTraps = false } = {}) {
  if (!text) return null;

  const pattern = highlightTraps
    ? `(${TRAP_PATTERN_STR}|\\*\\*[^*]+\\*\\*|\\*[^*]+\\*)`
    : '(\\*\\*[^*]+\\*\\*|\\*[^*]+\\*)';

  const tokenRegex = new RegExp(pattern, 'gi');
  const parts = text.split(tokenRegex);

  return parts.map((part, i) => {
    if (!part) return null;
    const itemKey = `fmt-${i}-${part.slice(0, 10)}`;

    if (highlightTraps && new RegExp(`^${TRAP_PATTERN_STR}$`, 'i').test(part)) {
      return (
        <span
          key={itemKey}
          style={{
            background: 'rgba(245, 158, 11, 0.16)',
            color: 'var(--status-warning)',
            border: '1px solid var(--status-warning-border, rgba(245, 158, 11, 0.3))',
            borderRadius: '3px',
            padding: '1px 6px',
            fontWeight: 700,
            fontSize: '0.74rem',
            margin: '0 2px',
            display: 'inline-block',
            lineHeight: 1.35,
            verticalAlign: 'baseline'
          }}
        >
          {part}
        </span>
      );
    }

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={itemKey} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return <em key={itemKey}>{part.slice(1, -1)}</em>;
    }

    return part;
  });
}

/**
 * Extracts individual distractor items and trap chips from distractor breakdown text.
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
