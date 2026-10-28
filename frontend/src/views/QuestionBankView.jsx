import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Database, Sparkles, Eye, X } from 'lucide-react';
import { batchDeleteQuestions, approveQuestion } from '../services/api';
import { useQuestionBank } from '../hooks/useQuestionBank';
import { PaginationBar } from '../components/common';
import { QuestionCard } from '../components/question';
import ExportPrintModal from '../components/modals/ExportPrintModal';
import QuestionBankFilters from '../components/bank/QuestionBankFilters';
import QuestionBankTable from '../components/bank/QuestionBankTable';


export default function QuestionBankView({ onShowToast, onNavigateToWizard }) {
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
    handleUpdate,
    avgScore
  } = useQuestionBank();

  const searchInputRef = useRef(null);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeletingBulk, setIsDeletingBulk] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [inspectingQuestion, setInspectingQuestion] = useState(null);

  const handleUpdateInspectedQuestion = async (updated) => {
    try {
      await approveQuestion(updated);
      setInspectingQuestion(updated);
      if (handleUpdate) handleUpdate(updated);
      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Changes Applied',
          message: 'Question updated in Question Bank.'
        });
      }
    } catch (err) {
      console.error('Failed to update question in bank:', err);
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Update Failed',
          message: 'Could not save question updates to database.'
        });
      }
    }
  };

  // Close inspection modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && inspectingQuestion) {
        setInspectingQuestion(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [inspectingQuestion]);

  const hasActiveFilters = Boolean(searchQuery.trim() || sectionFilter || diffFilter);

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSectionFilter('');
    setDiffFilter('');
  };

  // ─── Pagination ────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Store previous filter criteria to reset page to 1 during render without cascading effect lag
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

  // Focus search on '/'
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

  // ─── Selection Handlers ────────────────────────────────────────────────────
  const handleToggleSelect = useCallback((id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }, []);

  const handleSelectAll = () => {
    const currentIds = paginatedQuestions.map(q => q.id);
    const allCurrentSelected = currentIds.length > 0 && currentIds.every(id => selectedIds.includes(id));
    if (allCurrentSelected) {
      setSelectedIds(prev => prev.filter(id => !currentIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  // ─── Bulk Delete ───────────────────────────────────────────────────────────
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
        onShowToast({ type: 'error', title: 'Deletion Failed', message: err.message || 'Could not delete selected questions.' });
      }
    } finally {
      setIsDeletingBulk(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── Header & Stats Strip ─────────────────────────────────────────── */}
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
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Question Bank
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '5px 12px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              color: 'var(--text-secondary)'
            }}
          >
            <span><strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{questions.length}</strong> {questions.length === 1 ? 'question' : 'questions'}</span>
            <span style={{ color: 'var(--border-light)' }}>•</span>
            <span>
              <strong style={{ color: 'var(--status-success)', fontWeight: 600 }}>{avgScore}</strong>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>/100 avg</span>
            </span>
          </div>

          <button
            type="button"
            id="btn-open-export-studio"
            onClick={() => setShowExportModal(true)}
            className="btn-secondary"
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              gap: '6px',
              opacity: questions.length === 0 ? 0.5 : 1,
              cursor: questions.length === 0 ? 'not-allowed' : 'pointer'
            }}
            disabled={questions.length === 0}
            title={questions.length > 0 ? 'Export & Print' : 'No questions to export'}
          >
            <span>Export &amp; Print</span>
          </button>
        </div>
      </div>

      {/* ── Filters / Search / Bulk Bar ──────────────────────────────────── */}
      <QuestionBankFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchInputRef={searchInputRef}
        sectionFilter={sectionFilter}
        setSectionFilter={setSectionFilter}
        diffFilter={diffFilter}
        setDiffFilter={setDiffFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        questions={questions}
        selectedIds={selectedIds}
        isDeletingBulk={isDeletingBulk}
        hasActiveFilters={hasActiveFilters}
        onSelectAll={handleSelectAll}
        onBulkDelete={handleBulkDelete}
        onClearAllFilters={handleClearAllFilters}
        onNavigateToWizard={onNavigateToWizard}
        onOpenExportModal={() => setShowExportModal(true)}
      />

      {/* ── Question List ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="view-loading-box">
          <div className="view-loading-spinner" />
          <span className="view-loading-text">Loading Question Bank...</span>
        </div>
      ) : questions.length === 0 ? (
        <div className="view-empty-state">
          <div className="view-empty-icon-box">
            <Database size={28} />
          </div>
          <div>
            <h3 className="view-empty-title">No Questions Found</h3>
            <p className="view-empty-desc">
              {hasActiveFilters
                ? 'No questions match your current search or filters. Clear your filters to see more, or create questions.'
                : 'Your Question Bank is currently empty. Create your first practice set to get started!'}
            </p>
          </div>
          {!hasActiveFilters && onNavigateToWizard && (
            <div className="view-empty-actions">
              <button
                type="button"
                id="btn-bank-empty-create"
                onClick={onNavigateToWizard}
                className="btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Sparkles size={14} />
                <span>Create New Questions</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <QuestionBankTable
          paginatedQuestions={paginatedQuestions}
          selectedIds={selectedIds}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          copiedId={copiedId}
          onToggleSelect={handleToggleSelect}
          onCopy={handleCopy}
          onDelete={handleDelete}
          onSelectQuestion={setInspectingQuestion}
        />
      )}

      {/* ── Pagination Bar ────────────────────────────────────────────────── */}
      {!loading && questions.length > 0 && (
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={questions.length}
          itemLabel="questions"
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[
            { value: 10, label: '10' },
            { value: 15, label: '15' },
            { value: 25, label: '25' },
            { value: 50, label: '50' },
            { value: -1, label: 'All' }
          ]}
        />
      )}

      {/* ── Export Modal ──────────────────────────────────────────────────── */}
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

      {/* ── In-Place Question Inspection & Edit Dialog ────────────────────── */}
      {inspectingQuestion && (
        <div
          className="modal-backdrop"
          onClick={() => setInspectingQuestion(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="bank-inspect-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(8, 12, 20, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '960px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-lg)',
              padding: '24px',
              position: 'relative'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-light)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={18} color="var(--brand-primary)" />
                <h3
                  id="bank-inspect-modal-title"
                  style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}
                >
                  Question Inspector &amp; Editorial Desk
                </h3>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setInspectingQuestion(null)}
                style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Close Inspector (Esc)"
              >
                <X size={14} />
                <span>Close</span>
                <span className="kbd-hint" style={{ fontSize: '0.62rem' }}>Esc</span>
              </button>
            </div>

            <QuestionCard
              question={inspectingQuestion}
              isSaved={true}
              onUpdateQuestion={handleUpdateInspectedQuestion}
            />
          </div>
        </div>
      )}
    </div>
  );
}
