import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Check,
  Trash2,
  Eye,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Award,
  Sparkles,
  ShieldCheck,
  Loader2,
  Clock,
  PenTool,
  RotateCcw
} from 'lucide-react';
import QuestionCard from './QuestionCard';

export default function StagedBatchReview({
  stagedQuestions = [],
  targetTotal = 1,
  isGenerating = false,
  batchProgress = null,
  perQuestionState = {},
  onApproveSelected,
  onApproveAll,
  onDiscardQuestion,
  onDiscardAll,
  onOpenAudit,
  onUpdateQuestion
}) {
  // State for which questions are explicitly deselected by the user
  const [deselectedIds, setDeselectedIds] = useState(() => new Set());
  // State for which questions have already been saved to the database
  const [savedIds, setSavedIds] = useState(() => new Set());
  // Active question index in detailed view
  const [activeIdx, setActiveIdx] = useState(0);
  // View mode: default 'grid' (all questions side-by-side) | 'tabs' (detailed single question view)
  const [viewMode, setViewMode] = useState('grid');
  // Loading state during batch saving
  const [isSaving, setIsSaving] = useState(false);

  // Determine total number of slots expected
  const effectiveTotal = Math.max(
    stagedQuestions.length,
    targetTotal || 1,
    batchProgress?.total || 1
  );

  // Derived set of selected question IDs (avoids useEffect cascading renders)
  const selectedIds = useMemo(() => {
    return new Set(
      stagedQuestions
        .filter(q => !deselectedIds.has(q.id))
        .map(q => q.id)
    );
  }, [stagedQuestions, deselectedIds]);

  // Batch stats computed unconditionally before any early returns (React Rules of Hooks)
  const totalCompleted = stagedQuestions.length;
  const selectedCount = selectedIds.size;
  const isAllSelected = totalCompleted > 0 && selectedCount === totalCompleted;

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
      avgScore: totalCompleted > 0 ? (scoreSum / totalCompleted).toFixed(1) : '95.0'
    };
  }, [stagedQuestions, totalCompleted]);

  // Clamped active question for single view
  const validIdx = Math.max(0, Math.min(activeIdx, Math.max(0, stagedQuestions.length - 1)));
  const activeQuestion = stagedQuestions[validIdx] || null;

  if (stagedQuestions.length === 0 && !isGenerating && effectiveTotal <= 1) {
    return null;
  }

  // Toggle selection for an individual question
  const handleToggleSelect = (id) => {
    setDeselectedIds(prev => {
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
      setDeselectedIds(new Set(stagedQuestions.map(q => q.id)));
    } else {
      setDeselectedIds(new Set());
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
    if (isSaving || totalCompleted === 0) return;
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
      setDeselectedIds(new Set());
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
                Review Generated Questions
              </h2>
              <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                {isGenerating
                  ? `${totalCompleted} of ${effectiveTotal} Ready (Generating...)`
                  : `${totalCompleted} Generated`}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
              Review the questions below. You can save all questions to your Question Bank, select individual ones, or edit them before saving.
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
              <span>Grid View (All Questions)</span>
            </button>
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
              <span>Detailed View</span>
            </button>
          </div>
        </div>

        {/* Breakdown Chips & Quality Metrics */}
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
            <span style={{ color: 'var(--text-muted)' }}>Question Mix:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {singleCount} Single Answer
            </span>
            <span style={{ color: 'var(--border-light)' }}>•</span>
            <span style={{ fontWeight: 600, color: multiCount > 0 ? 'var(--brand-indigo)' : 'var(--text-secondary)' }}>
              {multiCount} Multiple Answers
            </span>
            <span style={{ color: 'var(--border-light)' }}>•</span>
            <span style={{ fontWeight: 600, color: passageCount > 0 ? 'var(--brand-primary)' : 'var(--text-secondary)' }}>
              {passageCount} With Reading Passage{passageCount !== 1 ? 's' : ''}
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
              <span>Saved in Bank:</span>
              <strong style={{ color: savedIds.size > 0 ? 'var(--status-success)' : 'var(--text-secondary)' }}>
                {savedIds.size} of {totalCompleted}
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
              disabled={totalCompleted === 0}
              style={{
                accentColor: 'var(--brand-primary)',
                width: '15px',
                height: '15px',
                cursor: totalCompleted === 0 ? 'not-allowed' : 'pointer'
              }}
            />
            <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Select All Ready ({totalCompleted})
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
                  padding: '7px 12px',
                  fontSize: '0.75rem',
                  color: 'var(--status-danger)'
                }}
                title="Discard all generated candidate questions"
              >
                <Trash2 size={13} />
                <span>Discard All</span>
              </button>
            )}

            {/* Save Selected Button */}
            <button
              type="button"
              id="btn-approve-selected"
              onClick={handleApproveSelectedClick}
              disabled={selectedCount === 0 || isSaving}
              className="btn-secondary"
              style={{
                padding: '7px 14px',
                fontSize: '0.75rem',
                gap: '6px'
              }}
            >
              <Check size={14} />
              <span>
                {isSaving ? 'Saving...' : `Save Selected (${selectedCount}) to Bank`}
              </span>
            </button>

            {/* Accept All Questions Button (Prominent Primary Action) */}
            <button
              type="button"
              id="btn-approve-all"
              onClick={handleApproveAllClick}
              disabled={isSaving || totalCompleted === 0 || savedIds.size === totalCompleted}
              className="btn-primary"
              style={{
                padding: '7px 16px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: 'var(--status-success)',
                borderColor: 'var(--status-success)',
                gap: '6px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <CheckCircle2 size={15} color="#ffffff" />
              <span>
                {savedIds.size === totalCompleted && totalCompleted > 0
                  ? 'All Saved in Question Bank'
                  : `Accept All Questions (${totalCompleted}) into Bank`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: GRID VIEW (DEFAULT - ALL REQUESTED QUESTIONS DISPLAYED SIDE BY SIDE) */}
      {viewMode === 'grid' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
            gap: '16px'
          }}
        >
          {Array.from({ length: effectiveTotal }).map((_, idx) => {
            const slotNumber = idx + 1;
            const qState = perQuestionState[slotNumber];
            // Locate completed question for this specific slot index
            const q = stagedQuestions.find(item => item.index === slotNumber || item.batch_index === slotNumber)
              || qState?.question
              || (stagedQuestions.length === effectiveTotal ? stagedQuestions[idx] : null);

            // State A: Question has been generated and ready for review
            if (q) {
              const isChecked = selectedIds.has(q.id);
              const isSaved = savedIds.has(q.id);
              const isMulti = q.interaction_type === 'multi_choice' || (Array.isArray(q.correct_answer_ids) && q.correct_answer_ids.length > 1);
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
                  {/* Card Top Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                        title="Select this question to keep in Question Bank"
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Question {q.index || slotNumber}
                      </span>
                      <span className="badge badge-indigo" style={{ fontSize: '0.675rem', textTransform: 'capitalize' }}>
                        {q.difficulty}
                      </span>
                      {isMulti ? (
                        <span className="badge badge-indigo" style={{ fontSize: '0.675rem' }}>
                          Multiple Answers
                        </span>
                      ) : (
                        <span className="badge badge-neutral" style={{ fontSize: '0.675rem' }}>
                          Single Answer
                        </span>
                      )}
                      {isPassage && (
                        <span className="badge badge-cyan" style={{ fontSize: '0.675rem' }}>
                          Reading Passage
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                        {q.final_score || 95}/100 Quality
                      </span>
                      {isSaved && (
                        <span className="badge badge-emerald" style={{ fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Check size={10} /> In Bank
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scenario / Reading Passage Box */}
                  {q.stimulus_text && (
                    <div
                      style={{
                        padding: '8px 10px',
                        background: 'var(--bg-surface-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.725rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5,
                        maxHeight: '75px',
                        overflowY: 'auto'
                      }}
                    >
                      <strong style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '2px', fontSize: '0.675rem' }}>
                        {isPassage ? `Reading Passage (${wordCount} words):` : 'Scenario / Vignette:'}
                      </strong>
                      {q.stimulus_text}
                    </div>
                  )}

                  {/* Question Stem */}
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {q.question_stem}
                  </div>

                  {/* Options with marked correct answer */}
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
                      <span>Detailed View</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {onOpenAudit && (
                        <button
                          type="button"
                          onClick={() => onOpenAudit(q)}
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          title="View Quality Audit Scorecard"
                        >
                          <Award size={12} />
                          <span>Quality Details</span>
                        </button>
                      )}

                      {!isSaved ? (
                        <button
                          type="button"
                          onClick={() => handleApproveSingle(q)}
                          disabled={isSaving}
                          className="btn-primary"
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.7rem',
                            background: 'var(--status-success)',
                            borderColor: 'var(--status-success)'
                          }}
                          title="Keep this question in the bank"
                        >
                          <Check size={12} />
                          <span>Save to Bank</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: 'var(--status-success)', fontWeight: 600 }}>
                          ✓ In Bank
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // State B: Question is currently being generated or reviewed in parallel swarm
            const stage = qState?.stage || 'drafting';
            const agentName = qState?.agentName || 'Question Writer';
            const message = qState?.message || `Writing draft for Question ${slotNumber}...`;
            const isMulti = qState?.interactionType === 'multi_choice';
            const isPassage = qState?.passageRequired === 'Yes';
            const iteration = qState?.iteration || 1;

            const isDraftDone = stage === 'reviewing' || stage === 'remediating' || stage === 'image' || stage === 'completed';
            const isDraftActive = stage === 'drafting';

            const isAuditDone = stage === 'image' || stage === 'completed';
            const isAuditActive = stage === 'reviewing' || stage === 'remediating';

            const isStimulusDone = stage === 'completed';
            const isStimulusActive = stage === 'image';

            return (
              <div
                key={`slot-generating-${slotNumber}`}
                className="glass-panel"
                style={{
                  padding: '20px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-brand)',
                  background: 'var(--bg-surface-elevated)',
                  minHeight: '280px',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative'
                }}
              >
                {/* Card Top Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      Question {slotNumber}
                    </span>
                    <span className="badge badge-indigo" style={{ fontSize: '0.675rem' }}>
                      {isMulti ? 'Multiple Answers' : 'Single Answer'}
                    </span>
                    {isPassage && (
                      <span className="badge badge-cyan" style={{ fontSize: '0.675rem' }}>
                        Reading Passage
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-xs)',
                      background: stage === 'remediating'
                        ? 'rgba(245, 158, 11, 0.12)'
                        : stage === 'reviewing'
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'var(--brand-light)',
                      border: stage === 'remediating'
                        ? '1px solid var(--status-warning)'
                        : stage === 'reviewing'
                        ? '1px solid var(--status-success)'
                        : '1px solid var(--border-brand)',
                      fontSize: '0.675rem',
                      fontWeight: 700,
                      color: stage === 'remediating'
                        ? 'var(--status-warning)'
                        : stage === 'reviewing'
                        ? 'var(--status-success)'
                        : 'var(--brand-primary)'
                    }}
                  >
                    <span className="agent-pulse-dot" style={{ width: '6px', height: '6px' }} />
                    <span>{agentName}</span>
                  </div>
                </div>

                {/* Stage Headline & Activity Description */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {isDraftActive && <PenTool size={14} color="var(--brand-primary)" />}
                    {stage === 'reviewing' && <ShieldCheck size={14} color="var(--status-success)" />}
                    {stage === 'remediating' && <RotateCcw size={14} color="var(--status-warning)" />}
                    {stage === 'image' && <Sparkles size={14} color="var(--status-purple)" />}
                    <span>
                      {isDraftActive
                        ? 'Drafting Question & Options'
                        : stage === 'reviewing'
                        ? `Quality Review (Check ${iteration})`
                        : stage === 'remediating'
                        ? `Polishing & Improving (Attempt ${iteration})`
                        : stage === 'image'
                        ? 'Drawing Helpful Diagram / Chart'
                        : 'AI Team Creating Question...'}
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: '6px',
                      padding: '8px 10px',
                      background: 'var(--bg-surface-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.725rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4,
                      minHeight: '44px'
                    }}
                  >
                    {message}
                  </div>
                </div>

                {/* 4-Step Micro-Track Stepper */}
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Team Progress</span>
                    <span>Slot {slotNumber} of {effectiveTotal}</span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '6px',
                      background: 'var(--bg-surface-subtle)',
                      padding: '6px',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    {/* Step 1: Write */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        padding: '4px',
                        borderRadius: 'var(--radius-xs)',
                        background: isDraftActive ? 'var(--brand-light)' : isDraftDone ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                        border: isDraftActive ? '1px solid var(--border-brand)' : '1px solid transparent',
                        color: isDraftDone ? 'var(--status-success)' : isDraftActive ? 'var(--brand-primary)' : 'var(--text-muted)',
                        fontSize: '0.65rem',
                        fontWeight: isDraftActive || isDraftDone ? 700 : 500
                      }}
                    >
                      {isDraftDone ? <Check size={11} /> : isDraftActive ? <Loader2 size={11} className="spin-slow" /> : <PenTool size={11} />}
                      <span>1. Write</span>
                    </div>

                    {/* Step 2: Review */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        padding: '4px',
                        borderRadius: 'var(--radius-xs)',
                        background: isAuditActive ? 'rgba(16, 185, 129, 0.1)' : isAuditDone ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                        border: isAuditActive ? '1px solid var(--status-success)' : '1px solid transparent',
                        color: isAuditDone ? 'var(--status-success)' : isAuditActive ? 'var(--status-success)' : 'var(--text-muted)',
                        fontSize: '0.65rem',
                        fontWeight: isAuditActive || isAuditDone ? 700 : 500
                      }}
                    >
                      {isAuditDone ? <Check size={11} /> : isAuditActive ? <Loader2 size={11} className="spin-slow" /> : <ShieldCheck size={11} />}
                      <span>2. Review</span>
                    </div>

                    {/* Step 3: Diagram */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        padding: '4px',
                        borderRadius: 'var(--radius-xs)',
                        background: isStimulusActive ? 'rgba(168, 85, 247, 0.1)' : isStimulusDone ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                        border: isStimulusActive ? '1px solid var(--status-purple)' : '1px solid transparent',
                        color: isStimulusDone ? 'var(--status-success)' : isStimulusActive ? 'var(--status-purple)' : 'var(--text-muted)',
                        fontSize: '0.65rem',
                        fontWeight: isStimulusActive || isStimulusDone ? 700 : 500
                      }}
                    >
                      {isStimulusDone ? <Check size={11} /> : isStimulusActive ? <Loader2 size={11} className="spin-slow" /> : <Sparkles size={11} />}
                      <span>3. Diagram</span>
                    </div>

                    {/* Step 4: Ready */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        padding: '4px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        fontSize: '0.65rem',
                        fontWeight: 500
                      }}
                    >
                      <CheckCircle2 size={11} />
                      <span>4. Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: DETAILED SINGLE VIEW WITH QUESTION PILLS RAIL */}
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
            {Array.from({ length: effectiveTotal }).map((_, idx) => {
              const slotNumber = idx + 1;
              const qState = perQuestionState[slotNumber];
              const q = stagedQuestions.find(item => item.index === slotNumber || item.batch_index === slotNumber)
                || qState?.question
                || (stagedQuestions.length === effectiveTotal ? stagedQuestions[idx] : null);
              const isCurrent = idx === validIdx && Boolean(q);
              const isChecked = q && selectedIds.has(q.id);
              const isSaved = q && savedIds.has(q.id);
              const isMulti = q && (q.interaction_type === 'multi_choice' || (Array.isArray(q.correct_answer_ids) && q.correct_answer_ids.length > 1));
              const isPassage = q && (q.passage_required === 'Yes' || (q.stimulus_text && q.stimulus_text.trim().split(/\s+/).length >= 180));

              if (!q) {
                // Pending/generating pill with live agent info
                const agentShort = (qState?.agentName === 'Question Writer' || qState?.agentName === 'Question Generator')
                  ? 'Writing'
                  : (qState?.agentName === 'Quality Reviewer' || qState?.agentName === 'Question Reviewer')
                  ? 'Reviewing'
                  : (qState?.agentName === 'Question Improver' || qState?.agentName === 'Question Re-Generator')
                  ? 'Improving'
                  : (qState?.agentName === 'Diagram & Chart Maker' || qState?.agentName === 'Image Generator')
                  ? 'Diagram'
                  : (isGenerating ? 'Writing' : 'Queued');
                return (
                  <div
                    key={`pill-placeholder-${idx}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: isGenerating ? 'var(--brand-light)' : 'var(--bg-surface-subtle)',
                      border: isGenerating ? '1px dashed var(--brand-primary)' : '1px dashed var(--border-light)',
                      color: isGenerating ? 'var(--brand-primary)' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      opacity: isGenerating ? 1 : 0.6,
                      flexShrink: 0
                    }}
                  >
                    {isGenerating ? <Loader2 size={12} className="spin-slow" /> : <Clock size={12} />}
                    <span>Q{slotNumber} • {agentShort}...</span>
                  </div>
                );
              }

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
                    title={isChecked ? 'Selected to keep in Bank' : 'Click to select for Bank'}
                  />

                  {/* Question Number & Tags */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Q{q.index || slotNumber}
                    </span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.625rem' }}>
                      {q.difficulty}
                    </span>
                    {isMulti && (
                      <span className="badge badge-indigo" style={{ fontSize: '0.625rem' }}>
                        Multi
                      </span>
                    )}
                    {isPassage && (
                      <span className="badge badge-cyan" style={{ fontSize: '0.625rem' }}>
                        Passage
                      </span>
                    )}
                  </div>

                  {/* Saved Status Indicator */}
                  {isSaved ? (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: 'var(--status-success)',
                        color: '#ffffff'
                      }}
                      title="Saved in Question Bank"
                    >
                      <Check size={10} />
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.675rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)'
                      }}
                    >
                      {q.final_score || 95}/100
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stepper Navigation Strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 12px',
              background: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Viewing Question:</span>
              <strong style={{ color: 'var(--text-primary)' }}>
                {validIdx + 1} of {totalCompleted}
              </strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                id="btn-prev-candidate"
                onClick={() => setActiveIdx(prev => Math.max(0, prev - 1))}
                disabled={validIdx === 0}
                className="btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.725rem' }}
                title="Previous Question"
              >
                <ChevronLeft size={13} />
                <span>Prev</span>
              </button>
              <button
                type="button"
                id="btn-next-candidate"
                onClick={() => setActiveIdx(prev => Math.min(totalCompleted - 1, prev + 1))}
                disabled={validIdx >= totalCompleted - 1}
                className="btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.725rem' }}
                title="Next Question"
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Embedded Full Question Card */}
          {activeQuestion ? (
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
          ) : (
            <div
              className="glass-panel"
              style={{
                padding: '40px',
                textAlign: 'center',
                color: 'var(--text-muted)'
              }}
            >
              <Loader2 size={24} className="spin-slow" style={{ margin: '0 auto 12px auto' }} />
              <p>Waiting for questions to generate...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
