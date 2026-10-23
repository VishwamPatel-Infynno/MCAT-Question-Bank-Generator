import React, { useState, useMemo } from 'react';
import SharedPassageCard from './SharedPassageCard';
import StagedQuestionSlotCard from './StagedQuestionSlotCard';
import BatchProgressHeader from './BatchProgressHeader';
import StagedBatchGrid from './StagedBatchGrid';
import StagedDetailedView from './StagedDetailedView';

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = Object.freeze({});

export default function StagedBatchReview({
  stagedQuestions = EMPTY_ARRAY,
  targetTotal = 1,
  savedQuestionIds = null,
  isGenerating = false,
  batchProgress = null,
  perQuestionState = EMPTY_OBJECT,
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
  const [deselectedIds, setDeselectedIds] = useState(() => new Set());
  const [localSavedIds, setLocalSavedIds] = useState(() => new Set());
  const [activeIdx, setActiveIdx] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [isSaving, setIsSaving] = useState(false);
  const [expandedExplanationIds, setExpandedExplanationIds] = useState(() => new Set());

  // ─── Derived State ─────────────────────────────────────────────────────────
  const savedIds = useMemo(() => {
    const combined = new Set(localSavedIds);
    if (savedQuestionIds) savedQuestionIds.forEach((id) => combined.add(id));
    return combined;
  }, [localSavedIds, savedQuestionIds]);

  const effectiveTotal = Math.max(stagedQuestions.length, targetTotal || 1, batchProgress?.total || 1);

  const isPassageSet = useMemo(() => {
    if (batchProgress?.passage_mode === 'single_passage') return true;
    if (stagedQuestions.some((q) => q.passage_id || q.passage_mode === 'single_passage')) return true;
    if (
      stagedQuestions.length > 1 &&
      stagedQuestions.every(
        (q) => q.passage_required === 'Yes' && q.stimulus_text && q.stimulus_text === stagedQuestions[0]?.stimulus_text
      )
    )
      return true;
    return false;
  }, [stagedQuestions, batchProgress]);

  const effectivePassageCount = useMemo(() => {
    if (batchProgress?.passage_question_count) return batchProgress.passage_question_count;
    const passageLinkedQs = stagedQuestions.filter((q) => q.passage_id || q.passage_mode === 'single_passage');
    if (passageLinkedQs.length > 0 && passageLinkedQs.length < stagedQuestions.length) return passageLinkedQs.length;
    if (
      isPassageSet &&
      !batchProgress?.is_mixed_set &&
      stagedQuestions.length > 0 &&
      stagedQuestions.every((q) => !q.passage_id || q.passage_mode === 'single_passage')
    )
      return effectiveTotal;
    return passageLinkedQs.length || (isPassageSet ? effectiveTotal : 0);
  }, [batchProgress, stagedQuestions, isPassageSet, effectiveTotal]);

  const isMixedBatch = useMemo(() => {
    if (batchProgress?.is_mixed_set !== undefined) return Boolean(batchProgress.is_mixed_set);
    return effectivePassageCount > 0 && effectivePassageCount < effectiveTotal;
  }, [batchProgress, effectivePassageCount, effectiveTotal]);

  const sharedStimulusText = useMemo(() => {
    if (!isPassageSet) return null;
    if (batchProgress?.shared_passage) return batchProgress.shared_passage;
    const linkedQ = stagedQuestions.find((q) => q.passage_id || q.passage_mode === 'single_passage');
    return linkedQ?.stimulus_text || stagedQuestions[0]?.stimulus_text || null;
  }, [isPassageSet, batchProgress, stagedQuestions]);

  const sharedPassageImage = useMemo(() => {
    if (!isPassageSet) return null;
    if (batchProgress?.shared_passage_image_svg || batchProgress?.shared_passage_image_url) {
      return {
        image_svg: batchProgress.shared_passage_image_svg,
        image_url: batchProgress.shared_passage_image_url,
        image_description: batchProgress.shared_passage_image_description
      };
    }
    const linkedQ = stagedQuestions.find(
      (q) =>
        (q.passage_id || q.passage_mode === 'single_passage') &&
        (q.image_svg ||
          q.image_url ||
          q.stage_outcomes?.passage_visual_stimulus?.image_svg ||
          q.stage_outcomes?.visual_stimulus?.image_svg)
    );
    if (linkedQ) {
      return {
        image_svg:
          linkedQ.stage_outcomes?.passage_visual_stimulus?.image_svg ||
          linkedQ.image_svg ||
          linkedQ.stage_outcomes?.visual_stimulus?.image_svg,
        image_url:
          linkedQ.stage_outcomes?.passage_visual_stimulus?.image_url ||
          linkedQ.image_url ||
          linkedQ.stage_outcomes?.visual_stimulus?.image_url,
        image_description:
          linkedQ.stage_outcomes?.passage_visual_stimulus?.image_description ||
          linkedQ.image_description ||
          linkedQ.stage_outcomes?.visual_stimulus?.image_description
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

  const selectedIds = useMemo(() => {
    return new Set(stagedQuestions.filter((q) => !deselectedIds.has(q.id)).map((q) => q.id));
  }, [stagedQuestions, deselectedIds]);

  const totalCompleted = stagedQuestions.length;
  const selectedCount = selectedIds.size;
  const savedCount = savedIds.size;
  const unsavedQuestions = useMemo(
    () => stagedQuestions.filter((q) => !savedIds.has(q.id)),
    [stagedQuestions, savedIds]
  );
  const unsavedCount = unsavedQuestions.length;
  const allAccepted = totalCompleted > 0 && savedCount === totalCompleted;
  const anyAccepted = savedCount > 0;

  const unsavedSelectedCount = useMemo(() => {
    return stagedQuestions.filter((q) => selectedIds.has(q.id) && !savedIds.has(q.id)).length;
  }, [stagedQuestions, selectedIds, savedIds]);

  const { singleCount, multiCount, passageCount, avgScore } = useMemo(() => {
    let single = 0,
      multi = 0,
      passage = 0,
      scoreSum = 0;
    stagedQuestions.forEach((q) => {
      const isMulti =
        q.interaction_type === 'multi_choice' ||
        (Array.isArray(q.correct_answer_ids) && q.correct_answer_ids.length > 1);
      if (isMulti) multi++;
      else single++;
      const wordCount = q.stimulus_text ? q.stimulus_text.trim().split(/\s+/).length : 0;
      if (q.passage_required === 'Yes' || wordCount >= 180) passage++;
      scoreSum += q.final_score || 95;
    });
    return {
      singleCount: single,
      multiCount: multi,
      passageCount: passage,
      avgScore: totalCompleted > 0 ? (scoreSum / totalCompleted).toFixed(1) : '95.0'
    };
  }, [stagedQuestions, totalCompleted]);

  const validIdx = Math.max(0, Math.min(activeIdx, Math.max(0, stagedQuestions.length - 1)));
  const activeQuestion = stagedQuestions[validIdx] || null;

  if (stagedQuestions.length === 0 && !isGenerating && effectiveTotal <= 1) return null;

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleToggleSelect = (id) => {
    if (savedIds.has(id)) return;
    setDeselectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExplanation = (id) => {
    setExpandedExplanationIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (allAccepted) return;
    if (unsavedCount > 0 && unsavedSelectedCount === unsavedCount) {
      setDeselectedIds((prev) => {
        const next = new Set(prev);
        unsavedQuestions.forEach((q) => next.add(q.id));
        return next;
      });
    } else {
      setDeselectedIds((prev) => {
        const next = new Set(prev);
        unsavedQuestions.forEach((q) => next.delete(q.id));
        return next;
      });
    }
  };

  const handleApproveSelectedClick = async () => {
    if (unsavedSelectedCount === 0 || isSaving) return;
    const questionsToApprove = stagedQuestions.filter((q) => selectedIds.has(q.id) && !savedIds.has(q.id));
    if (questionsToApprove.length === 0) return;
    setIsSaving(true);
    try {
      if (onApproveSelected) await onApproveSelected(questionsToApprove);
      setLocalSavedIds((prev) => {
        const next = new Set(prev);
        questionsToApprove.forEach((q) => next.add(q.id));
        return next;
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveAllClick = async () => {
    if (isSaving || totalCompleted === 0 || allAccepted) return;
    const unsaved = stagedQuestions.filter((q) => !savedIds.has(q.id));
    if (unsaved.length === 0) return;
    setIsSaving(true);
    try {
      if (onApproveAll) await onApproveAll(unsaved);
      setLocalSavedIds((prev) => {
        const next = new Set(prev);
        unsaved.forEach((q) => next.add(q.id));
        return next;
      });
      setDeselectedIds(new Set());
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardUnsavedClick = () => {
    if (unsavedCount === 0) return;
    const unsavedIds = new Set(unsavedQuestions.map((q) => q.id));
    if (onDiscardUnsaved) {
      onDiscardUnsaved(unsavedIds);
    } else if (onDiscardAll && unsavedCount === totalCompleted) {
      onDiscardAll();
    }
    setDeselectedIds((prev) => {
      const next = new Set(prev);
      unsavedIds.forEach((id) => next.delete(id));
      return next;
    });
  };

  const handleApproveSingle = async (q) => {
    if (isSaving || savedIds.has(q.id)) return;
    setIsSaving(true);
    try {
      if (onApproveSelected) await onApproveSelected([q]);
      setLocalSavedIds((prev) => new Set([...prev, q.id]));
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Slot Card Factory ─────────────────────────────────────────────────────
  const renderSlotCard = (idx) => {
    const slotNumber = idx + 1;
    const qState = perQuestionState[slotNumber];
    const q =
      stagedQuestions.find((item) => item.index === slotNumber || item.batch_index === slotNumber) ||
      qState?.question ||
      (stagedQuestions.length === effectiveTotal ? stagedQuestions[idx] : null);
    const isLinked = isQuestionPassageLinked(q, slotNumber);

    return (
      <StagedQuestionSlotCard
        key={q?.id || `slot-${slotNumber}`}
        idx={idx}
        slotNumber={slotNumber}
        q={q}
        qState={qState}
        isLinked={isLinked}
        isMixedBatch={isMixedBatch}
        isPassageSet={isPassageSet}
        effectiveTotal={effectiveTotal}
        isChecked={q ? selectedIds.has(q.id) : false}
        isSaved={q ? savedIds.has(q.id) : false}
        isSaving={isSaving}
        isExpandedExplanation={q ? expandedExplanationIds.has(q.id) : false}
        onToggleSelect={handleToggleSelect}
        onToggleExplanation={toggleExplanation}
        onApproveSingle={handleApproveSingle}
        onOpenAudit={onOpenAudit}
        onSelectDetailedView={(selectedIdx) => {
          setActiveIdx(selectedIdx);
          setViewMode('tabs');
        }}
      />
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── Progress Header + Bulk Action Toolbar ───────────────────────── */}
      <BatchProgressHeader
        isGenerating={isGenerating}
        totalCompleted={totalCompleted}
        effectiveTotal={effectiveTotal}
        isSaving={isSaving}
        singleCount={singleCount}
        multiCount={multiCount}
        passageCount={passageCount}
        isPassageSet={isPassageSet}
        isMixedBatch={isMixedBatch}
        effectivePassageCount={effectivePassageCount}
        avgScore={avgScore}
        savedIds={savedIds}
        allAccepted={allAccepted}
        anyAccepted={anyAccepted}
        unsavedCount={unsavedCount}
        unsavedSelectedCount={unsavedSelectedCount}
        selectedCount={selectedCount}
        viewMode={viewMode}
        setViewMode={setViewMode}
        handleToggleSelectAll={handleToggleSelectAll}
        unsavedQuestions={unsavedQuestions}
        handleApproveSelectedClick={handleApproveSelectedClick}
        handleApproveAllClick={handleApproveAllClick}
        handleDiscardUnsavedClick={handleDiscardUnsavedClick}
        onDiscardAll={onDiscardAll}
        onNavigateToBank={onNavigateToBank}
        onFinishBatch={onFinishBatch}
      />

      {/* ── Shared Reading Passage Card ────────────────────────────────── */}
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

      {/* ── VIEW MODE 1: GRID ──────────────────────────────────────────── */}
      {viewMode === 'grid' && (
        <StagedBatchGrid
          isMixedBatch={isMixedBatch}
          effectivePassageCount={effectivePassageCount}
          effectiveTotal={effectiveTotal}
          renderSlotCard={renderSlotCard}
        />
      )}

      {/* ── VIEW MODE 2: DETAILED SINGLE VIEW ─────────────────────────── */}
      {viewMode === 'tabs' && (
        <StagedDetailedView
          effectiveTotal={effectiveTotal}
          perQuestionState={perQuestionState}
          stagedQuestions={stagedQuestions}
          validIdx={validIdx}
          activeQuestion={activeQuestion}
          totalCompleted={totalCompleted}
          isGenerating={isGenerating}
          isMixedBatch={isMixedBatch}
          selectedIds={selectedIds}
          savedIds={savedIds}
          setActiveIdx={setActiveIdx}
          handleToggleSelect={handleToggleSelect}
          isQuestionPassageLinked={isQuestionPassageLinked}
          handleApproveSingle={handleApproveSingle}
          onDiscardQuestion={onDiscardQuestion}
          onOpenAudit={onOpenAudit}
          onUpdateQuestion={onUpdateQuestion}
        />
      )}
    </div>
  );
}
