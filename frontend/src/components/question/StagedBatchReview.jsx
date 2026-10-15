import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Check,
  Trash2,
  Eye,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ListChecks,
  Award,
  Sparkles,
  ShieldCheck,
  FileText
} from 'lucide-react';
import QuestionCard from './QuestionCard';

export default function StagedBatchReview({
  stagedQuestions = [],
  onApproveSelected,
  onApproveAll,
  onDiscardQuestion,
  onDiscardAll,
  onOpenAudit,
  onUpdateQuestion
}) {
  // State for which questions are selected for commit
  const [selectedIds, setSelectedIds] = useState(() => new Set(stagedQuestions.map(q => q.id)));
  // State for which questions have already been persisted to PostgreSQL
  const [savedIds, setSavedIds] = useState(() => new Set());
  // Active question index in tabbed view
  const [activeIdx, setActiveIdx] = useState(0);
  // View mode: 'tabs' (detailed carousel) | 'grid' (all cards comparison)
  const [viewMode, setViewMode] = useState('tabs');
  // Loading state during batch saving
  const [isSaving, setIsSaving] = useState(false);

  // Sync selectedIds if new questions arrive during streaming
  React.useEffect(() => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      stagedQuestions.forEach(q => {
        if (!prev.has(q.id) && !savedIds.has(q.id)) {
          next.add(q.id);
        }
      });
      return next;
    });
  }, [stagedQuestions, savedIds]);

  if (!stagedQuestions || stagedQuestions.length === 0) {
    return null;
  }

  // Clamped active question
  const validIdx = Math.max(0, Math.min(activeIdx, stagedQuestions.length - 1));
  const activeQuestion = stagedQuestions[validIdx];

  // Batch stats
  const totalCount = stagedQuestions.length;
  const selectedCount = selectedIds.size;
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;

  const { singleCount, multiCount, passageCount, avgScore } = useMemo(() => {
    let single = 0;
    let multi = 0;
    let passage = 0;
    let scoreSum = 0;

    stagedQuestions.forEach(q => {
      const isMulti = q.interaction_type === 'multi_choice' || (Array.isArray(q.correct_answer_ids) && q.correct_answer_ids.length > 1);
      if (isMulti) multi++;
      else single++;

      const wordCount = q.stimulus_text ? q.stimulus_text.trim().split(/\s+/).length : 0;
      if (q.passage_required === 'Yes' || wordCount >= 180) passage++;

      scoreSum += (q.final_score || 95);
    });

    return {
      singleCount: single,
      multiCount: multi,
      passageCount: passage,
      avgScore: totalCount > 0 ? (scoreSum / totalCount).toFixed(1) : '95.0'
    };
  }, [stagedQuestions, totalCount]);

  // Toggle selection for an individual question
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle select all
  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(stagedQuestions.map(q => q.id)));
    }
  };

  // Commit selected questions to database
  const handleApproveSelectedClick = async () => {
    if (selectedCount === 0 || isSaving) return;
    const questionsToApprove = stagedQuestions.filter(q => selectedIds.has(q.id) && !savedIds.has(q.id));
    if (questionsToApprove.length === 0) return;

    setIsSaving(true);
    try {
      if (onApproveSelected) {
        await onApproveSelected(questionsToApprove);
      }
      setSavedIds(prev => {
        const next = new Set(prev);
        questionsToApprove.forEach(q => next.add(q.id));
        return next;
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Commit all questions to database
  const handleApproveAllClick = async () => {
    if (isSaving) return;
    const unsaved = stagedQuestions.filter(q => !savedIds.has(q.id));
    if (unsaved.length === 0) return;

    setIsSaving(true);
    try {
      if (onApproveAll) {
        await onApproveAll(unsaved);
      }
      setSavedIds(prev => {
        const next = new Set(prev);
        unsaved.forEach(q => next.add(q.id));
        return next;
      });
      setSelectedIds(new Set(stagedQuestions.map(q => q.id)));
    } finally {
      setIsSaving(false);
    }
  };

  // Approve a single question
  const handleApproveSingle = async (q) => {
    if (isSaving || savedIds.has(q.id)) return;
    setIsSaving(true);
    try {
      if (onApproveSelected) {
        await onApproveSelected([q]);
      }
      setSavedIds(prev => new Set([...prev, q.id]));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Staged Batch Summary & Controls Header */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          borderRadius: 'var(--radius-md)'
        }}
      >
        {/* Top Title & Stats Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} color="var(--brand-primary)" />
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Staged Batch Review &amp; Confirmation
              </h2>
              <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                {totalCount} Generated
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
              Verify candidates. Select which questions to commit to the Question Bank or approve all at once.
            </p>
          </div>

          {/* View Mode Switcher */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-surface-subtle)',
              padding: '3px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)'
            }}
          >
            <button
              type="button"
              id="btn-view-tabs"
              onClick={() => setViewMode('tabs')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                background: viewMode === 'tabs' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: viewMode === 'tabs' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '0.725rem',
                fontWeight: viewMode === 'tabs' ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              <Eye size={13} />
              <span>Detail Tab</span>
            </button>
            <button
              type="button"
              id="btn-view-grid"
              onClick={() => setViewMode('grid')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                background: viewMode === 'grid' ? 'var(--bg-surface-elevated)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontSize: '0.725rem',
                fontWeight: viewMode === 'grid' ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              <LayoutGrid size={13} />
              <span>Grid View</span>
            </button>
          </div>
        </div>

        {/* Breakdown Chips & Psychometric Quality Metrics */}
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
            <span style={{ color: 'var(--text-muted)' }}>Composition:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {singleCount} Single Choice
            </span>
            <span style={{ color: 'var(--border-light)' }}>•</span>
            <span style={{ fontWeight: 600, color: multiCount > 0 ? '#818cf8' : 'var(--text-secondary)' }}>
              {multiCount} Multi-Choice
            </span>
            <span style={{ color: 'var(--border-light)' }}>•</span>
            <span style={{ fontWeight: 600, color: passageCount > 0 ? '#38bdf8' : 'var(--text-secondary)' }}>
              {passageCount} Reading Passage{passageCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
              <ShieldCheck size={13} color="var(--status-success)" />
              <span>Avg Quality:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{avgScore}/100</strong>
            </span>

            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={13} color="var(--brand-primary)" />
              <span>Saved in DB:</span>
              <strong style={{ color: savedIds.size > 0 ? 'var(--status-success)' : 'var(--text-secondary)' }}>
                {savedIds.size} of {totalCount}
              </strong>
            </span>
          </div>
        </div>

        {/* Batch Action Toolbar */}
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
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleToggleSelectAll}
              style={{
                accentColor: 'var(--brand-primary)',
                width: '15px',
                height: '15px',
                cursor: 'pointer'
              }}
            />
            <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Select All ({totalCount})
            </span>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              ({selectedCount} selected)
            </span>
          </label>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Discard Batch Button */}
            {onDiscardAll && (
              <button
                type="button"
                id="btn-discard-batch"
                onClick={onDiscardAll}
                className="btn-secondary"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  color: 'var(--status-danger)'
                }}
                title="Discard all generated candidate questions"
              >
                <Trash2 size={13} />
                <span>Discard Batch</span>
              </button>
            )}

            {/* Approve Selected Button */}
            <button
              type="button"
              id="btn-approve-selected"
              onClick={handleApproveSelectedClick}
              disabled={selectedCount === 0 || isSaving}
              className="btn-primary"
              style={{
                padding: '6px 14px',
                fontSize: '0.75rem',
                background: 'var(--status-success)',
                borderColor: 'var(--status-success)',
                gap: '6px'
              }}
            >
              <Check size={14} />
              <span>
                {isSaving ? 'Saving to DB...' : `Approve Selected (${selectedCount})`}
              </span>
            </button>

            {/* Approve All Button */}
            <button
              type="button"
              id="btn-approve-all"
              onClick={handleApproveAllClick}
              disabled={isSaving || savedIds.size === totalCount}
              className="btn-secondary"
              style={{
                padding: '6px 14px',
                fontSize: '0.75rem',
                gap: '6px'
              }}
            >
              <CheckCircle2 size={14} color="var(--brand-primary)" />
              <span>Approve All ({totalCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: TABBED CAROUSEL VIEW */}
      {viewMode === 'tabs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Horizontal Question Pills Rail */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '4px'
            }}
          >
            {stagedQuestions.map((q, idx) => {
              const isCurrent = idx === validIdx;
              const isChecked = selectedIds.has(q.id);
              const isSaved = savedIds.has(q.id);
              const isMulti = q.interaction_type === 'multi_choice';
              const isPassage = q.passage_required === 'Yes' || (q.stimulus_text && q.stimulus_text.trim().split(/\s+/).length >= 180);

              return (
                <div
                  key={q.id || idx}
                  onClick={() => setActiveIdx(idx)}
                  id={`tab-pill-q-${idx + 1}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: isCurrent ? 'var(--bg-surface-elevated)' : 'var(--bg-surface-subtle)',
                    border: isCurrent ? '1px solid var(--border-brand)' : '1px solid var(--border-light)',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'all var(--transition-fast)',
                    boxShadow: isCurrent ? 'var(--shadow-sm)' : 'none',
                    flexShrink: 0
                  }}
                >
                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleToggleSelect(q.id);
                    }}
                    style={{
                      accentColor: 'var(--brand-primary)',
                      width: '14px',
                      height: '14px',
                      cursor: 'pointer'
                    }}
                    title={isChecked ? 'Selected for commit' : 'Click to select for commit'}
                  />

                  {/* Question Number */}
                  <span style={{ fontSize: '0.8rem', fontWeight: isCurrent ? 700 : 600, color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                    Q{idx + 1}
                  </span>

                  {/* Format Indicator Badges */}
                  {isMulti && (
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        padding: '1px 4px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: '#818cf8'
                      }}
                      title="Multi-Choice Question"
                    >
                      MC
                    </span>
                  )}
                  {isPassage && (
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        padding: '1px 4px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'rgba(56, 189, 248, 0.15)',
                        color: '#38bdf8'
                      }}
                      title="Long Reading Passage"
                    >
                      DOC
                    </span>
                  )}

                  {/* Score */}
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: (q.final_score || 95) >= 90 ? 'var(--status-success)' : 'var(--status-warning)'
                    }}
                  >
                    {q.final_score || 95}
                  </span>

                  {/* Saved Status Indicator */}
                  {isSaved && (
                    <CheckCircle2 size={13} color="var(--status-success)" title="Already saved in Question Bank" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Question Top Banner */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 14px',
              background: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                Candidate {validIdx + 1} of {totalCount}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {activeQuestion.section_label || activeQuestion.section}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                {activeQuestion.interaction_type === 'multi_choice' ? 'Multi-Choice' : 'Single Choice'}
              </span>
              {activeQuestion.passage_required === 'Yes' && (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600 }}>Reading Passage</span>
                </>
              )}
            </div>

            {/* Stepper Navigation Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                id="btn-prev-candidate"
                onClick={() => setActiveIdx(prev => Math.max(0, prev - 1))}
                disabled={validIdx === 0}
                className="btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.725rem' }}
                title="Previous Candidate"
              >
                <ChevronLeft size={13} />
                <span>Prev</span>
              </button>
              <button
                type="button"
                id="btn-next-candidate"
                onClick={() => setActiveIdx(prev => Math.min(totalCount - 1, prev + 1))}
                disabled={validIdx === totalCount - 1}
                className="btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.725rem' }}
                title="Next Candidate"
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Embedded Full Question Card */}
          <QuestionCard
            question={activeQuestion}
            isSaved={savedIds.has(activeQuestion.id)}
            onApprove={handleApproveSingle}
            onDiscard={() => {
              if (onDiscardQuestion) {
                onDiscardQuestion(activeQuestion.id);
              }
            }}
            onOpenAudit={onOpenAudit}
            onUpdateQuestion={onUpdateQuestion}
          />
        </div>
      )}

      {/* VIEW MODE 2: GRID / COMPARISON VIEW */}
      {viewMode === 'grid' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '16px'
          }}
        >
          {stagedQuestions.map((q, idx) => {
            const isChecked = selectedIds.has(q.id);
            const isSaved = savedIds.has(q.id);
            const isMulti = q.interaction_type === 'multi_choice';
            const wordCount = q.stimulus_text ? q.stimulus_text.trim().split(/\s+/).length : 0;
            const isPassage = q.passage_required === 'Yes' || wordCount >= 180;
            const correctKeysList = Array.isArray(q.correct_answer_ids) && q.correct_answer_ids.length > 0
              ? q.correct_answer_ids.map(k => String(k).trim().toUpperCase())
              : (q.correct_answer_id || '').split(',').map(k => k.trim().toUpperCase()).filter(Boolean);

            return (
              <div
                key={q.id || idx}
                className="glass-panel"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: isChecked ? '1px solid var(--border-brand)' : '1px solid var(--border-light)',
                  position: 'relative'
                }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleSelect(q.id)}
                      style={{
                        accentColor: 'var(--brand-primary)',
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer'
                      }}
                      title="Select for confirmation"
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Q{idx + 1}
                    </span>
                    <span className="badge badge-indigo" style={{ fontSize: '0.675rem' }}>
                      {q.difficulty}
                    </span>
                    {isMulti && (
                      <span className="badge" style={{ fontSize: '0.675rem', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                        Multi-Key
                      </span>
                    )}
                    {isPassage && (
                      <span className="badge" style={{ fontSize: '0.675rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                        Passage
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                      {q.final_score || 95}/100
                    </span>
                    {isSaved && (
                      <span className="badge badge-emerald" style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Check size={10} /> Saved
                      </span>
                    )}
                  </div>
                </div>

                {/* Stimulus Snippet if Passage */}
                {q.stimulus_text && (
                  <div
                    style={{
                      padding: '8px 10px',
                      background: 'var(--bg-surface-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.725rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      maxHeight: '70px',
                      overflowY: 'auto'
                    }}
                  >
                    <strong style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '2px', fontSize: '0.675rem' }}>
                      {isPassage ? `Stimulus Passage (${wordCount} words):` : 'Clinical Vignette:'}
                    </strong>
                    {q.stimulus_text}
                  </div>
                )}

                {/* Question Stem */}
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {q.question_stem}
                </div>

                {/* Compact Options Preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {q.options && q.options.map(opt => {
                    const isCorrect = correctKeysList.includes(String(opt.id).toUpperCase());
                    return (
                      <div
                        key={opt.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface-subtle)',
                          border: isCorrect ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                          fontSize: '0.725rem',
                          color: isCorrect ? 'var(--status-success)' : 'var(--text-secondary)'
                        }}
                      >
                        <span style={{ fontWeight: 700, minWidth: '14px' }}>{opt.id}.</span>
                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {opt.text}
                        </span>
                        {isCorrect && <Check size={11} color="var(--status-success)" />}
                      </div>
                    );
                  })}
                </div>

                {/* Card Actions Footer */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-light)'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveIdx(idx);
                      setViewMode('tabs');
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--brand-primary)',
                      fontSize: '0.725rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Eye size={12} />
                    <span>Focus in Detail</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {onOpenAudit && (
                      <button
                        type="button"
                        onClick={() => onOpenAudit(q)}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                        title="Audit Scorecard"
                      >
                        <Award size={12} />
                        <span>Audit</span>
                      </button>
                    )}

                    {!isSaved && (
                      <button
                        type="button"
                        onClick={() => handleApproveSingle(q)}
                        disabled={isSaving}
                        className="btn-primary"
                        style={{ padding: '4px 10px', fontSize: '0.7rem', background: 'var(--status-success)', borderColor: 'var(--status-success)' }}
                      >
                        <Check size={12} />
                        <span>Approve</span>
                      </button>
                    )}
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
