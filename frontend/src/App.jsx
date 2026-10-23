import React, { Suspense, lazy } from 'react';
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
import { useAppState } from './hooks';

// Dynamic code-split chunk imports for optimal bundle size
const QuestionBank = lazy(() => import('./components/bank/QuestionBank'));
const ReviewAuditView = lazy(() => import('./components/question/ReviewAuditView'));
const BatchActivityView = lazy(() => import('./components/batch/BatchActivityView'));
const AiValidatedQuestionsView = lazy(() => import('./components/validated/AiValidatedQuestionsView'));

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
  const {
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
    validatedCount,
    refreshCounts,
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
  } = useAppState();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendStatus={backendStatus}
        activeBatchCount={activeBatchCount}
        validatedCount={validatedCount}
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
                onGenerateQuestions={handleGenerate}
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

                {/* Output: Rejection Card, Staged Batch Review, Single Question Card, or Empty State */}
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
                    onUpdateQuestion={handleUpdateQuestionInBatch}
                  />
                ) : activeQuestion ? (
                  <QuestionCard
                    question={activeQuestion}
                    isSaved={isQuestionSaved}
                    onApprove={handleApproveQuestion}
                    onDiscard={handleDiscardQuestion}
                    onOpenAudit={(q) => setAuditQuestion(q)}
                    onNextQuestion={() => setViewMode('wizard')}
                    onUpdateQuestion={handleUpdateSingleQuestion}
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

        {activeTab === 'batches' && (
          <Suspense fallback={<LazyLoadingSpinner label="Loading Batch Activity Monitor..." />}>
            <BatchActivityView
              onOpenAudit={(q) => setAuditQuestion(q)}
              onNavigateToBank={() => setActiveTab('bank')}
              onNavigateToValidated={() => setActiveTab('validated')}
              onNavigateToWizard={() => {
                setActiveTab('generator');
                setViewMode('wizard');
              }}
              onShowToast={showToast}
            />
          </Suspense>
        )}

        {activeTab === 'validated' && (
          <Suspense fallback={<LazyLoadingSpinner label="Loading AI Validated Questions..." />}>
            <AiValidatedQuestionsView
              onOpenAudit={(q) => setAuditQuestion(q)}
              onNavigateToBank={() => setActiveTab('bank')}
              onNavigateToBatches={() => setActiveTab('batches')}
              onNavigateToWizard={() => {
                setActiveTab('generator');
                setViewMode('wizard');
              }}
              onShowToast={showToast}
              onRefreshCounts={refreshCounts}
            />
          </Suspense>
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
