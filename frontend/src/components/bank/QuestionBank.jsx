import React, { useState, useRef, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Download, 
  Trash2, 
  Award, 
  Copy, 
  Check, 
  Coins, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  CheckSquare, 
  Square,
  Sparkles,
  HelpCircle,
  FileDown
} from 'lucide-react';
import { getExportUrl, deleteQuestion } from '../../services/api';
import { useQuestionBank } from '../../hooks/useQuestionBank';

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

export default function QuestionBank({ onSelectQuestion, onShowToast }) {
  const {
    questions,
    repoStats,
    loading,
    sectionFilter,
    setSectionFilter,
    diffFilter,
    setDiffFilter,
    searchQuery,
    setSearchQuery,
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
    if (selectedIds.length === questions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map(q => q.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected question(s) from the Question Bank?`)) return;
    setIsDeletingBulk(true);
    try {
      for (const id of selectedIds) {
        await deleteQuestion(id);
      }
      setSelectedIds([]);
      await loadQuestions();
      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Questions Deleted',
          message: `Successfully removed ${selectedIds.length} question(s).`
        });
      }
    } catch (err) {
      console.error('Failed to bulk delete questions:', err);
    } finally {
      setIsDeletingBulk(false);
    }
  };

  const handleBulkExportJson = () => {
    const exportData = selectedIds.length > 0 
      ? questions.filter(q => selectedIds.includes(q.id))
      : questions;
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ucat_selected_${exportData.length}_questions.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (onShowToast) {
      onShowToast({
        type: 'success',
        title: 'Export Complete',
        message: `Exported ${exportData.length} question(s) to JSON.`
      });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Modern Metrics Deck */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              UK UCAT Question Bank Library
            </h2>
            <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
              PostgreSQL 16
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Psychometrically audited items with distractor trap analysis, stored with full stage telemetry.
          </p>
        </div>

        {/* 3 Modern KPI Cards */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Total Questions Card */}
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              minWidth: '100px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
              QUESTIONS
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
              {questions.length}
            </div>
          </div>

          {/* Average Quality Score Card */}
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              minWidth: '100px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
              AVG QUALITY
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981' }}>
              {avgScore}<span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>/100</span>
            </div>
          </div>

          {/* Repository Cost Card */}
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              padding: '10px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              minWidth: '100px',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
              REPO COST
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#6366f1' }}>
              ${repoStats.total_cost_usd.toFixed(4)}
            </div>
          </div>

          {/* Export Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href={getExportUrl('json')}
              download="ucat_questions.json"
              className="btn-secondary"
              style={{ textDecoration: 'none', padding: '8px 12px', fontSize: '0.8rem' }}
              title="Download entire question bank as JSON"
            >
              <Download size={14} /> JSON
            </a>
            <a
              href={getExportUrl('csv')}
              download="ucat_questions.csv"
              className="btn-secondary"
              style={{ textDecoration: 'none', padding: '8px 12px', fontSize: '0.8rem' }}
              title="Download entire question bank as CSV"
            >
              <Download size={14} /> CSV
            </a>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        {/* Search Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div
            style={{
              flex: 1,
              minWidth: '260px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'var(--bg-surface-elevated)',
              padding: '0 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)'
            }}
          >
            <Search size={16} color="var(--text-muted)" />
            <input
              ref={searchInputRef}
              id="input-bank-search"
              type="text"
              placeholder="Search by stem, stimulus, topic, or trap (Press / to focus)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '9px 0',
                width: '100%',
                fontSize: '0.85rem',
                color: 'var(--text-primary)'
              }}
            />
            <span className="kbd-hint" style={{ fontSize: '0.65rem' }}>/</span>
          </div>

          {/* Difficulty Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {DIFFICULTY_FILTER_OPTIONS.map(d => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDiffFilter(d.id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: diffFilter === d.id ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                  background: diffFilter === d.id ? 'var(--brand-primary)' : 'var(--bg-surface-elevated)',
                  color: diffFilter === d.id ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subtest Horizontal Filter Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
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
              borderTop: '1px solid var(--border-light)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={handleSelectAll}
                className="btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '6px' }}
              >
                {selectedIds.length === questions.length ? (
                  <CheckSquare size={14} color="var(--brand-primary)" />
                ) : (
                  <Square size={14} />
                )}
                <span>{selectedIds.length === questions.length ? 'Deselect All' : 'Select All'}</span>
              </button>

              {selectedIds.length > 0 && (
                <span style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>
                  {selectedIds.length} of {questions.length} selected
                </span>
              )}
            </div>

            {selectedIds.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleBulkExportJson}
                  className="btn-secondary"
                  style={{ padding: '5px 12px', fontSize: '0.75rem', gap: '6px' }}
                >
                  <FileDown size={14} />
                  <span>Export Selected ({selectedIds.length})</span>
                </button>

                <button
                  onClick={handleBulkDelete}
                  disabled={isDeletingBulk}
                  className="btn-danger"
                  style={{ padding: '5px 12px', fontSize: '0.75rem', gap: '6px' }}
                >
                  <Trash2 size={14} />
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
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem' }}>
            <Sparkles size={18} color="var(--brand-primary)" className="pulse-glowing" />
            <span>Loading Question Bank...</span>
          </div>
        </div>
      ) : questions.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <Database size={44} color="var(--text-muted)" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '6px' }}>No Questions Found</h3>
          <p style={{ fontSize: '0.825rem' }}>
            No questions match your current filters. Clear filters or generate new questions in the Studio.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {questions.map((q) => {
            const isSelected = selectedIds.includes(q.id);
            const isExpanded = expandedId === q.id;

            return (
              <div
                key={q.id}
                className="glass-panel"
                style={{
                  padding: '18px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                  border: isSelected ? '1px solid var(--border-brand)' : '1px solid var(--border-light)',
                  boxShadow: isSelected ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {/* Main Row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                  {/* Checkbox & Details */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
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
                      {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Metadata Badges */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="badge badge-cyan">{q.section_label || q.section}</span>
                        <span className="badge badge-purple">{q.subtopic}</span>
                        <span
                          className={`badge ${(q.difficulty || '').toLowerCase() === 'easy' ? 'badge-emerald' : (q.difficulty || '').toLowerCase() === 'hard' ? 'badge-rose' : 'badge-amber'}`}
                          style={{ textTransform: 'capitalize' }}
                        >
                          {q.difficulty}
                        </span>
                        <span className="badge badge-emerald">
                          <Award size={12} /> {q.final_score}/100
                        </span>

                        {q.id && (
                          <span
                            className="badge badge-cyan"
                            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', cursor: 'pointer' }}
                            title={`UUID: ${q.id} (Click to copy)`}
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(q.id); }}
                          >
                            ID: {q.id.slice(0, 8)}...
                          </span>
                        )}

                        {q.combination_id && (
                          <span
                            className="badge badge-indigo"
                            style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                          >
                            {q.combination_id}
                          </span>
                        )}

                        {q.primary_trap && (
                          <span className="badge badge-rose">
                            Trap: {q.primary_trap}
                          </span>
                        )}

                        {q.total_tokens !== undefined && q.total_tokens > 0 && (
                          <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                            <Coins size={11} /> {q.total_tokens.toLocaleString()} tok &bull; ${q.cost_usd?.toFixed(5)}
                          </span>
                        )}
                      </div>

                      {/* Question Stem */}
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                        {q.question_stem}
                      </div>

                      {/* Snippet */}
                      {q.stimulus_text && (
                        <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '780px' }}>
                          {q.stimulus_text}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions: Review in Studio, Expand Details, Copy, Delete */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => onSelectQuestion(q)}
                      className="btn-primary"
                      style={{ padding: '8px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap', gap: '6px' }}
                      title="Inspect in Question Studio"
                    >
                      <Eye size={14} /> Review in Studio
                    </button>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : q.id)}
                      className="btn-secondary"
                      style={{ padding: '8px' }}
                      title={isExpanded ? 'Collapse preview' : 'Expand preview inline'}
                    >
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>

                    <button
                      onClick={(e) => handleCopy(q, e)}
                      className="btn-secondary"
                      style={{ padding: '8px' }}
                      title="Copy formatted question text"
                    >
                      {copiedId === q.id ? <Check size={15} color="#10b981" /> : <Copy size={15} />}
                    </button>

                    <button
                      onClick={(e) => handleDelete(q.id, e)}
                      className="btn-danger"
                      style={{ padding: '8px' }}
                      title="Delete question"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Inline Expansion Drawer */}
                {isExpanded && (
                  <div
                    style={{
                      paddingTop: '14px',
                      borderTop: '1px solid var(--border-light)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    {/* Full Stimulus */}
                    {q.stimulus_text && (
                      <div
                        style={{
                          background: 'var(--bg-canvas)',
                          padding: '14px 18px',
                          borderRadius: 'var(--radius-md)',
                          borderLeft: '4px solid var(--brand-primary)',
                          fontSize: '0.875rem',
                          lineHeight: '1.6',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <div style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Full Stimulus Vignette
                        </div>
                        {q.stimulus_text}
                      </div>
                    )}

                    {/* Options Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {q.options?.map(opt => {
                        const isCorrect = opt.id === q.correct_answer_id;
                        return (
                          <div
                            key={opt.id}
                            style={{
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: isCorrect ? 'var(--status-success-bg)' : 'var(--bg-surface-elevated)',
                              border: isCorrect ? '1px solid var(--status-success-border)' : '1px solid var(--border-light)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              fontSize: '0.825rem'
                            }}
                          >
                            <span style={{ fontWeight: 800, color: isCorrect ? '#10b981' : 'var(--text-muted)' }}>
                              {opt.id}:
                            </span>
                            <span style={{ color: isCorrect ? '#10b981' : 'var(--text-primary)', fontWeight: isCorrect ? 700 : 400 }}>
                              {opt.text}
                            </span>
                            {isCorrect && (
                              <span className="badge badge-emerald" style={{ marginLeft: 'auto', fontSize: '0.625rem' }}>
                                Correct
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    {q.explanation && (
                      <div
                        style={{
                          padding: '12px 16px',
                          background: 'var(--bg-surface-elevated)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)',
                          fontSize: '0.825rem',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.6'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '4px' }}>
                          <HelpCircle size={14} /> Rationale &amp; Distractor Analysis
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
    </div>
  );
}
