import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  Trash2,
  Database,
  RefreshCw,
  Search,
  Filter,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import {
  fetchQuestions,
  fetchQuestionCounts,
  updateQuestionStatus,
  batchUpdateQuestionStatus
} from '../../services/api';
import { MCAT_SECTION_LABELS, MCAT_SECTIONS_FALLBACK } from '../../constants/mcat';

export default function AiValidatedQuestionsView({
  onOpenAudit,
  onNavigateToBank,
  onNavigateToBatches,
  onNavigateToWizard,
  onShowToast,
  onRefreshCounts
}) {
  const [questions, setQuestions] = useState([]);
  const [counts, setCounts] = useState({ ai_validated: 0, in_bank: 0, discarded: 0, below_threshold: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [expandedPassageIds, setExpandedPassageIds] = useState({});

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Load questions and counts
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [qsRes, countsRes] = await Promise.all([
        fetchQuestions({ status: 'ai_validated', section: sectionFilter || undefined }),
        fetchQuestionCounts()
      ]);
      setQuestions(qsRes.questions || []);
      setCounts(countsRes || {});
      if (onRefreshCounts) onRefreshCounts();
    } catch (err) {
      console.error('Failed to load AI validated questions:', err);
      if (!isSilent && onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Load Failed',
          message: 'Could not fetch validated questions from database.'
        });
      }
    } finally {
      setLoading(false);
      if (!isSilent) setRefreshing(false);
    }
  }, [sectionFilter, onRefreshCounts, onShowToast]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Filtered in-memory questions by search query
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questions;
    const q = searchQuery.toLowerCase().trim();
    return questions.filter(item =>
      (item.question_stem && item.question_stem.toLowerCase().includes(q)) ||
      (item.subtopic && item.subtopic.toLowerCase().includes(q)) ||
      (item.explanation && item.explanation.toLowerCase().includes(q)) ||
      (item.stimulus_text && item.stimulus_text.toLowerCase().includes(q))
    );
  }, [questions, searchQuery]);

  // Toggle single selection
  const handleToggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Toggle select all
  const handleSelectAll = () => {
    const currentIds = filteredQuestions.map(q => q.id);
    const allSelected = currentIds.length > 0 && currentIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !currentIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  // Single question actions
  const handleMoveToBankSingle = async (q) => {
    setActionInProgress(true);
    try {
      await updateQuestionStatus(q.id, 'in_bank');
      setQuestions(prev => prev.filter(item => item.id !== q.id));
      setSelectedIds(prev => prev.filter(id => id !== q.id));
      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Question Moved to Bank',
          message: 'Question is now available in your Question Bank.'
        });
      }
      loadData(true);
    } catch (err) {
      console.error('Error promoting question:', err);
      if (onShowToast) {
        onShowToast({ type: 'error', title: 'Action Failed', message: err.message || 'Could not move question.' });
      }
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDiscardSingle = async (q) => {
    setActionInProgress(true);
    try {
      await updateQuestionStatus(q.id, 'discarded');
      setQuestions(prev => prev.filter(item => item.id !== q.id));
      setSelectedIds(prev => prev.filter(id => id !== q.id));
      if (onShowToast) {
        onShowToast({
          type: 'info',
          title: 'Question Discarded',
          message: 'Question has been marked as discarded.'
        });
      }
      loadData(true);
    } catch (err) {
      console.error('Error discarding question:', err);
      if (onShowToast) {
        onShowToast({ type: 'error', title: 'Action Failed', message: err.message || 'Could not discard question.' });
      }
    } finally {
      setActionInProgress(false);
    }
  };

  // Bulk actions
  const handleBulkMoveToBank = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    setActionInProgress(true);
    try {
      await batchUpdateQuestionStatus(selectedIds, 'in_bank');
      setQuestions(prev => prev.filter(item => !selectedIds.includes(item.id)));
      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Bulk Saved to Bank',
          message: `${count} question(s) placed into Question Bank.`
        });
      }
      setSelectedIds([]);
      loadData(true);
    } catch (err) {
      console.error('Bulk move failed:', err);
      if (onShowToast) {
        onShowToast({ type: 'error', title: 'Bulk Move Failed', message: err.message || 'Error updating questions.' });
      }
    } finally {
      setActionInProgress(false);
    }
  };

  const handleBulkDiscard = async () => {
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    if (!window.confirm(`Are you sure you want to discard ${count} selected question(s)?`)) return;
    setActionInProgress(true);
    try {
      await batchUpdateQuestionStatus(selectedIds, 'discarded');
      setQuestions(prev => prev.filter(item => !selectedIds.includes(item.id)));
      if (onShowToast) {
        onShowToast({
          type: 'info',
          title: 'Questions Discarded',
          message: `${count} question(s) marked as discarded.`
        });
      }
      setSelectedIds([]);
      loadData(true);
    } catch (err) {
      console.error('Bulk discard failed:', err);
      if (onShowToast) {
        onShowToast({ type: 'error', title: 'Bulk Discard Failed', message: err.message || 'Error updating questions.' });
      }
    } finally {
      setActionInProgress(false);
    }
  };

  const togglePassage = (id) => {
    setExpandedPassageIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const allFilteredSelected =
    filteredQuestions.length > 0 && filteredQuestions.every(q => selectedIds.includes(q.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* View Header */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--status-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ShieldCheck size={18} />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                AI Validated Questions
              </h2>
              <span
                style={{
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: 'var(--status-success)',
                  borderRadius: '12px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  border: '1px solid rgba(16, 185, 129, 0.25)'
                }}
              >
                Score &gt; 90 Benchmark Passed
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
              Candidate questions generated and verified with psychometric score &gt; 90. Review and select questions to place into your official Question Bank or discard.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => loadData(false)}
              disabled={refreshing}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', fontSize: '0.78rem' }}
              title="Refresh AI Validated Questions"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            {onNavigateToBank && (
              <button
                type="button"
                onClick={onNavigateToBank}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', fontSize: '0.78rem' }}
              >
                <Database size={13} />
                <span>Open Question Bank</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-light)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending AI Validated:</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--status-success)' }}>
              {counts.ai_validated || questions.length}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>In Question Bank:</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
              {counts.in_bank || 0}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Discarded:</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-muted)' }}>
              {counts.discarded || 0}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Below Threshold (&le;90):</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f59e0b' }}>
              {counts.below_threshold || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Bulk Actions Bar */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        {/* Left: Search & Section Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '360px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              placeholder="Search stem, passage, subtopic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{
                paddingLeft: '32px',
                fontSize: '0.78rem',
                height: '34px',
                width: '100%'
              }}
            />
          </div>

          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="input-field"
            style={{ fontSize: '0.78rem', height: '34px', minWidth: '180px' }}
          >
            <option value="">All Sections</option>
            {MCAT_SECTIONS_FALLBACK.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.label}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Selection & Bulk Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {filteredQuestions.length > 0 && (
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                marginRight: '6px',
                userSelect: 'none'
              }}
            >
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={handleSelectAll}
                style={{ accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
              />
              <span>Select All ({filteredQuestions.length})</span>
            </label>
          )}

          {selectedIds.length > 0 && (
            <>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {selectedIds.length} selected
              </span>

              <button
                type="button"
                onClick={handleBulkMoveToBank}
                disabled={actionInProgress}
                className="btn-primary"
                style={{
                  padding: '6px 14px',
                  fontSize: '0.76rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--status-success)',
                  borderColor: 'var(--status-success)'
                }}
              >
                <Database size={13} />
                <span>Move Selected to Question Bank</span>
              </button>

              <button
                type="button"
                onClick={handleBulkDiscard}
                disabled={actionInProgress}
                className="btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.76rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--status-danger)'
                }}
              >
                <Trash2 size={13} />
                <span>Discard Selected</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '60px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            color: 'var(--text-muted)'
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '2px solid var(--border-medium)',
              borderTopColor: 'var(--brand-primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite'
            }}
          />
          <span style={{ fontSize: '0.85rem' }}>Loading AI Validated Questions...</span>
        </div>
      ) : filteredQuestions.length === 0 ? (
        /* Empty State */
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '50px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--status-success)'
            }}
          >
            <CheckCircle2 size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              No Pending AI Validated Questions
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto' }}>
              {searchQuery || sectionFilter
                ? 'No questions matched your current filter criteria. Try clearing filters.'
                : 'All validated questions have been placed into the Question Bank or discarded. Generate a new batch to review new questions here.'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
            {onNavigateToBatches && (
              <button
                type="button"
                className="btn-primary"
                onClick={onNavigateToBatches}
                style={{ padding: '8px 18px', fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <span>View Batch Activity</span>
                <ArrowRight size={14} />
              </button>
            )}
            {onNavigateToWizard && (
              <button
                type="button"
                className="btn-secondary"
                onClick={onNavigateToWizard}
                style={{ padding: '8px 18px', fontSize: '0.825rem' }}
              >
                Generate Questions
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Questions Grid */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredQuestions.map((q, idx) => {
            const isSelected = selectedIds.includes(q.id);
            const isPassageExpanded = expandedPassageIds[q.id];
            const hasPassage = Boolean(q.stimulus_text && q.stimulus_text.trim());

            return (
              <div
                key={q.id}
                style={{
                  background: isSelected ? 'var(--bg-surface)' : 'var(--bg-surface)',
                  border: isSelected ? '1.5px solid var(--brand-primary)' : '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '16px 18px',
                  boxShadow: isSelected ? '0 0 0 1px var(--brand-primary)' : 'var(--shadow-xs)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {/* Card Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    marginBottom: '10px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(q.id)}
                      style={{ accentColor: 'var(--brand-primary)', cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--brand-primary)' }}>
                      #{idx + 1}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--bg-surface-subtle)',
                        border: '1px solid var(--border-light)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {q.section_label || MCAT_SECTION_LABELS[q.section] || q.section}
                    </span>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--bg-surface-subtle)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      {q.difficulty}
                    </span>
                    {q.image_svg && (
                      <span
                        className="badge-minimal"
                        style={{ fontSize: '0.675rem', padding: '1px 6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        title="Contains Visual Diagram"
                      >
                        <ImageIcon size={10} /> Diagram
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        background: 'rgba(16, 185, 129, 0.12)',
                        color: 'var(--status-success)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Sparkles size={11} />
                      Score {q.final_score}/100
                    </span>
                  </div>
                </div>

                {/* Stimulus / Passage Snippet */}
                {hasPassage && (
                  <div
                    style={{
                      background: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '8px 12px',
                      marginBottom: '12px',
                      fontSize: '0.775rem'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                      onClick={() => togglePassage(q.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        <BookOpen size={12} />
                        <span>Passage Context ({q.stimulus_text.split(/\s+/).length} words)</span>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '2px 6px', fontSize: '0.675rem' }}
                      >
                        {isPassageExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                        <span style={{ marginLeft: '3px' }}>{isPassageExpanded ? 'Hide' : 'View'}</span>
                      </button>
                    </div>

                    {isPassageExpanded && (
                      <div
                        style={{
                          marginTop: '8px',
                          color: 'var(--text-primary)',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                          maxHeight: '240px',
                          overflowY: 'auto'
                        }}
                      >
                        {q.stimulus_text}
                      </div>
                    )}
                  </div>
                )}

                {/* Question Stem */}
                <div
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    lineHeight: 1.45,
                    marginBottom: '12px'
                  }}
                >
                  {q.question_stem}
                </div>

                {/* 4 Options Grid/List */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px', marginBottom: '14px' }}>
                  {(q.options || []).map((opt) => {
                    const isCorrect =
                      (q.correct_answer_ids && q.correct_answer_ids.includes(opt.id)) ||
                      q.correct_answer_id === opt.id;

                    return (
                      <div
                        key={opt.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-xs)',
                          background: isCorrect ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface-subtle)',
                          border: isCorrect ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid var(--border-light)',
                          fontSize: '0.78rem'
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 800,
                            color: isCorrect ? 'var(--status-success)' : 'var(--text-muted)',
                            minWidth: '18px'
                          }}
                        >
                          {opt.id}.
                        </span>
                        <span
                          style={{
                            color: isCorrect ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: isCorrect ? 600 : 400,
                            flex: 1
                          }}
                        >
                          {opt.text}
                        </span>
                        {isCorrect && (
                          <span
                            style={{
                              fontSize: '0.675rem',
                              fontWeight: 700,
                              color: 'var(--status-success)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              marginLeft: 'auto'
                            }}
                          >
                            <CheckCircle2 size={12} /> Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Card Footer: Metadata Tags & Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--border-light)',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Subtopic: <strong>{q.subtopic || 'General'}</strong>
                    </span>
                    {q.primary_trap && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '1px 6px',
                          background: 'var(--bg-surface-subtle)',
                          borderRadius: '4px',
                          color: 'var(--text-secondary)'
                        }}
                      >
                        Trap: {q.primary_trap}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {onOpenAudit && (
                      <button
                        type="button"
                        onClick={() => onOpenAudit(q)}
                        className="btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '0.74rem' }}
                      >
                        Audit Rubric
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDiscardSingle(q)}
                      disabled={actionInProgress}
                      className="btn-secondary"
                      style={{
                        padding: '5px 10px',
                        fontSize: '0.74rem',
                        color: 'var(--status-danger)'
                      }}
                      title="Discard question"
                    >
                      <Trash2 size={12} />
                      <span style={{ marginLeft: '4px' }}>Discard</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleMoveToBankSingle(q)}
                      disabled={actionInProgress}
                      className="btn-primary"
                      style={{
                        padding: '5px 14px',
                        fontSize: '0.74rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'var(--status-success)',
                        borderColor: 'var(--status-success)'
                      }}
                    >
                      <Database size={12} />
                      <span>Place in Bank</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
