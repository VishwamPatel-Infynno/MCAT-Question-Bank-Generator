import React from 'react';
import {
  Check,
  Eye,
  Award,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon
} from 'lucide-react';
import VisualStimulusViewer from '../question/VisualStimulusViewer';
import StagedSlotSkeleton from './StagedSlotSkeleton';
import { formatDifficulty } from '../../constants/mcat';

export default function StagedQuestionSlotCard({
  idx,
  slotNumber,
  q,
  qState,
  isLinked,
  isMixedBatch,
  effectiveTotal,
  isChecked,
  isSaved,
  isSaving,
  isExpandedExplanation,
  onToggleSelect,
  onToggleExplanation,
  onApproveSingle,
  onOpenAudit,
  onSelectDetailedView
}) {
  // State A: Question has been generated and ready for review
  if (q) {
    const wordCount = q.stimulus_text ? q.stimulus_text.trim().split(/\s+/).length : 0;
    const isPassage = q.passage_required === 'Yes' || wordCount >= 180;
    const correctKeysList = Array.isArray(q.correct_answer_ids) && q.correct_answer_ids.length > 0
      ? q.correct_answer_ids.map(k => String(k).trim().toUpperCase())
      : (q.correct_answer_id || '').split(',').map(k => k.trim().toUpperCase()).filter(Boolean);

    return (
      <div
        key={q.id || idx}
        style={{
          background: 'var(--bg-surface)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          borderRadius: 'var(--radius-sm)',
          border: isSaved
            ? '1px solid rgba(16, 185, 129, 0.4)'
            : isChecked
            ? '1px solid var(--border-brand)'
            : '1px solid var(--border-light)',
          position: 'relative',
          transition: 'border-color var(--transition-fast)'
        }}
      >
        {/* Card Top Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {isSaved ? (
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  background: 'var(--status-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  flexShrink: 0
                }}
                title="Accepted & Saved in Question Bank (Protected from discard)"
              >
                <Check size={11} strokeWidth={3} />
              </div>
            ) : (
              <input
                type="checkbox"
                aria-label={`Select Question ${q.index || slotNumber}`}
                checked={isChecked}
                onChange={() => onToggleSelect(q.id)}
                style={{
                  accentColor: 'var(--brand-primary)',
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer'
                }}
                title="Select this question to keep in Question Bank"
              />
            )}
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Question {q.index || slotNumber}
            </span>
            <span style={{ color: 'var(--border-medium)' }}>•</span>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
              {formatDifficulty(q.difficulty)}
            </span>
            <span className="badge badge-neutral" style={{ fontSize: '0.675rem' }}>
              Single Choice MCQ
            </span>
            {isLinked ? (
              <span className="badge badge-cyan" style={{ fontSize: '0.675rem' }}>
                Passage Set
              </span>
            ) : isMixedBatch ? (
              <span className="badge badge-emerald" style={{ fontSize: '0.675rem' }}>
                Independent Direct
              </span>
            ) : isPassage ? (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                • Passage ({wordCount}w)
              </span>
            ) : (
              <span className="badge badge-neutral" style={{ fontSize: '0.675rem' }}>
                Direct Question
              </span>
            )}
            {!isLinked && (q.image_svg || q.image_url || q.stage_outcomes?.visual_stimulus?.image_svg || q.stage_outcomes?.visual_stimulus?.image_url || q.stage_outcomes?.passage_visual_stimulus?.image_svg || q.stage_outcomes?.passage_visual_stimulus?.image_url) && (
              <span className="badge badge-purple" style={{ fontSize: '0.675rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                <ImageIcon size={10} /> Diagram
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="badge badge-emerald" style={{ fontSize: '0.675rem', fontWeight: 600 }}>
              {q.final_score || 95}/100
            </span>
            {isSaved && (
              <span style={{ fontSize: '0.7rem', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                <Check size={10} /> Saved
              </span>
            )}
          </div>
        </div>

        {/* Scenario / Reading Passage Box */}
        {isLinked ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              background: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-light)',
              fontSize: '0.7rem',
              color: 'var(--text-muted)'
            }}
          >
            <BookOpen size={12} color="var(--brand-primary)" />
            <span>References shared reading passage above</span>
          </div>
        ) : (
          q.stimulus_text && q.stimulus_text.trim() && (
            <div
              style={{
                padding: '8px 10px',
                background: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.725rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                maxHeight: '75px',
                overflowY: 'auto'
              }}
            >
              <strong style={{ display: 'block', color: 'var(--text-muted)', marginBottom: '2px', fontSize: '0.675rem' }}>
                {isPassage ? `Reading Passage (${wordCount} words):` : 'Scenario / Vignette:'}
              </strong>
              {q.stimulus_text}
            </div>
          )
        )}

        {/* Visual Stimulus Diagram Thumbnail */}
        {!isLinked && (q.image_svg || q.image_url || q.stage_outcomes?.visual_stimulus?.image_svg || q.stage_outcomes?.visual_stimulus?.image_url || q.stage_outcomes?.passage_visual_stimulus?.image_svg || q.stage_outcomes?.passage_visual_stimulus?.image_url) && (
          <VisualStimulusViewer question={q} compact={true} />
        )}

        {/* Question Stem */}
        <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.45 }}>
          {q.question_stem}
        </div>

        {/* Options with Single Choice vs Multi Choice visual markers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {q.options && q.options.map(opt => {
            const isCorrect = correctKeysList.includes(String(opt.id).toUpperCase());
            return (
              <div
                key={opt.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface-subtle)',
                  border: isCorrect ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid transparent',
                  fontSize: '0.75rem',
                  color: isCorrect ? 'var(--status-success)' : 'var(--text-secondary)',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: isCorrect ? 'var(--status-success)' : 'transparent',
                    border: isCorrect ? '1px solid var(--status-success)' : '1px solid var(--border-medium)',
                    color: isCorrect ? '#ffffff' : 'var(--text-muted)',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    flexShrink: 0
                  }}
                >
                  {isCorrect ? (
                    <Check size={11} strokeWidth={3} />
                  ) : (
                    <span>{opt.id}</span>
                  )}
                </div>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isCorrect ? 600 : 400 }}>
                  {opt.text}
                </span>
                {isCorrect && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--status-success)', flexShrink: 0 }}>
                    Answer
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Expandable Explanation Drawer */}
        <div style={{ marginTop: '2px' }}>
          <button
            type="button"
            onClick={() => onToggleExplanation(q.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.7rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 0'
            }}
          >
            {isExpandedExplanation ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            <span>{isExpandedExplanation ? 'Hide Explanation' : 'View Explanation & Distractors'}</span>
          </button>

          {isExpandedExplanation && (
            <div
              style={{
                marginTop: '6px',
                padding: '8px 10px',
                background: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-light)',
                fontSize: '0.725rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.45,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              {q.explanation && (
                <div>
                  <strong style={{ color: 'var(--text-primary)', display: 'block', fontSize: '0.675rem' }}>Rationale:</strong>
                  {q.explanation}
                </div>
              )}
              {q.distractor_analysis && (
                <div style={{ borderTop: '1px dashed var(--border-light)', paddingTop: '4px' }}>
                  <strong style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.675rem' }}>Distractor Breakdown:</strong>
                  <div style={{ whiteSpace: 'pre-line' }}>{q.distractor_analysis}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Actions Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
            paddingTop: '8px',
            borderTop: '1px solid var(--border-light)'
          }}
        >
          <button
            type="button"
            onClick={() => onSelectDetailedView(idx)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--brand-primary)',
              fontSize: '0.725rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Eye size={12} />
            <span>Detailed View</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {onOpenAudit && (
              <button
                type="button"
                onClick={() => onOpenAudit(q)}
                className="btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                title="View Quality Audit Scorecard"
              >
                <Award size={12} />
                <span>Quality Details</span>
              </button>
            )}

            {!isSaved ? (
              <button
                type="button"
                onClick={() => onApproveSingle(q)}
                disabled={isSaving}
                className="btn-primary"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.7rem',
                  background: 'var(--status-success)',
                  borderColor: 'var(--status-success)'
                }}
                title="Keep this question in the bank"
              >
                <Check size={12} />
                <span>Save to Bank</span>
              </button>
            ) : (
              <span style={{ fontSize: '0.7rem', color: 'var(--status-success)', fontWeight: 600 }}>
                ✓ In Bank
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // State B: Question is currently being generated or reviewed in parallel swarm
  return (
    <StagedSlotSkeleton
      slotNumber={slotNumber}
      qState={qState}
      isLinked={isLinked}
      isMixedBatch={isMixedBatch}
      effectiveTotal={effectiveTotal}
    />
  );
}
