import React, { useState, useEffect } from 'react';
import { 
  PenTool, 
  ShieldCheck, 
  RotateCcw, 
  CheckCircle2, 
  Coins, 
  ChevronDown, 
  ChevronUp, 
  Terminal, 
  Activity,
  Sparkles,
  Timer
} from 'lucide-react';

export default function AgentVisualizer({
  activeAgent,
  iterationCount,
  events,
  latestReview,
  isGenerating
}) {
  const [showTelemetry, setShowTelemetry] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

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

  // Agent flags
  const isGeneratorActive = activeAgent === 'Question Generator';
  const isReviewerActive = activeAgent === 'Question Reviewer';
  const isRegeneratorActive = activeAgent === 'Question Re-Generator';
  const isImageActive = activeAgent === 'Image Generator';

  const hasGenerated = events.some(e => e.agent_name === 'Question Generator' && e.event_type === 'agent_complete');
  const hasReviewed = events.some(e => e.agent_name === 'Question Reviewer' && e.event_type === 'agent_complete');
  const hasRegenerated = events.some(e => e.agent_name === 'Question Re-Generator' && e.event_type === 'agent_complete');

  const isWorkflowComplete = !isGenerating && events.length > 0 && hasReviewed && (latestReview?.total_score > 90 || !latestReview);

  // Metrics extraction
  const latestUsageEvent = [...events].reverse().find(e => e.data?.cumulative_usage);
  const cumulativeUsage = latestUsageEvent?.data?.cumulative_usage;
  const totalTokens = cumulativeUsage?.total_tokens || 0;
  const totalCost = cumulativeUsage?.total_cost_usd || 0;

  const getAgentUsage = (agentName) => {
    const ev = [...events].reverse().find(e => e.agent_name === agentName && e.data?.latest_usage);
    return ev?.data?.latest_usage || null;
  };

  const genUsage = getAgentUsage('Question Generator');
  const revUsage = getAgentUsage('Question Reviewer');
  const regenUsage = getAgentUsage('Question Re-Generator');

  const nodes = [
    {
      id: 'draft',
      label: 'Drafting Agent',
      role: 'Writer',
      icon: PenTool,
      color: '#38bdf8',
      active: isGeneratorActive,
      completed: hasGenerated
    },
    {
      id: 'review',
      label: 'Psychometric Auditor',
      role: 'Reviewer',
      icon: ShieldCheck,
      color: '#10b981',
      active: isReviewerActive,
      completed: hasReviewed,
      score: latestReview ? `${latestReview.total_score}/100` : null
    },
    {
      id: 'remediate',
      label: 'Trap Calibrator',
      role: iterationCount > 1 ? `Loop ${iterationCount}` : 'Re-Generator',
      icon: RotateCcw,
      color: '#a855f7',
      active: isRegeneratorActive,
      completed: hasRegenerated || (hasReviewed && latestReview?.total_score > 90)
    },
    {
      id: 'ready',
      label: 'Exam Ready',
      role: 'Verified',
      icon: Sparkles,
      color: '#f59e0b',
      active: false,
      completed: isWorkflowComplete
    }
  ];

  // Dynamic status copy
  let statusMessage = 'Ready to generate high-yield UCAT practice questions.';
  if (isGenerating) {
    if (isGeneratorActive) statusMessage = 'Drafting clinical vignette, stem & candidate distractors...';
    else if (isReviewerActive) statusMessage = 'Auditing 100-pt psychometric rubric across 4 dimensions...';
    else if (isRegeneratorActive) statusMessage = `Refining distractor trap plausibility (Iteration ${iterationCount} of 3)...`;
    else if (isImageActive) statusMessage = 'Generating visual stimulus diagram...';
    else {
      const lastEvent = events[events.length - 1];
      statusMessage = lastEvent ? lastEvent.message : 'Running autonomous multi-agent pipeline...';
    }
  } else if (isWorkflowComplete) {
    statusMessage = `Question verified against psychometric standards. Quality Score: ${latestReview?.total_score || 95}/100.`;
  }

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top Status Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: isGenerating ? 'var(--brand-primary)' : isWorkflowComplete ? '#10b981' : '#64748b',
              boxShadow: isGenerating ? '0 0 12px var(--brand-primary)' : isWorkflowComplete ? '0 0 10px #10b981' : 'none'
            }}
            className={isGenerating ? 'pulse-glowing' : ''}
          />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Multi-Agent Command Rail
          </h3>
          <span className="badge badge-cyan" style={{ fontSize: '0.625rem' }}>
            LangGraph Swarm
          </span>
        </div>

        {/* Stopwatch & Token Cost Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isGenerating && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-full)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--brand-primary)'
              }}
            >
              <Timer size={13} />
              <span>{elapsedTime}s</span>
            </span>
          )}

          {totalTokens > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 10px',
                background: 'var(--status-success-bg)',
                border: '1px solid var(--status-success-border)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#10b981'
              }}
            >
              <Coins size={12} color="#10b981" />
              <span>{totalTokens.toLocaleString()} tok</span>
              <span style={{ opacity: 0.6 }}>&bull;</span>
              <span>${totalCost.toFixed(5)}</span>
            </span>
          )}

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowTelemetry(!showTelemetry)}
            style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '5px' }}
          >
            <Terminal size={12} />
            <span>Telemetry</span>
            {showTelemetry ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Interconnected Command Rail Track */}
      <div style={{ position: 'relative', padding: '10px 0 6px 0' }}>
        {/* Connecting Line */}
        <div
          style={{
            position: 'absolute',
            top: '26px',
            left: '36px',
            right: '36px',
            height: '2px',
            background: 'var(--border-light)',
            zIndex: 1
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #38bdf8 0%, #10b981 40%, #a855f7 70%, #f59e0b 100%)',
              width: isWorkflowComplete ? '100%' : isRegeneratorActive ? '75%' : isReviewerActive ? '50%' : isGeneratorActive ? '25%' : '0%',
              transition: 'width 0.4s ease',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)'
            }}
          />
        </div>

        {/* 4 Agent Nodes */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 2
          }}
        >
          {nodes.map(node => {
            const Icon = node.icon;
            const isNodeActive = node.active;
            const isNodeCompleted = node.completed;

            return (
              <div
                key={node.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  flex: 1
                }}
              >
                {/* Node Circle */}
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isNodeCompleted
                      ? node.color
                      : isNodeActive
                      ? 'var(--bg-surface)'
                      : 'var(--bg-surface-elevated)',
                    border: isNodeActive
                      ? `2px solid ${node.color}`
                      : isNodeCompleted
                      ? `2px solid ${node.color}`
                      : '2px solid var(--border-medium)',
                    color: isNodeCompleted ? '#ffffff' : isNodeActive ? node.color : 'var(--text-muted)',
                    boxShadow: isNodeActive
                      ? `0 0 18px ${node.color}55`
                      : isNodeCompleted
                      ? `0 0 12px ${node.color}40`
                      : 'none',
                    transition: 'all 0.3s ease'
                  }}
                  className={isNodeActive ? 'pulse-glowing' : ''}
                >
                  {isNodeCompleted ? <CheckCircle2 size={18} /> : <Icon size={16} />}
                </div>

                {/* Node Labels */}
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: '0.785rem',
                      fontWeight: 700,
                      color: isNodeActive ? node.color : isNodeCompleted ? 'var(--text-primary)' : 'var(--text-secondary)'
                    }}
                  >
                    {node.label}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {node.score ? (
                      <span className="badge badge-emerald" style={{ fontSize: '0.625rem', padding: '1px 5px' }}>
                        {node.score}
                      </span>
                    ) : (
                      node.role
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Streaming Activity Feed Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 14px',
          background: isGenerating ? 'var(--brand-light)' : 'var(--bg-surface-elevated)',
          border: isGenerating ? '1px solid var(--border-brand)' : '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.825rem',
          color: isGenerating ? 'var(--brand-primary)' : 'var(--text-secondary)',
          boxShadow: isGenerating ? 'var(--shadow-glow)' : 'none',
          transition: 'all var(--transition-fast)'
        }}
      >
        <Activity size={16} color={isGenerating ? 'var(--brand-primary)' : '#94a3b8'} className={isGenerating ? 'pulse-glowing' : ''} />
        <span style={{ fontWeight: 600, flex: 1 }}>{statusMessage}</span>
      </div>

      {/* Expandable Technical Telemetry Drawer */}
      {showTelemetry && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            padding: '14px',
            background: 'var(--bg-canvas)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)'
          }}
        >
          {/* Agent Cost & Token Summary Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '8px'
            }}
          >
            {[
              { name: 'Question Generator', usage: genUsage, color: '#38bdf8' },
              { name: 'Question Reviewer', usage: revUsage, color: '#10b981' },
              { name: 'Question Re-Generator', usage: regenUsage, color: '#a855f7' },
              { name: 'Image Generator', usage: null, color: '#f59e0b' }
            ].map(agent => (
              <div
                key={agent.name}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.75rem'
                }}
              >
                <div style={{ fontWeight: 700, color: agent.color, marginBottom: '2px' }}>
                  {agent.name}
                </div>
                {agent.usage ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                    {agent.usage.total_tokens.toLocaleString()} tok &bull; ${agent.usage.cost_usd?.toFixed(5)}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                    Standard execution
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Raw Terminal Event Stream */}
          <div
            style={{
              background: '#040711',
              color: '#cbd5e1',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 12px',
              maxHeight: '120px',
              overflowY: 'auto',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.725rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {events.length === 0 ? (
              <span style={{ color: '#64748b', fontStyle: 'italic' }}>
                Pipeline idle. No events logged yet.
              </span>
            ) : (
              events.slice(-10).map((e, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', lineHeight: 1.4 }}>
                  <span style={{ color: '#64748b', flexShrink: 0 }}>
                    [{new Date(e.timestamp).toLocaleTimeString()}]
                  </span>
                  <span style={{ color: '#38bdf8', fontWeight: 600, flexShrink: 0 }}>
                    {e.agent_name}:
                  </span>
                  <span>{e.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
