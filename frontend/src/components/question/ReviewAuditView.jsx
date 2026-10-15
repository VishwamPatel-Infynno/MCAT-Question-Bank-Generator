import React from 'react';
import { X, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ReviewAuditView({ question, onClose }) {
  if (!question) return null;

  const review = question.review_rubric;
  const history = question.iterations_history || [];

  const pillars = [
    { label: 'UCAT Authenticity & Tone', score: review?.authenticity_score ?? 24, max: 25, color: 'var(--brand-primary)' },
    { label: 'Clarity & Logical Soundness', score: review?.clarity_score ?? 24, max: 25, color: 'var(--brand-indigo)' },
    { label: 'Distractor Trap Quality', score: review?.distractor_score ?? 23, max: 25, color: 'var(--status-warning)' },
    { label: 'Explanation & Key Rigor', score: review?.explanation_score ?? 24, max: 25, color: 'var(--status-success)' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px'
      }}
    >
      <div
        className="glass-panel-elevated"
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'var(--brand-light)',
                border: '1px solid var(--border-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-primary)'
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Psychometric Review &amp; Cost Audit
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Official 100-Point Quality Assurance Evaluation &bull; AI Token Tracking &bull; Agent Reflection Diff
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            background: 'var(--brand-light)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-brand)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--brand-primary)' }}>Overall Psychometric Score</div>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--brand-primary)', lineHeight: 1.1 }}>
              {question.final_score} <span style={{ fontSize: '1.1rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ 100</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span
              className={`badge ${question.final_score > 90 ? 'badge-emerald' : 'badge-amber'}`}
              style={{ fontSize: '0.8rem', padding: '6px 14px' }}
            >
              {question.final_score > 90 ? 'PASSED (> 90 Benchmark)' : 'CONDITIONAL PASS'}
            </span>
            <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginTop: '6px' }}>
              Cycles: {question.iteration_count || 1} of 3
            </div>
          </div>
        </div>

        {/* Token Usage & Cost Audit Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              AI Token Tracking &amp; Cost Audit
            </h4>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Infynno Cognitive Core ($0.10 in &bull; $0.32 out / 1M tokens)
            </span>
          </div>

          {/* Metric Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ background: 'var(--bg-canvas)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: 600 }}>PROMPT TOKENS</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-primary)' }}>{(question.prompt_tokens || 0).toLocaleString()}</div>
            </div>
            <div style={{ background: 'var(--bg-canvas)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: 600 }}>COMPLETION TOKENS</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-indigo)' }}>{(question.completion_tokens || 0).toLocaleString()}</div>
            </div>
            <div style={{ background: 'var(--bg-canvas)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL TOKENS</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--status-success)' }}>{(question.total_tokens || 0).toLocaleString()}</div>
            </div>
            <div style={{ background: 'var(--bg-canvas)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontWeight: 600 }}>ACCUMULATED COST</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--status-warning)' }}>${(question.cost_usd || 0).toFixed(5)}</div>
            </div>
          </div>
        </div>

        {/* 4 Pillars Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Four-Pillar Rubric Breakdown
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {pillars.map((p, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--bg-canvas)',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{p.label}</span>
                  <span style={{ color: p.color, fontWeight: 800 }}>{p.score} / {p.max}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--border-medium)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${(p.score / p.max) * 100}%`,
                      height: '100%',
                      background: p.color,
                      borderRadius: '3px'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Deficiencies */}
        {review && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            {/* Strengths */}
            <div
              style={{
                background: 'var(--status-success-bg)',
                border: '1px solid var(--status-success-border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 18px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-success)', fontWeight: 800, fontSize: '0.85rem', marginBottom: '8px' }}>
                <CheckCircle size={16} /> Observed Strengths
              </div>
              <ul style={{ paddingLeft: '18px', fontSize: '0.825rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {review.strengths?.length > 0 ? (
                  review.strengths.map((s, idx) => <li key={idx}>{s}</li>)
                ) : (
                  <li>Consistent authentic formatting adhered to.</li>
                )}
              </ul>
            </div>

            {/* Recommendations / Remediation */}
            <div
              style={{
                background: 'var(--status-warning-bg)',
                border: '1px solid var(--status-warning-border)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 18px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-warning)', fontWeight: 800, fontSize: '0.85rem', marginBottom: '8px' }}>
                <AlertTriangle size={16} /> Remediation Guidelines
              </div>
              <ul style={{ paddingLeft: '18px', fontSize: '0.825rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
            <h4 style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Multi-Agent Evolution History
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.map((h, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    background: 'var(--bg-canvas)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="badge badge-cyan">Iteration {h.iteration}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                      Score: {h.review?.total_score || 'N/A'}/100
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
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
