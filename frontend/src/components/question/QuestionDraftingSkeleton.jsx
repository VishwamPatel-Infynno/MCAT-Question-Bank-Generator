import React from 'react';
import { Sparkles, Layers } from 'lucide-react';

export default function QuestionDraftingSkeleton({
  sectionLabel = 'MCAT Section',
  difficulty = 'Medium',
  interactionType = 'single_choice',
  isPassage = false,
  slotNumber = 1
}) {
  const isMulti = interactionType === 'multi_choice';
  const diffBadgeClass = difficulty.toLowerCase() === 'easy'
    ? 'badge-emerald'
    : difficulty.toLowerCase() === 'hard'
    ? 'badge-rose'
    : 'badge-amber';

  return (
    <div
      className="glass-panel"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-medium)',
        background: 'var(--bg-surface-elevated)',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        minHeight: '380px'
      }}
    >
      {/* Top Header Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--border-light)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--brand-primary)'
            }}
          >
            <span className="agent-pulse-dot" style={{ width: 6, height: 6 }} />
            Drafting Question {slotNumber}
          </span>

          <span style={{ color: 'var(--border-medium)' }}>|</span>

          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {sectionLabel}
          </span>

          <span className={`badge ${diffBadgeClass}`} style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}>
            {difficulty}
          </span>

          <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
            {isMulti ? 'Multiple Answers' : 'Single Answer'}
          </span>

          {isPassage && (
            <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
              Reading Passage
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <Sparkles size={13} color="var(--brand-primary)" />
          <span>Synthesizing Authentic AAMC MCAT Item</span>
        </div>
      </div>

      {/* Reading Passage Shimmer (if passage mode active) */}
      {isPassage && (
        <div
          style={{
            padding: '16px',
            background: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
            <Layers size={13} color="var(--brand-primary)" />
            <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Reading Passage
            </span>
          </div>
          <div className="skeleton-shimmer" style={{ height: '12px', width: '100%' }} />
          <div className="skeleton-shimmer" style={{ height: '12px', width: '95%' }} />
          <div className="skeleton-shimmer" style={{ height: '12px', width: '88%' }} />
          <div className="skeleton-shimmer" style={{ height: '12px', width: '70%' }} />
        </div>
      )}

      {/* Question Stem Shimmer Lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Question Stem
        </div>
        <div className="skeleton-shimmer" style={{ height: '16px', width: '92%' }} />
        <div className="skeleton-shimmer" style={{ height: '16px', width: '100%' }} />
        <div className="skeleton-shimmer" style={{ height: '16px', width: '64%' }} />
      </div>

      {/* Options Shimmer Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
        {['A', 'B', 'C', 'D'].map((letter, idx) => (
          <div
            key={letter}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-light)'
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                flexShrink: 0
              }}
            >
              {letter}
            </div>
            <div
              className="skeleton-shimmer"
              style={{
                height: '14px',
                width: `${75 - (idx * 8)}%`,
                minWidth: '40%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Footer reassurance */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.7rem',
          color: 'var(--text-muted)'
        }}
      >
        <span>Balancing answer choices and exam quality</span>
        <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>
          Target Quality: 90+ Score
        </span>
      </div>
    </div>
  );
}
