import React, { Suspense, lazy } from 'react';
import {
  Navbar,
  ToastContainer,
  HeroLanding,
  GuidedWizard,
  Footer
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
    isLaunchingBatch
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
            <QuestionBankView
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
