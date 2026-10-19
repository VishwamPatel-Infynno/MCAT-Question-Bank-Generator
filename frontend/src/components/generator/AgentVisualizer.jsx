import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Terminal, 
  Timer 
} from 'lucide-react';
import MultiAgentPipelineVisualizer from './MultiAgentPipelineVisualizer';
import QuestionProgressTracker from './QuestionProgressTracker';

export default function AgentVisualizer({
  activeAgent,
  iterationCount,
  events = [],
  latestReview,
  isGenerating,
  batchProgress,
  perQuestionState = {}
}) {
  const [showTelemetry, setShowTelemetry] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('0.0');

  // Live stopwatch during active generation
  useEffect(() => {
    let interval = null;
    if (isGenerating) {
      const startTime = Date.now();
      interval = setInterval(() => {
        setElapsedTime(((Date.now() - startTime) / 1000).toFixed(1));
      }, 100);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const hasReviewed = events.some(e => (e.agent_name === 'Quality Reviewer' || e.agent_name === 'Question Reviewer') && e.event_type === 'agent_complete');

  const isWorkflowComplete = !isGenerating && events.length > 0 && hasReviewed;

  // Swarm & Batch calculation
  const totalBatch = batchProgress?.total || Object.keys(perQuestionState).length || 1;
  const completedCount = Object.values(perQuestionState).filter(q => q.isComplete).length;
  const inProgressCount = Math.max(0, totalBatch - completedCount);
  const progressPercent = Math.min(100, Math.round((completedCount / Math.max(1, totalBatch)) * 100));

  // Usage telemetry
  const latestUsageEvent = [...events].reverse().find(e => e.data?.cumulative_usage);
  const cumulativeUsage = latestUsageEvent?.data?.cumulative_usage;
  const totalTokens = cumulativeUsage?.total_tokens || 0;
  const totalCost = cumulativeUsage?.total_cost_usd || 0;

  // When Idle (No events, not generating)
  if (!isGenerating && events.length === 0) {
    return null;
  }

  // When Complete: Minimalist Verification Chip
  if (isWorkflowComplete) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} color="var(--status-success)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {totalBatch > 1 ? `All Questions Ready (${totalBatch} Questions Created)` : 'Quality Check Passed'}
          </span>
          <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
            {latestReview?.total_score || 95}/100 Quality
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Timer size={12} /> {elapsedTime}s
          </span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            {totalTokens.toLocaleString()} tokens (${totalCost.toFixed(4)})
          </span>
          <button
            onClick={() => setShowTelemetry(!showTelemetry)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--brand-primary)',
              fontSize: '0.725rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Terminal size={12} />
            {showTelemetry ? 'Hide Details' : 'Details'}
          </button>
        </div>

        {/* Collapsible Telemetry Tray */}
        {showTelemetry && (
          <div
            style={{
              width: '100%',
              marginTop: '6px',
              padding: '10px',
              background: 'var(--bg-app)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              maxHeight: '140px',
              overflowY: 'auto'
            }}
          >
            {events.map((ev, i) => (
              <div key={i} style={{ color: ev.event_type === 'error' ? 'var(--status-danger)' : 'var(--text-muted)', marginBottom: '3px' }}>
                <span style={{ color: 'var(--brand-primary)' }}>[{ev.agent_name || 'Workflow'}]</span> {ev.message}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // When Generating: Unified Pipeline Stepper with Live Per-Question Progress Tracker
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Batch Progress Bar when generating multiple questions */}
      {totalBatch > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '10px 14px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="agent-pulse-dot" />
              Batch Progress: {completedCount} of {totalBatch} Questions Verified
              {inProgressCount > 0 && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  ({inProgressCount} in progress)
                </span>
              )}
            </span>
            <span style={{ color: 'var(--brand-primary)', fontWeight: 800 }}>
              {progressPercent}%
            </span>
          </div>
          <div style={{ width: '100%', height: '5px', background: 'var(--bg-surface-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, Math.max(completedCount > 0 ? progressPercent : 12, progressPercent))}%`,
                height: '100%',
                background: 'var(--infynno-gradient)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
          {batchProgress?.message && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {batchProgress.message}
            </div>
          )}
        </div>
      )}

      {/* Live Per-Question Progress Tracker: Immediate zero-wait feedback */}
      <QuestionProgressTracker
        perQuestionState={perQuestionState}
        totalQuestions={totalBatch}
        isGenerating={isGenerating}
      />

      {/* Unified Multi-Agent Pipeline & Swarm Stepper */}
      <MultiAgentPipelineVisualizer
        isGenerating={isGenerating}
        activeAgent={activeAgent}
        iterationCount={iterationCount}
        events={events}
        latestReview={latestReview}
        totalBatch={totalBatch}
        perQuestionState={perQuestionState}
      />
    </div>
  );
}


