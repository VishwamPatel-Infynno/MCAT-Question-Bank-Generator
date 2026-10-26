/**
 * StagedBatchGrid
 *
 * Renders the candidate questions in grid view:
 * - Either grouped into 2 sections (Passage questions + Independent questions) for mixed sets
 * - Or rendered as a uniform responsive grid of slot cards
 */
import React from 'react';

export default function StagedBatchGrid({
  isMixedBatch,
  effectivePassageCount,
  effectiveTotal,
  renderSlotCard
}) {
  if (isMixedBatch) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Section 01: Passage Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '6px',
              borderBottom: '1px solid var(--border-light)',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-purple" style={{ fontSize: '0.65rem', fontWeight: 800 }}>
                SECTION 01
              </span>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Shared Reading Passage Set ({effectivePassageCount} Questions)
              </h3>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Questions 1-{effectivePassageCount} reference the shared stimulus above
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
            {Array.from({ length: effectivePassageCount }).map((_, idx) => renderSlotCard(idx))}
          </div>
        </div>

        {/* Section 02: Independent Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '6px',
              borderBottom: '1px solid var(--border-light)',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-emerald" style={{ fontSize: '0.65rem', fontWeight: 800 }}>
                SECTION 02
              </span>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Independent Standalone Questions ({effectiveTotal - effectivePassageCount} Questions)
              </h3>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Questions {effectivePassageCount + 1}-{effectiveTotal} are independent with individual vignettes
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
            {Array.from({ length: effectiveTotal - effectivePassageCount }).map((_, i) =>
              renderSlotCard(effectivePassageCount + i)
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
      {Array.from({ length: effectiveTotal }).map((_, idx) => renderSlotCard(idx))}
    </div>
  );
}
