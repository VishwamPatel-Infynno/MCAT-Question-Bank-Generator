/**
 * useAppState - Central application state and handler hook.
 *
 * Extracted from App.jsx to enforce single-responsibility: App.jsx now
 * purely assembles the layout while this hook owns all stateful logic,
 * side-effects, and event handlers.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from './useTheme';
import { useGeneratorForm } from './useGeneratorForm';
import { useQuestionGenerator } from './useQuestionGenerator';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { MCAT_SECTIONS_FALLBACK } from '../constants';
import { fetchSections, fetchHealth, approveQuestion, batchApproveQuestions, startBackgroundBatch, fetchBatches, fetchQuestionCounts } from '../services';

/**
 * Central application state hook.
 *
 * Owns all stateful logic, side-effects, and event handlers for the app.
 * App.jsx uses this as its single source of truth — it purely assembles
 * the layout while this hook manages everything stateful.
 *
 * @returns {Object} All app state values and event handler callbacks.
 */
export function useAppState() {
  // ─── Theme ───────────────────────────────────────────────────────────────
  const { theme, toggleTheme } = useTheme();

  // ─── Navigation ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('generator');
  const [viewMode, setViewMode] = useState('hero'); // 'hero' | 'wizard' | 'workspace'
  const [wizardStep, setWizardStep] = useState(1);

  // ─── Sections / Backend Status ────────────────────────────────────────────
  const [sectionsData, setSectionsData] = useState([]);
  const [backendStatus, setBackendStatus] = useState(false);
  const [activeBatchCount, setActiveBatchCount] = useState(0);
  const [validatedCount, setValidatedCount] = useState(0);

  // ─── Form ─────────────────────────────────────────────────────────────────
  const generatorForm = useGeneratorForm();
  const { updateFields } = generatorForm;

  // ─── Modals & Background Actions ──────────────────────────────────────────
  const [auditQuestion, setAuditQuestion] = useState(null);
  const [isLaunchingBatch, setIsLaunchingBatch] = useState(false);

  // ─── Toast Notifications ──────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ─── Multi-Agent Generation Hook ──────────────────────────────────────────
  const {
    isGenerating,
    activeAgent,
    iterationCount,
    events,
    activeQuestion,
    setActiveQuestion,
    stagedQuestions,
    setStagedQuestions,
    batchProgress,
    perQuestionState,
    rejectedData,
    latestReview,
    startGeneration,
    cancelGeneration
  } = useQuestionGenerator();

  const handleCancelGeneration = useCallback(() => {
    cancelGeneration();
    showToast({
      type: 'info',
      title: 'Generation Cancelled',
      message: 'Generation cancelled. Workflow execution stopped and returned to idle.'
    });
  }, [cancelGeneration, showToast]);

  const handleNavigateToGenerator = useCallback(() => {
    if (isGenerating) {
      const confirmCancel = window.confirm(
        'Question generation is currently in progress. Returning to Step 1 will cancel current generation. Do you want to proceed?'
      );
      if (!confirmCancel) return;
      handleCancelGeneration();
    }
    setActiveTab('generator');
    setViewMode('wizard');
    setWizardStep(1);
  }, [isGenerating, handleCancelGeneration]);

  const handleNavigateToWizard = useCallback((step = 1) => {
    setActiveTab('generator');
    setViewMode('wizard');
    setWizardStep(step);
  }, []);

  // ─── Bootstrap: Health + Sections ─────────────────────────────────────────
  useEffect(() => {
    fetchHealth()
      .then(() => setBackendStatus(true))
      .catch(() => setBackendStatus(false));

    fetchSections()
      .then((data) => {
        if (data.sections && data.sections.length > 0) {
          setSectionsData(data.sections);
          updateFields({
            selectedSection: data.sections[0].id,
            selectedSubtopic: data.sections[0].subtopics?.[0] || ''
          });
        }
      })
      .catch((err) => {
        console.error('Failed to fetch sections:', err);
        setSectionsData(MCAT_SECTIONS_FALLBACK);
        updateFields({
          selectedSection: MCAT_SECTIONS_FALLBACK[0].id,
          selectedSubtopic: MCAT_SECTIONS_FALLBACK[0].subtopics?.[0] || ''
        });
      });
  }, [updateFields]);

  // ─── Batch & Counts Polling ───────────────────────────────────────────────
  const activeBatchCountRef = useRef(0);
  useEffect(() => {
    activeBatchCountRef.current = activeBatchCount;
  }, [activeBatchCount]);

  const refreshGlobalCounts = useCallback(() => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }
    fetchBatches()
      .then((data) => {
        setActiveBatchCount(data.active_running_batches || 0);
      })
      .catch(() => {});

    fetchQuestionCounts()
      .then((counts) => {
        setValidatedCount(counts.ai_validated || 0);
      })
      .catch(() => {});
  }, []);

  const refreshActiveBatches = refreshGlobalCounts;

  useEffect(() => {
    refreshGlobalCounts();

    let timer = null;
    let isCancelled = false;

    const scheduleNext = () => {
      if (isCancelled) return;
      // If there are running background batches, poll every 4s; otherwise idle poll at 30s
      const delay = activeBatchCountRef.current > 0 ? 4000 : 30000;
      timer = setTimeout(() => {
        refreshGlobalCounts();
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshGlobalCounts();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isCancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshGlobalCounts]);

  // ─── Save State ───────────────────────────────────────────────────────────
  const [isQuestionSaved, setIsQuestionSaved] = useState(false);
  const [savedQuestionIds, setSavedQuestionIds] = useState(() => new Set());

  // ─── Generate Handler ─────────────────────────────────────────────────────
  const handleGenerate = useCallback(() => {
    if (isGenerating) return;
    const {
      selectedSection,
      selectedSubject,
      selectedUnit,
      selectedTopic,
      selectedSubtopic,
      selectedSkill,
      selectedSubskill,
      questionType,
      difficulty,
      totalQuestions,
      passageMode,
      passageRequired,
      primaryTrap,
      primaryTraps,
      likelyMistakePattern,
      likelyMistakePatterns,
      customMistakePattern,
      contentDomains,
      contentDomain,
      selectedSubskills,
      selectedSubtopics,
      allowAiImages,
      requireImage
    } = generatorForm.formData;

    const isVisualsPermitted = Boolean(allowAiImages || requireImage);

    const payload = {
      section: selectedSection,
      subject: selectedSubject || undefined,
      unit: selectedUnit || undefined,
      topic: selectedTopic || undefined,
      subtopic: (selectedSubtopics && selectedSubtopics.length > 0) ? selectedSubtopics.join(', ') : selectedSubtopic,
      aamc_skill: selectedSkill || undefined,
      subskill: (selectedSubskills && selectedSubskills.length > 0) ? selectedSubskills.join(', ') : (selectedSubskill || undefined),
      question_type: questionType || (passageMode === 'single_passage' ? 'PASSAGE_BASED_MCQ' : 'DISCRETE_MCQ'),
      difficulty,
      questions_to_generate: totalQuestions,
      passage_count: passageMode === 'single_passage' ? (totalQuestions === 50 ? 10 : 1) : 0,
      passage_mode: passageMode,
      passage_question_count: passageMode === 'single_passage' ? totalQuestions : undefined,
      interaction_type: 'single_choice',
      passage_required: passageRequired,
      primary_trap: (primaryTraps && primaryTraps.length > 0) ? primaryTraps.join(', ') : (primaryTrap || 'Automatic'),
      likely_mistake_pattern: customMistakePattern || ((likelyMistakePatterns && likelyMistakePatterns.length > 0) ? likelyMistakePatterns.join(', ') : (likelyMistakePattern || 'Automatic')),
      content_domains: contentDomains && contentDomains.length > 0 ? contentDomains : undefined,
      content_domain: contentDomain || (contentDomains && contentDomains.length > 0 ? contentDomains.join(', ') : undefined),
      allow_ai_images: isVisualsPermitted,
      require_image: isVisualsPermitted && passageMode !== 'single_passage' && totalQuestions === 1,
      visual_type: isVisualsPermitted ? 'AI_FLUX_Image' : 'None',
      require_passage_image: isVisualsPermitted && passageMode === 'single_passage'
    };

    // Full Exam (50 questions across 10 jobs) runs in background worker pool
    if (totalQuestions === 50) {
      if (isLaunchingBatch) return;
      setIsLaunchingBatch(true);
      startBackgroundBatch(payload)
        .then(() => {
          showToast({
            type: 'success',
            title: '50-Question Exam Batch Launched',
            message: 'Generating 50 questions across 10 jobs in the background (Global Worker Pool).'
          });
          setActiveTab('batches');
          refreshActiveBatches();
        })
        .catch((err) => {
          showToast({
            type: 'error',
            title: 'Batch Launch Failed',
            message: err.message || 'Could not launch background batch.'
          });
        })
        .finally(() => {
          setIsLaunchingBatch(false);
        });
      return;
    }

    // Practice Set (5 questions) streams live into Generator Workspace via SSE
    setViewMode('workspace');
    setIsQuestionSaved(false);
    setSavedQuestionIds(new Set());
    startGeneration(payload);
    refreshActiveBatches();
    const isPassageBatch = passageMode === 'single_passage' || selectedSection === 'cars';
    showToast({
      type: 'info',
      title: 'Practice Set Started',
      message: isPassageBatch
        ? 'Drafting 5-question passage set with real-time multi-agent telemetry...'
        : 'Drafting 5 independent discrete questions with real-time multi-agent telemetry...'
    });
  }, [
    isGenerating,
    generatorForm.formData,
    startGeneration,
    showToast,
    refreshActiveBatches,
    isLaunchingBatch
  ]);

  // ─── Approve / Discard Handlers ────────────────────────────────────────────
  const handleApproveQuestion = useCallback(async (q) => {
    try {
      await approveQuestion(q);
      setIsQuestionSaved(true);
      setSavedQuestionIds(prev => new Set([...prev, q.id]));
      showToast({
        type: 'success',
        title: 'Question Saved',
        message: 'Question has been saved into your Question Bank.'
      });
    } catch (err) {
      console.error('Failed to approve and save question:', err);
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Could not connect to database to save question.'
      });
    }
  }, [showToast]);

  const handleBatchApprove = useCallback(async (questionsToSave) => {
    try {
      await batchApproveQuestions(questionsToSave);
      setSavedQuestionIds(prev => new Set([...prev, ...questionsToSave.map(item => item.id)]));
      showToast({
        type: 'success',
        title: 'Success - Questions Saved',
        message: `Successfully saved ${questionsToSave.length} question(s) to your Question Bank.`
      });
    } catch (err) {
      console.error('Failed to batch save questions:', err);
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Could not connect to database to save questions.'
      });
      throw err;
    }
  }, [showToast]);

  const handleDiscardQuestion = useCallback(() => {
    if (isQuestionSaved) {
      showToast({
        type: 'info',
        title: 'Question Protected',
        message: 'This question has already been accepted and saved in your Question Bank.'
      });
      return;
    }
    setActiveQuestion(null);
    setIsQuestionSaved(false);
    showToast({ type: 'info', title: 'Question Discarded', message: 'Question was removed.' });
  }, [isQuestionSaved, setActiveQuestion, showToast]);

  const handleDiscardBatch = useCallback(() => {
    setStagedQuestions([]);
    setActiveQuestion(null);
    setIsQuestionSaved(false);
    setSavedQuestionIds(new Set());
    showToast({ type: 'info', title: 'Questions Discarded', message: 'All unaccepted generated questions were removed.' });
  }, [setStagedQuestions, setActiveQuestion, showToast]);

  const handleDiscardUnsaved = useCallback((unsavedIds) => {
    const idSet = unsavedIds instanceof Set ? unsavedIds : new Set(unsavedIds);
    setStagedQuestions(prev => prev.filter(q => !idSet.has(q.id)));
    showToast({
      type: 'info',
      title: 'Unsaved Questions Discarded',
      message: `${idSet.size} unaccepted question(s) removed. Accepted questions remain safely in your Question Bank.`
    });
  }, [setStagedQuestions, showToast]);

  const handleFinishBatch = useCallback(() => {
    setStagedQuestions([]);
    setActiveQuestion(null);
    setIsQuestionSaved(false);
    setSavedQuestionIds(new Set());
    showToast({ type: 'success', title: 'Batch Completed', message: 'Batch finished. All accepted questions are safely in your Question Bank.' });
  }, [setStagedQuestions, setActiveQuestion, showToast]);

  const handleDiscardQuestionInBatch = useCallback((qId) => {
    setStagedQuestions(prev => prev.filter(q => q.id !== qId));
    showToast({ type: 'info', title: 'Question Removed', message: 'Question removed from batch.' });
  }, [setStagedQuestions, showToast]);

  // ─── Preset & Bank Selection Handlers ─────────────────────────────────────
  const handleApplyPreset = useCallback((cfg) => {
    updateFields({
      ...(cfg.section && { selectedSection: cfg.section }),
      ...(cfg.difficulty && { difficulty: cfg.difficulty }),
      ...(cfg.totalQuestions !== undefined && { totalQuestions: cfg.totalQuestions }),
      ...(cfg.singleChoiceCount !== undefined && { singleChoiceCount: cfg.singleChoiceCount }),
      interactionType: 'single_choice',
      multiChoiceCount: 0,
      ...(cfg.passageCount !== undefined && {
        passageCount: cfg.passageCount,
        passageRequired: cfg.passageCount > 0 ? 'Yes' : 'No'
      }),
      ...(cfg.passageMode && {
        passageMode: cfg.passageMode,
        questionType: cfg.passageMode === 'single_passage' ? 'PASSAGE_BASED_MCQ' : 'DISCRETE_MCQ'
      }),
      ...(cfg.passageQuestionCount !== undefined && { passageQuestionCount: cfg.passageQuestionCount }),
      ...(cfg.passageSingleCount !== undefined && { passageSingleCount: cfg.passageSingleCount }),
      ...(cfg.independentSingleCount !== undefined && { independentSingleCount: cfg.independentSingleCount }),
      ...(cfg.primaryTrap && { primaryTrap: cfg.primaryTrap })
    });
    showToast({
      type: 'info',
      title: 'Preset Applied',
      message: `${cfg.totalQuestions || 50} questions configured for ${cfg.section ? cfg.section.replace(/_/g, ' ') : 'MCAT'}.`
    });
  }, [updateFields, showToast]);

  const handleSelectFromBank = useCallback((q) => {
    setActiveQuestion(q);
    setIsQuestionSaved(true);
    updateFields({
      ...(q.section && { selectedSection: q.section }),
      ...(q.subtopic && { selectedSubtopic: q.subtopic }),
      ...(q.difficulty && { difficulty: q.difficulty }),
      ...(q.primary_trap && { primaryTrap: q.primary_trap }),
      ...(q.passage_required && { passageRequired: q.passage_required })
    });
    setActiveTab('generator');
    setViewMode('workspace');
    showToast({ type: 'info', title: 'Loaded into Review', message: 'Question loaded into Review Workspace.' });
  }, [updateFields, setActiveQuestion, showToast]);

  // ─── Question Update Handlers ──────────────────────────────────────────────
  const handleUpdateQuestionInBatch = useCallback((updated) => {
    setStagedQuestions(prev => prev.map(item => item.id === updated.id ? updated : item));
    if (activeQuestion?.id === updated.id) setActiveQuestion(updated);
    showToast({ type: 'success', title: 'Changes Applied', message: 'Question text updated.' });
  }, [setStagedQuestions, activeQuestion, setActiveQuestion, showToast]);

  const handleUpdateSingleQuestion = useCallback((updated) => {
    setActiveQuestion(updated);
    setStagedQuestions(prev => prev.map(item => item.id === updated.id ? updated : item));
    showToast({ type: 'success', title: 'Changes Applied', message: 'Question text updated.' });
  }, [setActiveQuestion, setStagedQuestions, showToast]);

  // ─── Keyboard Shortcuts ────────────────────────────────────────────────────
  useKeyboardShortcuts({
    onGenerate: activeTab === 'generator' ? handleGenerate : undefined,
    onApprove: activeQuestion && !isQuestionSaved ? () => handleApproveQuestion(activeQuestion) : undefined,
    onDiscard: activeQuestion && !isQuestionSaved ? handleDiscardQuestion : undefined,
    onToggleTheme: toggleTheme,
    onEscape: () => { if (auditQuestion) setAuditQuestion(null); },
    onNextQuestion: () => {
      if (stagedQuestions.length > 1) {
        const currIdx = stagedQuestions.findIndex(q => q.id === activeQuestion?.id);
        const nextIdx = currIdx >= 0 ? (currIdx + 1) % stagedQuestions.length : 0;
        setActiveQuestion(stagedQuestions[nextIdx]);
      }
    },
    onPrevQuestion: () => {
      if (stagedQuestions.length > 1) {
        const currIdx = stagedQuestions.findIndex(q => q.id === activeQuestion?.id);
        const prevIdx = currIdx >= 0 ? (currIdx - 1 + stagedQuestions.length) % stagedQuestions.length : stagedQuestions.length - 1;
        setActiveQuestion(stagedQuestions[prevIdx]);
      }
    }
  });

  return {
    // Theme
    theme,
    toggleTheme,
    // Navigation
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    wizardStep,
    setWizardStep,
    handleNavigateToGenerator,
    handleNavigateToWizard,
    // Data
    sectionsData,
    backendStatus,
    activeBatchCount,
    // Form
    generatorForm,
    // Modals
    auditQuestion,
    setAuditQuestion,
    // Toasts
    toasts,
    showToast,
    dismissToast,
    // Generator
    isGenerating,
    activeAgent,
    iterationCount,
    events,
    activeQuestion,
    stagedQuestions,
    batchProgress,
    perQuestionState,
    rejectedData,
    latestReview,
    // Save state
    isQuestionSaved,
    savedQuestionIds,
    // Handlers
    handleGenerate,
    handleCancelGeneration,
    handleApproveQuestion,
    handleBatchApprove,
    handleDiscardQuestion,
    handleDiscardBatch,
    handleDiscardUnsaved,
    handleFinishBatch,
    handleDiscardQuestionInBatch,
    handleApplyPreset,
    handleSelectFromBank,
    handleUpdateQuestionInBatch,
    handleUpdateSingleQuestion,
    // AI Validated state
    validatedCount,
    refreshCounts: refreshActiveBatches,
    isLaunchingBatch
  };
}
