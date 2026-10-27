/**
 * StagedDetailedView
 *
 * Renders the candidate questions in detailed single-question view:
 * - Horizontal navigation pills rail with status indicators
 * - Stepper controls (Prev / Next)
 * - Full embedded QuestionCard with audit/edit support or waiting placeholder
 */
import React from 'react';
import { ChevronLeft, ChevronRight, Loader2, Clock, Check } from 'lucide-react';
import QuestionCard from '../question/QuestionCard';
import { formatDifficulty } from '../../constants/mcat';

export default function StagedDetailedView({
  effectiveTotal,
  perQuestionState,
  stagedQuestions,
  validIdx,
  activeQuestion,
  totalCompleted,
  isGenerating,
  isMixedBatch,
  selectedIds,
  savedIds,
  setActiveIdx,
  handleToggleSelect,
  isQuestionPassageLinked,
  handleApproveSingle,
  onDiscardQuestion,
  onOpenAudit,
  onUpdateQuestion
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Horizontal Question Pills Rail */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
        {Array.from({ length: effectiveTotal }, (_, i) => i + 1).map((slotNumber) => {
          const idx = slotNumber - 1;
          const qState = perQuestionState[slotNumber];
          const q =
            stagedQuestions.find((item) => item.index === slotNumber || item.batch_index === slotNumber) ||
            qState?.question ||
            (stagedQuestions.length === effectiveTotal ? stagedQuestions[idx] : null);
          const isCurrent = idx === validIdx && Boolean(q);
          const isChecked = q && selectedIds.has(q.id);
          const isSaved = q && savedIds.has(q.id);
          const isPassage =
            q && (q.passage_required === 'Yes' || (q.stimulus_text && q.stimulus_text.trim().split(/\s+/).length >= 180));

          if (!q) {
            return (
              <div
                key={`pill-placeholder-slot-${slotNumber}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: isGenerating ? 'var(--brand-light)' : 'var(--bg-surface-subtle)',
                  border: isGenerating ? '1px dashed var(--border-brand)' : '1px dashed var(--border-light)',
                  color: isGenerating ? 'var(--brand-primary)' : 'var(--text-muted)',
                  fontSize: '0.75rem',
                  opacity: isGenerating ? 1 : 0.6,
                  flexShrink: 0
                }}
              >
                {isGenerating ? <Loader2 size={12} className="spin-slow" /> : <Clock size={12} />}
                <span>
                  Q{slotNumber} • {isGenerating ? 'Creating...' : 'Queued'}
                </span>
              </div>
            );
          }

          return (
            <div
              key={q.id || idx}
              onClick={() => setActiveIdx(idx)}
              id={`tab-pill-q-${idx + 1}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                background: isCurrent ? 'var(--bg-surface-elevated)' : 'var(--bg-surface-subtle)',
                border: isCurrent ? '1px solid var(--border-brand)' : '1px solid var(--border-light)',
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'all var(--transition-fast)',
                boxShadow: isCurrent ? 'var(--shadow-sm)' : 'none',
                flexShrink: 0
              }}
            >
              <input
                type="checkbox"
                aria-label={`Select Question ${q.index || slotNumber}`}
                checked={isChecked}
                onChange={(e) => {
                  e.stopPropagation();
                  handleToggleSelect(q.id);
                }}
                style={{ accentColor: 'var(--brand-primary)', width: '14px', height: '14px', cursor: 'pointer' }}
                title={isChecked ? 'Selected to keep in Bank' : 'Click to select for Bank'}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Q{q.index || slotNumber}
                </span>
                <span className="badge badge-neutral" style={{ fontSize: '0.625rem' }}>
                  {formatDifficulty(q.difficulty)}
                </span>
                {isQuestionPassageLinked(q, slotNumber) ? (
                  <span className="badge badge-purple" style={{ fontSize: '0.625rem' }}>Passage</span>
                ) : isMixedBatch ? (
                  <span className="badge badge-emerald" style={{ fontSize: '0.625rem' }}>Independent</span>
                ) : isPassage ? (
                  <span className="badge badge-cyan" style={{ fontSize: '0.625rem' }}>Passage</span>
                ) : null}
                {Boolean(q.option_symmetry || q.stage_outcomes?.option_symmetry) && (
                  <span
                    style={{
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: (q.option_symmetry?.is_balanced ?? q.stage_outcomes?.option_symmetry?.is_balanced ?? true)
                        ? 'var(--status-success)'
                        : 'var(--status-warning)',
                      display: 'inline-block'
                    }}
                    title={`Option Length Balance: ${
                      (q.option_symmetry || q.stage_outcomes?.option_symmetry)?.status || 'Balanced'
                    }`}
                  />
                )}
              </div>
              {isSaved ? (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'var(--status-success)',
                    color: '#ffffff'
                  }}
                  title="Saved in Question Bank"
                >
                  <Check size={10} />
                </span>
              ) : (
                <span style={{ fontSize: '0.675rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {q.final_score || 95}/100
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Stepper Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          background: 'var(--bg-surface-subtle)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text-muted)' }}>Viewing Question:</span>
          <strong style={{ color: 'var(--text-primary)' }}>
            {validIdx + 1} of {totalCompleted}
          </strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            id="btn-prev-candidate"
            onClick={() => setActiveIdx((prev) => Math.max(0, prev - 1))}
            disabled={validIdx === 0}
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.725rem' }}
            title="Previous Question"
          >
            <ChevronLeft size={13} />
            <span>Prev</span>
          </button>
          <button
            type="button"
            id="btn-next-candidate"
            onClick={() => setActiveIdx((prev) => Math.min(totalCompleted - 1, prev + 1))}
            disabled={validIdx >= totalCompleted - 1}
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.725rem' }}
            title="Next Question"
          >
            <span>Next</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Embedded Full Question Card */}
      {activeQuestion ? (
        <QuestionCard
          question={activeQuestion}
          isSaved={savedIds.has(activeQuestion.id)}
          onApprove={handleApproveSingle}
          onDiscard={() => {
            if (savedIds.has(activeQuestion.id)) return;
            if (onDiscardQuestion) onDiscardQuestion(activeQuestion.id);
          }}
          onOpenAudit={onOpenAudit}
          onUpdateQuestion={onUpdateQuestion}
        />
      ) : (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={24} className="spin-slow" style={{ margin: '0 auto 12px auto' }} />
          <p>Waiting for questions to generate...</p>
        </div>
      )}
    </div>
  );
}
