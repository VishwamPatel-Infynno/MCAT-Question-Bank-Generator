/**
 * BatchProgressHeader
 *
 * Renders the top panel of the Staged Batch Review:
 * - Title, badge, and description
 * - View mode switcher (Grid / Detailed)
 * - Breakdown chips (question mix, quality score, saved count)
 * - Bulk action toolbar (select all, approve, discard buttons)
 */
import React from 'react';
import {
  CheckCircle2,
  Check,
  Trash2,
  Eye,
  LayoutGrid,
  Columns2,
  Sparkles,
  ShieldCheck,
  FolderCheck,
  Loader2
} from 'lucide-react';

export default function BatchProgressHeader({
  // Batch state
  isGenerating,
  totalCompleted,
  effectiveTotal,
  isSaving,
  // Derived stats
  singleCount,
  passageCount,
  isPassageSet,
  isMixedBatch,
  effectivePassageCount,
  avgScore,
  savedIds,
  allAccepted,
  anyAccepted,
  unsavedCount,
  unsavedSelectedCount,
  selectedCount,
  // View mode
  viewMode,
  setViewMode,
  passageLayoutMode = 'split',
  setPassageLayoutMode,
  // Selection
  handleToggleSelectAll,
  unsavedQuestions,
  // Handlers
  handleApproveSelectedClick,
  handleApproveAllClick,
  handleDiscardUnsavedClick,
  onDiscardAll,
  onNavigateToBank,
  onFinishBatch,
}) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-light)',
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        borderRadius: 'var(--radius-sm)'
      }}
    >
      {/* ── Title & View Mode Switcher ─────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="var(--brand-primary)" />
            <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Review Generated Questions
            </h2>
            <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
              {isGenerating
                ? `${totalCompleted} of ${effectiveTotal} Ready`
                : `${totalCompleted} Generated`}
            </span>
          </div>
        </div>

        <div className="pill-track">
          <button
            type="button"
            id="btn-view-grid"
            onClick={() => setViewMode('grid')}
            className={`pill-track-btn ${viewMode === 'grid' ? 'active' : ''}`}
          >
            <LayoutGrid size={13} />
            <span>Grid View</span>
          </button>
          <button
            type="button"
            id="btn-view-tabs"
            onClick={() => setViewMode('tabs')}
            className={`pill-track-btn ${viewMode === 'tabs' ? 'active' : ''}`}
          >
            <Eye size={13} />
            <span>Detailed View</span>
          </button>
          {isPassageSet && viewMode === 'tabs' && setPassageLayoutMode && (
            <button
              type="button"
              id="btn-toggle-split-layout"
              onClick={() => setPassageLayoutMode(mode => mode === 'split' ? 'stacked' : 'split')}
              className={`pill-track-btn ${passageLayoutMode === 'split' ? 'active' : ''}`}
              title="Toggle AAMC-style side-by-side passage and question view"
            >
              <Columns2 size={13} />
              <span>{passageLayoutMode === 'split' ? 'Split View' : 'Stacked View'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Question Mix Chips & Quality Metrics ──────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '8px 12px',
          background: 'var(--bg-surface-subtle)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.725rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ color: 'var(--text-muted)' }}>Format:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{singleCount} Multiple Choice Questions (A-D)</span>
          <span style={{ color: 'var(--border-light)' }}>•</span>
          <span style={{ fontWeight: 600, color: (isMixedBatch || isPassageSet || passageCount > 0) ? 'var(--brand-primary)' : 'var(--text-secondary)' }}>
            {isMixedBatch
              ? `Mixed Set: ${effectivePassageCount} Passage + ${effectiveTotal - effectivePassageCount} Standalone`
              : isPassageSet
                ? '1 Shared Reading Passage Set'
                : `${passageCount} With Reading Passage${passageCount !== 1 ? 's' : ''}`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
            <ShieldCheck size={13} color="var(--status-success)" />
            <span>Average Quality:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{avgScore}/100</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={13} color="var(--brand-primary)" />
            <span>Saved in Question Bank:</span>
            <strong style={{ color: savedIds.size > 0 ? 'var(--status-success)' : 'var(--text-secondary)' }}>
              {savedIds.size} of {totalCompleted}
            </strong>
          </span>
        </div>
      </div>

      {/* ── Batch Action Toolbar ───────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          borderTop: '1px solid var(--border-light)',
          paddingTop: '12px'
        }}
      >
        {/* Select All Checkbox & Count */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: allAccepted ? 'default' : 'pointer', userSelect: 'none' }}>
          {allAccepted ? (
            <div
              style={{
                width: '15px', height: '15px', borderRadius: '3px',
                background: 'var(--status-success)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: '#ffffff', flexShrink: 0
              }}
              title="All questions saved in Question Bank"
            >
              <Check size={10} strokeWidth={3} />
            </div>
          ) : (
            <input
              type="checkbox"
              aria-label="Select all ready questions"
              checked={unsavedQuestions.length > 0 && unsavedSelectedCount === unsavedQuestions.length}
              onChange={handleToggleSelectAll}
              disabled={totalCompleted === 0}
              style={{ accentColor: 'var(--brand-primary)', width: '15px', height: '15px', cursor: totalCompleted === 0 ? 'not-allowed' : 'pointer' }}
            />
          )}
          <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {allAccepted
              ? `All Saved in Question Bank (${totalCompleted})`
              : anyAccepted
              ? `Select Unsaved (${unsavedCount})`
              : `Select All Ready (${totalCompleted})`}
          </span>
          {!allAccepted && (
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              ({anyAccepted ? `${unsavedSelectedCount} unsaved selected` : `${selectedCount} selected`})
            </span>
          )}
        </label>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {allAccepted ? (
            <>
              {onNavigateToBank && (
                <button
                  type="button"
                  id="btn-view-bank"
                  onClick={onNavigateToBank}
                  className="btn-secondary"
                  style={{ padding: '7px 12px', fontSize: '0.75rem', gap: '6px' }}
                  title="Navigate to Question Bank"
                >
                  <FolderCheck size={14} color="var(--brand-primary)" />
                  <span>View in Question Bank</span>
                </button>
              )}
              {onFinishBatch && (
                <button
                  type="button"
                  id="btn-finish-batch"
                  onClick={onFinishBatch}
                  className="btn-secondary"
                  style={{ padding: '7px 14px', fontSize: '0.75rem', gap: '6px', color: 'var(--status-success)' }}
                  title="Finish reviewing this batch"
                >
                  <CheckCircle2 size={14} color="var(--status-success)" />
                  <span>Finish &amp; Create New Set</span>
                </button>
              )}
            </>
          ) : anyAccepted ? (
            <button
              type="button"
              id="btn-discard-unsaved"
              onClick={handleDiscardUnsavedClick}
              className="btn-secondary"
              style={{ padding: '7px 12px', fontSize: '0.75rem', color: 'var(--status-danger)', gap: '6px' }}
              title={`Discard the ${unsavedCount} unaccepted question(s)`}
            >
              <Trash2 size={13} />
              <span>Discard Unsaved ({unsavedCount})</span>
            </button>
          ) : (
            onDiscardAll && (
              <button
                type="button"
                id="btn-discard-batch"
                onClick={onDiscardAll}
                className="btn-secondary"
                style={{ padding: '7px 12px', fontSize: '0.75rem', color: 'var(--status-danger)' }}
                title="Discard all generated questions"
              >
                <Trash2 size={13} />
                <span>Discard All</span>
              </button>
            )
          )}

          {!allAccepted && (
            <button
              type="button"
              id="btn-approve-selected"
              onClick={handleApproveSelectedClick}
              disabled={unsavedSelectedCount === 0 || isSaving}
              className="btn-secondary"
              style={{ padding: '7px 14px', fontSize: '0.75rem', gap: '6px' }}
            >
              <Check size={14} />
              <span>
                {isSaving ? 'Saving...' : unsavedSelectedCount > 0
                  ? `Save Selected (${unsavedSelectedCount}) to Bank`
                  : 'No Unsaved Selected'}
              </span>
            </button>
          )}

          <button
            type="button"
            id="btn-approve-all"
            onClick={handleApproveAllClick}
            disabled={isSaving || totalCompleted === 0 || allAccepted}
            className="btn-primary"
            style={{
              padding: '7px 16px', fontSize: '0.75rem', fontWeight: 700,
              background: allAccepted ? 'var(--bg-surface-subtle)' : 'var(--status-success)',
              borderColor: allAccepted ? 'var(--border-medium)' : 'var(--status-success)',
              color: allAccepted ? 'var(--status-success)' : '#ffffff',
              gap: '6px',
              boxShadow: allAccepted ? 'none' : 'var(--shadow-sm)',
              cursor: allAccepted ? 'default' : 'pointer'
            }}
          >
            <CheckCircle2 size={15} color={allAccepted ? 'var(--status-success)' : '#ffffff'} />
            <span>
              {allAccepted
                ? 'All Saved in Question Bank'
                : isPassageSet
                  ? `Save Passage Set (${totalCompleted} Qs) to Bank`
                  : `Save All Ready (${totalCompleted}) to Bank`}
            </span>
          </button>
        </div>
      </div>

      {/* Loading indicator while saving */}
      {isSaving && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <Loader2 size={13} className="spin-slow" />
          <span>Saving to Question Bank...</span>
        </div>
      )}
    </div>
  );
}
