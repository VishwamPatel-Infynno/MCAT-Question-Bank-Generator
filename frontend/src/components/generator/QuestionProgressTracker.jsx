import React from 'react';
import {
  PenTool,
  ShieldCheck,
  RotateCcw,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  ChevronRight
} from 'lucide-react';

/**
 * QuestionProgressTracker
 * Renders an animated, live stage progress tracker for each question in a generation batch.
 * Appears immediately upon click so users have zero-wait visual feedback from the first millisecond.
 */
export default function QuestionProgressTracker({
  perQuestionState = {},
  totalQuestions = 1,
  isGenerating = false,
}) {
  const stateList = Object.values(perQuestionState);
  
  // If no state exists yet, build a placeholder array for totalQuestions
  const questionsToRender = stateList.length > 0
    ? stateList.sort((a, b) => a.index - b.index)
    : Array.from({ length: totalQuestions }, (_, i) => ({
        index: i + 1,
        stage: 'drafting',
        agentName: 'Question Writer',
        message: `Drafting Question ${i + 1}...`,
        iteration: 1,
        score: null,
        isComplete: false,
      }));

  const getStageStatus = (qState, stageKey) => {
    const stage = qState.stage;
    const isDone = qState.isComplete;

    if (stageKey === 'drafting') {
      if (isDone || stage === 'reviewing' || stage === 'remediating' || stage === 'image' || stage === 'completed') {
        return 'completed';
      }
      return isGenerating ? 'active' : 'idle';
    }

    if (stageKey === 'reviewing') {
      if (isDone || stage === 'completed' || stage === 'image') return 'completed';
      if (stage === 'remediating') return 'completed'; // Passed through review to reach remediation
      if (stage === 'reviewing') return isGenerating ? 'active' : 'completed';
      return 'pending';
    }

    if (stageKey === 'remediating') {
      if (qState.iteration > 1 || stage === 'remediating') {
        if (isDone || stage === 'completed' || (stage === 'reviewing' && qState.iteration > 1)) return 'completed';
        return isGenerating ? 'active' : 'idle';
      }
      return 'hidden'; // Don't show remediation stage if it wasn't needed
    }

    if (stageKey === 'image') {
      if (qState.passageRequired === 'Yes' && !qState.imageNeeded) return 'hidden';
      if (isDone || stage === 'completed') return 'completed';
      if (stage === 'image') return isGenerating ? 'active' : 'idle';
      return 'hidden';
    }

    if (stageKey === 'completed') {
      if (isDone || stage === 'completed') return 'completed';
      return 'pending';
    }

    return 'pending';
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '14px 18px',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-medium)',
        background: 'var(--bg-surface-elevated)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="agent-pulse-dot" style={{ width: '8px', height: '8px' }} />
          <h4 style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {isGenerating ? 'Live Question Generation Pipeline' : 'Generation Pipeline Status'}
          </h4>
          <span className="badge badge-sky" style={{ fontSize: '0.675rem' }}>
            {questionsToRender.filter(q => q.isComplete).length} of {totalQuestions} Ready
          </span>
        </div>

        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Fused Draft-and-Critique Active</span>
          <span>•</span>
          <span style={{ color: 'var(--status-success)', fontWeight: 600 }}>90+ Quality Standard</span>
        </div>
      </div>

      {/* Per-Question Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {questionsToRender.map((qState) => {
          const isDone = qState.isComplete;
          const score = qState.score || (qState.question?.final_score);
          const needsRemediation = qState.iteration > 1 || qState.stage === 'remediating';

          const draftingStatus = getStageStatus(qState, 'drafting');
          const reviewingStatus = getStageStatus(qState, 'reviewing');
          const remediatingStatus = getStageStatus(qState, 'remediating');

          return (
            <div
              key={`q-tracker-${qState.index}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                background: isDone
                  ? 'rgba(16, 185, 129, 0.05)'
                  : 'var(--bg-surface-subtle)',
                border: isDone
                  ? '1px solid var(--status-success-border)'
                  : '1px solid var(--border-light)',
                transition: 'all 0.25s ease'
              }}
            >
              {/* Question Identifier & Live Message */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '160px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-xs)',
                    background: isDone
                      ? 'var(--status-success-bg)'
                      : 'var(--brand-light)',
                    color: isDone
                      ? 'var(--status-success)'
                      : 'var(--brand-primary)',
                    border: isDone
                      ? '1px solid var(--status-success-border)'
                      : '1px solid var(--border-brand)'
                  }}
                >
                  Q{qState.index}
                </span>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {isDone ? 'Question Ready' : (qState.agentName || 'Writing Draft...')}
                  </span>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      color: 'var(--text-muted)',
                      maxWidth: '220px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                    title={qState.message}
                  >
                    {isDone ? 'Passed psychometric validation' : (qState.message || 'Executing prompt...')}
                  </span>
                </div>
              </div>

              {/* Progress Stage Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {/* 1. Drafting */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.675rem',
                    fontWeight: draftingStatus === 'active' ? 700 : 500,
                    background: draftingStatus === 'active'
                      ? 'var(--brand-light)'
                      : draftingStatus === 'completed'
                      ? 'rgba(56, 189, 248, 0.08)'
                      : 'transparent',
                    color: draftingStatus === 'active' || draftingStatus === 'completed'
                      ? 'var(--brand-primary)'
                      : 'var(--text-dim)',
                    border: draftingStatus === 'active'
                      ? '1px solid var(--border-brand)'
                      : '1px solid transparent'
                  }}
                >
                  {draftingStatus === 'completed' ? (
                    <Check size={10} />
                  ) : draftingStatus === 'active' ? (
                    <Loader2 size={10} className="spin-slow" />
                  ) : (
                    <PenTool size={10} />
                  )}
                  <span>Writing</span>
                </div>

                <ChevronRight size={10} color="var(--text-dim)" />

                {/* 2. Quality Review */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.675rem',
                    fontWeight: reviewingStatus === 'active' ? 700 : 500,
                    background: reviewingStatus === 'active'
                      ? 'var(--status-warning-bg)'
                      : reviewingStatus === 'completed'
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'transparent',
                    color: reviewingStatus === 'active'
                      ? 'var(--status-warning)'
                      : reviewingStatus === 'completed'
                      ? 'var(--status-success)'
                      : 'var(--text-dim)',
                    border: reviewingStatus === 'active'
                      ? '1px solid var(--status-warning-border)'
                      : '1px solid transparent'
                  }}
                >
                  {reviewingStatus === 'completed' ? (
                    <Check size={10} />
                  ) : reviewingStatus === 'active' ? (
                    <Loader2 size={10} className="spin-slow" />
                  ) : (
                    <ShieldCheck size={10} />
                  )}
                  <span>Review</span>
                </div>

                {/* 3. Remediation (if triggered) */}
                {needsRemediation && (
                  <>
                    <ChevronRight size={10} color="var(--text-dim)" />
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.675rem',
                        fontWeight: remediatingStatus === 'active' ? 700 : 500,
                        background: remediatingStatus === 'active'
                          ? 'rgba(249, 115, 22, 0.1)'
                          : 'rgba(249, 115, 22, 0.05)',
                        color: 'rgb(249, 115, 22)',
                        border: '1px solid rgba(249, 115, 22, 0.25)'
                      }}
                    >
                      {remediatingStatus === 'completed' ? (
                        <Check size={10} />
                      ) : (
                        <RotateCcw size={10} className={remediatingStatus === 'active' ? 'spin-slow' : ''} />
                      )}
                      <span>Refining (v{qState.iteration})</span>
                    </div>
                  </>
                )}

                <ChevronRight size={10} color="var(--text-dim)" />

                {/* 4. Done */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-xs)',
                    fontSize: '0.675rem',
                    fontWeight: isDone ? 700 : 500,
                    background: isDone
                      ? 'var(--status-success-bg)'
                      : 'transparent',
                    color: isDone
                      ? 'var(--status-success)'
                      : 'var(--text-dim)',
                    border: isDone
                      ? '1px solid var(--status-success-border)'
                      : '1px solid transparent'
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 size={11} />
                  ) : (
                    <Clock size={10} />
                  )}
                  <span>Done</span>
                  {isDone && score && (
                    <span style={{ marginLeft: '2px', fontWeight: 800 }}>
                      ({score}/100)
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
