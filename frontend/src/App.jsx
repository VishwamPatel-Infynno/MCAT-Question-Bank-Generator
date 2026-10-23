import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Sparkles } from 'lucide-react';
import {
  Navbar,
  AgentVisualizer,
  QuestionCard,
  QuestionDraftingSkeleton,
  StagedBatchReview,
  RejectionCard,
  ToastContainer,
  HeroLanding,
  GuidedWizard,
  Footer
} from './components';
import { useQuestionGenerator } from './hooks/useQuestionGenerator';
import { useTheme } from './hooks/useTheme';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useGeneratorForm } from './hooks/useGeneratorForm';
import { MCAT_SECTIONS_FALLBACK } from './constants/mcat';
import { fetchSections, fetchHealth, approveQuestion, batchApproveQuestions } from './services/api';

// Dynamic code-split chunk imports for optimal bundle size
const QuestionBank = lazy(() => import('./components/bank/QuestionBank'));
const ReviewAuditView = lazy(() => import('./components/question/ReviewAuditView'));

function LazyLoadingSpinner({ label = 'Loading...' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '360px',
        width: '100%',
        gap: '16px',
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
      <span style={{ fontSize: '0.85rem', fontWeight: 500, letterSpacing: '0.02em' }}>
        {label}
      </span>
    </div>
  );
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('generator');
  const [viewMode, setViewMode] = useState('hero'); // 'hero' | 'wizard' | 'workspace'
  const [sectionsData, setSectionsData] = useState([]);
  const generatorForm = useGeneratorForm();
  const { updateFields } = generatorForm;

  // Modals & Status
  const [auditQuestion, setAuditQuestion] = useState(null);
  const [backendStatus, setBackendStatus] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback(({ type = 'info', title, message, duration = 4000 }) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Multi-Agent Generation Hook
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

  // Initialize backend health & sections data
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

  const [isQuestionSaved, setIsQuestionSaved] = useState(false);
  const [savedQuestionIds, setSavedQuestionIds] = useState(() => new Set());

  const handleGenerate = useCallback(() => {
    if (isGenerating) return;
    setViewMode('workspace');
    setIsQuestionSaved(false);
    setSavedQuestionIds(new Set());
    const {
      selectedSection,
      selectedSubtopic,
      difficulty,
      totalQuestions,
      singleChoiceCount,
      multiChoiceCount,
      passageCount,
      passageMode,
      passageQuestionCount,
      passageSingleCount,
      passageMultiCount,
      independentSingleCount,
      independentMultiCount,
      interactionType,
      passageRequired,
      primaryTrap,
      requireImage,
      imageMode,
      imageQuestionIndices,
      requirePassageImage,
      customPrompt
    } = generatorForm.formData;

    let effectiveImageIndices = [];
    if (imageMode === 'all') {
      effectiveImageIndices = Array.from({ length: totalQuestions }, (_, i) => i + 1);
    } else if (imageMode === 'specific') {
      effectiveImageIndices = (imageQuestionIndices || []).filter(idx => idx <= totalQuestions);
    }
    const hasAnyImage = effectiveImageIndices.length > 0 || requirePassageImage || requireImage;

    const payload = {
      section: selectedSection,
      subtopic: selectedSubtopic,
      difficulty,
      questions_to_generate: totalQuestions,
      single_choice_count: totalQuestions > 1 ? singleChoiceCount : (interactionType === 'multi_choice' ? 0 : 1),
      multi_choice_count: totalQuestions > 1 ? multiChoiceCount : (interactionType === 'multi_choice' ? 1 : 0),
      passage_count: totalQuestions > 1 ? passageCount : (passageRequired === 'Yes' ? 1 : 0),
      passage_mode: passageMode,
      passage_question_count: (totalQuestions > 1 && passageMode === 'single_passage') ? passageQuestionCount : undefined,
      passage_single_count: (totalQuestions > 1 && passageMode === 'single_passage') ? passageSingleCount : undefined,
      passage_multi_count: (totalQuestions > 1 && passageMode === 'single_passage') ? passageMultiCount : undefined,
      independent_single_count: (totalQuestions > 1 && passageMode === 'single_passage') ? independentSingleCount : undefined,
      independent_multi_count: (totalQuestions > 1 && passageMode === 'single_passage') ? independentMultiCount : undefined,
      interaction_type: interactionType,
      passage_required: passageRequired,
      primary_trap: primaryTrap || 'Automatic',
      require_image: hasAnyImage,
      visual_type: hasAnyImage ? 'AI_FLUX_Image' : 'None',
      image_question_indices: imageMode !== 'none' ? effectiveImageIndices : [],
      require_passage_image: Boolean(requirePassageImage),
      custom_prompt: customPrompt.trim() || undefined
    };
    startGeneration(payload);
    showToast({
      type: 'info',
      title: totalQuestions > 1 ? `Batch Generation Started (${totalQuestions})` : 'Generation Started',
      message: isMixedSet
        ? `Drafting mixed batch: ${passageQuestionCount} linked to Shared Passage + ${totalQuestions - passageQuestionCount} Independent Questions...`
        : totalQuestions > 1
          ? `Drafting ${totalQuestions} questions (${singleChoiceCount} Single, ${multiChoiceCount} Multi)...`
          : `Multi-agent swarm drafting ${difficulty.toUpperCase()} question...`
    });
  }, [
    isGenerating,
    generatorForm.formData,
    startGeneration,
    showToast
  ]);

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
    showToast({
      type: 'info',
      title: 'Question Discarded',
      message: 'Question was removed.'
    });
  }, [isQuestionSaved, setActiveQuestion, showToast]);

  const handleDiscardBatch = useCallback(() => {
    setStagedQuestions([]);
    setActiveQuestion(null);
    setIsQuestionSaved(false);
    setSavedQuestionIds(new Set());
    showToast({
      type: 'info',
      title: 'Questions Discarded',
      message: 'All unaccepted generated questions were removed.'
    });
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
    showToast({
      type: 'success',
      title: 'Batch Completed',
      message: 'Batch finished. All accepted questions are safely in your Question Bank.'
    });
  }, [setStagedQuestions, setActiveQuestion, showToast]);

  const handleDiscardQuestionInBatch = useCallback((qId) => {
    setStagedQuestions(prev => prev.filter(q => q.id !== qId));
    showToast({
      type: 'info',
      title: 'Question Removed',
      message: 'Question removed from batch.'
    });
  }, [setStagedQuestions, showToast]);

  // Keyboard Shortcuts Registration
  useKeyboardShortcuts({
    onGenerate: activeTab === 'generator' ? handleGenerate : undefined,
    onApprove: activeQuestion && !isQuestionSaved ? () => handleApproveQuestion(activeQuestion) : undefined,
    onDiscard: activeQuestion && !isQuestionSaved ? handleDiscardQuestion : undefined,
    onToggleTheme: toggleTheme,
    onEscape: () => {
      if (auditQuestion) setAuditQuestion(null);
    }
  });

  const handleApplyPreset = useCallback((cfg) => {
    generatorForm.updateFields({
      ...(cfg.section && { selectedSection: cfg.section }),
      ...(cfg.difficulty && { difficulty: cfg.difficulty }),
      ...(cfg.totalQuestions !== undefined && { totalQuestions: cfg.totalQuestions }),
      ...(cfg.singleChoiceCount !== undefined && { singleChoiceCount: cfg.singleChoiceCount }),
      ...(cfg.multiChoiceCount !== undefined && {
        multiChoiceCount: cfg.multiChoiceCount,
        interactionType: cfg.multiChoiceCount > 0 ? 'multi_choice' : 'single_choice'
      }),
      ...(cfg.passageCount !== undefined && {
        passageCount: cfg.passageCount,
        passageRequired: cfg.passageCount > 0 ? 'Yes' : 'No'
      }),
      ...(cfg.passageMode && { passageMode: cfg.passageMode }),
      ...(cfg.passageQuestionCount !== undefined && { passageQuestionCount: cfg.passageQuestionCount }),
      ...(cfg.passageSingleCount !== undefined && { passageSingleCount: cfg.passageSingleCount }),
      ...(cfg.passageMultiCount !== undefined && { passageMultiCount: cfg.passageMultiCount }),
      ...(cfg.independentSingleCount !== undefined && { independentSingleCount: cfg.independentSingleCount }),
      ...(cfg.independentMultiCount !== undefined && { independentMultiCount: cfg.independentMultiCount }),
      ...(cfg.primaryTrap && { primaryTrap: cfg.primaryTrap })
    });
    showToast({
      type: 'info',
      title: 'Preset Applied',
      message: `${cfg.totalQuestions || 5} questions set for ${cfg.section ? cfg.section.replace(/_/g, ' ') : 'MCAT'}.`
    });
  }, [generatorForm, showToast]);

  const handleSelectFromBank = (q) => {
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
    showToast({
      type: 'info',
      title: 'Loaded into Review',
      message: 'Question loaded into Review Workspace.'
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendStatus={backendStatus}
        theme={theme}
        onToggleTheme={toggleTheme}
        onGoHome={() => {
          setActiveTab('generator');
          setViewMode('hero');
        }}
      />

      <main style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '24px' }}>
        {activeTab === 'generator' && (
          <>
            {viewMode === 'hero' && (
              <HeroLanding
                onGetStarted={() => setViewMode('wizard')}
                onOpenBank={() => setActiveTab('bank')}
                onApplyPreset={(cfg) => {
                  handleApplyPreset(cfg);
                  setViewMode('wizard');
                }}
              />
            )}

            {viewMode === 'wizard' && (
              <GuidedWizard
                generatorForm={generatorForm}
                sectionsData={sectionsData}
                onGenerateQuestions={() => {
                  setViewMode('workspace');
                  handleGenerate();
                }}
              />
            )}

            {viewMode === 'workspace' && (
              <div style={{ maxWidth: '1040px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Multi-Agent Command Rail */}
                <AgentVisualizer
                  activeAgent={activeAgent}
                  iterationCount={iterationCount}
                  events={events}
                  latestReview={latestReview}
                  isGenerating={isGenerating}
                  batchProgress={batchProgress}
                  perQuestionState={perQuestionState}
                  onCancel={handleCancelGeneration}
                />

                {/* Output: Rejection Card, Staged Batch Review, Single Question Card, or Empty State Placeholder */}
                {rejectedData ? (
                  <RejectionCard
                    rejectionData={rejectedData}
                    onRetry={handleGenerate}
                  />
                ) : ((stagedQuestions.length > 1) || (stagedQuestions.length > 0 && generatorForm.formData.totalQuestions > 1) || (isGenerating && (batchProgress?.total > 1 || generatorForm.formData.totalQuestions > 1))) ? (
                  <StagedBatchReview
                    stagedQuestions={stagedQuestions}
                    targetTotal={generatorForm.formData.totalQuestions}
                    savedQuestionIds={savedQuestionIds}
                    isGenerating={isGenerating}
                    batchProgress={batchProgress}
                    perQuestionState={perQuestionState}
                    onApproveSelected={handleBatchApprove}
                    onApproveAll={handleBatchApprove}
                    onDiscardQuestion={handleDiscardQuestionInBatch}
                    onDiscardAll={handleDiscardBatch}
                    onDiscardUnsaved={handleDiscardUnsaved}
                    onFinishBatch={handleFinishBatch}
                    onNavigateToBank={() => setActiveTab('bank')}
                    onOpenAudit={(q) => setAuditQuestion(q)}
                    onUpdateQuestion={(updated) => {
                      setStagedQuestions(prev => prev.map(item => item.id === updated.id ? updated : item));
                      if (activeQuestion?.id === updated.id) {
                        setActiveQuestion(updated);
                      }
                      showToast({
                        type: 'success',
                        title: 'Changes Applied',
                        message: 'Question text updated.'
                      });
                    }}
                  />
                ) : activeQuestion ? (
                  <QuestionCard
                    question={activeQuestion}
                    isSaved={isQuestionSaved}
                    onApprove={handleApproveQuestion}
                    onDiscard={handleDiscardQuestion}
                    onOpenAudit={(q) => setAuditQuestion(q)}
                    onNextQuestion={() => setViewMode('wizard')}
                    onUpdateQuestion={(updated) => {
                      setActiveQuestion(updated);
                      setStagedQuestions(prev => prev.map(item => item.id === updated.id ? updated : item));
                      showToast({
                        type: 'success',
                        title: 'Changes Applied',
                        message: 'Question text updated.'
                      });
                    }}
                  />
                ) : isGenerating ? (
                  <QuestionDraftingSkeleton
                    sectionLabel={sectionsData?.find(s => s.id === generatorForm.formData.section)?.label || 'MCAT Question'}
                    difficulty={generatorForm.formData.difficulty || 'Medium'}
                    interactionType={generatorForm.formData.interactionType || 'single_choice'}
                    isPassage={generatorForm.formData.passageRequired === 'Yes'}
                    slotNumber={1}
                  />
                ) : (
                  /* Clean Empty State */
                  <div
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      padding: '48px 24px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '16px'
                    }}
                  >
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'rgba(79, 48, 185, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--brand-primary)'
                      }}
                    >
                      <Sparkles size={28} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                        Ready to Create Questions
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
                        Configure exam sections, difficulty, reading passages, and diagrams with the Guided Question Wizard.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '10px 22px', fontSize: '0.9rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      onClick={() => setViewMode('wizard')}
                    >
                      <Sparkles size={16} />
                      <span>Open Question Wizard</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}


        {activeTab === 'bank' && (
          <Suspense fallback={<LazyLoadingSpinner label="Loading Question Bank..." />}>
            <QuestionBank
              onSelectQuestion={handleSelectFromBank}
              onShowToast={showToast}
              onNavigateToWizard={() => {
                setActiveTab('generator');
                setViewMode('wizard');
              }}
            />
          </Suspense>
        )}

      </main>

      {/* Corporate Footer */}
      <Footer />

      {/* Audit Modal */}
      {auditQuestion && (
        <Suspense fallback={null}>
          <ReviewAuditView
            question={auditQuestion}
            onClose={() => setAuditQuestion(null)}
          />
        </Suspense>
      )}


      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
