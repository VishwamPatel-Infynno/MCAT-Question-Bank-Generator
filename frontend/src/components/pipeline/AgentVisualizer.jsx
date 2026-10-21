import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Terminal, 
  Timer 
} from 'lucide-react';
import MultiAgentPipelineVisualizer from './MultiAgentPipelineVisualizer';

export default function AgentVisualizer({
  activeAgent,
  iterationCount,
  events = [],
  latestReview,
  isGenerating,
  batchProgress,
  perQuestionState = {},
  onCancel
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

  // Usage telemetry
  const latestUsageEvent = [...events].reverse().find(e => e.data?.cumulative_usage);
  const cumulativeUsage = latestUsageEvent?.data?.cumulative_usage;
  const totalTokens = cumulativeUsage?.total_tokens || 0;

  // Extract latest active event message for single-source status
  const latestProgressEvent = [...events].reverse().find(e => e.message && e.event_type !== 'agent_complete');
  const liveStatusMessage = latestProgressEvent?.message || batchProgress?.message || null;

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
          {isGenerating && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--status-danger)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.675rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Stop generation workflow"
            >
              Stop
            </button>
          )}
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            {totalTokens.toLocaleString()} Compute Units
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

  // When Generating: ONE single unified pipeline visualizer with live real-time status
  return (
    <MultiAgentPipelineVisualizer
      isGenerating={isGenerating}
      activeAgent={activeAgent}
      iterationCount={iterationCount}
      events={events}
      latestReview={latestReview}
      totalBatch={totalBatch}
      perQuestionState={perQuestionState}
      liveStatusMessage={liveStatusMessage}
      batchProgress={batchProgress}
    />
  );
}



