import React from 'react';
import { CheckCircle2, Image as ImageIcon } from 'lucide-react';

export default function BatchQuestionItem({
  question,
  index = 0,
  onNavigateToBank,
  onOpenAudit
}) {
  if (!question) return null;

  return (
    <div
      style={{
        background: 'var(--bg-canvas)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xs)',
        padding: '10px 12px',
        fontSize: '0.78rem'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px'
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: '0.725rem' }}>
          Question {index + 1}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
            Score {question.final_score || 95}/100
          </span>
          {question.image_svg && (
            <span
              className="badge-minimal"
              style={{ fontSize: '0.65rem', padding: '1px 4px' }}
              title="Has visual diagram"
            >
              <ImageIcon size={10} /> Diagram
            </span>
          )}
        </div>
      </div>

      {/* Question Stem */}
      <div
        style={{
          color: 'var(--text-primary)',
          lineHeight: 1.4,
          fontWeight: 500,
          marginBottom: '8px'
        }}
      >
        {question.question_stem}
      </div>

      {/* Options List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
        {(question.options || []).map((opt) => {
          const isCorrect =
            (question.correct_answer_ids && question.correct_answer_ids.includes(opt.id)) ||
            question.correct_answer_id === opt.id;
          return (
            <div
              key={opt.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-xs)',
                background: isCorrect ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface-subtle)',
                border: isCorrect ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                fontSize: '0.74rem'
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color: isCorrect ? 'var(--status-success)' : 'var(--text-muted)',
                  minWidth: '16px'
                }}
              >
                {opt.id}.
              </span>
              <span style={{ color: isCorrect ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {opt.text}
              </span>
              {isCorrect && (
                <CheckCircle2
                  size={12}
                  style={{ color: 'var(--status-success)', marginLeft: 'auto', flexShrink: 0 }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Question Tools */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '6px',
          borderTop: '1px dashed var(--border-light)'
        }}
      >
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          {question.aamc_skill || question.primary_trap || 'MCAT Standard'}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onNavigateToBank && (
            <button
              type="button"
              onClick={onNavigateToBank}
              className="btn-secondary"
              style={{ padding: '2px 8px', fontSize: '0.7rem' }}
              title="Open in Question Bank"
            >
              Bank
            </button>
          )}
          {onOpenAudit && (
            <button
              type="button"
              onClick={() => onOpenAudit(question)}
              className="btn-secondary"
              style={{ padding: '2px 8px', fontSize: '0.7rem' }}
            >
              Audit Rubric
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
