import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Check,
  Trash2,
  Eye,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Award,
  Sparkles,
  ShieldCheck,
  Loader2,
  Clock,
  BookOpen,
  FolderCheck,
  Image as ImageIcon
} from 'lucide-react';
import QuestionCard from './QuestionCard';
import VisualStimulusViewer from './VisualStimulusViewer';
import SharedPassageCard from './SharedPassageCard';

export default function StagedBatchReview({
  stagedQuestions = [],
  targetTotal = 1,
  savedQuestionIds = null,
  isGenerating = false,
  batchProgress = null,
  perQuestionState = {},
  onApproveSelected,
  onApproveAll,
  onDiscardQuestion,
  onDiscardAll,
  onDiscardUnsaved,
  onFinishBatch,
  onNavigateToBank,
  onOpenAudit,
  onUpdateQuestion
}) {
  // State for which questions are explicitly deselected by the user
  const [deselectedIds, setDeselectedIds] = useState(() => new Set());
  // State for which questions have already been saved to the database locally
  const [localSavedIds, setLocalSavedIds] = useState(() => new Set());

  // Combined saved IDs (persistent from App.jsx and locally updated)
  const savedIds = useMemo(() => {
    const combined = new Set(localSavedIds);
    if (savedQuestionIds) {
      savedQuestionIds.forEach(id => combined.add(id));
    }
    return combined;
  }, [localSavedIds, savedQuestionIds]);
  // Active question index in detailed view
  const [activeIdx, setActiveIdx] = useState(0);
  // View mode: default 'grid' (all questions side-by-side) | 'tabs' (detailed single question view)
  const [viewMode, setViewMode] = useState('grid');
  // Loading state during batch saving
  const [isSaving, setIsSaving] = useState(false);
  // Expanded explanation card IDs
  const [expandedExplanationIds, setExpandedExplanationIds] = useState(() => new Set());

  // Determine total number of slots expected
  const effectiveTotal = Math.max(
    stagedQuestions.length,
    targetTotal || 1,
    batchProgress?.total || 1
  );

  // Detect whether this batch has any single passage set items
  const isPassageSet = useMemo(() => {
    if (batchProgress?.passage_mode === 'single_passage') return true;
    if (stagedQuestions.some(q => q.passage_id || q.passage_mode === 'single_passage')) return true;
    if (stagedQuestions.length > 1 && stagedQuestions.every(q => q.passage_required === 'Yes' && q.stimulus_text && q.stimulus_text === stagedQuestions[0]?.stimulus_text)) return true;
    return false;
  }, [stagedQuestions, batchProgress]);

  // Determine how many questions are linked to the shared reading passage
  const effectivePassageCount = useMemo(() => {
    if (batchProgress?.passage_question_count) return batchProgress.passage_question_count;
    const passageLinkedQs = stagedQuestions.filter(q => q.passage_id || q.passage_mode === 'single_passage');
    if (passageLinkedQs.length > 0 && passageLinkedQs.length < stagedQuestions.length) {
      return passageLinkedQs.length;
    }
    if (isPassageSet && !batchProgress?.is_mixed_set && stagedQuestions.length > 0 && stagedQuestions.every(q => !q.passage_id || q.passage_mode === 'single_passage')) {
      return effectiveTotal;
    }
    return passageLinkedQs.length || (isPassageSet ? effectiveTotal : 0);
  }, [batchProgress, stagedQuestions, isPassageSet, effectiveTotal]);

  const isMixedBatch = useMemo(() => {
    if (batchProgress?.is_mixed_set !== undefined) return Boolean(batchProgress.is_mixed_set);
    return effectivePassageCount > 0 && effectivePassageCount < effectiveTotal;
  }, [batchProgress, effectivePassageCount, effectiveTotal]);

  // Extract shared reading passage text
  const sharedStimulusText = useMemo(() => {
    if (!isPassageSet) return null;
    if (batchProgress?.shared_passage) return batchProgress.shared_passage;
    const linkedQ = stagedQuestions.find(q => q.passage_id || q.passage_mode === 'single_passage');
    return linkedQ?.stimulus_text || stagedQuestions[0]?.stimulus_text || null;
  }, [isPassageSet, batchProgress, stagedQuestions]);

  // Extract shared reading passage image (SVG or URL)
  const sharedPassageImage = useMemo(() => {
    if (!isPassageSet) return null;
    if (batchProgress?.shared_passage_image_svg || batchProgress?.shared_passage_image_url) {
      return {
        image_svg: batchProgress.shared_passage_image_svg,
        image_url: batchProgress.shared_passage_image_url,
        image_description: batchProgress.shared_passage_image_description
      };
    }
    const linkedQ = stagedQuestions.find(q =>
      (q.passage_id || q.passage_mode === 'single_passage') &&
      (q.image_svg || q.image_url || q.stage_outcomes?.passage_visual_stimulus?.image_svg || q.stage_outcomes?.visual_stimulus?.image_svg)
    );
    if (linkedQ) {
      return {
        image_svg: linkedQ.stage_outcomes?.passage_visual_stimulus?.image_svg || linkedQ.image_svg || linkedQ.stage_outcomes?.visual_stimulus?.image_svg,
        image_url: linkedQ.stage_outcomes?.passage_visual_stimulus?.image_url || linkedQ.image_url || linkedQ.stage_outcomes?.visual_stimulus?.image_url,
        image_description: linkedQ.stage_outcomes?.passage_visual_stimulus?.image_description || linkedQ.image_description || linkedQ.stage_outcomes?.visual_stimulus?.image_description
      };
    }
    return null;
  }, [isPassageSet, batchProgress, stagedQuestions]);

  const isQuestionPassageLinked = (q, slotNumber) => {
    if (q) {
      if (q.passage_id) return true;
      if (q.passage_mode === 'single_passage') return true;
      if (q.passage_mode === 'independent') return false;
    }
    if (effectivePassageCount && slotNumber <= effectivePassageCount && isPassageSet) return true;
    return false;
  };

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

  // Acceptance & Protection Derived States
  const savedCount = savedIds.size;
  const unsavedQuestions = useMemo(() => stagedQuestions.filter(q => !savedIds.has(q.id)), [stagedQuestions, savedIds]);
  const unsavedCount = unsavedQuestions.length;
  const allAccepted = totalCompleted > 0 && savedCount === totalCompleted;
  const anyAccepted = savedCount > 0;

  // Selected questions that are not yet saved in the Question Bank
  const unsavedSelectedCount = useMemo(() => {
    return stagedQuestions.filter(q => selectedIds.has(q.id) && !savedIds.has(q.id)).length;
  }, [stagedQuestions, selectedIds, savedIds]);

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

  // Toggle selection for an individual question (locked if already saved)
  const handleToggleSelect = (id) => {
    if (savedIds.has(id)) return;
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

  // Toggle explanation accordion for an individual question
  const toggleExplanation = (id) => {
    setExpandedExplanationIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle select all unsaved questions
  const handleToggleSelectAll = () => {
    if (allAccepted) return;
    if (unsavedCount > 0 && unsavedSelectedCount === unsavedCount) {
      setDeselectedIds(prev => {
        const next = new Set(prev);
        unsavedQuestions.forEach(q => next.add(q.id));
        return next;
      });
    } else {
      setDeselectedIds(prev => {
        const next = new Set(prev);
        unsavedQuestions.forEach(q => next.delete(q.id));
        return next;
      });
    }
  };

  // Commit selected questions to database
  const handleApproveSelectedClick = async () => {
    if (unsavedSelectedCount === 0 || isSaving) return;
    const questionsToApprove = stagedQuestions.filter(q => selectedIds.has(q.id) && !savedIds.has(q.id));
    if (questionsToApprove.length === 0) return;

    setIsSaving(true);
    try {
      if (onApproveSelected) {
        await onApproveSelected(questionsToApprove);
      }
      setLocalSavedIds(prev => {
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
    if (isSaving || totalCompleted === 0 || allAccepted) return;
    const unsaved = stagedQuestions.filter(q => !savedIds.has(q.id));
    if (unsaved.length === 0) return;

    setIsSaving(true);
    try {
      if (onApproveAll) {
        await onApproveAll(unsaved);
      }
      setLocalSavedIds(prev => {
        const next = new Set(prev);
        unsaved.forEach(q => next.add(q.id));
        return next;
      });
      setDeselectedIds(new Set());
    } finally {
      setIsSaving(false);
    }
  };

  // Discard only the unaccepted questions, leaving all accepted ones safely in staging
  const handleDiscardUnsavedClick = () => {
    if (unsavedCount === 0) return;
    const unsavedIds = new Set(unsavedQuestions.map(q => q.id));
    if (onDiscardUnsaved) {
      onDiscardUnsaved(unsavedIds);
    } else if (onDiscardAll && unsavedCount === totalCompleted) {
      onDiscardAll();
    }
    // Clean up deselected IDs
    setDeselectedIds(prev => {
      const next = new Set(prev);
      unsavedIds.forEach(id => next.delete(id));
      return next;
    });
  };

  // Approve a single question
  const handleApproveSingle = async (q) => {
    if (isSaving || savedIds.has(q.id)) return;
    setIsSaving(true);
    try {
      if (onApproveSelected) {
        await onApproveSelected([q]);
      }
      setLocalSavedIds(prev => new Set([...prev, q.id]));
    } finally {
      setIsSaving(false);
    }
  };

  const renderSlotCard = (idx) => {
    const slotNumber = idx + 1;
    const qState = perQuestionState[slotNumber];
    // Locate completed question for this specific slot index
    const q = stagedQuestions.find(item => item.index === slotNumber || item.batch_index === slotNumber)
      || qState?.question
      || (stagedQuestions.length === effectiveTotal ? stagedQuestions[idx] : null);

    const isLinked = isQuestionPassageLinked(q, slotNumber);

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
            border: isSaved
              ? '1px solid rgba(16, 185, 129, 0.4)'
              : isChecked
              ? '1px solid var(--border-brand)'
              : '1px solid var(--border-light)',
            position: 'relative'
          }}
        >
          {/* Card Top Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {isSaved ? (
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    background: 'var(--status-success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    flexShrink: 0
                  }}
                  title="Accepted & Saved in Question Bank (Protected from discard)"
                >
                  <Check size={11} strokeWidth={3} />
                </div>
              ) : (
                <input
                  type="checkbox"
                  aria-label={`Select Question ${q.index || slotNumber}`}
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
              )}
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Question {q.index || slotNumber}
              </span>
              <span style={{ color: 'var(--border-medium)' }}>•</span>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                {q.difficulty}
              </span>
              {isMulti ? (
                <span className="badge badge-indigo" style={{ fontSize: '0.675rem' }}>
                  Multi Choice
                </span>
              ) : (
                <span className="badge badge-neutral" style={{ fontSize: '0.675rem' }}>
                  Single Choice
                </span>
              )}
              {isLinked ? (
                <span className="badge badge-cyan" style={{ fontSize: '0.675rem' }}>
                  Passage Set
                </span>
              ) : isMixedBatch ? (
                <span className="badge badge-emerald" style={{ fontSize: '0.675rem' }}>
                  Independent Direct
                </span>
              ) : isPassage ? (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  • Passage ({wordCount}w)
                </span>
              ) : (
                <span className="badge badge-neutral" style={{ fontSize: '0.675rem' }}>
                  Direct Question
                </span>
              )}
              {!isLinked && (q.image_svg || q.image_url || q.stage_outcomes?.visual_stimulus?.image_svg || q.stage_outcomes?.visual_stimulus?.image_url) && (
                <span className="badge badge-purple" style={{ fontSize: '0.675rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <ImageIcon size={10} /> Diagram
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="badge badge-emerald" style={{ fontSize: '0.675rem', fontWeight: 600 }}>
                {q.final_score || 95}/100
              </span>
              {isSaved && (
                <span style={{ fontSize: '0.7rem', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                  <Check size={10} /> Saved
                </span>
              )}
            </div>
          </div>

          {/* Scenario / Reading Passage Box */}
          {isLinked ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                background: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-light)',
                fontSize: '0.7rem',
                color: 'var(--text-muted)'
              }}
            >
              <BookOpen size={12} color="var(--brand-primary)" />
              <span>References shared reading passage above</span>
            </div>
          ) : (
            q.stimulus_text && q.stimulus_text.trim() && (
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
            )
          )}

          {/* Visual Stimulus Diagram Thumbnail (only for independent direct questions; passage questions display diagram inside shared passage) */}
          {!isLinked && (q.image_svg || q.image_url || q.stage_outcomes?.visual_stimulus?.image_svg || q.stage_outcomes?.visual_stimulus?.image_url) && (
            <VisualStimulusViewer question={q} compact={true} />
          )}

          {/* Question Stem */}
          <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.45 }}>
            {q.question_stem}
          </div>

          {/* Options with Single Choice vs Multi Choice visual markers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {q.options && q.options.map(opt => {
              const isCorrect = correctKeysList.includes(String(opt.id).toUpperCase());
              return (
                <div
                  key={opt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface-subtle)',
                    border: isCorrect ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
                    fontSize: '0.75rem',
                    color: isCorrect ? 'var(--status-success)' : 'var(--text-secondary)',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '18px',
                      height: '18px',
                      borderRadius: isMulti ? '4px' : '50%',
                      background: isCorrect ? 'var(--status-success)' : 'transparent',
                      border: isCorrect ? '1px solid var(--status-success)' : '1px solid var(--border-medium)',
                      color: isCorrect ? '#ffffff' : 'var(--text-muted)',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      flexShrink: 0
                    }}
                  >
                    {isCorrect ? (
                      <Check size={11} strokeWidth={3} />
                    ) : (
                      <span>{opt.id}</span>
                    )}
                  </div>
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isCorrect ? 600 : 400 }}>
                    {opt.text}
                  </span>
                  {isCorrect && (
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--status-success)', flexShrink: 0 }}>
                      {isMulti ? 'Correct Key' : 'Answer'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Expandable Explanation Drawer */}
          <div style={{ marginTop: '2px' }}>
            <button
              type="button"
              onClick={() => toggleExplanation(q.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.7rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 0'
              }}
            >
              {expandedExplanationIds.has(q.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              <span>{expandedExplanationIds.has(q.id) ? 'Hide Explanation' : 'View Explanation & Distractors'}</span>
            </button>

            {expandedExplanationIds.has(q.id) && (
              <div
                style={{
                  marginTop: '6px',
                  padding: '8px 10px',
                  background: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.725rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.45,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                {q.explanation && (
                  <div>
                    <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.675rem' }}>Rationale:</strong>
                    {q.explanation}
                  </div>
                )}
                {q.distractor_analysis && (
                  <div style={{ borderTop: '1px dashed var(--border-light)', paddingTop: '4px' }}>
                    <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.675rem' }}>Distractor Breakdown:</strong>
                    <div style={{ whiteSpace: 'pre-line' }}>{q.distractor_analysis}</div>
                  </div>
                )}
              </div>
            )}
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
    const isMulti = qState?.interactionType === 'multi_choice';
    const isPassage = qState?.passageRequired === 'Yes';

    return (
      <div
        key={`slot-generating-${slotNumber}`}
        className="glass-panel"
        style={{
          padding: '20px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-medium)',
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
            {isLinked ? (
              <span className="badge badge-cyan" style={{ fontSize: '0.675rem' }}>
                Passage Set
              </span>
            ) : isMixedBatch ? (
              <span className="badge badge-emerald" style={{ fontSize: '0.675rem' }}>
                Independent
              </span>
            ) : isPassage ? (
              <span className="badge badge-cyan" style={{ fontSize: '0.675rem' }}>
                Reading Passage
              </span>
            ) : null}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--brand-light)',
              border: '1px solid var(--border-brand)',
              fontSize: '0.675rem',
              fontWeight: 600,
              color: 'var(--brand-primary)'
            }}
          >
            <span className="agent-pulse-dot" style={{ width: '6px', height: '6px' }} />
            <span>Drafting in progress...</span>
          </div>
        </div>

        {/* Question Stem Shimmer Lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton-shimmer" style={{ height: '14px', width: '90%' }} />
          <div className="skeleton-shimmer" style={{ height: '14px', width: '98%' }} />
          <div className="skeleton-shimmer" style={{ height: '14px', width: '60%' }} />
        </div>

        {/* Options Shimmer Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {['A', 'B', 'C', 'D'].map((letter, idx) => (
            <div
              key={letter}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-light)'
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-medium)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  flexShrink: 0
                }}
              >
                {letter}
              </div>
              <div
                className="skeleton-shimmer"
                style={{
                  height: '12px',
                  width: `${70 - idx * 8}%`,
                  minWidth: '40%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Card Footer Reassurance */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.675rem',
            color: 'var(--text-muted)'
          }}
        >
          <span>Slot {slotNumber} of {effectiveTotal} • Calibrating options</span>
          <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Autonomous Pipeline Active</span>
        </div>
      </div>
    );
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
          <div className="pill-track">
            <button
              type="button"
              id="btn-view-grid"
              onClick={() => setViewMode('grid')}
              className={`pill-track-btn ${viewMode === 'grid' ? 'active' : ''}`}
            >
              <LayoutGrid size={13} />
              <span>Grid View (All Questions)</span>
            </button>
            <button
              type="button"
              id="btn-view-tabs"
              onClick={() => setViewMode('tabs')}
              className={`pill-track-btn ${viewMode === 'tabs' ? 'active' : ''}`}
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
            <span style={{ fontWeight: 600, color: (isMixedBatch || isPassageSet || passageCount > 0) ? 'var(--brand-primary)' : 'var(--text-secondary)' }}>
              {isMixedBatch
                ? `Mixed Set: ${effectivePassageCount} Passage + ${effectiveTotal - effectivePassageCount} Independent`
                : isPassageSet
                  ? '1 Shared Passage Set'
                  : `${passageCount} With Reading Passage${passageCount !== 1 ? 's' : ''}`}
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
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: allAccepted ? 'default' : 'pointer', userSelect: 'none' }}>
            {allAccepted ? (
              <div
                style={{
                  width: '15px',
                  height: '15px',
                  borderRadius: '3px',
                  background: 'var(--status-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0
                }}
                title="All questions saved in Question Bank"
              >
                <Check size={10} strokeWidth={3} />
              </div>
            ) : (
              <input
                type="checkbox"
                aria-label="Select all ready questions"
                checked={unsavedCount > 0 && unsavedSelectedCount === unsavedCount}
                onChange={handleToggleSelectAll}
                disabled={totalCompleted === 0}
                style={{
                  accentColor: 'var(--brand-primary)',
                  width: '15px',
                  height: '15px',
                  cursor: totalCompleted === 0 ? 'not-allowed' : 'pointer'
                }}
              />
            )}
            <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {allAccepted
                ? `All Saved in Bank (${totalCompleted})`
                : anyAccepted
                ? `Select Unsaved (${unsavedCount})`
                : `Select All Ready (${totalCompleted})`}
            </span>
            {!allAccepted && (
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                ({anyAccepted ? `${unsavedSelectedCount} unsaved selected` : `${selectedCount} selected`})
              </span>
            )}
          </label>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {allAccepted ? (
              <>
                {onNavigateToBank && (
                  <button
                    type="button"
                    id="btn-view-bank"
                    onClick={onNavigateToBank}
                    className="btn-secondary"
                    style={{
                      padding: '7px 12px',
                      fontSize: '0.75rem',
                      gap: '6px'
                    }}
                    title="Navigate to Question Bank to view saved questions"
                  >
                    <FolderCheck size={14} color="var(--brand-primary)" />
                    <span>View in Question Bank</span>
                  </button>
                )}
                {onFinishBatch && (
                  <button
                    type="button"
                    id="btn-finish-batch"
                    onClick={onFinishBatch}
                    className="btn-secondary"
                    style={{
                      padding: '7px 14px',
                      fontSize: '0.75rem',
                      gap: '6px',
                      color: 'var(--status-success)'
                    }}
                    title="Finish reviewing this batch and return to Generator"
                  >
                    <CheckCircle2 size={14} color="var(--status-success)" />
                    <span>Finish & Start New Batch</span>
                  </button>
                )}
              </>
            ) : anyAccepted ? (
              <button
                type="button"
                id="btn-discard-unsaved"
                onClick={handleDiscardUnsavedClick}
                className="btn-secondary"
                style={{
                  padding: '7px 12px',
                  fontSize: '0.75rem',
                  color: 'var(--status-danger)',
                  gap: '6px'
                }}
                title={`Discard only the ${unsavedCount} unaccepted question(s) from staging`}
              >
                <Trash2 size={13} />
                <span>Discard Unsaved ({unsavedCount})</span>
              </button>
            ) : (
              onDiscardAll && (
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
              )
            )}

            {/* Save Selected Button */}
            {!allAccepted && (
              <button
                type="button"
                id="btn-approve-selected"
                onClick={handleApproveSelectedClick}
                disabled={unsavedSelectedCount === 0 || isSaving}
                className="btn-secondary"
                style={{
                  padding: '7px 14px',
                  fontSize: '0.75rem',
                  gap: '6px'
                }}
              >
                <Check size={14} />
                <span>
                  {isSaving
                    ? 'Saving...'
                    : unsavedSelectedCount > 0
                    ? `Save Selected (${unsavedSelectedCount}) to Bank`
                    : `No Unsaved Selected`}
                </span>
              </button>
            )}

            {/* Accept All Questions Button (Prominent Primary Action) */}
            <button
              type="button"
              id="btn-approve-all"
              onClick={handleApproveAllClick}
              disabled={isSaving || totalCompleted === 0 || allAccepted}
              className="btn-primary"
              style={{
                padding: '7px 16px',
                fontSize: '0.75rem',
                fontWeight: 700,
                background: allAccepted ? 'var(--bg-surface-subtle)' : 'var(--status-success)',
                borderColor: allAccepted ? 'var(--border-medium)' : 'var(--status-success)',
                color: allAccepted ? 'var(--status-success)' : '#ffffff',
                gap: '6px',
                boxShadow: allAccepted ? 'none' : 'var(--shadow-sm)',
                cursor: allAccepted ? 'default' : 'pointer'
              }}
            >
              <CheckCircle2 size={15} color={allAccepted ? 'var(--status-success)' : '#ffffff'} />
              <span>
                {allAccepted
                  ? 'All Saved in Question Bank'
                  : isPassageSet
                  ? `Accept Entire Passage Set (${totalCompleted} Qs) into Bank`
                  : `Accept All Questions (${totalCompleted}) into Bank`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* FEATURED SHARED READING PASSAGE (UCAT Single Passage Multi-Question Stimulus) */}
      {isPassageSet && sharedStimulusText && effectivePassageCount > 0 && (
        <SharedPassageCard
          passageText={sharedStimulusText}
          questionCount={effectivePassageCount}
          totalCount={effectiveTotal}
          isMixedBatch={isMixedBatch}
          diagramQuestion={sharedPassageImage}
          collapsible={true}
          defaultCollapsed={false}
        />
      )}

      {/* VIEW MODE 1: GRID VIEW (DEFAULT - ALL REQUESTED QUESTIONS DISPLAYED SIDE BY SIDE) */}
      {viewMode === 'grid' && (
        isMixedBatch ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Section 01: Shared Reading Passage Set */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-light)', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-purple" style={{ fontSize: '0.65rem', fontWeight: 800 }}>SECTION 01</span>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Shared Reading Passage Set ({effectivePassageCount} Questions)
                  </h3>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Questions 1–{effectivePassageCount} reference the shared stimulus above
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                  gap: '16px'
                }}
              >
                {Array.from({ length: effectivePassageCount }).map((_, idx) => renderSlotCard(idx))}
              </div>
            </div>

            {/* Section 02: Independent Questions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px solid var(--border-light)', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-emerald" style={{ fontSize: '0.65rem', fontWeight: 800 }}>SECTION 02</span>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Independent Standalone Questions ({effectiveTotal - effectivePassageCount} Questions)
                  </h3>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Questions {effectivePassageCount + 1}–{effectiveTotal} are independent with individual vignettes
                </span>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                  gap: '16px'
                }}
              >
                {Array.from({ length: effectiveTotal - effectivePassageCount }).map((_, i) => renderSlotCard(effectivePassageCount + i))}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
              gap: '16px'
            }}
          >
            {Array.from({ length: effectiveTotal }).map((_, idx) => renderSlotCard(idx))}
          </div>
        )
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
                // Pending/generating pill
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
                      border: isGenerating ? '1px dashed var(--border-brand)' : '1px dashed var(--border-light)',
                      color: isGenerating ? 'var(--brand-primary)' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      opacity: isGenerating ? 1 : 0.6,
                      flexShrink: 0
                    }}
                  >
                    {isGenerating ? <Loader2 size={12} className="spin-slow" /> : <Clock size={12} />}
                    <span>Q{slotNumber} • {isGenerating ? 'Creating...' : 'Queued'}</span>
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
                    aria-label={`Select Question ${q.index || i + 1}`}
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
                    {isQuestionPassageLinked(q, slotNumber) ? (
                      <span className="badge badge-purple" style={{ fontSize: '0.625rem' }}>
                        Passage
                      </span>
                    ) : isMixedBatch ? (
                      <span className="badge badge-emerald" style={{ fontSize: '0.625rem' }}>
                        Independent
                      </span>
                    ) : isPassage ? (
                      <span className="badge badge-cyan" style={{ fontSize: '0.625rem' }}>
                        Passage
                      </span>
                    ) : null}

                    {/* Symmetry Balance Indicator */}
                    {Boolean(q.option_symmetry || q.stage_outcomes?.option_symmetry) && (
                      <span
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: (q.option_symmetry?.is_balanced ?? q.stage_outcomes?.option_symmetry?.is_balanced ?? true) ? 'var(--status-success)' : 'var(--status-warning)',
                          display: 'inline-block'
                        }}
                        title={`Anti-Guessability Symmetry: ${(q.option_symmetry || q.stage_outcomes?.option_symmetry)?.status || 'Balanced'}`}
                      />
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
                if (savedIds.has(activeQuestion.id)) return;
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
