import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Database, 
  Search, 
  Trash2, 
  Award, 
  Copy, 
  Check, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  ChevronRight,
  CheckSquare, 
  Square,
  Sparkles,
  HelpCircle,
  FileDown,
  ArrowUpDown,
  Image as ImageIcon,
  RotateCcw
} from 'lucide-react';
import { batchDeleteQuestions } from '../../services/api';
import { useQuestionBank } from '../../hooks/useQuestionBank';
import VisualStimulusViewer from '../question/VisualStimulusViewer';
import SharedPassageCard from '../question/SharedPassageCard';
import CustomSelect from '../common/CustomSelect';
import ExportPrintModal from '../modals/ExportPrintModal';

const SORT_OPTIONS = [
  { id: 'newest', label: 'Newest First' },
  { id: 'score_desc', label: 'Highest Score' },
  { id: 'score_asc', label: 'Lowest Score' },
  { id: 'difficulty', label: 'Difficulty Level' }
];

const SUBTEST_FILTER_OPTIONS = [
  { id: '', label: 'All Subtests' },
  { id: 'verbal_reasoning', label: 'Verbal' },
  { id: 'decision_making', label: 'Decision' },
  { id: 'quantitative_reasoning', label: 'Quantitative' },
  { id: 'abstract_reasoning', label: 'Abstract' },
  { id: 'situational_judgement', label: 'SJT' }
];

const DIFFICULTY_FILTER_OPTIONS = [
  { id: '', label: 'All Levels' },
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' }
];

