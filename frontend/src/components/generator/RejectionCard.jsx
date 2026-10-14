import React, { useState } from 'react';
import { AlertOctagon, RotateCcw, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

export default function RejectionCard({ rejectionData, onRetry }) {
  const [showDraft, setShowDraft] = useState(false);

  if (!rejectionData) return null;

  const review = rejectionData.review_rubric || rejectionData.review;
  const draft = rejectionData.draft;

  return (
    <div style={{
      padding: '28px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      borderRadius: 'var(--radius-lg)',
      border: '1.5px solid #fecdd3',
      background: '#fff1f2',
      boxShadow: 'var(--shadow-md)'
    }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: '#ffe4e6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#e11d48',
            border: '1px solid #fecdd3',
            boxShadow: '0 2px 8px rgba(225, 29, 72, 0.15)'
          }}>
            <AlertOctagon size={26} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#9f1239' }}>
                Quality Benchmark Not Met (Score ≤ 90)
              </h3>
              <span className="badge badge-rose">
                Discarded
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#be123c', fontWeight: 500 }}>
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
      <div style={{
        padding: '14px 18px',
        background: '#ffffff',
        borderRadius: 'var(--radius-md)',
        border: '1px solid #fecdd3',
        fontSize: '0.85rem',
        color: '#9f1239',
        lineHeight: 1.6
      }}>
        <strong>Strict Policy Enforcement:</strong> The workflow was completely halted to ensure question bank integrity. Image generation was bypassed, and this question was <strong>NOT saved</strong> to the PostgreSQL repository.
      </div>

      {/* Reviewer Critique & Weaknesses */}
      {review && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Rubric Breakdown */}
          <div style={{
            background: '#ffffff',
            padding: '18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #e2e8f0',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Rubric Evaluation
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#334155' }}>Authenticity &amp; Tone:</span>
              <span style={{ fontWeight: 700, color: '#0284c7' }}>{review.authenticity_score}/25</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#334155' }}>Clarity &amp; Validity:</span>
              <span style={{ fontWeight: 700, color: '#4f46e5' }}>{review.clarity_score}/25</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#334155' }}>Distractor Quality:</span>
              <span style={{ fontWeight: 700, color: '#e11d48' }}>{review.distractor_score}/25</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#334155' }}>Explanation Rigor:</span>
              <span style={{ fontWeight: 700, color: '#059669' }}>{review.explanation_score}/25</span>
            </div>
          </div>

          {/* Identified Weaknesses */}
          <div style={{
            background: '#ffffff',
            padding: '18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #e2e8f0',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <AlertTriangle size={15} /> Reviewer's Key Critiques
            </div>
            <ul style={{ paddingLeft: '18px', fontSize: '0.825rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
            onClick={() => setShowDraft(!showDraft)}
            className="btn-secondary"
            style={{ alignSelf: 'flex-start', padding: '6px 14px', fontSize: '0.8rem', gap: '6px', background: '#ffffff' }}
          >
            {showDraft ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showDraft ? 'Hide Discarded Draft' : 'Inspect Discarded Draft Details'}
          </button>

          {showDraft && (
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-md)',
              padding: '18px',
              border: '1px solid #e2e8f0',
              fontSize: '0.85rem',
              color: '#334155',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {draft.stimulus_text && (
                <div>
                  <strong style={{ color: '#0f172a' }}>Stimulus:</strong>
                  <div style={{ marginTop: '4px', whiteSpace: 'pre-line', color: '#334155' }}>{draft.stimulus_text}</div>
                </div>
              )}
              <div>
                <strong style={{ color: '#0f172a' }}>Question Stem:</strong>
                <div style={{ marginTop: '4px', color: '#334155' }}>{draft.question_stem}</div>
              </div>
              <div>
                <strong style={{ color: '#0f172a' }}>Options:</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  {draft.options?.map(o => (
                    <div key={o.id} style={{ color: o.id === draft.correct_answer_id ? '#059669' : '#475569', fontWeight: o.id === draft.correct_answer_id ? 700 : 400 }}>
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
