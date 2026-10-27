import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Database, Sparkles } from 'lucide-react';
import { batchDeleteQuestions } from '../services/api';
import { useQuestionBank } from '../hooks/useQuestionBank';
import { PaginationBar } from '../components/common';
import ExportPrintModal from '../components/modals/ExportPrintModal';
import QuestionBankFilters from '../components/bank/QuestionBankFilters';
import QuestionBankTable from '../components/bank/QuestionBankTable';


export default function QuestionBankView({ onSelectQuestion, onShowToast, onNavigateToWizard }) {
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
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem('infynno_qb_view_mode') || 'grid';
    } catch {
      return 'grid';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('infynno_qb_view_mode', viewMode);
    } catch {
      // ignore
    }
  }, [viewMode]);

  const hasActiveFilters = Boolean(searchQuery.trim() || sectionFilter || diffFilter);

  const handleClearAllFilters = () => {
    setSearchQuery('');
    setSectionFilter('');
    setDiffFilter('');
  };

  // ─── Pagination ────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

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
  const handleToggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              Question Bank
            </h2>
            <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>Verified Library</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Verified exam questions with full answer explanations and quality metrics.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '6px 14px',
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
              padding: '6px 14px',
              fontSize: '0.78rem',
              gap: '6px',
              opacity: questions.length === 0 ? 0.5 : 1,
              cursor: questions.length === 0 ? 'not-allowed' : 'pointer'
            }}
            disabled={questions.length === 0}
            title={questions.length > 0 ? 'Open Export & Print Exam' : 'No questions to export'}
          >
            <span>Export &amp; Print Exam</span>
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
        viewMode={viewMode}
        setViewMode={setViewMode}
        onSelectAll={handleSelectAll}
        onBulkDelete={handleBulkDelete}
        onClearAllFilters={handleClearAllFilters}
        onNavigateToWizard={onNavigateToWizard}
        onOpenExportModal={() => setShowExportModal(true)}
      />

      {/* ── Question List ─────────────────────────────────────────────────── */}
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
          <h3 style={{ fontSize: '0.96rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>No Questions Found</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, maxWidth: '440px' }}>
            {hasActiveFilters
              ? 'No questions match your current search or filters. Clear your filters to see more, or create questions.'
              : 'Your Question Bank is currently empty. Create your first practice set to get started!'}
          </p>
          {!hasActiveFilters && onNavigateToWizard && (
            <button
              type="button"
              id="btn-bank-empty-create"
              onClick={onNavigateToWizard}
              className="btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.78rem', gap: '6px', marginTop: '12px' }}
            >
              <Sparkles size={13} />
              <span>Create New Questions</span>
            </button>
          )}
        </div>
      ) : (
        <QuestionBankTable
          viewMode={viewMode}
          paginatedQuestions={paginatedQuestions}
          selectedIds={selectedIds}
          expandedId={expandedId}
          setExpandedId={setExpandedId}
          copiedId={copiedId}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onCopy={handleCopy}
          onDelete={handleDelete}
          onSelectQuestion={onSelectQuestion}
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
    </div>
  );
}
