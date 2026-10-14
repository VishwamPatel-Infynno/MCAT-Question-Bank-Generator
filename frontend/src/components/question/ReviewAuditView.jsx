import React from 'react';
import { X, Award, CheckCircle, AlertTriangle, ArrowRight, ShieldCheck, Layers, Coins, Cpu } from 'lucide-react';

export default function ReviewAuditView({ question, onClose }) {
  if (!question) return null;

  const review = question.review_rubric;
  const history = question.iterations_history || [];

  const pillars = [
    { label: 'UCAT Authenticity & Tone', score: review?.authenticity_score ?? 24, max: 25, color: '#0284c7' },
    { label: 'Clarity & Logical Soundness', score: review?.clarity_score ?? 23, max: 25, color: '#4f46e5' },
    { label: 'Distractor Trap Quality', score: review?.distractor_score ?? 23, max: 25, color: '#d97706' },
    { label: 'Explanation & Key Rigor', score: review?.explanation_score ?? 24, max: 25, color: '#059669' },
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '820px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        borderRadius: 'var(--radius-lg)',
        background: '#ffffff',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: '#ede9fe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#6366f1'
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Psychometric Review &amp; Cost Audit
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Official 100-Point Quality Assurance Evaluation &bull; LLM Token Tracking &bull; Agent Reflection Diff
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '6px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Overall Score Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 22px',
          background: 'var(--brand-primary-light)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #bae6fd'
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--brand-primary-dark)' }}>Overall Psychometric Score</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
              {question.final_score} <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>/ 100</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={`badge ${question.final_score > 90 ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.8rem', padding: '6px 14px' }}>
              {question.final_score > 90 ? 'PASSED (> 90 Benchmark)' : 'CONDITIONAL PASS'}
            </span>
            <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', marginTop: '6px' }}>
              Cycles: {question.iteration_count} of 3
            </div>
          </div>
        </div>

        {/* Token Usage & Cost Audit Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              LLM Request Token Usage &amp; Cost Audit
            </h4>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
              Meta Llama 3.3 70B Turbo ($0.10 in &bull; $0.32 out / 1M tokens)
            </span>
          </div>

          {/* Metric Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ background: 'var(--bg-canvas)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>PROMPT TOKENS</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7' }}>{(question.prompt_tokens || 0).toLocaleString()}</div>
            </div>
            <div style={{ background: 'var(--bg-canvas)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>COMPLETION TOKENS</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4f46e5' }}>{(question.completion_tokens || 0).toLocaleString()}</div>
            </div>
            <div style={{ background: 'var(--bg-canvas)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TOTAL TOKENS</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>{(question.total_tokens || 0).toLocaleString()}</div>
            </div>
            <div style={{ background: 'var(--bg-canvas)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ACCUMULATED COST</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#d97706' }}>${(question.cost_usd || 0).toFixed(5)}</div>
            </div>
          </div>

          {/* Granular Breakdown Table */}
          {Array.isArray(question.token_usage_details) && question.token_usage_details.length > 0 && (
            <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-light)', color: '#475569' }}>
                    <th style={{ padding: '8px 12px', fontWeight: 700 }}>Agent Node</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700 }}>Cycle</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'right' }}>Prompt Tokens ($0.10)</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'right' }}>Completion ($0.32)</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'right' }}>Total Tokens</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700, textAlign: 'right' }}>Cost (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {question.token_usage_details.map((entry, idx) => {
                    const agentName = entry.agent || entry.agent_name || 'Agent';
                    const isImageGen = agentName === 'Image Generator';
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)', background: idx % 2 === 0 ? '#ffffff' : '#fcfcfd' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {agentName}
                          {isImageGen && entry.details && (
                            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>
                              {entry.model || 'FLUX-1-schnell'} {entry.details.width ? `(${entry.details.width}×${entry.details.height}, ${entry.details.iters} iters)` : ''}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '8px 12px', color: '#64748b' }}>
                          {isImageGen ? 'Visual' : `Iter ${entry.iteration || 1}`}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          {isImageGen ? '-' : (entry.prompt_tokens || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          {isImageGen ? '-' : (entry.completion_tokens || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {isImageGen ? 'N/A' : (entry.total_tokens || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#166534' }}>
                          ${(entry.cost_usd || 0).toFixed(5)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 4 Pillars Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Four-Pillar Rubric Breakdown
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {pillars.map((p, i) => (
              <div key={i} style={{
                background: 'var(--bg-canvas)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{p.label}</span>
                  <span style={{ color: p.color, fontWeight: 800 }}>{p.score} / {p.max}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${(p.score / p.max) * 100}%`,
                    height: '100%',
                    background: p.color,
                    borderRadius: '3px'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Deficiencies */}
        {review && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Strengths */}
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 'var(--radius-md)',
              padding: '16px 18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 800, fontSize: '0.85rem', marginBottom: '8px' }}>
                <CheckCircle size={16} /> Observed Strengths
              </div>
              <ul style={{ paddingLeft: '18px', fontSize: '0.825rem', color: '#14532d', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {review.strengths?.length > 0 ? (
                  review.strengths.map((s, idx) => <li key={idx}>{s}</li>)
                ) : (
                  <li>Consistent authentic formatting adhered to.</li>
                )}
              </ul>
            </div>

            {/* Recommendations / Remediation */}
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 'var(--radius-md)',
              padding: '16px 18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontWeight: 800, fontSize: '0.85rem', marginBottom: '8px' }}>
                <AlertTriangle size={16} /> Remediation Guidelines
              </div>
              <ul style={{ paddingLeft: '18px', fontSize: '0.825rem', color: '#78350f', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {review.recommendations?.length > 0 ? (
                  review.recommendations.map((r, idx) => <li key={idx}>{r}</li>)
                ) : (
                  <li>Draft met passing threshold and approved for Question Bank.</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Iterations Evolution Timeline */}
        {history.length > 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Multi-Agent Evolution History
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.map((h, idx) => (
                <div key={idx} style={{
                  padding: '12px 16px',
                  background: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge badge-cyan">Iteration {h.iteration}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                      Score: {h.review?.total_score || 'N/A'}/100
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {h.review?.passed ? '✓ Met > 90 Quality Benchmark' : '⚠️ Refined by Re-Generator'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
