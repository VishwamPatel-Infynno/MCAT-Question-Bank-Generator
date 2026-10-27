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
  setViewMode,
  onNavigateToWizard
}) {
  // Hierarchical view resolution:
  // 1. Rejection state: prompt user with retry
  // 2. Single-question inspection: active question loaded (e.g. from Bank or single review) while no batch is active
  // 3. Staged batch review: questions are staged or batch generation is actively running
  // 4. Skeleton preview during single question generation
  // 5. Clean empty idle state
  const isBatchMode = stagedQuestions.length > 0 || isGenerating;

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

      {/* Output: Rejection Card, Single Question Card, Staged Batch Review, Skeleton, or Empty State */}
      {rejectedData ? (
        <RejectionCard
          rejectionData={rejectedData}
          onRetry={handleGenerate}
        />
      ) : activeQuestion && stagedQuestions.length === 0 && !isGenerating ? (
        <QuestionCard
          question={activeQuestion}
          isSaved={isQuestionSaved}
          onApprove={handleApproveQuestion}
          onDiscard={handleDiscardQuestion}
          onOpenAudit={(q) => setAuditQuestion(q)}
          onNextQuestion={() => (onNavigateToWizard ? onNavigateToWizard(1) : setViewMode('wizard'))}
          onUpdateQuestion={handleUpdateSingleQuestion}
        />
      ) : isBatchMode ? (
        <StagedBatchReview
          stagedQuestions={stagedQuestions}
          targetTotal={generatorForm?.formData?.totalQuestions || 5}
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
      ) : isGenerating ? (
        <QuestionDraftingSkeleton
          sectionLabel={sectionsData?.find((s) => s.id === generatorForm?.formData?.section)?.label || 'MCAT Question'}
          difficulty={generatorForm?.formData?.difficulty || 'Medium'}
          interactionType={generatorForm?.formData?.interactionType || 'single_choice'}
          isPassage={generatorForm?.formData?.passageRequired === 'Yes'}
          slotNumber={1}
        />
      ) : (
        /* Clean Empty State */
        <div className="workspace-empty-state">
          <div className="workspace-empty-icon">
            <Sparkles size={28} />
          </div>
          <div>
            <div className="workspace-empty-badge-row">
              <span className="badge badge-subtle" style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                Status: Idle
              </span>
              <span style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0, overflow: 'hidden' }}>
                Ready for Review
              </span>
            </div>
            <h3 className="workspace-empty-heading">
              Ready to Create Questions
            </h3>
            <p className="workspace-empty-subtext">
              Configure exam sections, difficulty, reading passages, and diagrams with the Guided Question Wizard.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary"
            style={{ padding: '10px 22px', fontSize: '0.9rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            onClick={() => (onNavigateToWizard ? onNavigateToWizard(1) : setViewMode('wizard'))}
          >
            <Sparkles size={16} />
            <span>Open Question Wizard</span>
          </button>
        </div>
      )}
    </div>
  );
}
