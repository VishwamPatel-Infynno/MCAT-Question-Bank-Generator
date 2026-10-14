import React from 'react';
import { PenTool, CheckCircle2, RotateCcw, Image as ImageIcon, ArrowRight, ShieldCheck, AlertCircle, Coins } from 'lucide-react';

export default function AgentVisualizer({
  activeAgent,
  iterationCount,
  events,
  latestReview,
  isGenerating
}) {
  // Agent status determination
  const isGeneratorActive = activeAgent === 'Question Generator';
  const isReviewerActive = activeAgent === 'Question Reviewer';
  const isRegeneratorActive = activeAgent === 'Question Re-Generator';
  const isImageActive = activeAgent === 'Image Generator';

  // Check if an agent has completed its work
  const hasGenerated = events.some(e => e.agent_name === 'Question Generator' && e.event_type === 'agent_complete');
  const hasReviewed = events.some(e => e.agent_name === 'Question Reviewer' && e.event_type === 'agent_complete');
  const hasRegenerated = events.some(e => e.agent_name === 'Question Re-Generator' && e.event_type === 'agent_complete');
  const hasImaged = events.some(e => e.agent_name === 'Image Generator' && e.event_type === 'agent_complete');

  // Extract cumulative and per-agent usage metrics from events
  const latestUsageEvent = [...events].reverse().find(e => e.data?.cumulative_usage);
  const cumulativeUsage = latestUsageEvent?.data?.cumulative_usage;
  const totalTokens = cumulativeUsage?.total_tokens || 0;
  const totalCost = cumulativeUsage?.total_cost_usd || 0;

  // Find latest agent-specific usage
  const getAgentUsage = (agentName) => {
    const ev = [...events].reverse().find(e => e.agent_name === agentName && e.data?.latest_usage);
    return ev?.data?.latest_usage || null;
  };

  const genUsage = getAgentUsage('Question Generator');
  const revUsage = getAgentUsage('Question Reviewer');
  const regenUsage = getAgentUsage('Question Re-Generator');

  const agents = [
    {
      id: 'generator',
      name: 'Question Generator',
      role: 'Drafts passage & 4 options',
      icon: PenTool,
      isActive: isGeneratorActive,
      isDone: hasGenerated,
      accentColor: '#0284c7',
      usage: genUsage
    },
    {
      id: 'reviewer',
      name: 'Question Reviewer',
      role: 'Evaluates 100-pt rubric',
      icon: ShieldCheck,
      isActive: isReviewerActive,
      isDone: hasReviewed,
      accentColor: '#4f46e5',
      badge: latestReview ? `${latestReview.total_score}/100` : null,
      passed: latestReview?.total_score > 90,
      usage: revUsage
    },
    {
      id: 'regenerator',
      name: 'Question Re-Generator',
      role: 'Remediates if score ≤ 90',
      icon: RotateCcw,
      isActive: isRegeneratorActive,
      isDone: hasRegenerated,
      accentColor: '#d97706',
      badge: iterationCount > 1 ? `Iteration ${iterationCount}` : null,
      usage: regenUsage
    },
    {
      id: 'image_generator',
      name: 'Image Generator',
      role: 'Generates SVG / AI visual',
      icon: ImageIcon,
      isActive: isImageActive,
      isDone: hasImaged,
      accentColor: '#059669',
      usage: null
    }
  ];

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: isGenerating ? 'var(--brand-primary)' : '#10b981',
            boxShadow: isGenerating ? '0 0 10px rgba(2, 132, 199, 0.5)' : 'none'
          }} className={isGenerating ? 'pulse-active' : ''} />
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Multi-Agent State Graph
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Live Cumulative Token & Cost Tracker Badge */}
          {totalTokens > 0 && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 10px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#166534'
            }}>
              <Coins size={13} color="#16a34a" />
              <span>{totalTokens.toLocaleString()} tokens</span>
              <span style={{ color: '#86efac' }}>&bull;</span>
              <span style={{ color: '#15803d' }}>${totalCost.toFixed(5)}</span>
            </span>
          )}

          {iterationCount > 1 && (
            <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
              Regeneration Loop: Cycle {iterationCount} of 3
            </span>
          )}
        </div>
      </div>

      {/* Agents Stepper Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        position: 'relative'
      }}>
        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <div
              key={agent.id}
              id={`agent-node-${agent.id}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                padding: '14px 10px',
                borderRadius: 'var(--radius-md)',
                background: agent.isActive 
                  ? 'var(--brand-primary-light)' 
                  : agent.isDone 
                  ? '#f0fdf4' 
                  : '#ffffff',
                border: agent.isActive 
                  ? `2px solid ${agent.accentColor}` 
                  : agent.isDone 
                  ? '1.5px solid #86efac' 
                  : '1px solid var(--border-light)',
                boxShadow: agent.isActive ? `0 4px 14px ${agent.accentColor}25` : 'var(--shadow-sm)',
                transition: 'all 0.3s'
              }}
              className={agent.isActive ? 'pulse-active' : ''}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: agent.isActive ? agent.accentColor : agent.isDone ? '#dcfce7' : 'var(--bg-canvas)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: agent.isActive ? '#ffffff' : (agent.isDone ? '#059669' : 'var(--text-secondary)'),
                marginBottom: '8px'
              }}>
                <Icon size={18} />
              </div>

              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                {agent.name}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                {agent.role}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                {agent.badge && (
                  <span className={`badge ${agent.passed ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
                    {agent.badge}
                  </span>
                )}
                {agent.usage && (
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    color: '#475569',
                    background: '#f1f5f9',
                    padding: '2px 6px',
                    borderRadius: '4px'
                  }}>
                    {agent.usage.total_tokens} tok &bull; ${agent.usage.cost_usd?.toFixed(5)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Stream Terminal Logs in Light Console Style */}
      <div style={{
        background: '#f8fafc',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)',
        padding: '14px',
        maxHeight: '140px',
        overflowY: 'auto',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        {events.length === 0 ? (
          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            Workflow idle. Select parameters and click 'Generate UK UCAT Question' to start.
          </span>
        ) : (
          events.slice(-6).map((e, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', lineHeight: 1.4 }}>
              <span style={{ color: '#64748b', flexShrink: 0 }}>
                [{new Date(e.timestamp).toLocaleTimeString()}]
              </span>
              <span style={{
                fontWeight: 700,
                flexShrink: 0,
                color: e.agent_name === 'Question Generator' ? '#0284c7'
                  : e.agent_name === 'Question Reviewer' ? '#4f46e5'
                  : e.agent_name === 'Question Re-Generator' ? '#d97706'
                  : e.agent_name === 'Image Generator' ? '#059669'
                  : '#475569'
              }}>
                {e.agent_name}:
              </span>
              <span style={{ color: '#1e293b' }}>{e.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
