import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Terminal, 
  Timer 
} from 'lucide-react';
import MultiAgentPipelineVisualizer from './MultiAgentPipelineVisualizer';
import { LiveStopwatch } from '../common';

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = Object.freeze({});

export default function AgentVisualizer({
  activeAgent,
  iterationCount,
  events = EMPTY_ARRAY,
  latestReview,
  isGenerating,
  batchProgress,
  perQuestionState = EMPTY_OBJECT,
  onCancel
}) {
  const [showTelemetry, setShowTelemetry] = useState(false);

  const hasReviewed = useMemo(() => {
    return events.some(e =>
      (e.agent_name === 'Question Writer & Reviewer' ||
       e.agent_name === 'Quality Reviewer' ||
       e.agent_name === 'Question Reviewer') &&
      e.event_type === 'agent_complete'
    );
  }, [events]);

  const isWorkflowComplete = !isGenerating && events.length > 0 && hasReviewed;

  // Swarm & Batch calculation
  const totalBatch = batchProgress?.total || Object.keys(perQuestionState).length || 1;

  // Memoized Usage Telemetry selector (avoids array reversal/allocation on every render)
  const totalTokens = useMemo(() => {
    for (let i = events.length - 1; i >= 0; i--) {
      const usage = events[i]?.data?.cumulative_usage;
      if (usage?.total_tokens != null) {
        return usage.total_tokens;
      }
    }
    return 0;
  }, [events]);

  // Memoized live status message
  const liveStatusMessage = useMemo(() => {
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i]?.message && events[i]?.event_type !== 'agent_complete') {
        return events[i].message;
      }
    }
    return batchProgress?.message || null;
  }, [events, batchProgress?.message]);

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
            {totalBatch > 1 ? `${totalBatch} Questions Ready` : 'Complete'}
          </span>
          <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
            {latestReview?.total_score || 95}/100
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Timer size={12} /> <LiveStopwatch isRunning={isGenerating} />
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
              title="Stop generation"
            >
              Stop
            </button>
          )}
          <span style={{ fontFamily: 'var(--font-mono)' }}>
            {totalTokens.toLocaleString()} tokens
          </span>
          <button
            type="button"
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
            title="View event logs and processing telemetry"
          >
            <Terminal size={12} />
            <span>{showTelemetry ? 'Hide Logs' : 'Logs'}</span>
          </button>
        </div>

        {/* Collapsible Telemetry Tray */}
        {showTelemetry && (
          <div
            className="event-log-tray processing-stage-container"
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
              <span>Live Agent Event Stream & Processing Stage Logs ({events.length} events)</span>
            </div>
            {events.map((ev, i) => (
              <div
                key={ev.id || `${ev.event_type}-${ev.timestamp || i}-${i}`}
                className="event-log-entry processing-stage"
                style={{ color: ev.event_type === 'error' ? 'var(--status-danger)' : 'var(--text-muted)', marginBottom: '3px' }}
              >
                <span style={{ color: 'var(--brand-primary)' }}>[{ev.agent_name || 'Processing Stage'}]</span> {ev.message}
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
      onCancel={onCancel}
    />
  );
}



