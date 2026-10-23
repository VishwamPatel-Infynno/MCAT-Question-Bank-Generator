import React, { useMemo } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Target,
  Sparkles
} from 'lucide-react';

import {
  resolveTrapInfo,
  detectTrapFromText,
  renderFormattedText,
  extractDistractorLines
} from '../../utils';

/**
 * MentorExplanationView
 *
 * Dedicated educational view for AAMC MCAT questions:
 * 1. Card 1: Why Option [Key] is Correct (Evidence, proof & intuition)
 * 2. Card 2: Why Other Options are Incorrect (Itemized distractor rows with cognitive trap chips)
 * 3. Card 3: Primary Cognitive Trap Spotlight (Smart AI or assigned trap with student defense strategy)
 */
const EMPTY_ARRAY = [];

export default function MentorExplanationView({
  explanation = '',
  isCompact = false,
  _options = EMPTY_ARRAY,
  correctAnswerId = '',
  primaryTrap = null
}) {
  const parsed = useMemo(() => {
    if (!explanation) {
      return {
        correctExplanation: 'No explanation currently available.',
        steps: null,
        distractors: [],
        resolvedTrap: null
      };
    }

    const text = String(explanation).trim();

    // 1. Resolve Primary Trap: from prop or detect from explanation
    let resolvedTrap = resolveTrapInfo(primaryTrap);
    if (!resolvedTrap) {
      resolvedTrap = detectTrapFromText(text);
    }

    // 2. Split on distractor header markers
    const distractorHeaderRegex = /(?:(?:why\s+other\s+options\s+are\s+incorrect(?:\s*\(distractor\s*&\s*trap\s*breakdown\))?|why\s+distractors\s+fail|why\s+other\s+options\s+(?:are\s+traps|fail|are\s+wrong|are\s+incorrect)|why\s+other\s+choices\s+fail|why\s+incorrect\s+options\s+fail|(?:explicit\s+)?distractor\s+(?:breakdown|analysis|notes|traps)|common\s+traps|trap\s+breakdown|why\s+distractors\s+are\s+incorrect)(?:\s*(?:[•·\-–—:|/]|&|\+)\s*[^\n\r]*)?):?/i;
    const match = text.match(distractorHeaderRegex);

    if (match && match.index !== undefined) {
      const correctRaw = text.substring(0, match.index).trim();
      const distractorsRaw = text.substring(match.index + match[0].length).trim();

      // Clean up headers from correct section
      const cleanedCorrect = correctRaw
        .replace(/^(?:why\s+options?\s+[A-E](?:\s*,\s*[A-E])*\s+is\s+correct|correct\s+answer(?:\s+analysis)?|how\s+to\s+think\s+about\s+this|pedagogical\s+evaluation):?/i, '')
        .trim();

      // Check for step-by-step
      let steps = null;
      if (/(?:\*\*|\b)Step\s+\d+:?\*?\*?/i.test(cleanedCorrect)) {
        const rawSteps = cleanedCorrect.split(/(?=(?:(?:\*\*|\b)Step\s+\d+:?\*?\*?))/i);
        const filtered = rawSteps.map(s => s.trim()).filter(Boolean);
        if (filtered.length > 1) steps = filtered;
      }

      const distractorItems = extractDistractorLines(distractorsRaw);

      return {
        correctExplanation: cleanedCorrect || correctRaw,
        steps,
        distractors: distractorItems,
        resolvedTrap
      };
    }

    // Fallback: If no explicit distractor marker, check if text has option bullet lines (e.g. - Key A is CORRECT, - Distractor B is INCORRECT)
    const lines = text.split(/\r?\n+/).map(l => l.trim()).filter(Boolean);
    const correctLines = [];
    const distractorLines = [];

    let inDistractorSection = false;
    for (const line of lines) {
      if (/(?:INCORRECT|DISTRACTOR|Wrong|Trap)/i.test(line) && /(?:[-•*]\s*)?(?:Options?|Choices?|Distractors?|Statements?)\s+[A-E]\b/i.test(line)) {
        inDistractorSection = true;
      }
      if (inDistractorSection || /(?:INCORRECT|DISTRACTOR)/i.test(line)) {
        distractorLines.push(line);
      } else {
        correctLines.push(line);
      }
    }

    if (distractorLines.length > 0) {
      const correctText = correctLines
        .join('\n')
        .replace(/^(?:why\s+options?\s+[A-E](?:\s*,\s*[A-E])*\s+is\s+correct|correct\s+answer(?:\s+analysis)?|pedagogical\s+evaluation|analysis\s+of\s+options):?/i, '')
        .trim();

      return {
        correctExplanation: correctText || text,
        steps: null,
        distractors: extractDistractorLines(distractorLines.join('\n')),
        resolvedTrap
      };
    }

    // Unified single text fallback
    const cleanedUnified = text
      .replace(/^(?:why\s+options?\s+[A-E](?:\s*,\s*[A-E])*\s+is\s+correct|correct\s+answer|how\s+to\s+think\s+about\s+this):?/i, '')
      .trim();

    return {
      correctExplanation: cleanedUnified || text,
      steps: null,
      distractors: [],
      resolvedTrap
    };
  }, [explanation, primaryTrap]);

  if (!explanation) return null;

  const keyLabel = correctAnswerId ? `Option ${correctAnswerId}` : 'Correct Key';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isCompact ? '10px' : '14px' }}>
      {/* Mentor Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: isCompact ? '24px' : '28px',
              height: isCompact ? '24px' : '28px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.12)',
              color: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <GraduationCap size={isCompact ? 14 : 16} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: isCompact ? '0.85rem' : '0.92rem', color: 'var(--text-primary)' }}>
              Why Answers are Right or Wrong
            </div>
            {!isCompact && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Itemized Option Analysis &bull; Cognitive Trap Breakdown
              </div>
            )}
          </div>
        </div>

        {parsed.resolvedTrap && (
          <span
            className="badge badge-amber"
            style={{ fontSize: '0.68rem', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
            title={parsed.resolvedTrap.advice}
          >
            <AlertTriangle size={11} />
            Trap: {parsed.resolvedTrap.label}
          </span>
        )}
      </div>

      {/* CARD 1: Why Option [Key] is Correct */}
      <div
        style={{
          background: 'var(--status-success-bg, rgba(16, 185, 129, 0.05))',
          border: '1px solid var(--status-success-border, rgba(16, 185, 129, 0.25))',
          borderRadius: 'var(--radius-sm)',
          padding: isCompact ? '10px 12px' : '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--status-success)' }}>
          <CheckCircle2 size={14} />
          <span>Why {keyLabel} is Correct</span>
        </div>

        {parsed.steps && parsed.steps.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {parsed.steps.map((st, idx) => {
              const stepMatch = st.match(/^(?:\*\*)?(Step\s+\d+|[1-9]\d*\.)(?::|\s*-)?(?:\*\*)?\s*(.*)/is);
              const stepKey = `step-${idx}-${st.slice(0, 10)}`;
              if (stepMatch) {
                const label = stepMatch[1].replace(/:$/, '').trim();
                const stepBody = stepMatch[2].trim();
                return (
                  <div key={stepKey} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: isCompact ? '0.8rem' : '0.86rem' }}>
                    <span
                      style={{
                        background: 'rgba(16, 185, 129, 0.14)',
                        border: '1px solid var(--status-success-border, rgba(16, 185, 129, 0.25))',
                        color: 'var(--status-success)',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        fontWeight: 700,
                        fontSize: '0.74rem',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        lineHeight: 1.45
                      }}
                    >
                      {label}
                    </span>
                    <span style={{ color: 'var(--text-primary)', flex: 1, lineHeight: 1.55 }}>
                      {renderFormattedText(stepBody)}
                    </span>
                  </div>
                );
              }
              return (
                <div key={stepKey} style={{ color: 'var(--text-primary)', lineHeight: 1.55, fontSize: isCompact ? '0.8rem' : '0.86rem' }}>
                  {renderFormattedText(st)}
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              fontSize: isCompact ? '0.8rem' : '0.86rem',
              lineHeight: 1.6,
              color: 'var(--text-primary)',
              whiteSpace: 'pre-line'
            }}
          >
            {renderFormattedText(parsed.correctExplanation)}
          </div>
        )}
      </div>

      {/* CARD 2: Why Other Options are Incorrect (Distractor & Trap Breakdown) */}
      {parsed.distractors && parsed.distractors.length > 0 && (
        <div
          style={{
            background: 'var(--status-warning-bg, rgba(245, 158, 11, 0.05))',
            border: '1px solid var(--status-warning-border, rgba(245, 158, 11, 0.22))',
            borderRadius: 'var(--radius-sm)',
            padding: isCompact ? '10px 12px' : '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--status-warning)' }}>
              <AlertTriangle size={14} />
              <span>Why Other Options are Incorrect (Distractor & Trap Breakdown)</span>
            </div>
            <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
              {parsed.distractors.length} distractors evaluated
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: isCompact ? '0.78rem' : '0.84rem' }}>
            {parsed.distractors.map((item, idx) => (
              <div
                key={item.label ? `dist-${item.label}` : `dist-${idx}-${item.text?.slice(0, 10)}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  background: 'var(--bg-surface-elevated, rgba(255,255,255,0.03))',
                  border: '1px solid var(--border-light, rgba(255,255,255,0.06))',
                  borderRadius: 'var(--radius-xs)',
                  padding: '8px 10px',
                  lineHeight: 1.5
                }}
              >
                {/* Option Badge */}
                {item.label && (
                  <span
                    style={{
                      background: 'rgba(245, 158, 11, 0.14)',
                      border: '1px solid var(--status-warning-border, rgba(245, 158, 11, 0.22))',
                      color: 'var(--status-warning)',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      fontWeight: 700,
                      fontSize: '0.74rem',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    {item.label}
                  </span>
                )}

                {/* Specific Trap Chip */}
                {item.trap && (
                  <span
                    style={{
                      background: 'rgba(139, 92, 246, 0.14)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      color: 'var(--status-purple, #8b5cf6)',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      fontWeight: 700,
                      fontSize: '0.72rem',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}
                  >
                    {item.trap}
                  </span>
                )}

                {/* Flaw description */}
                <div style={{ color: 'var(--text-secondary)', flex: 1 }}>
                  {renderFormattedText(item.body, { highlightTraps: true })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CARD 3: Primary Cognitive Trap Spotlight */}
      {parsed.resolvedTrap && (
        <div
          style={{
            background: 'rgba(139, 92, 246, 0.05)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: isCompact ? '10px 12px' : '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--status-purple, #8b5cf6)' }}>
              <Target size={14} />
              <span>Primary Cognitive Trap Spotlight &bull; {parsed.resolvedTrap.label}</span>
            </div>

            <span
              style={{
                fontSize: '0.65rem',
                background: 'rgba(139, 92, 246, 0.14)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                color: 'var(--status-purple, #8b5cf6)',
                padding: '1px 6px',
                borderRadius: '3px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <Sparkles size={9} />
              Smart Trap Profile
            </span>
          </div>

          <div style={{ fontSize: isCompact ? '0.76rem' : '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            <strong style={{ color: 'var(--text-primary)' }}>Anti-Trap Strategy: </strong>
            {parsed.resolvedTrap.advice}
          </div>
        </div>
      )}

      {/* Mentor Pro-Tip Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          fontStyle: 'italic',
          paddingTop: '2px'
        }}
      >
        <Lightbulb size={12} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
        <span>Tip: Always note why distractors fail to build subconscious anti-trap intuition under strict MCAT exam timing.</span>
      </div>
    </div>
  );
}
