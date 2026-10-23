import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import {
  fetchQuestions,
  fetchQuestionCounts,
  updateQuestionStatus,
  batchUpdateQuestionStatus
} from '../../services/api';
import AiValidatedStatsBar from './AiValidatedStatsBar';
import AiValidatedFiltersBar from './AiValidatedFiltersBar';
import AiValidatedQuestionCard from './AiValidatedQuestionCard';

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredQuestions.map((q, idx) => (
            <AiValidatedQuestionCard
              key={q.id}
              question={q}
              index={idx}
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
      )}
    </div>
  );
}
