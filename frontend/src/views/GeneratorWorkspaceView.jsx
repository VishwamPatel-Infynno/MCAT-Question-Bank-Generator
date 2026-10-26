import React from 'react';
import { Sparkles } from 'lucide-react';
import { AgentVisualizer, RejectionCard } from '../components/pipeline';
import { StagedBatchReview } from '../components/staged';
import { QuestionCard, QuestionDraftingSkeleton } from '../components/question';

/**
 * GeneratorWorkspaceView
 *
 * Full-width multi-agent generation command rail, real-time agent visualizer,
 * rejection handler, single-question review desk, and staged batch review manager.
 */
export default function GeneratorWorkspaceView({
  // Agent & Generation State
  isGenerating,
  activeAgent,
  iterationCount,
  events,
  latestReview,
  batchProgress,
  perQuestionState,
  rejectedData,
  activeQuestion,
  stagedQuestions,
  savedQuestionIds,
  isQuestionSaved,
  generatorForm,
  sectionsData,
  // Handlers
  handleGenerate,
  handleCancelGeneration,
  handleBatchApprove,
  handleDiscardQuestionInBatch,
  handleDiscardBatch,
  handleDiscardUnsaved,
  handleFinishBatch,
  handleUpdateQuestionInBatch,
  handleApproveQuestion,
  handleDiscardQuestion,
  handleUpdateSingleQuestion,
  setAuditQuestion,
  setActiveTab,
  setViewMode
}) {
  const isBatchMode =
    stagedQuestions.length > 1 ||
    (stagedQuestions.length > 0 && generatorForm.formData.totalQuestions > 1) ||
    (isGenerating && (batchProgress?.total > 1 || generatorForm.formData.totalQuestions > 1));

  return (
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
      ) : isBatchMode ? (
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
          sectionLabel={sectionsData?.find((s) => s.id === generatorForm.formData.section)?.label || 'MCAT Question'}
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
  );
}
