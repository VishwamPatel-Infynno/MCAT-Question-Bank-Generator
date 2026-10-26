import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import CustomSelect from '../components/common/CustomSelect';
import {
  fetchQuestions,
  fetchQuestionCounts,
  updateQuestionStatus,
  batchUpdateQuestionStatus
} from '../services/api';
import {
  AiValidatedStatsBar,
  AiValidatedFiltersBar,
  AiValidatedQuestionCard
} from '../components/validated';

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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [expandedPassageIds, setExpandedPassageIds] = useState({});

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState([]);

  // Load questions and counts on manual trigger or filter change
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
    let ignore = false;
    async function init() {
      try {
        const [qsRes, countsRes] = await Promise.all([
          fetchQuestions({ status: 'ai_validated', section: sectionFilter || undefined }),
          fetchQuestionCounts()
        ]);
        if (!ignore) {
          setQuestions(qsRes.questions || []);
          setCounts(countsRes || {});
          if (onRefreshCounts) onRefreshCounts();
        }
      } catch (err) {
        if (!ignore) {
          console.error('Failed to load AI validated questions:', err);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [sectionFilter, onRefreshCounts]);

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

  // Pagination calculation
  const filterKey = `${searchQuery}|${sectionFilter}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedQuestions = useMemo(() => {
    if (pageSize === -1) return filteredQuestions;
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, safeCurrentPage, pageSize]);

  const startIndex = filteredQuestions.length === 0 ? 0 : (pageSize === -1 ? 1 : (safeCurrentPage - 1) * pageSize + 1);
  const endIndex = pageSize === -1 ? filteredQuestions.length : Math.min(safeCurrentPage * pageSize, filteredQuestions.length);

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
          title: 'Success - Question Saved to Bank',
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
          title: 'Success - Saved to Bank',
          message: `Successfully placed ${count} question(s) into Question Bank.`
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

  const handleApproveAllValidated = async () => {
    const allIds = filteredQuestions.map(q => q.id);
    if (allIds.length === 0) return;
    const count = allIds.length;
    setActionInProgress(true);
    try {
      await batchUpdateQuestionStatus(allIds, 'in_bank');
      setQuestions(prev => prev.filter(item => !allIds.includes(item.id)));
      setSelectedIds([]);
      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'All Validated Questions Approved',
          message: `${count} question(s) moved to Question Bank.`
        });
      }
      loadData(true);
    } catch (err) {
      console.error('Approve all validated failed:', err);
      if (onShowToast) {
        onShowToast({ type: 'error', title: 'Action Failed', message: err.message || 'Error updating questions.' });
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
      {/* Header and Metrics */}
      <AiValidatedStatsBar
        counts={counts}
        questionsCount={questions.length}
        refreshing={refreshing}
        onRefresh={() => loadData(false)}
        onNavigateToBank={onNavigateToBank}
      />

      {/* Filter and Bulk Action Toolbar */}
      <AiValidatedFiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sectionFilter={sectionFilter}
        onSectionFilterChange={setSectionFilter}
        totalFiltered={filteredQuestions.length}
        allFilteredSelected={allFilteredSelected}
        onSelectAll={handleSelectAll}
        selectedCount={selectedIds.length}
        actionInProgress={actionInProgress}
        onBulkMoveToBank={handleBulkMoveToBank}
        onBulkDiscard={handleBulkDiscard}
        onApproveAllValidated={handleApproveAllValidated}
      />

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
        /* Questions List */
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {paginatedQuestions.map((q, idx) => (
              <AiValidatedQuestionCard
                key={q.id}
                question={q}
                index={(safeCurrentPage - 1) * pageSize + idx}
                isSelected={selectedIds.includes(q.id)}
                onToggleSelect={handleToggleSelect}
                isPassageExpanded={Boolean(expandedPassageIds[q.id])}
                onTogglePassage={togglePassage}
                onOpenAudit={onOpenAudit}
                onMoveToBank={handleMoveToBankSingle}
                onDiscard={handleDiscardSingle}
                actionInProgress={actionInProgress}
              />
            ))}
          </div>

          {/* Pagination Bar */}
          {filteredQuestions.length > 0 && (
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
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Showing <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{startIndex}-{endIndex}</strong> of <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{filteredQuestions.length}</strong> validated questions
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>Show</span>
                  <CustomSelect
                    id="select-validated-page-size"
                    label="Questions per page"
                    size="sm"
                    value={pageSize}
                    onChange={(newSize) => { setPageSize(Number(newSize)); setCurrentPage(1); }}
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

                {pageSize !== -1 && totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={safeCurrentPage === 1}
                      className="btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '0.76rem', gap: '4px' }}
                      aria-label="Previous Page"
                    >
                      <ChevronLeft size={13} />
                      <span>Prev</span>
                    </button>

                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0 6px', fontWeight: 500 }}>
                      Page {safeCurrentPage} of {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={safeCurrentPage >= totalPages}
                      className="btn-secondary"
                      style={{ padding: '5px 10px', fontSize: '0.76rem', gap: '4px' }}
                      aria-label="Next Page"
                    >
                      <span>Next</span>
                      <ChevronRight size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
