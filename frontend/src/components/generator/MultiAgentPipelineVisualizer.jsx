import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  RotateCcw,
  PenTool,
  CheckCircle2,
  Cpu,
  Terminal,
  Activity
} from 'lucide-react';
import InfynnoLogo from '../common/InfynnoLogo';

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
      engine: 'Infynno Cognitive Reasoning Core',
      engineTag: 'Cognitive Core',
      role: 'Synthesizes clinical stimuli, authentic question stems, and subtle distractor options.',
      guarantee: 'Sub-30s Latency',
      icon: PenTool,
      accentColor: 'var(--brand-primary)',
      isActive: isGenActive,
      isDone: hasGenCompleted
    },
    {
      id: 'reviewer',
      stepNum: '02',
      title: 'Psychometric Auditor',
      subtitle: 'Quality & Rigor Reviewer',
      engine: 'Infynno Psychometric Scoring Engine',
      engineTag: 'Auditor AI',
      role: 'Audits authenticity, clarity, distractor plausibility, and mathematical working steps.',
      guarantee: latestReview?.total_score ? `Verified ${latestReview.total_score}/100 Quality` : 'Strict 90+ Score Gate',
      icon: ShieldCheck,
      accentColor: 'var(--status-success)',
      isActive: isRevActive,
      isDone: hasRevCompleted
    },
    {
      id: 'regenerator',
      stepNum: '03',
      title: 'Remediation Engine',
      subtitle: 'Self-Correction Agent',
      engine: 'Autonomous Remediation Engine',
      engineTag: 'Self-Correction',
      role: 'Automatically refines draft if score ≤ 90; eliminates loopholes and rebalances traps.',
      guarantee: 'Autonomous Self-Correction',
      icon: RotateCcw,
      accentColor: 'var(--status-warning)',
      isActive: isRegenActive,
      isDone: hasRegenFired && !isRegenActive
    },
    {
      id: 'image',
      stepNum: '04',
      title: 'Stimulus & Diagram Artist',
      subtitle: 'Visual Generator',
      engine: 'Infynno Visual & Vector Engine',
      engineTag: 'Visual Synthesis',
      role: 'Generates geometric figures, abstract shapes, and crisp medical charts.',
      guarantee: 'Vector & 1024px High-Res',
      icon: Sparkles,
      accentColor: 'var(--status-purple)',
      isActive: isImgActive,
      isDone: hasImgCompleted
    }
  ];

  return (
    <div
      className="glass-panel agent-pipeline-hub"
      style={{
        padding: '22px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Decorative Grid Lines */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'radial-gradient(ellipse 60% 40% at 50% 20%, rgba(56, 189, 248, 0.08), transparent 70%)',
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      />

      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
          position: 'relative',
          zIndex: 2
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              className="badge"
              style={{
                background: 'var(--infynno-gradient)',
                color: '#ffffff',
                border: 'none',
                gap: '5px',
                fontSize: '0.675rem',
                fontWeight: 700,
                letterSpacing: '0.5px'
              }}
            >
              <InfynnoLogo width={14} height={9} />
              <span>INFYNNO MULTI-AGENT SWARM</span>
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '0.725rem',
                color: 'var(--text-muted)'
              }}
            >
              <Cpu size={12} color="var(--brand-primary)" />
              Proprietary Cyclic State Machine
            </span>
          </div>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {isGenerating ? 'Multi-Agent Pipeline Executing...' : 'Live 4-Agent Cognitive Architecture'}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', margin: 0 }}>
            {isGenerating
              ? `Autonomous agents are actively collaborating to reach a 90+ psychometric score.`
              : 'Every question is autonomously drafted, audited, calibrated, and illustrated by 4 specialized AI agents.'}
          </p>
        </div>

        {/* Live Status or Mode Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isGenerating ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--brand-light)',
                border: '1px solid var(--border-brand)',
                color: 'var(--brand-primary)',
                fontSize: '0.75rem',
                fontWeight: 700
              }}
            >
              <span className="agent-pulse-dot" />
              <span>{elapsedTime}s</span>
              <span>•</span>
              <span>Iteration {iterationCount}</span>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-light)',
                color: 'var(--status-success)',
                fontSize: '0.725rem',
                fontWeight: 600
              }}
            >
              <Activity size={12} />
              <span>Live Neural Pipeline Active</span>
            </div>
          )}

          {events.length > 0 && (
            <button
              type="button"
              onClick={() => setShowLogs(!showLogs)}
              className="btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.725rem', gap: '4px' }}
            >
              <Terminal size={12} />
              <span>{showLogs ? 'Hide Logs' : 'Agent Logs'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 4-Agent Interactive Grid & Conduits */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          position: 'relative',
          zIndex: 2
        }}
      >
        {agents.map((agent) => {
          const Icon = agent.icon;
          const isCurrentlyActive = isGenerating && agent.isActive;
          const isFinished = !isCurrentlyActive && (agent.isDone || (!isGenerating && agent.id !== 'regenerator'));

          return (
            <div
              key={agent.id}
              className={`agent-node-card ${isCurrentlyActive ? 'agent-node-active' : ''}`}
              style={{
                borderTop: isCurrentlyActive ? '2px solid var(--brand-primary)' : `2px solid ${agent.accentColor}`
              }}
            >
              {/* Card Header: Step & Badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-sm)',
                      background: isCurrentlyActive
                        ? 'var(--brand-light)'
                        : 'var(--bg-surface-subtle)',
                      color: isCurrentlyActive ? 'var(--brand-primary)' : agent.accentColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon size={15} />
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)'
                    }}
                  >
                    AGENT {agent.stepNum}
                  </span>
                </div>

                <span
                  className="badge"
                  style={{
                    fontSize: '0.625rem',
                    background: isCurrentlyActive ? 'var(--brand-light)' : 'var(--bg-surface-subtle)',
                    color: isCurrentlyActive ? 'var(--brand-primary)' : 'var(--text-muted)',
                    border: '1px solid var(--border-light)'
                  }}
                >
                  {agent.engineTag}
                </span>
              </div>

              {/* Title & Role */}
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {agent.title}
                </h4>
                <div style={{ fontSize: '0.7rem', color: agent.accentColor, fontWeight: 600, marginTop: '2px' }}>
                  {agent.subtitle}
                </div>
                <p style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', margin: '6px 0 0', lineHeight: 1.45 }}>
                  {agent.role}
                </p>
              </div>

              {/* Technical Model Spec */}
              <div
                style={{
                  background: 'var(--bg-surface-subtle)',
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.675rem',
                  marginTop: 'auto'
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Engine:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {agent.engine}
                </span>
              </div>

              {/* Status / Guarantee Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.7rem',
                  paddingTop: '6px',
                  borderTop: '1px solid var(--border-light)'
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>Standard:</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: isCurrentlyActive
                      ? 'var(--brand-primary)'
                      : isFinished
                      ? 'var(--status-success)'
                      : 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {isCurrentlyActive ? (
                    <>
                      <span className="agent-pulse-dot" />
                      <span>Processing...</span>
                    </>
                  ) : isFinished ? (
                    <>
                      <CheckCircle2 size={12} color="var(--status-success)" />
                      <span>{agent.guarantee}</span>
                    </>
                  ) : (
                    <span>{agent.guarantee}</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Animated Electric Pipeline SVG Connector */}
      <div
        style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'var(--bg-surface-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.725rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Continuous Dataflow:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>01 Draft</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ fontWeight: 700, color: 'var(--status-success)' }}>02 Audit (90+)</span>
            <span style={{ color: 'var(--text-muted)' }}>⇄</span>
            <span style={{ fontWeight: 700, color: 'var(--status-warning)' }}>03 Self-Correct</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ fontWeight: 700, color: 'var(--status-purple)' }}>04 Stimulus</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Approved Question Bank</span>
          </div>
        </div>

        {/* Live Wiring Animation Visual SVG */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="120" height="12" viewBox="0 0 120 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line
              x1="0"
              y1="6"
              x2="120"
              y2="6"
              stroke="var(--brand-primary)"
              strokeWidth="2"
              className="agent-conduit-line"
            />
          </svg>
          <span
            style={{
              fontSize: '0.675rem',
              fontFamily: 'var(--font-mono)',
              color: 'var(--brand-primary)',
              fontWeight: 700,
              letterSpacing: '0.5px'
            }}
          >
            PULSE SYNCHRONIZED
          </span>
        </div>
      </div>

      {/* Collapsible Agent Event Logs Tray */}
      {showLogs && events.length > 0 && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px',
            background: 'var(--bg-app)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            maxHeight: '160px',
            overflowY: 'auto'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-muted)' }}>
            <span>Live Agent Event Log Stream ({events.length} events)</span>
            <span>Agent Swarm Telemetry</span>
          </div>
          {events.map((ev, i) => (
            <div
              key={i}
              style={{
                color: ev.event_type === 'error' ? 'var(--status-danger)' : 'var(--text-secondary)',
                marginBottom: '4px',
                lineHeight: 1.4
              }}
            >
              <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>[{ev.agent_name || 'Swarm'}]</span>{' '}
              {ev.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
