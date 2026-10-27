import React from 'react';
import {
  CheckCircle2,
  Image as ImageIcon,
  Sparkles,
  XCircle,
  AlertCircle,
  Database,
  Layers
} from 'lucide-react';

export default function BatchQuestionItem({
  question,
  index = 0,
  onNavigateToBank,
  onNavigateToValidated,
  onOpenAudit,
  onSaveToBank
}) {
  if (!question) return null;

  // Determine lifecycle status
  let status = question.status;
  const finalScore = question.final_score ?? 95;
  if (!status) {
    if (finalScore > 90) status = 'ai_validated';
    else if (finalScore > 85) status = 'batch_only';
    else status = 'below_threshold';
  }

  const isBelowThreshold = status === 'below_threshold' || finalScore <= 85;

  return (
    <div
      style={{
        background: isBelowThreshold ? 'var(--bg-surface-subtle)' : 'var(--bg-canvas)',
        border: isBelowThreshold
          ? '1px dashed var(--border-medium)'
          : '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xs)',
        padding: '10px 12px',
        fontSize: '0.78rem',
        opacity: isBelowThreshold ? 0.85 : 1,
        transition: 'all var(--transition-fast)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          flexWrap: 'wrap',
          gap: '6px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, color: 'var(--brand-primary)', fontSize: '0.75rem' }}>
            Question {index + 1}
          </span>

          {/* Status Badge */}
          {status === 'in_bank' && (
            <span
              style={{
                fontSize: '0.675rem',
                padding: '2px 8px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--status-success)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <CheckCircle2 size={11} /> In Question Bank
            </span>
          )}

          {status === 'ai_validated' && (
            <span
              style={{
                fontSize: '0.675rem',
                padding: '2px 8px',
                borderRadius: '10px',
                background: 'rgba(79, 48, 185, 0.12)',
                color: 'var(--brand-primary)',
                border: '1px solid rgba(79, 48, 185, 0.3)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Sparkles size={11} /> Ready for Review (&gt;90)
            </span>
          )}

          {status === 'batch_only' && (
            <span
              style={{
                fontSize: '0.675rem',
                padding: '2px 8px',
                borderRadius: '10px',
                background: 'rgba(51, 90, 207, 0.12)',
                color: 'var(--brand-primary)',
                border: '1px solid rgba(51, 90, 207, 0.3)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Layers size={11} /> Good Quality (86-90)
            </span>
          )}

          {status === 'discarded' && (
            <span
              style={{
                fontSize: '0.675rem',
                padding: '2px 8px',
                borderRadius: '10px',
                background: 'rgba(244, 63, 94, 0.12)',
                color: 'var(--status-danger)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <XCircle size={11} /> Discarded
            </span>
          )}

          {status === 'below_threshold' && (
            <span
              style={{
                fontSize: '0.675rem',
                padding: '2px 8px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#d97706',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <AlertCircle size={11} /> Needs Polish (&le;85)
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            className="badge"
            style={{
              fontSize: '0.65rem',
              padding: '1px 6px',
              background:
                finalScore > 90
                  ? 'rgba(16, 185, 129, 0.12)'
                  : finalScore > 85
                    ? 'rgba(51, 90, 207, 0.12)'
                    : 'rgba(245, 158, 11, 0.12)',
              color:
                finalScore > 90
                  ? 'var(--status-success)'
                  : finalScore > 85
                    ? 'var(--brand-primary)'
                    : '#d97706',
              border:
                finalScore > 90
                  ? '1px solid rgba(16, 185, 129, 0.25)'
                  : finalScore > 85
                    ? '1px solid rgba(51, 90, 207, 0.25)'
                    : '1px solid rgba(245, 158, 11, 0.25)',
              fontWeight: 700
            }}
          >
            Score {finalScore}/100
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
          {status === 'batch_only' && onSaveToBank && (
            <button
              type="button"
              onClick={() => onSaveToBank(question)}
              className="btn-primary"
              style={{
                padding: '3px 9px',
                fontSize: '0.7rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Save question directly to Question Bank"
            >
              <Database size={10} />
              <span>Save to Question Bank</span>
            </button>
          )}

          {status === 'ai_validated' && onNavigateToValidated && (
            <button
              type="button"
              onClick={onNavigateToValidated}
              className="btn-primary"
              style={{ padding: '2px 8px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title="Review in Ready for Review screen"
            >
              <Sparkles size={10} />
              <span>Review Question</span>
            </button>
          )}

          {status === 'in_bank' && onNavigateToBank && (
            <button
              type="button"
              onClick={onNavigateToBank}
              className="btn-secondary"
              style={{ padding: '2px 8px', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              title="View in Question Bank"
            >
              <Database size={10} />
              <span>In Question Bank</span>
            </button>
          )}

          {onOpenAudit && (
            <button
              type="button"
              onClick={() => onOpenAudit(question)}
              className="btn-secondary"
              style={{ padding: '2px 8px', fontSize: '0.7rem' }}
            >
              Quality Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