export default function QuestionBank({ onSelectQuestion, onShowToast, onNavigateToWizard }) {
  const {
    questions,
    loading,
    sectionFilter,
    setSectionFilter,
    diffFilter,
    setDiffFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    copiedId,
    loadQuestions,
    handleDelete,
    handleCopy,
    avgScore
  } = useQuestionBank();

  const searchInputRef = useRef(null);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const hasActiveFilters = Boolean(searchQuery.trim() || sectionFilter || diffFilter);

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSectionFilter('');
    setDiffFilter('');
  };

  // Client-Side Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15); // 10, 15, 25, 50, -1 (All)

  // Reset to first page when filtering or sorting changes (React-recommended pattern)
  const filterKey = `${searchQuery}|${sectionFilter}|${diffFilter}|${sortBy}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(questions.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedQuestions = useMemo(() => {
    if (pageSize === -1) return questions;
    const start = (safeCurrentPage - 1) * pageSize;
    return questions.slice(start, start + pageSize);
  }, [questions, safeCurrentPage, pageSize]);

  const startIndex = questions.length === 0 ? 0 : (pageSize === -1 ? 1 : (safeCurrentPage - 1) * pageSize + 1);
  const endIndex = pageSize === -1 ? questions.length : Math.min(safeCurrentPage * pageSize, questions.length);

  // Focus search listener on '/'
  useEffect(() => {
    const handleSlash = (e) => {
      if (e.key === '/' && document.activeElement?.tagName.toLowerCase() !== 'input') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleSlash);
    return () => window.removeEventListener('keydown', handleSlash);
  }, []);

  const handleToggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const currentIds = paginatedQuestions.map(q => q.id);
    const allCurrentSelected = currentIds.length > 0 && currentIds.every(id => selectedIds.includes(id));
    if (allCurrentSelected) {
      setSelectedIds(prev => prev.filter(id => !currentIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const countToDelete = selectedIds.length;
    if (!window.confirm(`Delete ${countToDelete} selected question(s) from the Question Bank?`)) return;
    setIsDeletingBulk(true);
    try {
      await batchDeleteQuestions(selectedIds);
      setSelectedIds([]);
      await loadQuestions();
      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Questions Deleted',
          message: `Successfully removed ${countToDelete} question(s) from the Question Bank.`
        });
      }
    } catch (err) {
      console.error('Failed to bulk delete questions:', err);
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Deletion Failed',
          message: err.message || 'Could not delete selected questions.'
        });
      }
    } finally {
      setIsDeletingBulk(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Header & Precision Metric Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '4px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              Question Bank
            </h2>
            <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
              Verified Library
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Verified exam questions with full answer explanations and quality metrics.
          </p>
        </div>

        {/* 1-Line Stats Summary Strip & Exports */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '6px 14px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)'
            }}
          >
            <span>
              <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{questions.length}</strong> {questions.length === 1 ? 'question' : 'questions'}
            </span>
            <span style={{ color: 'var(--border-subtle)' }}>&bull;</span>
            <span>
              <strong style={{ color: 'var(--status-success-text)', fontWeight: 700 }}>{avgScore}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>/100 avg</span>
            </span>
            <span style={{ color: 'var(--border-subtle)' }}>&bull;</span>
            <span>
              <strong style={{ color: 'var(--status-purple)', fontWeight: 700 }}>Enterprise Verified</strong>
            </span>
          </div>

          <button
            type="button"
            id="btn-open-export-studio"
            onClick={() => setShowExportModal(true)}
            className="btn-secondary"
            style={{
              padding: '6px 14px',
              fontSize: '0.78rem',
              gap: '6px',
              opacity: questions.length === 0 ? 0.5 : 1,
              cursor: questions.length === 0 ? 'not-allowed' : 'pointer'
            }}
            disabled={questions.length === 0}
            title={questions.length > 0 ? "Open Export & Print Studio" : "No questions to export"}
          >
            <FileDown size={14} />
            <span>Export &amp; Print Studio</span>
          </button>
        </div>
      </div>

      {/* Precision Filter & Search Row */}
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
              options={SORT_OPTIONS.map((opt) => ({
                value: opt.id,
                label: opt.label
              }))}
              searchable={false}
              align="right"
              style={{ width: '140px' }}
            />
          </div>
        </div>

        {/* Subtest Horizontal Filter Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: '2px'
          }}
        >
          {SUBTEST_FILTER_OPTIONS.map(sec => {
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
                onClick={handleSelectAll}
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
                  onClick={() => setShowExportModal(true)}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '6px' }}
                  title="Open Export & Print Studio with selected questions"
                >
                  <FileDown size={13} />
                  <span>Export Selected ({selectedIds.length})</span>
                </button>

                <button
                  onClick={handleBulkDelete}
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
      </div>

      {/* Question Cards List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
            <Sparkles size={16} color="var(--brand-primary)" />
            <span>Loading Question Bank...</span>
          </div>
        </div>
      ) : questions.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '50px 20px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Database size={36} color="var(--text-muted)" style={{ marginBottom: '4px' }} />
          <h3 style={{ fontSize: '0.96rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            No Questions Found
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, maxWidth: '440px' }}>
            {hasActiveFilters
              ? 'No questions match your current search or filters. Clear your filters to see more, or create brand-new questions in the wizard.'
              : 'Your question library is currently empty. Launch the Guided Wizard to generate your first set of exam questions!'}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {hasActiveFilters && (
              <button
                type="button"
                id="btn-bank-clear-filters"
                onClick={handleClearAllFilters}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem', gap: '6px' }}
              >
                <RotateCcw size={13} />
                <span>Clear Active Filters</span>
              </button>
            )}
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
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {paginatedQuestions.map((q) => {
            const isSelected = selectedIds.includes(q.id);
            const isExpanded = expandedId === q.id;

            return (
              <div
                key={q.id}
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                  border: isSelected ? '1px solid var(--border-brand)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  transition: 'background var(--transition-fast), border-color var(--transition-fast)'
                }}
              >
                {/* Main Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  {/* Checkbox & Details */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                    <button
                      onClick={(e) => handleToggleSelect(q.id, e)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px',
                        color: isSelected ? 'var(--brand-primary)' : 'var(--text-muted)',
                        marginTop: '2px'
                      }}
                      title="Select question"
                    >
                      {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Metadata Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.725rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {q.section_label || q.section}
                        </span>

                        {q.subtopic && (
                          <>
                            <span style={{ color: 'var(--border-medium)' }}>•</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{q.subtopic}</span>
                          </>
                        )}

                        <span style={{ color: 'var(--border-medium)' }}>•</span>

                        <span
                          className={`badge ${(q.difficulty || '').toLowerCase() === 'easy' ? 'badge-emerald' : (q.difficulty || '').toLowerCase() === 'hard' ? 'badge-rose' : 'badge-amber'}`}
                          style={{ textTransform: 'capitalize', fontSize: '0.65rem' }}
                        >
                          {q.difficulty}
                        </span>

                        <span className="badge badge-emerald" style={{ fontSize: '0.65rem', fontWeight: 600 }}>
                          <Award size={10} /> {q.final_score}/100
                        </span>

                        {(q.image_svg || q.image_url || q.stage_outcomes?.visual_stimulus?.image_svg || q.stage_outcomes?.visual_stimulus?.image_url || q.stage_outcomes?.passage_visual_stimulus?.image_svg) && (
                          <span className="badge badge-purple" style={{ fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ImageIcon size={10} /> {q.stimulus_text ? 'Passage Diagram' : 'Diagram'}
                          </span>
                        )}

                        {((q.correct_answer_ids && q.correct_answer_ids.length > 1) || q.interaction_type === 'multi_choice') && (
                          <span style={{ color: 'var(--brand-indigo)', fontWeight: 500, fontSize: '0.7rem' }}>
                            • Multi-Choice
                          </span>
                        )}

                        {q.passage_id ? (
                          <span className="badge badge-cyan" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                            Passage Set
                          </span>
                        ) : (q.passage_required === 'Yes' || (q.stimulus_text && q.stimulus_text.split(/\s+/).length >= 180)) ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            • Passage
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            • Direct
                          </span>
                        )}

                        {q.primary_trap && q.primary_trap !== 'Automatic' && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                            • Trap: {q.primary_trap.replace(/_/g, ' ')}
                          </span>
                        )}


                      </div>

                      {/* Question Stem */}
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {q.question_stem}
                      </div>

                      {/* Snippet */}
                      {q.stimulus_text && q.stimulus_text.trim() && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '780px' }}>
                          {q.stimulus_text}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Review in Workspace, Expand Details, Copy, Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => onSelectQuestion(q)}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', whiteSpace: 'nowrap', gap: '6px' }}
                      title="Open in Question Generator"
                    >
                      <Eye size={13} /> Open Question
                    </button>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      className="btn-secondary"
                      style={{ padding: '6px' }}
                      title={isExpanded ? 'Collapse preview' : 'Expand preview inline'}
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    <button
                      onClick={(e) => handleCopy(q, e)}
                      className="btn-secondary"
                      style={{ padding: '6px' }}
                      title="Copy formatted question text"
                    >
                      {copiedId === q.id ? <Check size={14} color="var(--status-success-text)" /> : <Copy size={14} />}
                    </button>

                    <button
                      onClick={(e) => handleDelete(q.id, e)}
                      className="btn-danger"
                      style={{ padding: '6px' }}
                      title="Delete question"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Inline Expansion Drawer */}
                {isExpanded && (
                  <div
                    style={{
                      paddingTop: '14px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    {/* Full Stimulus with embedded diagram if present */}
                    {q.stimulus_text && (
                      <SharedPassageCard
                        title={q.passage_id ? 'Shared Reading Passage' : 'Stimulus Vignette'}
                        passageText={q.stimulus_text}
                        questionCount={1}
                        diagramQuestion={q}
                        collapsible={false}
                        style={{ padding: '14px 18px', borderLeft: '3px solid var(--brand-primary)' }}
                      />
                    )}

                    {/* Visual Stimulus for standalone direct questions (without stimulus_text) */}
                    {!q.stimulus_text && <VisualStimulusViewer question={q} />}

                    {/* Options Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {(() => {
                        const correctList = Array.isArray(q.correct_answer_ids) && q.correct_answer_ids.length > 0
                          ? q.correct_answer_ids.map(k => String(k).trim().toUpperCase())
                          : (q.correct_answer_id || '').split(',').map(k => k.trim().toUpperCase()).filter(Boolean);

                        return q.options?.map(opt => {
                          const isCorrect = correctList.includes(opt.id.toUpperCase());
                          return (
                            <div
                              key={opt.id}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 'var(--radius-sm)',
                                background: isCorrect ? 'var(--status-success-bg)' : 'var(--bg-surface-elevated)',
                                border: isCorrect ? '1px solid var(--status-success-border)' : '1px solid var(--border-subtle)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.8rem'
                              }}
                            >
                              <span style={{ fontWeight: 700, color: isCorrect ? 'var(--status-success-text)' : 'var(--text-muted)' }}>
                                {opt.id}:
                              </span>
                              <span style={{ color: isCorrect ? 'var(--status-success-text)' : 'var(--text-primary)', fontWeight: isCorrect ? 600 : 400 }}>
                                {opt.text}
                              </span>
                              {isCorrect && (
                                <span className="badge badge-emerald" style={{ marginLeft: 'auto', fontSize: '0.62rem' }}>
                                  Key
                                </span>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div
                        style={{
                          padding: '12px 16px',
                          background: 'var(--bg-surface-elevated)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.82rem',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.6'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--brand-primary)', marginBottom: '4px' }}>
                          <HelpCircle size={13} /> Explanation &amp; Answer Breakdown
                        </div>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls Bar */}
      {!loading && questions.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            marginTop: '16px',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          {/* Summary Text */}
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Showing <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{startIndex}-{endIndex}</strong> of <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{questions.length}</strong> questions
          </div>

          {/* Controls: Page Size & Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Page Size Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>Show</span>
              <CustomSelect
                id="select-page-size"
                label="Questions per page"
                size="sm"
                value={pageSize}
                onChange={(newSize) => {
                  setPageSize(Number(newSize));
                  setCurrentPage(1);
                }}
                options={[
                  { value: 10, label: '10' },
                  { value: 15, label: '15' },
                  { value: 25, label: '25' },
                  { value: 50, label: '50' },
                  { value: -1, label: 'All' }
                ]}
                searchable={false}
                style={{ width: '75px' }}
              />
              <span>per page</span>
            </div>

            {/* Page Buttons (only if not 'All' and totalPages > 1) */}
            {pageSize !== -1 && totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, Math.min(safeCurrentPage, prev) - 1))}
                  disabled={safeCurrentPage === 1}
                  className="btn-secondary"
                  style={{
                    padding: '5px 8px',
                    fontSize: '0.76rem',
                    opacity: safeCurrentPage === 1 ? 0.35 : 1,
                    cursor: safeCurrentPage === 1 ? 'not-allowed' : 'pointer'
                  }}
                  title="Previous page"
                >
                  <ChevronLeft size={13} />
                </button>

                {/* Numbered page chips */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - safeCurrentPage) <= 1)
                  .map((p, idx, arr) => {
                    const prevPage = arr[idx - 1];
                    const showEllipsis = prevPage && p - prevPage > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', padding: '0 2px' }}>...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(p)}
                          style={{
                            minWidth: '28px',
                            height: '28px',
                            padding: '0 6px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.78rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: p === safeCurrentPage ? '1px solid var(--border-brand)' : '1px solid var(--border-subtle)',
                            background: p === safeCurrentPage ? 'var(--brand-light)' : 'var(--bg-surface-elevated)',
                            color: p === safeCurrentPage ? 'var(--brand-primary)' : 'var(--text-secondary)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, Math.max(safeCurrentPage, prev) + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="btn-secondary"
                  style={{
                    padding: '5px 8px',
                    fontSize: '0.76rem',
                    opacity: safeCurrentPage === totalPages ? 0.35 : 1,
                    cursor: safeCurrentPage === totalPages ? 'not-allowed' : 'pointer'
                  }}
                  title="Next page"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Export & Print Studio Modal */}
      {showExportModal && (
        <ExportPrintModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          allQuestions={questions}
          selectedIds={selectedIds}
          filteredQuestions={questions}
          hasActiveFilters={hasActiveFilters}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}

