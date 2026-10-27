import React, { Suspense, lazy } from 'react';
import {
  Navbar,
  ToastContainer,
  HeroLanding,
  GuidedWizard,
  Footer,
  ErrorBoundary
} from './components';
import GeneratorWorkspaceView from './views/GeneratorWorkspaceView';
import { useAppState } from './hooks';

// Dynamic code-split chunk imports for optimal bundle size
const QuestionBankView = lazy(() => import('./views/QuestionBankView'));
const ReviewAuditView = lazy(() => import('./components/question/ReviewAuditView'));
const BatchActivityView = lazy(() => import('./views/BatchActivityView'));
const AiValidatedQuestionsView = lazy(() => import('./views/AiValidatedQuestionsView'));

function LazyLoadingSpinner({ label = 'Loading...' }) {
  return (
    <div className="lazy-spinner-container">
      <div className="lazy-spinner-ring" />
      <span className="lazy-spinner-label">
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
    isLaunchingBatch
  } = useAppState();

  return (
    <div className="app-root">
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

      <main className="app-main-content">
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
                isLaunchingBatch={isLaunchingBatch}
              />
            )}

            {viewMode === 'workspace' && (
              <GeneratorWorkspaceView
                isGenerating={isGenerating}
                activeAgent={activeAgent}
                iterationCount={iterationCount}
                events={events}
                latestReview={latestReview}
                batchProgress={batchProgress}
                perQuestionState={perQuestionState}
                rejectedData={rejectedData}
                activeQuestion={activeQuestion}
                stagedQuestions={stagedQuestions}
                savedQuestionIds={savedQuestionIds}
                isQuestionSaved={isQuestionSaved}
                generatorForm={generatorForm}
                sectionsData={sectionsData}
                handleGenerate={handleGenerate}
                handleCancelGeneration={handleCancelGeneration}
                handleBatchApprove={handleBatchApprove}
                handleDiscardQuestionInBatch={handleDiscardQuestionInBatch}
                handleDiscardBatch={handleDiscardBatch}
                handleDiscardUnsaved={handleDiscardUnsaved}
                handleFinishBatch={handleFinishBatch}
                handleUpdateQuestionInBatch={handleUpdateQuestionInBatch}
                handleApproveQuestion={handleApproveQuestion}
                handleDiscardQuestion={handleDiscardQuestion}
                handleUpdateSingleQuestion={handleUpdateSingleQuestion}
                setAuditQuestion={setAuditQuestion}
                setActiveTab={setActiveTab}
                setViewMode={setViewMode}
              />
            )}
          </>
        )}

        {activeTab === 'batches' && (
          <ErrorBoundary fallbackLabel="Batch Activity Monitor">
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
          </ErrorBoundary>
        )}

        {activeTab === 'validated' && (
          <ErrorBoundary fallbackLabel="AI Validated Questions">
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
          </ErrorBoundary>
        )}

        {activeTab === 'bank' && (
          <ErrorBoundary fallbackLabel="Question Bank">
            <Suspense fallback={<LazyLoadingSpinner label="Loading Question Bank..." />}>
              <QuestionBankView
                onSelectQuestion={handleSelectFromBank}
                onShowToast={showToast}
                onNavigateToWizard={() => {
                  setActiveTab('generator');
                  setViewMode('wizard');
                }}
              />
            </Suspense>
          </ErrorBoundary>
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
