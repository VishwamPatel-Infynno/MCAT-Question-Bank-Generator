import React, { useState, useEffect, useCallback } from 'react';
import {
  Navbar,
  GeneratorPanel,
  AgentVisualizer,
  QuestionCard,
  StagedBatchReview,
  QuestionBank,
  ReviewAuditView,
  SettingsModal,
  RejectionCard,
  ToastContainer
} from './components';
import { useQuestionGenerator } from './hooks/useQuestionGenerator';
import { useTheme } from './hooks/useTheme';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { UCAT_SECTIONS_FALLBACK } from './constants/ucat';
import { fetchSections, fetchHealth, approveQuestion, batchApproveQuestions } from './services/api';

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

  const handleGenerate = useCallback(() => {
    if (isGenerating) return;
    setIsQuestionSaved(false);
    const payload = {
      section: selectedSection,
      subtopic: selectedSubtopic,
      difficulty,
      questions_to_generate: totalQuestions,
      single_choice_count: totalQuestions > 1 ? singleChoiceCount : (interactionType === 'multi_choice' ? 0 : 1),
      multi_choice_count: totalQuestions > 1 ? multiChoiceCount : (interactionType === 'multi_choice' ? 1 : 0),
      passage_count: totalQuestions > 1 ? passageCount : (passageRequired === 'Yes' ? 1 : 0),
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
      message: totalQuestions > 1
        ? `Drafting ${totalQuestions} questions (${singleChoiceCount} Single, ${multiChoiceCount} Multi, ${passageCount} Passage)...`
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
      showToast({
        type: 'success',
        title: 'Question Approved & Saved',
        message: 'Psychometrically verified item is now stored in PostgreSQL Question Bank.'
      });
    } catch (err) {
      console.error('Failed to approve and save question:', err);
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Could not connect to database to persist question.'
      });
    }
  }, [showToast]);

  const handleBatchApprove = useCallback(async (questionsToSave) => {
    try {
      await batchApproveQuestions(questionsToSave);
      showToast({
        type: 'success',
        title: 'Batch Items Saved',
        message: `${questionsToSave.length} question(s) successfully committed to PostgreSQL Question Bank.`
      });
    } catch (err) {
      console.error('Failed to batch save questions:', err);
      showToast({
        type: 'error',
        title: 'Batch Save Failed',
        message: 'Could not connect to database to persist questions.'
      });
      throw err;
    }
  }, [showToast]);

  const handleDiscardQuestion = useCallback(() => {
    setActiveQuestion(null);
    setIsQuestionSaved(false);
    showToast({
      type: 'info',
      title: 'Candidate Discarded',
      message: 'Candidate question was discarded from studio view.'
    });
  }, [setActiveQuestion, showToast]);

  const handleDiscardBatch = useCallback(() => {
    setStagedQuestions([]);
    setActiveQuestion(null);
    setIsQuestionSaved(false);
    showToast({
      type: 'info',
      title: 'Batch Discarded',
      message: 'Generated candidate batch was discarded.'
    });
  }, [setStagedQuestions, setActiveQuestion, showToast]);

  const handleDiscardQuestionInBatch = useCallback((qId) => {
    setStagedQuestions(prev => prev.filter(q => q.id !== qId));
    showToast({
      type: 'info',
      title: 'Candidate Discarded',
      message: 'Question removed from staged batch.'
    });
  }, [setStagedQuestions, showToast]);

  // Keyboard Shortcuts Registration
  useKeyboardShortcuts({
    onGenerate: activeTab === 'generator' ? handleGenerate : undefined,
    onApprove: activeQuestion && !isQuestionSaved ? () => handleApproveQuestion(activeQuestion) : undefined,
    onDiscard: activeQuestion ? handleDiscardQuestion : undefined,
    onToggleTheme: toggleTheme,
    onEscape: () => {
      if (showSettings) setShowSettings(false);
      if (auditQuestion) setAuditQuestion(null);
    }
  });

  const handleSelectFromBank = (q) => {
    setActiveQuestion(q);
    setIsQuestionSaved(true);
    if (q.section) setSelectedSection(q.section);
    if (q.subtopic) setSelectedSubtopic(q.subtopic);
    if (q.difficulty) setDifficulty(q.difficulty);
    if (q.combination_id) setCombinationId(q.combination_id);
    if (q.content_domain) setContentDomain(q.content_domain);
    if (q.question_type) setQuestionType(q.question_type);
    if (q.primary_trap) setPrimaryTrap(q.primary_trap);
    if (q.passage_required) setPassageRequired(q.passage_required);
    if (q.visual_type) setVisualType(q.visual_type);
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
              />

              {/* Output: Rejection Card, Staged Batch Review, Single Question Card, or Empty State Placeholder */}
              {rejectedData ? (
                <RejectionCard
                  rejectionData={rejectedData}
                  onRetry={handleGenerate}
                />
              ) : stagedQuestions.length > 1 ? (
                <StagedBatchReview
                  stagedQuestions={stagedQuestions}
                  onApproveSelected={handleBatchApprove}
                  onApproveAll={handleBatchApprove}
                  onDiscardQuestion={handleDiscardQuestionInBatch}
                  onDiscardAll={handleDiscardBatch}
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
                <div
                  className="glass-panel"
                  style={{
                    padding: '80px 24px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: 'var(--brand-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.75rem',
                      boxShadow: 'var(--shadow-glow)'
                    }}
                  >
                    ✨
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Admin Review &amp; Quality Desk
                  </h3>
                  <p style={{ maxWidth: '480px', fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Select your target UCAT subtest on the left dock and press <strong style={{ color: 'var(--text-primary)' }}>⌘↵ (or click Generate)</strong>.
                    Watch the 4 autonomous agents draft, audit, and calibrate the question to 90+ quality standards in real time.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}


        {activeTab === 'bank' && (
          <QuestionBank
            onSelectQuestion={handleSelectFromBank}
            onShowToast={showToast}
          />
        )}

      </main>

      {/* Audit Modal */}
      {auditQuestion && (
        <ReviewAuditView
          question={auditQuestion}
          onClose={() => setAuditQuestion(null)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
