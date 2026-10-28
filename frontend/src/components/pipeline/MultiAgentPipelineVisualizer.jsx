import React, { useState } from 'react';
import {
  Sparkles,
  RotateCcw,
  PenTool,
  CheckCircle2,
  ShieldCheck,
  Terminal
} from 'lucide-react';
import { LiveStopwatch } from '../common';

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = Object.freeze({});

export default function MultiAgentPipelineVisualizer({
  activeAgent = null,
  iterationCount = 1,
  events = EMPTY_ARRAY,
  isGenerating = false,
  latestReview = null,
  totalBatch = 1,
  perQuestionState = EMPTY_OBJECT,
  liveStatusMessage = null,
  batchProgress = null,
  onCancel = null
}) {
  const [showLogs, setShowLogs] = useState(false);

  // For multi-question swarms, inspect perQuestionState to see which agents are actively processing
  const qList = Object.values(perQuestionState);
  const isSwarm = totalBatch > 1 && qList.length > 0;
  const completedCount = qList.filter(q => q.isComplete).length;
  const progressPercent = Math.min(100, Math.round((completedCount / Math.max(1, totalBatch)) * 100));

  // Swarm-aware active states
  const isWriterReviewerActive = isSwarm
    ? isGenerating && qList.some(q => !q.isComplete && (q.stage === 'drafting' || q.stage === 'reviewing'))
    : (
        activeAgent === 'Question Writer & Reviewer' ||
        activeAgent === 'Question Writer' ||
        activeAgent === 'Question Generator' ||
        activeAgent === 'Quality Reviewer' ||
        activeAgent === 'Question Reviewer'
      );

  const isBlindSolverActive = isSwarm
    ? isGenerating && qList.some(q => !q.isComplete && q.stage === 'blind_solving')
    : (
        activeAgent === 'Blind-Solver Dual Validation' ||
        activeAgent === 'Blind Solver' ||
        activeAgent === 'Blind-Solver Student Agent'
      );

  const isRegenActive = isSwarm
    ? isGenerating && qList.some(q => !q.isComplete && q.stage === 'remediating')
    : (activeAgent === 'Question Improver' || activeAgent === 'Question Re-Generator');

  const isImgActive = isSwarm
    ? isGenerating && qList.some(q => !q.isComplete && q.stage === 'image')
    : (activeAgent === 'Diagram & Chart Maker' || activeAgent === 'Image Generator');

  // Completion states
  const hasWriterReviewerCompleted = isSwarm
    ? qList.length > 0 && qList.every(q => q.stage !== 'drafting' && q.stage !== 'queued')
    : events.some(e =>
        (e.agent_name === 'Question Writer & Reviewer' ||
         e.agent_name === 'Question Writer' ||
         e.agent_name === 'Question Generator') &&
        e.event_type === 'agent_complete'
      );

  const hasBlindSolverCompleted = events.some(e =>
    (e.agent_name === 'Blind-Solver Dual Validation' || e.agent_name === 'Blind Solver') &&
    e.event_type === 'agent_complete'
  );

  const hasRegenFired = iterationCount > 1 || events.some(e => e.agent_name === 'Question Improver' || e.agent_name === 'Question Re-Generator');
  const hasImgCompleted = events.some(e => (e.agent_name === 'Diagram & Chart Maker' || e.agent_name === 'Image Generator') && e.event_type === 'agent_complete');

  // Determine the most descriptive live activity message
  const activeMessage = liveStatusMessage
    || batchProgress?.message
    || (isGenerating
      ? (isWriterReviewerActive
          ? 'Drafting question and initial review...'
          : isBlindSolverActive
          ? 'Verifying correct answer and choices...'
          : isRegenActive
          ? 'Polishing choices and answer explanations...'
          : isImgActive
          ? 'Creating scientific diagram...'
          : 'AI creating questions...')
      : null);

  const agents = [
    {
      id: 'writer_reviewer',
      stepNum: '01',
      title: 'Writer & Reviewer',
      subtitle: 'Fused Draft & Audit',
      guarantee: isSwarm
        ? 'Parallel Drafting & Instant Audit'
        : (latestReview?.total_score ? `${latestReview.total_score}/100 Quality Score` : 'Draft & Instant Audit (~40% Faster)'),
      icon: PenTool,
      accentColor: 'var(--brand-primary)',
      isActive: isWriterReviewerActive,
      isDone: hasWriterReviewerCompleted
    },
    {
      id: 'blind_solver',
      stepNum: '02',
      title: 'Blind Solver',
      subtitle: 'Dual Verification',
      guarantee: hasBlindSolverCompleted
        ? 'Indisputable Key (Verified)'
        : (isBlindSolverActive ? 'Solving Blind (No Key)...' : 'Zero Ambiguity Standard'),
      icon: ShieldCheck,
      accentColor: 'var(--status-success)',
      isActive: isBlindSolverActive,
      isDone: hasBlindSolverCompleted || (hasWriterReviewerCompleted && !isGenerating)
    },
    {
      id: 'regenerator',
      stepNum: '03',
      title: 'Question Improver',
      subtitle: 'Polish & Refine',
      guarantee: hasRegenFired
        ? 'Remediated & Refined'
        : (hasWriterReviewerCompleted && !isGenerating ? 'Passed (90+ Standard)' : 'Auto-Fixes Ambiguities'),
      icon: RotateCcw,
      accentColor: 'var(--status-warning)',
      isActive: isRegenActive,
      isDone: hasRegenFired ? !isRegenActive : (hasWriterReviewerCompleted && !isGenerating)
    },
    {
      id: 'image',
      stepNum: '04',
      title: 'Diagram & Chart Maker',
      subtitle: 'Visuals & Figures',
      guarantee: hasImgCompleted
        ? 'Visual Stimulus Attached'
        : (hasWriterReviewerCompleted && !isGenerating ? 'Text-Only (No Diagram Needed)' : 'Clear Charts & Shapes'),
      icon: Sparkles,
      accentColor: 'var(--status-purple)',
      isActive: isImgActive,
      isDone: hasImgCompleted || (hasWriterReviewerCompleted && !isGenerating)
    }
  ];

  return (
    <div className="pipeline-stepper-container">
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.675rem',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)'
              }}
            >
              Pipeline Architecture
            </span>
            <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              3 Specialized AI Milestones
            </span>
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 0' }}>
            {isGenerating ? (totalBatch > 1 ? `AI Team Creating ${totalBatch} Questions...` : 'AI Team Creating Question...') : 'Automated Quality Checking & Scoring'}
          </h3>
          {isGenerating && activeMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '4px',
                fontSize: '0.75rem',
                color: 'var(--brand-primary)',
                fontWeight: 600
              }}
            >
              <span className="agent-pulse-dot" style={{ width: 6, height: 6 }} />
              <span style={{ maxWidth: '520px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeMessage}
              </span>
            </div>
          )}
        </div>

        {/* Status / Stopwatch Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isGenerating ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--brand-light)',
                border: '1px solid var(--border-brand)',
                color: 'var(--brand-primary)',
                fontSize: '0.725rem',
                fontWeight: 600
              }}
            >
              <span className="agent-pulse-dot" />
              <LiveStopwatch isRunning={isGenerating} />
              <span>•</span>
              {totalBatch > 1 ? (
                <span>{completedCount}/{totalBatch} Ready ({progressPercent}%)</span>
              ) : (
                <span>Pass {iterationCount}</span>
              )}
            </div>
          ) : (
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--status-success)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 500
              }}
            >
              <CheckCircle2 size={12} />
              <span>Calibrated for 90+ Quality Standard</span>
            </span>
          )}

          {isGenerating && onCancel && (
            <button
              type="button"
              id="btn-cancel-generation"
              onClick={onCancel}
              className="btn-danger"
              style={{
                padding: '4px 10px',
                fontSize: '0.725rem',
                borderRadius: 'var(--radius-xs)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
              title="Stop and cancel generation workflow"
            >
              <span>Stop Generation</span>
            </button>
          )}

          {events.length > 0 && (
            <button
              type="button"
              onClick={() => setShowLogs(!showLogs)}
              className="btn-secondary"
              style={{ padding: '4px 8px', fontSize: '0.7rem', borderRadius: 'var(--radius-xs)', gap: '4px' }}
            >
              <Terminal size={11} />
              <span>{showLogs ? 'Hide Logs' : 'Logs'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 3-Milestone Stepper Grid */}
      <div className="pipeline-stepper">
        {agents.map((agent) => {
          const Icon = agent.icon;
          const isCurrentlyActive = isGenerating && agent.isActive;
          const isFinished = agent.isDone || (!isGenerating && events.length > 0 && !agent.isActive);

          let nodeClass = 'pipeline-step-node';
          if (isCurrentlyActive) nodeClass += ' active';
          else if (isFinished) nodeClass += ' completed';

          return (
            <div
              key={agent.id}
              className={nodeClass}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '6px',
                padding: '10px 12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Icon size={13} color={isCurrentlyActive ? 'var(--brand-primary)' : 'var(--text-muted)'} />
                  <span style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {agent.stepNum}
                  </span>
                </div>
                {isCurrentlyActive && <span className="agent-pulse-dot" />}
                {isFinished && <CheckCircle2 size={12} color="var(--status-success)" />}
              </div>

              <div>
                <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {agent.title}
                </div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                  {agent.subtitle}
                </div>
              </div>

              <div
                style={{
                  fontSize: '0.65rem',
                  color: isCurrentlyActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  marginTop: 'auto',
                  paddingTop: '4px'
                }}
              >
                {isCurrentlyActive ? (
                  <span title={`${agent.title} - Processing...`}>
                    <span style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0, overflow: 'hidden' }}>
                      {`${agent.title} - Processing...`}
                    </span>
                    Processing...
                  </span>
                ) : agent.guarantee}
              </div>
            </div>
          );
        })}
      </div>

      {/* Collapsible Event Log Tray */}
      {showLogs && events.length > 0 && (
        <div
          style={{
            marginTop: '8px',
            padding: '10px 12px',
            background: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-light)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            maxHeight: '140px',
            overflowY: 'auto'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
            <span>Live Agent Event Stream ({events.length} events)</span>
          </div>
          {events.map((ev, i) => (
            <div
              key={ev.id || `${ev.event_type}-${ev.timestamp || i}-${i}`}
              style={{
                color: ev.event_type === 'error' ? 'var(--status-danger)' : 'var(--text-secondary)',
                marginBottom: '3px',
                lineHeight: 1.4
              }}
            >
              <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>[{ev.agent_name || 'Pipeline'}]</span>{' '}
              {ev.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
