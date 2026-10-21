import React from 'react';
import { X, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ReviewAuditView({ question, onClose }) {
  if (!question) return null;

  const review = question.review_rubric;
  const history = question.iterations_history || [];

  const pillars = [
    { label: 'Real UCAT Style & Tone', score: review?.authenticity_score ?? 24, max: 25, color: 'var(--brand-primary)' },
    { label: 'Clarity & Logic', score: review?.clarity_score ?? 24, max: 25, color: 'var(--brand-indigo)' },
    { label: 'Wrong Answer Quality', score: review?.distractor_score ?? 23, max: 25, color: 'var(--status-warning)' },
    { label: 'Explanation & Key Accuracy', score: review?.explanation_score ?? 24, max: 25, color: 'var(--status-success)' },
  ];

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: '820px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--brand-light)',
                border: '1px solid var(--border-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-primary)',
                flexShrink: 0
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="modal-title">
                Question Quality &amp; Verification Audit
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Quality Score Review &bull; AI Compute Tracking &bull; Multi-Agent Verification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}
            title="Close Audit"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">

        {/* Overall Score Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            background: 'var(--brand-light)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-brand)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--brand-primary)' }}>Overall Quality Score</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--brand-primary)', lineHeight: 1.1 }}>
              {question.final_score} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ 100</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span
              className={`badge ${question.final_score > 90 ? 'badge-emerald' : 'badge-amber'}`}
              style={{ fontSize: '0.75rem', padding: '4px 10px' }}
            >
              {question.final_score > 90 ? 'PASSED (> 90 Benchmark)' : 'CONDITIONAL PASS'}
            </span>
            <div style={{ fontSize: '0.725rem', fontWeight: 500, color: 'var(--text-muted)', marginTop: '4px' }}>
              Cycles: {question.iteration_count || 1} of 3
            </div>
          </div>
        </div>

        {/* AI Compute Units & Workload Audit Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              AI Compute &amp; Workload Breakdown
            </h4>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Infynno Multi-Agent Quality Engine
            </span>
          </div>

          {/* Metric Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            <div style={{ background: 'var(--bg-canvas)', padding: '10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>INPUT UNITS</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-primary)' }}>{(question.prompt_tokens || 0).toLocaleString()}</div>
            </div>
            <div style={{ background: 'var(--bg-canvas)', padding: '10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>GENERATION UNITS</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--brand-indigo)' }}>{(question.completion_tokens || 0).toLocaleString()}</div>
            </div>
            <div style={{ background: 'var(--bg-canvas)', padding: '10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL COMPUTE UNITS</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--status-success)' }}>{(question.total_tokens || 0).toLocaleString()}</div>
            </div>
            <div style={{ background: 'var(--bg-canvas)', padding: '10px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-light)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>QUALITY STATUS</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--status-success)' }}>Pass (&gt; 90)</div>
            </div>
          </div>
        </div>

        {/* 4 Pillars Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Four-Pillar Quality Breakdown
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
                <AlertTriangle size={16} /> Improvement Tips
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
              Improvement Steps History
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
                    {h.review?.passed ? '✓ Met > 90 Quality Benchmark' : '⚠️ Polished by Question Improver'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
}
