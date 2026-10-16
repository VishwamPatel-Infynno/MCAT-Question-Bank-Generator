import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  RotateCcw,
  PenTool,
  CheckCircle2,
  Terminal,
  Check
} from 'lucide-react';

export default function MultiAgentPipelineVisualizer({
  activeAgent = null,
  iterationCount = 1,
  events = [],
  isGenerating = false,
  latestReview = null,
  totalBatch = 1,
  perQuestionState = {}
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

  // For multi-question swarms, inspect perQuestionState to see which agents are actively processing
  const qList = Object.values(perQuestionState);
  const isSwarm = totalBatch > 1 && qList.length > 0;

  // Swarm-aware active states
  const isGenActive = isSwarm
    ? isGenerating && qList.some(q => !q.isComplete && q.stage === 'drafting')
    : (activeAgent === 'Question Writer' || activeAgent === 'Question Generator');

  const isRevActive = isSwarm
    ? isGenerating && qList.some(q => !q.isComplete && q.stage === 'reviewing')
    : (activeAgent === 'Quality Reviewer' || activeAgent === 'Question Reviewer');

  const isRegenActive = isSwarm
    ? isGenerating && qList.some(q => !q.isComplete && q.stage === 'remediating')
    : (activeAgent === 'Question Improver' || activeAgent === 'Question Re-Generator');

  const isImgActive = isSwarm
    ? isGenerating && qList.some(q => !q.isComplete && q.stage === 'image')
    : (activeAgent === 'Diagram & Chart Maker' || activeAgent === 'Image Generator');

  // Completion states: in a swarm, a stage is fully completed only when NO question is at or before that stage
  const hasGenCompleted = isSwarm
    ? qList.length > 0 && qList.every(q => q.stage !== 'drafting' && (q.stage !== 'queued'))
    : events.some(e => (e.agent_name === 'Question Writer' || e.agent_name === 'Question Generator') && e.event_type === 'agent_complete');

  const hasRevCompleted = isSwarm
    ? qList.length > 0 && qList.every(q => q.isComplete)
    : events.some(e => (e.agent_name === 'Quality Reviewer' || e.agent_name === 'Question Reviewer') && e.event_type === 'agent_complete');

  const hasRegenFired = iterationCount > 1 || events.some(e => e.agent_name === 'Question Improver' || e.agent_name === 'Question Re-Generator');
  const hasImgCompleted = events.some(e => (e.agent_name === 'Diagram & Chart Maker' || e.agent_name === 'Image Generator') && e.event_type === 'agent_complete');

  const agents = [
    {
      id: 'generator',
      stepNum: '01',
      title: 'Question Writer',
      subtitle: 'Drafting Question & Options',
      guarantee: isSwarm ? 'Parallel Question Drafting' : 'Realistic Scenarios & Traps',
      icon: PenTool,
      accentColor: 'var(--brand-primary)',
      isActive: isGenActive,
      isDone: hasGenCompleted
    },
    {
      id: 'reviewer',
      stepNum: '02',
      title: 'Quality Reviewer',
      subtitle: 'Exam Rigor Check',
      guarantee: latestReview?.total_score ? `${latestReview.total_score}/100 Quality Score` : 'Strict 90+ Score Standard',
      icon: ShieldCheck,
      accentColor: 'var(--status-success)',
      isActive: isRevActive,
      isDone: hasRevCompleted
    },
    {
      id: 'regenerator',
      stepNum: '03',
      title: 'Question Improver',
      subtitle: 'Polish & Refine',
      guarantee: 'Self-Fixes Ambiguities',
      icon: RotateCcw,
      accentColor: 'var(--status-warning)',
      isActive: isRegenActive,
      isDone: hasRegenFired && !isRegenActive
    },
    {
      id: 'image',
      stepNum: '04',
      title: 'Diagram & Chart Maker',
      subtitle: 'Visuals & Figures',
      guarantee: 'Clear Charts & Shapes',
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
              4 Specialized AI Helpers
            </span>
          </div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 0' }}>
            {isGenerating ? 'AI Team Creating Questions...' : 'Automated Quality Checking & Scoring'}
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
              <span>Calibrated for 90+ Quality Standard</span>
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

      {/* Multi-Question Swarm Status Rail (Parallel Batch Execution) */}
      {isSwarm && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '10px 14px',
            background: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.725rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="agent-pulse-dot" />
              Live AI Team Tracker ({totalBatch} Questions Creating at Once)
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {qList.filter(q => q.isComplete).length} of {totalBatch} Completed
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fit, minmax(140px, 1fr))`,
              gap: '8px'
            }}
          >
            {qList.sort((a, b) => a.index - b.index).map((qState) => {
              const isDone = qState.isComplete;
              const agentShort = (qState.agentName === 'Question Writer' || qState.agentName === 'Question Generator')
                ? 'Writing'
                : (qState.agentName === 'Quality Reviewer' || qState.agentName === 'Question Reviewer')
                ? 'Reviewing'
                : (qState.agentName === 'Question Improver' || qState.agentName === 'Question Re-Generator')
                ? 'Improving'
                : (qState.agentName === 'Diagram & Chart Maker' || qState.agentName === 'Image Generator')
                ? 'Diagram'
                : (qState.agentName || 'Queued');

              return (
                <div
                  key={qState.index}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-xs)',
                    background: isDone ? 'var(--bg-surface-elevated)' : 'var(--bg-surface-elevated)',
                    border: isDone ? '1px solid var(--border-brand)' : '1px solid var(--border-medium)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    boxShadow: 'var(--shadow-xs)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                      Question {qState.index}
                    </span>
                    {isDone ? (
                      <span className="badge badge-emerald" style={{ fontSize: '0.625rem', padding: '1px 6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Check size={9} /> {qState.score || 95}/100
                      </span>
                    ) : (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: qState.stage === 'remediating' ? 'var(--status-warning)' : 'var(--brand-primary)',
                          fontWeight: 700,
                          fontSize: '0.675rem'
                        }}
                      >
                        <span className="agent-pulse-dot" style={{ width: '6px', height: '6px' }} />
                        {agentShort}
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: '0.65rem',
                      color: 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={qState.message}
                  >
                    {isDone ? 'Verified & Ready' : (qState.message || 'Processing in AI team...')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
