import React, { useState } from 'react';
import { AlertOctagon, RotateCcw, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

export default function RejectionCard({ rejectionData, onRetry }) {
  const [showDraft, setShowDraft] = useState(false);

  if (!rejectionData) return null;

  const review = rejectionData.review_rubric || rejectionData.review;
  const draft = rejectionData.draft;

  return (
    <div
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--status-danger-border)',
        background: 'var(--status-danger-bg)',
        boxShadow: 'var(--shadow-md)'
      }}
    >
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'var(--status-danger-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--status-danger)',
              border: '1px solid var(--status-danger-border)',
              boxShadow: '0 2px 8px rgba(225, 29, 72, 0.15)'
            }}
          >
            <AlertOctagon size={24} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Quality Benchmark Not Met (Score ≤ 90)
              </h3>
              <span className="badge badge-rose">
                Discarded
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Candidate question scored <strong>{rejectionData.final_score}/100</strong> after {rejectionData.iteration_count} attempts (Threshold: &gt; 90).
            </p>
          </div>
        </div>

        <button
          onClick={onRetry}
          className="btn-primary"
          style={{ background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)', boxShadow: '0 4px 14px rgba(225, 29, 72, 0.25)' }}
        >
          <RotateCcw size={16} />
          Retry Generation
        </button>
      </div>

      {/* Explanation Banner */}
      <div
        style={{
          padding: '14px 18px',
          background: 'var(--bg-surface-elevated)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          fontSize: '0.85rem',
          color: 'var(--text-primary)',
          lineHeight: 1.6
        }}
      >
        <strong>Strict Policy Enforcement:</strong> The workflow was completely halted to ensure question bank integrity. Image generation was bypassed, and this question was <strong>NOT saved</strong> to the question bank repository.
      </div>

      {/* Reviewer Critique & Weaknesses */}
      {review && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Rubric Breakdown */}
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              padding: '18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Rubric Evaluation
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Authenticity &amp; Tone:</span>
              <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>{review.authenticity_score}/25</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Clarity &amp; Validity:</span>
              <span style={{ fontWeight: 700, color: 'var(--brand-indigo)' }}>{review.clarity_score}/25</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Distractor Quality:</span>
              <span style={{ fontWeight: 700, color: 'var(--status-danger)' }}>{review.distractor_score}/25</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Explanation Rigor:</span>
              <span style={{ fontWeight: 700, color: 'var(--status-success)' }}>{review.explanation_score}/25</span>
            </div>
          </div>

          {/* Identified Weaknesses */}
          <div
            style={{
              background: 'var(--bg-surface-elevated)',
              padding: '18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 800, color: 'var(--status-warning)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <AlertTriangle size={15} /> Reviewer's Key Critiques
            </div>
            <ul style={{ paddingLeft: '18px', fontSize: '0.825rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {review.weaknesses && review.weaknesses.length > 0 ? (
                review.weaknesses.map((w, i) => <li key={i}>{w}</li>)
              ) : (
                <li>Score fell below the passing threshold of 90 points.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Discarded Draft Inspector (Accordion) */}
      {draft && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowDraft(!showDraft)}
            className="btn-secondary"
            style={{ alignSelf: 'flex-start', padding: '6px 14px', fontSize: '0.8rem', gap: '6px' }}
          >
            {showDraft ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showDraft ? 'Hide Discarded Draft' : 'Inspect Discarded Draft Details'}
          </button>

          {showDraft && (
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                padding: '18px',
                border: '1px solid var(--border-light)',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {draft.stimulus_text && (
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>Stimulus:</strong>
                  <div style={{ marginTop: '4px', whiteSpace: 'pre-line', color: 'var(--text-secondary)' }}>{draft.stimulus_text}</div>
                </div>
              )}
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Question Stem:</strong>
                <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>{draft.question_stem}</div>
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Options:</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  {draft.options?.map(o => (
                    <div
                      key={o.id}
                      style={{
                        color: o.id === draft.correct_answer_id ? 'var(--status-success)' : 'var(--text-secondary)',
                        fontWeight: o.id === draft.correct_answer_id ? 700 : 400
                      }}
                    >
                      {o.id}: {o.text} {o.id === draft.correct_answer_id ? ' (Correct Answer)' : ''}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
