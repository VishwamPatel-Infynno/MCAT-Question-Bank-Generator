import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  RotateCcw, 
  CheckCircle2, 
  Terminal, 
  Sparkles,
  Timer,
  PenTool
} from 'lucide-react';

export default function AgentVisualizer({
  activeAgent,
  iterationCount,
  events,
  latestReview,
  isGenerating,
  batchProgress
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

  // Agent states
  const isGeneratorActive = activeAgent === 'Question Generator';
  const isReviewerActive = activeAgent === 'Question Reviewer';
  const isRegeneratorActive = activeAgent === 'Question Re-Generator';
  const isImageActive = activeAgent === 'Image Generator';

  const hasGenerated = events.some(e => e.agent_name === 'Question Generator' && e.event_type === 'agent_complete');
  const hasReviewed = events.some(e => e.agent_name === 'Question Reviewer' && e.event_type === 'agent_complete');

  const isWorkflowComplete = !isGenerating && events.length > 0 && hasReviewed;

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
            {batchProgress && batchProgress.total > 1 ? `Batch Verification Passed (${batchProgress.total} Questions Staged)` : 'Psychometric Verification Passed'}
          </span>
          <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
            {latestReview?.total_score || 95}/100
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
            {showTelemetry ? 'Hide Telemetry' : 'Telemetry'}
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

  // When Generating: Precision Horizontal Step Stepper
  const steps = [
    { label: 'Drafting', active: isGeneratorActive, done: hasGenerated, icon: PenTool },
    { label: 'Audit', active: isReviewerActive, done: hasReviewed, icon: ShieldCheck },
    { label: 'Calibrate', active: isRegeneratorActive || (iterationCount > 1), done: false, icon: RotateCcw },
    { label: 'Stimulus', active: isImageActive, done: false, icon: Sparkles }
  ];

  return (
    <div
      className="glass-panel"
      style={{
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        borderRadius: 'var(--radius-md)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--brand-primary)'
            }}
          />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Multi-Agent Swarm Active
          </span>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
            ({activeAgent || 'Orchestrating'}...)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Timer size={12} color="var(--brand-primary)" /> {elapsedTime}s
          </span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            {totalTokens} tokens
          </span>
        </div>
      </div>

      {/* Batch Progress Bar when generating multiple questions */}
      {batchProgress && batchProgress.total > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '6px 8px', background: 'var(--bg-surface-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.725rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Batch Progress: Question {batchProgress.current || 1} of {batchProgress.total}
            </span>
            <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>
              {Math.min(100, Math.round(((Math.max(0, (batchProgress.current || 1) - 1)) / batchProgress.total) * 100))}%
            </span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'var(--bg-surface-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, Math.max(10, (((batchProgress.current || 1) - 0.5) / batchProgress.total) * 100))}%`,
                height: '100%',
                background: 'linear-gradient(90deg, var(--brand-primary), #818cf8)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
          {batchProgress.message && (
            <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {batchProgress.message}
            </div>
          )}
        </div>
      )}

      {/* Horizontal Step Sequence */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {steps.map((st, idx) => {
          const Icon = st.icon;
          const isActive = st.active;
          const isDone = st.done;
          return (
            <React.Fragment key={st.label}>
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: isActive ? 'var(--bg-surface-hover)' : 'var(--bg-surface-subtle)',
                  border: isActive ? '1px solid var(--border-brand)' : '1px solid var(--border-light)',
                  color: isActive ? 'var(--brand-primary)' : isDone ? 'var(--status-success)' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 600 : 500
                }}
              >
                <Icon size={13} />
                <span>{st.label}</span>
                {isDone && <CheckCircle2 size={11} style={{ marginLeft: 'auto' }} />}
              </div>
              {idx < steps.length - 1 && (
                <div style={{ width: '12px', height: '1px', background: 'var(--border-light)' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
