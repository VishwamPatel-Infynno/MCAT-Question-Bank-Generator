import React from 'react';
import {
  Search,
  ArrowUpDown,
  Trash2,
  FileDown,
  CheckSquare,
  Square,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import CustomSelect from '../common/CustomSelect';

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'score_desc', label: 'Highest Score' },
  { id: 'score_asc', label: 'Lowest Score' },
  { id: 'difficulty', label: 'Difficulty Level' }
];

const SECTION_FILTER_OPTIONS = [
  { id: '', label: 'All Sections' },
  { id: 'chem_phys', label: 'Chem / Phys' },
  { id: 'cars', label: 'CARS' },
  { id: 'bio_biochem', label: 'Bio / Biochem' },
  { id: 'psych_soc', label: 'Psych / Soc' }
];

const DIFFICULTY_FILTER_OPTIONS = [
  { id: '', label: 'All Levels' },
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' }
];

/**
 * QuestionBankFilters
 *
 * Renders the search bar, difficulty chips, section pills, sort selector,
 * and bulk-selection action bar for the Question Bank.
 */
export default function QuestionBankFilters({
  searchQuery,
  setSearchQuery,
  searchInputRef,
  sectionFilter,
  setSectionFilter,
  diffFilter,
  setDiffFilter,
  sortBy,
  setSortBy,
  questions,
  selectedIds,
  isDeletingBulk,
  hasActiveFilters,
  onSelectAll,
  onBulkDelete,
  onClearAllFilters,
  onNavigateToWizard,
  onOpenExportModal,
}) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      {/* Search Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div
          style={{
            flex: 1,
            minWidth: '240px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'var(--bg-surface-elevated)',
            padding: '0 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <Search size={14} color="var(--text-muted)" />
          <input
            ref={searchInputRef}
            id="input-bank-search"
            aria-label="Search questions by stem, stimulus, topic, or trap"
            type="text"
            placeholder="Search by stem, stimulus, topic, or trap (Press / to focus)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              padding: '8px 0',
              width: '100%',
              fontSize: '0.82rem',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
          <span className="kbd-hint" style={{ fontSize: '0.62rem' }}>/</span>
        </div>

        {/* Difficulty Filter Chips */}
        <div className="pill-track">
          {DIFFICULTY_FILTER_OPTIONS.map(d => {
            const isActive = diffFilter === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setDiffFilter(d.id)}
                className={`pill-track-btn ${isActive ? 'active' : ''}`}
                style={{ padding: '4px 10px', fontSize: '0.74rem' }}
              >
                {d.label}
              </button>
            );
          })}
        </div>

        {/* Sort Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', minWidth: '180px' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
            <ArrowUpDown size={12} /> Sort:
          </span>
          <CustomSelect
            id="select-bank-sort"
            label="Sort Questions"
            size="sm"
            value={sortBy}
            onChange={(newSort) => setSortBy(newSort)}
            options={SORT_OPTIONS.map((opt) => ({ value: opt.id, label: opt.label }))}
            searchable={false}
            align="right"
            style={{ width: '140px' }}
          />
        </div>
      </div>

      {/* Section Horizontal Filter Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        {SECTION_FILTER_OPTIONS.map(sec => {
          const isActive = sectionFilter === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              className={`filter-pill ${isActive ? 'active' : ''}`}
              onClick={() => setSectionFilter(sec.id)}
              style={{ fontSize: '0.74rem', padding: '4px 10px' }}
            >
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bulk Action Bar (When items are selected) */}
      {questions.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onSelectAll}
              className="btn-secondary"
              style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '6px' }}
            >
              {selectedIds.length === questions.length ? (
                <CheckSquare size={13} color="var(--brand-primary)" />
              ) : (
                <Square size={13} />
              )}
              <span>{selectedIds.length === questions.length ? 'Deselect All' : 'Select All'}</span>
            </button>

            {selectedIds.length > 0 && (
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {selectedIds.length} of {questions.length} selected
              </span>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                id="btn-bulk-export-studio"
                onClick={onOpenExportModal}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '6px' }}
                title="Open Export & Print Studio with selected questions"
              >
                <FileDown size={13} />
                <span>Export Selected ({selectedIds.length})</span>
              </button>

              <button
                onClick={onBulkDelete}
                disabled={isDeletingBulk}
                className="btn-danger"
                style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '6px' }}
              >
                <Trash2 size={13} />
                <span>{isDeletingBulk ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty-state filter clear / wizard CTA (shown when filtered to 0 results) */}
      {questions.length === 0 && hasActiveFilters && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
          <button
            type="button"
            id="btn-bank-clear-filters"
            onClick={onClearAllFilters}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '6px' }}
          >
            <RotateCcw size={13} />
            <span>Clear Active Filters</span>
          </button>
          {onNavigateToWizard && (
            <button
              type="button"
              id="btn-bank-empty-create"
              onClick={onNavigateToWizard}
              className="btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.78rem', gap: '6px' }}
            >
              <Sparkles size={13} />
              <span>Create Questions in Wizard</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
