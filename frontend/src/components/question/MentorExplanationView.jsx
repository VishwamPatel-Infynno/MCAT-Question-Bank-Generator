import React, { useMemo } from 'react';
import { GraduationCap, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';

/**
 * Parses and renders question explanations in a warm, friendly, conversational mentor tone.
 * Separates the core winning strategy / step-by-step logic from the distractor trap breakdown.
 */
export default function MentorExplanationView({ explanation = '', isCompact = false }) {
  const parsed = useMemo(() => {
    if (!explanation) {
      return {
        walkthrough: 'No explanation currently available.',
        steps: null,
        distractors: null,
      };
    }

    const text = String(explanation).trim();

    // Regular expression to match common distractor header markers
    const distractorHeaderRegex = /(?:why\s+distractors\s+fail|why\s+other\s+options\s+are\s+traps|why\s+other\s+choices\s+fail|why\s+incorrect\s+options\s+fail|distractor\s+breakdown|common\s+traps|why\s+distractors\s+are\s+incorrect):?/i;
    const match = text.match(distractorHeaderRegex);

    if (match && match.index !== undefined) {
      const walkthroughRaw = text.substring(0, match.index).trim();
      const distractorsRaw = text.substring(match.index + match[0].length).trim();

      // Clean up leading mentor markers if present in walkthrough
      const cleanedWalkthrough = walkthroughRaw
        .replace(/^(?:how\s+to\s+think\s+about\s+this\s*(?:\(mentor\s+walkthrough\))?|winning\s+strategy|mentor\s+walkthrough):?/i, '')
        .trim();

      // Check if walkthrough contains numbered steps like "Step 1: ... Step 2: ..."
      let steps = null;
      if (/Step\s+\d+:?/i.test(cleanedWalkthrough)) {
        const rawSteps = cleanedWalkthrough.split(/(?=(?:Step\s+\d+:?))/i);
        const filtered = rawSteps.map(s => s.trim()).filter(Boolean);
        if (filtered.length > 1) {
          steps = filtered;
        }
      }

      // Split distractors into individual bullet items by newline OR by Option A/B/C/D boundary
      const distractorLines = distractorsRaw
        .split(/(?:\r?\n+)|(?<=[.!?])\s+(?=(?:-\s*)?Option\s+[A-E]\b)/i)
        .map(line => line.trim())
        .filter(Boolean);

      return {
        walkthrough: cleanedWalkthrough || walkthroughRaw,
        steps,
        distractors: distractorLines.length > 0 ? distractorLines : [distractorsRaw],
      };
    }

    // Fallback: If no explicit distractor marker, check for steps and clean any heading
    const cleanedUnified = text
      .replace(/^(?:how\s+to\s+think\s+about\s+this\s*(?:\(mentor\s+walkthrough\))?|winning\s+strategy|mentor\s+walkthrough):?/i, '')
      .trim();

    let steps = null;
    if (/Step\s+\d+:?/i.test(cleanedUnified)) {
      const rawSteps = cleanedUnified.split(/(?=(?:Step\s+\d+:?))/i);
      const filtered = rawSteps.map(s => s.trim()).filter(Boolean);
      if (filtered.length > 1) {
        steps = filtered;
      }
    }

    return {
      walkthrough: cleanedUnified || text,
      steps,
      distractors: null,
    };
  }, [explanation]);

  if (!explanation) return null;

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
                Mentor Walkthrough &bull; Conversational Step-by-Step Coaching
              </div>
            )}
          </div>
        </div>

        <span
          className="badge badge-indigo"
          style={{ fontSize: '0.68rem', padding: '2px 8px', letterSpacing: '0.02em', fontWeight: 600 }}
        >
          Mentor Note
        </span>
      </div>

      {/* Card 1: Winning Strategy & Core Solution Walkthrough */}
      <div
        style={{
          background: 'rgba(16, 185, 129, 0.05)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 'var(--radius-sm)',
          padding: isCompact ? '10px 12px' : '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--status-success)' }}>
          <CheckCircle2 size={14} />
          <span>The Winning Strategy (How to Solve This)</span>
        </div>

        {parsed.steps && parsed.steps.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {parsed.steps.map((st, idx) => {
              const stepMatch = st.match(/^(Step\s+\d+:?)\s*(.*)/i);
              if (stepMatch) {
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: isCompact ? '0.8rem' : '0.86rem' }}>
                    <span
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
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
                      {stepMatch[1].replace(/:$/, '')}
                    </span>
                    <span style={{ color: 'var(--text-primary)', flex: 1, lineHeight: 1.55 }}>
                      {stepMatch[2]}
                    </span>
                  </div>
                );
              }
              return (
                <div key={idx} style={{ color: 'var(--text-primary)', lineHeight: 1.55, fontSize: isCompact ? '0.8rem' : '0.86rem' }}>
                  {st}
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
            {parsed.walkthrough}
          </div>
        )}
      </div>

      {/* Card 2: Distractor Traps & Why Other Options Fail */}
      {parsed.distractors && parsed.distractors.length > 0 && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.22)',
            borderRadius: 'var(--radius-sm)',
            padding: isCompact ? '10px 12px' : '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, color: '#d97706' }}>
            <AlertTriangle size={14} />
            <span>Common Traps &bull; Why Other Options Are Wrong</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: isCompact ? '0.78rem' : '0.84rem', lineHeight: 1.55 }}>
            {parsed.distractors.map((line, idx) => {
              // Highlight Option labels like "Option A", "Option B"
              const optionMatch = line.match(/^(?:-\s*)?(Option\s+[A-E][^:,]*)(?:[:,\s-]+)\s*(.*)/i);

              if (optionMatch) {
                const label = optionMatch[1].trim();
                const body = optionMatch[2].trim();

                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: 1.45 }}>
                    <span
                      style={{
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: '#b45309',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        fontWeight: 700,
                        fontSize: '0.74rem',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                    >
                      {label}
                    </span>
                    <span style={{ color: 'var(--text-secondary)', flex: 1, lineHeight: 1.55 }}>{body}</span>
                  </div>
                );
              }

              return (
                <div key={idx} style={{ color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  {line}
                </div>
              );
            })}
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
        <span>Tip: Always note why distractors fail to build anti-trap intuition under strict UCAT exam timing.</span>
      </div>
    </div>
  );
}
