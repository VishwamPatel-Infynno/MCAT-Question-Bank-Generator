/**
 * useAppState — Central application state and handler hook.
 *
 * Extracted from App.jsx to enforce single-responsibility: App.jsx now
 * purely assembles the layout while this hook owns all stateful logic,
 * side-effects, and event handlers.
 */
import { useState, useEffect, useCallback } from 'react';
import { useTheme } from './useTheme';
import { useGeneratorForm } from './useGeneratorForm';
import { useQuestionGenerator } from './useQuestionGenerator';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { MCAT_SECTIONS_FALLBACK } from '../constants';
import { fetchSections, fetchHealth, approveQuestion, batchApproveQuestions, startBackgroundBatch, fetchBatches, fetchQuestionCounts } from '../services';

export function useAppState() {
  // ─── Theme ───────────────────────────────────────────────────────────────
  const { theme, toggleTheme } = useTheme();

  // ─── Navigation ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('generator');
  const [viewMode, setViewMode] = useState('hero'); // 'hero' | 'wizard' | 'workspace'

  // ─── Sections / Backend Status ────────────────────────────────────────────
  const [sectionsData, setSectionsData] = useState([]);
  const [backendStatus, setBackendStatus] = useState(false);
  const [activeBatchCount, setActiveBatchCount] = useState(0);
  const [validatedCount, setValidatedCount] = useState(0);

  // ─── Form ─────────────────────────────────────────────────────────────────
  const generatorForm = useGeneratorForm();
  const { updateFields } = generatorForm;

  // ─── Modals ───────────────────────────────────────────────────────────────
  const [auditQuestion, setAuditQuestion] = useState(null);

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
      message: 'Workflow execution stopped.'
    });
  }, [cancelGeneration, showToast]);

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
  const refreshActiveBatches = useCallback(() => {
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

  useEffect(() => {
    refreshActiveBatches();
    const timer = setInterval(refreshActiveBatches, 4000);
    return () => clearInterval(timer);
  }, [refreshActiveBatches]);

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
      likelyMistakePattern,
      customMistakePattern,
      contentDomains,
      contentDomain,
      allowAiImages,
      requireImage,
      customPrompt
    } = generatorForm.formData;

    const isVisualsPermitted = Boolean(allowAiImages || requireImage);

    const payload = {
      section: selectedSection,
      subject: selectedSubject || undefined,
      unit: selectedUnit || undefined,
      topic: selectedTopic || undefined,
      subtopic: selectedSubtopic,
      aamc_skill: selectedSkill || undefined,
      subskill: selectedSubskill || undefined,
      question_type: questionType || (passageMode === 'single_passage' ? 'PASSAGE_BASED_MCQ' : 'DISCRETE_MCQ'),
      difficulty,
      questions_to_generate: totalQuestions,
      single_choice_count: totalQuestions,
      multi_choice_count: 0,
      passage_count: passageMode === 'single_passage' ? (totalQuestions === 50 ? 10 : 1) : 0,
      passage_mode: passageMode,
      passage_question_count: passageMode === 'single_passage' ? totalQuestions : undefined,
      passage_single_count: passageMode === 'single_passage' ? totalQuestions : undefined,
      passage_multi_count: 0,
      independent_single_count: passageMode === 'independent' ? totalQuestions : undefined,
      independent_multi_count: 0,
      interaction_type: 'single_choice',
      passage_required: passageRequired,
      primary_trap: primaryTrap || 'Automatic',
      likely_mistake_pattern: customMistakePattern || likelyMistakePattern || undefined,
      content_domains: contentDomains && contentDomains.length > 0 ? contentDomains : undefined,
      content_domain: contentDomain || (contentDomains && contentDomains.length > 0 ? contentDomains.join(', ') : undefined),
      allow_ai_images: isVisualsPermitted,
      require_image: isVisualsPermitted,
      visual_type: isVisualsPermitted ? 'AI_FLUX_Image' : 'None',
      require_passage_image: isVisualsPermitted,
      custom_prompt: customPrompt.trim() || undefined
    };

    // If 50 questions selected, trigger background multi-job batch
    if (totalQuestions === 50) {
      startBackgroundBatch(payload)
        .then(() => {
          showToast({
            type: 'success',
            title: '50-Question Batch Launched',
            message: 'Generating 50 questions across 10 jobs (5 questions/job) in the background with 2-job concurrency.'
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
        });
      return;
    }

    setViewMode('workspace');
    setIsQuestionSaved(false);
    setSavedQuestionIds(new Set());
    startGeneration(payload);
    const isPassageBatch = passageMode === 'single_passage' || selectedSection === 'cars';
    showToast({
      type: 'info',
      title: totalQuestions > 1 ? `Batch Generation Started (${totalQuestions})` : 'Generation Started',
      message: totalQuestions > 1
        ? (isPassageBatch
            ? `Drafting ${totalQuestions}-question Passage-Based Set linked to a shared reading passage...`
            : `Drafting ${totalQuestions} Independent Discrete Questions...`)
        : `Multi-agent swarm drafting ${difficulty.toUpperCase()} question...`
    });
  }, [
    isGenerating,
    generatorForm.formData,
    startGeneration,
    showToast,
    refreshActiveBatches
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
        title: 'Questions Saved',
        message: `${questionsToSave.length} question(s) saved to your Question Bank.`
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
    generatorForm.updateFields({
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
  }, [generatorForm, showToast]);

  const handleSelectFromBank = useCallback((q) => {
    setActiveQuestion(q);
    setIsQuestionSaved(true);
    generatorForm.updateFields({
      ...(q.section && { selectedSection: q.section }),
      ...(q.subtopic && { selectedSubtopic: q.subtopic }),
      ...(q.difficulty && { difficulty: q.difficulty }),
      ...(q.primary_trap && { primaryTrap: q.primary_trap }),
      ...(q.passage_required && { passageRequired: q.passage_required })
    });
    setActiveTab('generator');
    setViewMode('workspace');
    showToast({ type: 'info', title: 'Loaded into Review', message: 'Question loaded into Review Workspace.' });
  }, [generatorForm, setActiveQuestion, showToast]);

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
    onEscape: () => { if (auditQuestion) setAuditQuestion(null); }
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
    setActiveQuestion,
    stagedQuestions,
    setStagedQuestions,
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
    refreshCounts: refreshActiveBatches
  };
}
