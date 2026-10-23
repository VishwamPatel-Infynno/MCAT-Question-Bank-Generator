import React from 'react';

/**
 * StagedSlotSkeleton:
 * Renders an animated drafting placeholder card with skeleton shimmers
 * while an individual question in a batch is being synthesized and reviewed.
 *
 * Props:
 * - slotNumber: number - Numerical slot index (1-based)
 * - qState: object - Current agent state of the question slot
 * - isLinked: boolean - Whether this item is passage-linked
 * - isMixedBatch: boolean - Whether batch is a mixed set
 * - effectiveTotal: number - Total questions in current batch
 */
export default function StagedSlotSkeleton({
  slotNumber,
  qState,
  isLinked = false,
  isMixedBatch = false,
  effectiveTotal = 5
}) {
  const isMulti = qState?.interactionType === 'multi_choice';
  const isPassage = qState?.passageRequired === 'Yes';

  return (
    <div
      key={`slot-generating-${slotNumber}`}
      className="glass-panel"
      style={{
        padding: '20px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-medium)',
        background: 'var(--bg-surface-elevated)',
        minHeight: '280px',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative'
      }}
    >
      {/* Card Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Question {slotNumber}
          </span>
          <span className="badge badge-indigo" style={{ fontSize: '0.675rem' }}>
            {isMulti ? 'Multiple Answers' : 'Single Answer'}
          </span>
          {isLinked ? (
            <span className="badge badge-cyan" style={{ fontSize: '0.675rem' }}>
              Passage Set
            </span>
          ) : isMixedBatch ? (
            <span className="badge badge-emerald" style={{ fontSize: '0.675rem' }}>
              Independent
            </span>
          ) : isPassage ? (
            <span className="badge badge-cyan" style={{ fontSize: '0.675rem' }}>
              Reading Passage
            </span>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            borderRadius: 'var(--radius-xs)',
            background: 'var(--brand-light)',
            border: '1px solid var(--border-brand)',
            fontSize: '0.675rem',
            fontWeight: 600,
            color: 'var(--brand-primary)'
          }}
        >
          <span className="agent-pulse-dot" style={{ width: '6px', height: '6px' }} />
          <span>Drafting in progress...</span>
        </div>
      </div>

      {/* Question Stem Shimmer Lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="skeleton-shimmer" style={{ height: '14px', width: '90%' }} />
        <div className="skeleton-shimmer" style={{ height: '14px', width: '98%' }} />
        <div className="skeleton-shimmer" style={{ height: '14px', width: '60%' }} />
      </div>

      {/* Options Shimmer Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {['A', 'B', 'C', 'D'].map((letter, optIdx) => (
          <div
            key={letter}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-light)'
            }}
          >
            <div
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
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
                height: '12px',
                width: `${70 - optIdx * 8}%`,
                minWidth: '40%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Card Footer Reassurance */}
      <div
        style={{
          marginTop: 'auto',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.675rem',
          color: 'var(--text-muted)'
        }}
      >
        <span>Slot {slotNumber} of {effectiveTotal} • Calibrating options</span>
        <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Autonomous Pipeline Active</span>
      </div>
    </div>
  );
}
