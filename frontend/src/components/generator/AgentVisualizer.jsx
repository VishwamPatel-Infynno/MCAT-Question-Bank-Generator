import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';

export default function AgentVisualizer({
  activeAgent,
  iterationCount,
  events,
  latestReview,
  isGenerating
}) {
  const [showTelemetry, setShowTelemetry] = useState(false);

  // Status flags
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

  // Friendly Stage Definition
  const stages = [
    {
      id: 'draft',
      label: '1. Drafting',
      desc: 'Stem & Options',
      icon: PenTool,
      active: isGeneratorActive,
      completed: hasGenerated
    },
    {
      id: 'review',
      label: '2. Quality Audit',
      desc: '100-pt Rubric',
      icon: ShieldCheck,
      active: isReviewerActive,
      completed: hasReviewed,
      badge: latestReview ? `${latestReview.total_score}/100` : null
    },
    {
      id: 'remediate',
      label: '3. Polish & Refine',
      desc: iterationCount > 1 ? `Loop ${iterationCount}` : 'Trap Calibration',
      icon: RotateCcw,
      active: isRegeneratorActive,
      completed: hasRegenerated || (hasReviewed && latestReview?.total_score > 90)
    },
    {
      id: 'ready',
      label: '4. Ready',
      desc: 'Exam Verified',
      icon: Sparkles,
      active: false,
      completed: isWorkflowComplete
    }
  ];

  // Current friendly activity message
  const lastEvent = events.length > 0 ? events[events.length - 1] : null;
  let statusMessage = 'Ready to generate high-yield UCAT practice questions.';
  if (isGenerating) {
    if (isGeneratorActive) statusMessage = '✍️ Drafting candidate passage, scenario, and distractors...';
    else if (isReviewerActive) statusMessage = '🔍 Psychometric auditor scoring question against 100-pt official rubric...';
    else if (isRegeneratorActive) statusMessage = `🛠️ Remediating distractors (Iteration ${iterationCount} of 3)...`;
    else if (isImageActive) statusMessage = '🎨 Generating visual stimulus diagram...';
    else statusMessage = lastEvent ? lastEvent.message : 'Running multi-agent pipeline...';
  } else if (isWorkflowComplete) {
    statusMessage = `✨ Question generated and verified! Quality score: ${latestReview?.total_score || 95}/100.`;
  }

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: isGenerating ? 'var(--brand-primary)' : isWorkflowComplete ? '#10b981' : '#94a3b8',
            boxShadow: isGenerating ? '0 0 10px rgba(2, 132, 199, 0.5)' : 'none'
          }} className={isGenerating ? 'pulse-active' : ''} />
          
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Generation Pipeline
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {totalTokens > 0 && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#166534'
            }}>
              <Coins size={12} color="#16a34a" />
              <span>{totalTokens.toLocaleString()} tokens</span>
              <span style={{ color: '#86efac' }}>&bull;</span>
              <span style={{ color: '#15803d' }}>${totalCost.toFixed(5)}</span>
            </span>
          )}

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowTelemetry(!showTelemetry)}
            style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '4px' }}
          >
            <Terminal size={13} />
            <span>{showTelemetry ? 'Hide Telemetry' : 'Technical Telemetry'}</span>
            {showTelemetry ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Friendly Horizontal Stepper */}
      <div className="workflow-stepper" style={{ padding: '8px 12px' }}>
        <div className="workflow-connector">
          <div 
            className="workflow-connector-fill" 
            style={{ 
              width: isWorkflowComplete ? '100%' 
                : isRegeneratorActive ? '75%'
                : isReviewerActive ? '50%'
                : isGeneratorActive ? '25%'
                : '0%'
            }} 
          />
        </div>

        {stages.map((stage) => {
          const Icon = stage.icon;
          let stepState = 'idle';
          if (stage.active) stepState = 'active';
          else if (stage.completed) stepState = 'completed';

          return (
            <div 
              key={stage.id} 
              className={`workflow-step ${stepState}`}
            >
              <div className="step-circle">
                {stage.completed ? <CheckCircle2 size={18} color="#ffffff" /> : <Icon size={16} />}
              </div>
              <div className="step-title">{stage.label}</div>
              <div className="step-desc">
                {stage.badge ? (
                  <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                    {stage.badge}
                  </span>
                ) : (
                  stage.desc
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Friendly Status Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        background: isGenerating ? 'var(--brand-light)' : '#f8fafc',
        border: isGenerating ? '1px solid #bae6fd' : '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.825rem',
        color: isGenerating ? 'var(--brand-primary-dark)' : 'var(--text-secondary)'
      }}>
        <Activity size={16} color={isGenerating ? 'var(--brand-primary)' : '#64748b'} className={isGenerating ? 'pulse-active' : ''} />
        <span style={{ fontWeight: 600 }}>{statusMessage}</span>
      </div>

      {/* Expandable Technical Telemetry & Event Stream */}
      {showTelemetry && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '14px',
          background: '#ffffff',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)'
        }}>
          {/* Detailed 4-Agent Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '8px'
          }}>
            {[
              { name: 'Question Generator', usage: genUsage, color: '#0284c7' },
              { name: 'Question Reviewer', usage: revUsage, color: '#4f46e5' },
              { name: 'Question Re-Generator', usage: regenUsage, color: '#d97706' },
              { name: 'Image Generator', usage: null, color: '#059669' }
            ].map(agent => (
              <div 
                key={agent.name}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-light)',
                  fontSize: '0.75rem'
                }}
              >
                <div style={{ fontWeight: 700, color: agent.color, marginBottom: '2px' }}>
                  {agent.name}
                </div>
                {agent.usage ? (
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                    {agent.usage.total_tokens.toLocaleString()} tokens &bull; ${agent.usage.cost_usd?.toFixed(5)}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                    Standard execution
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Raw Event Stream */}
          <div style={{
            background: '#0f172a',
            color: '#e2e8f0',
            borderRadius: 'var(--radius-sm)',
            padding: '12px',
            maxHeight: '120px',
            overflowY: 'auto',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.725rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            {events.length === 0 ? (
              <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                Pipeline idle. No events logged yet.
              </span>
            ) : (
              events.slice(-8).map((e, idx) => (
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
