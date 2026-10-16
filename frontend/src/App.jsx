import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import {
  Navbar,
  GeneratorPanel,
  AgentVisualizer,
  QuestionCard,
  StagedBatchReview,
  RejectionCard,
  ToastContainer,
  StudioBlueprint,
  Footer
} from './components';
import { useQuestionGenerator } from './hooks/useQuestionGenerator';
import { useTheme } from './hooks/useTheme';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { UCAT_SECTIONS_FALLBACK } from './constants/ucat';
import { fetchSections, fetchHealth, approveQuestion, batchApproveQuestions } from './services/api';

// Dynamic code-split chunk imports for optimal bundle size
const QuestionBank = lazy(() => import('./components/bank/QuestionBank'));
const ReviewAuditView = lazy(() => import('./components/question/ReviewAuditView'));
const SettingsModal = lazy(() => import('./components/modals/SettingsModal'));

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
  const [sectionsData, setSectionsData] = useState([]);
  const [selectedSection, setSelectedSection] = useState('verbal_reasoning');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [totalQuestions, setTotalQuestions] = useState(1);
  const [singleChoiceCount, setSingleChoiceCount] = useState(1);
  const [multiChoiceCount, setMultiChoiceCount] = useState(0);
  const [passageCount, setPassageCount] = useState(0);
  const [passageMode, setPassageMode] = useState('single_passage'); // 'single_passage' | 'independent'
  const [passageQuestionCount, setPassageQuestionCount] = useState(2);
  const [passageSingleCount, setPassageSingleCount] = useState(1);
  const [passageMultiCount, setPassageMultiCount] = useState(1);
  const [independentSingleCount, setIndependentSingleCount] = useState(2);
  const [independentMultiCount, setIndependentMultiCount] = useState(1);
  const [interactionType, setInteractionType] = useState('single_choice');
  const [passageRequired, setPassageRequired] = useState('No');
  const [primaryTrap, setPrimaryTrap] = useState('Automatic');
  const [requireImage, setRequireImage] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  // Layout & Dock State
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Modals & Status
  const [auditQuestion, setAuditQuestion] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
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
  } = useQuestionGenerator({
    onNeedsApiKey: () => setShowSettings(true)
  });

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
          setSelectedSection(data.sections[0].id);
          if (data.sections[0].subtopics?.length > 0) {
            setSelectedSubtopic(data.sections[0].subtopics[0]);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch sections:', err);
        setSectionsData(UCAT_SECTIONS_FALLBACK);
        setSelectedSection(UCAT_SECTIONS_FALLBACK[0].id);
        setSelectedSubtopic(UCAT_SECTIONS_FALLBACK[0].subtopics[0]);
      });
  }, []);

  const [isQuestionSaved, setIsQuestionSaved] = useState(false);
  const [savedQuestionIds, setSavedQuestionIds] = useState(() => new Set());

  const handleGenerate = useCallback(() => {
    if (isGenerating) return;
    setIsQuestionSaved(false);
    setSavedQuestionIds(new Set());
    const isMixedSet = totalQuestions > 1 && passageMode === 'single_passage' && passageQuestionCount < totalQuestions;
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
      primary_trap: primaryTrap !== 'Automatic' ? primaryTrap : undefined,
      require_image: requireImage || selectedSection === 'abstract_reasoning',
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
    customPrompt,
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
      if (showSettings) setShowSettings(false);
      if (auditQuestion) setAuditQuestion(null);
    }
  });

  const handleApplyPreset = useCallback((cfg) => {
    if (cfg.section) setSelectedSection(cfg.section);
    if (cfg.difficulty) setDifficulty(cfg.difficulty);
    if (cfg.totalQuestions) setTotalQuestions(cfg.totalQuestions);
    if (cfg.singleChoiceCount !== undefined) setSingleChoiceCount(cfg.singleChoiceCount);
    if (cfg.multiChoiceCount !== undefined) {
      setMultiChoiceCount(cfg.multiChoiceCount);
      setInteractionType(cfg.multiChoiceCount > 0 ? 'multi_choice' : 'single_choice');
    }
    if (cfg.passageCount !== undefined) {
      setPassageCount(cfg.passageCount);
      setPassageRequired(cfg.passageCount > 0 ? 'Yes' : 'No');
    }
    if (cfg.passageMode) setPassageMode(cfg.passageMode);
    if (cfg.passageQuestionCount !== undefined) setPassageQuestionCount(cfg.passageQuestionCount);
    if (cfg.passageSingleCount !== undefined) setPassageSingleCount(cfg.passageSingleCount);
    if (cfg.passageMultiCount !== undefined) setPassageMultiCount(cfg.passageMultiCount);
    if (cfg.independentSingleCount !== undefined) setIndependentSingleCount(cfg.independentSingleCount);
    if (cfg.independentMultiCount !== undefined) setIndependentMultiCount(cfg.independentMultiCount);
    if (cfg.primaryTrap) setPrimaryTrap(cfg.primaryTrap);
    showToast({
      type: 'info',
      title: 'Preset Applied',
      message: `${cfg.totalQuestions || 5} questions set for ${cfg.section ? cfg.section.replace(/_/g, ' ') : 'UCAT'}.`
    });
  }, [showToast]);

  const handleSelectFromBank = (q) => {
    setActiveQuestion(q);
    setIsQuestionSaved(true);
    if (q.section) setSelectedSection(q.section);
    if (q.subtopic) setSelectedSubtopic(q.subtopic);
    if (q.difficulty) setDifficulty(q.difficulty);
    if (q.primary_trap) setPrimaryTrap(q.primary_trap);
    if (q.passage_required) setPassageRequired(q.passage_required);
    setActiveTab('generator');
    showToast({
      type: 'info',
      title: 'Loaded in Studio',
      message: 'Question loaded into Review Desk.'
    });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setShowSettings(true)}
        backendStatus={backendStatus}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '24px' }}>
        {activeTab === 'generator' && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isPanelCollapsed ? '64px 1fr' : 'minmax(320px, 380px) 1fr',
              gap: '24px',
              alignItems: 'start',
              transition: 'grid-template-columns 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Left Parameter Dock */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <GeneratorPanel
                sectionsData={sectionsData}
                selectedSection={selectedSection}
                setSelectedSection={setSelectedSection}
                selectedSubtopic={selectedSubtopic}
                setSelectedSubtopic={setSelectedSubtopic}
                difficulty={difficulty}
                setDifficulty={setDifficulty}
                totalQuestions={totalQuestions}
                setTotalQuestions={setTotalQuestions}
                singleChoiceCount={singleChoiceCount}
                setSingleChoiceCount={setSingleChoiceCount}
                multiChoiceCount={multiChoiceCount}
                setMultiChoiceCount={setMultiChoiceCount}
                passageCount={passageCount}
                setPassageCount={setPassageCount}
                passageMode={passageMode}
                setPassageMode={setPassageMode}
                passageQuestionCount={passageQuestionCount}
                setPassageQuestionCount={setPassageQuestionCount}
                passageSingleCount={passageSingleCount}
                setPassageSingleCount={setPassageSingleCount}
                passageMultiCount={passageMultiCount}
                setPassageMultiCount={setPassageMultiCount}
                independentSingleCount={independentSingleCount}
                setIndependentSingleCount={setIndependentSingleCount}
                independentMultiCount={independentMultiCount}
                setIndependentMultiCount={setIndependentMultiCount}
                interactionType={interactionType}
                setInteractionType={setInteractionType}
                passageRequired={passageRequired}
                setPassageRequired={setPassageRequired}
                primaryTrap={primaryTrap}
                setPrimaryTrap={setPrimaryTrap}
                requireImage={requireImage}
                setRequireImage={setRequireImage}
                customPrompt={customPrompt}
                setCustomPrompt={setCustomPrompt}
                onGenerate={handleGenerate}
                onCancel={handleCancelGeneration}
                isGenerating={isGenerating}
                isCollapsed={isPanelCollapsed}
                onToggleCollapse={() => setIsPanelCollapsed(!isPanelCollapsed)}
              />
            </div>

            {/* Right Review Canvas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Multi-Agent Command Rail */}
              <AgentVisualizer
                activeAgent={activeAgent}
                iterationCount={iterationCount}
                events={events}
                latestReview={latestReview}
                isGenerating={isGenerating}
                batchProgress={batchProgress}
                perQuestionState={perQuestionState}
              />

              {/* Output: Rejection Card, Staged Batch Review, Single Question Card, or Empty State Placeholder */}
              {rejectedData ? (
                <RejectionCard
                  rejectionData={rejectedData}
                  onRetry={handleGenerate}
                />
              ) : ((stagedQuestions.length > 1) || (stagedQuestions.length > 0 && totalQuestions > 1) || (isGenerating && (batchProgress?.total > 1 || totalQuestions > 1))) ? (
                <StagedBatchReview
                  stagedQuestions={stagedQuestions}
                  targetTotal={totalQuestions}
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
                  onNextQuestion={handleGenerate}
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
              ) : (
                <StudioBlueprint
                  selectedSection={selectedSection}
                  selectedSubtopic={selectedSubtopic}
                  difficulty={difficulty}
                  totalQuestions={totalQuestions}
                  singleChoiceCount={singleChoiceCount}
                  multiChoiceCount={multiChoiceCount}
                  passageCount={passageCount}
                  passageMode={passageMode}
                  passageQuestionCount={passageQuestionCount}
                  passageSingleCount={passageSingleCount}
                  passageMultiCount={passageMultiCount}
                  independentSingleCount={independentSingleCount}
                  independentMultiCount={independentMultiCount}
                  primaryTrap={primaryTrap}
                  customPrompt={customPrompt}
                  sectionsData={sectionsData}
                  onGenerate={handleGenerate}
                  onApplyPreset={handleApplyPreset}
                  isGenerating={isGenerating}
                  activeAgent={activeAgent}
                  iterationCount={iterationCount}
                  events={events}
                  latestReview={latestReview}
                />
              )}
            </div>
          </div>
        )}


        {activeTab === 'bank' && (
          <Suspense fallback={<LazyLoadingSpinner label="Loading Question Bank..." />}>
            <QuestionBank
              onSelectQuestion={handleSelectFromBank}
              onShowToast={showToast}
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

      {/* Settings Modal */}
      {showSettings && (
        <Suspense fallback={null}>
          <SettingsModal onClose={() => setShowSettings(false)} />
        </Suspense>
      )}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
