import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  RotateCcw,
  PenTool,
  CheckCircle2,
  Terminal
} from 'lucide-react';

export default function MultiAgentPipelineVisualizer({
  activeAgent = null,
  iterationCount = 1,
  events = [],
  isGenerating = false,
  latestReview = null
}) {
  const [elapsedTime, setElapsedTime] = useState('0.0');
  const [showLogs, setShowLogs] = useState(false);

  // Live stopwatch when generation is actively running
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

  // Determine current active node
  const isGenActive = activeAgent === 'Question Generator';
  const isRevActive = activeAgent === 'Question Reviewer';
  const isRegenActive = activeAgent === 'Question Re-Generator';
  const isImgActive = activeAgent === 'Image Generator';

  // Completion states
  const hasGenCompleted = events.some(e => e.agent_name === 'Question Generator' && e.event_type === 'agent_complete');
  const hasRevCompleted = events.some(e => e.agent_name === 'Question Reviewer' && e.event_type === 'agent_complete');
  const hasRegenFired = iterationCount > 1 || events.some(e => e.agent_name === 'Question Re-Generator');
  const hasImgCompleted = events.some(e => e.agent_name === 'Image Generator' && e.event_type === 'agent_complete');

  const agents = [
    {
      id: 'generator',
      stepNum: '01',
      title: 'Question Generator',
      subtitle: 'Drafting Specialist',
      guarantee: 'Authentic Stem & Distractors',
      icon: PenTool,
      accentColor: 'var(--brand-primary)',
      isActive: isGenActive,
      isDone: hasGenCompleted
    },
    {
      id: 'reviewer',
      stepNum: '02',
      title: 'Psychometric Auditor',
      subtitle: 'Quality Reviewer',
      guarantee: latestReview?.total_score ? `${latestReview.total_score}/100 Quality Score` : 'Strict 90+ Score Gate',
      icon: ShieldCheck,
      accentColor: 'var(--status-success)',
      isActive: isRevActive,
      isDone: hasRevCompleted
    },
    {
      id: 'regenerator',
      stepNum: '03',
      title: 'Remediation Engine',
      subtitle: 'Self-Correction',
      guarantee: 'Autonomous Remediation',
      icon: RotateCcw,
      accentColor: 'var(--status-warning)',
      isActive: isRegenActive,
      isDone: hasRegenFired && !isRegenActive
    },
    {
      id: 'image',
      stepNum: '04',
      title: 'Stimulus & Diagram',
      subtitle: 'Visual Generator',
      guarantee: 'High-Res Charts & Shapes',
      icon: Sparkles,
      accentColor: 'var(--status-purple)',
      isActive: isImgActive,
      isDone: hasImgCompleted
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
              4 Specialized Autonomous Agents
            </span>
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 0' }}>
            {isGenerating ? 'Pipeline Executing...' : 'Psychometric Synthesis & Verification'}
          </h3>
        </div>

        {/* Status / Stopwatch Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isGenerating ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
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
              <span>{elapsedTime}s</span>
              <span>•</span>
              <span>Pass {iterationCount}</span>
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
              <span>Calibrated for 90+ Score Gate</span>
            </span>
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

      {/* 4-Agent Stepper Grid */}
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
                {isCurrentlyActive ? 'Processing...' : agent.guarantee}
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
              key={i}
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
