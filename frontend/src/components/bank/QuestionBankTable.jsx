import React from 'react';
import {
  Award,
  Copy,
  Check,
  Eye,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Trash2,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  Target
} from 'lucide-react';
import VisualStimulusViewer from '../question/VisualStimulusViewer';
import SharedPassageCard from '../question/SharedPassageCard';
import MentorExplanationView from '../question/MentorExplanationView';
import { getEffectiveTrapInfo } from '../../utils';

/**
 * QuestionBankTable
 *
 * Renders the list of question cards (each with expand/collapse, selection
 * checkbox, inline options, explanation, and action buttons).
 */
export default function QuestionBankTable({
  paginatedQuestions,
  selectedIds,
  expandedId,
  setExpandedId,
  copiedId,
  onToggleSelect,
  onCopy,
  onDelete,
  onSelectQuestion,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {paginatedQuestions.map((q) => {
        const isSelected = selectedIds.includes(q.id);
        const isExpanded = expandedId === q.id;

        return (
          <div
            key={q.id}
            style={{
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
              border: isSelected ? '1px solid var(--border-brand)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              transition: 'background var(--transition-fast), border-color var(--transition-fast)'
            }}
          >
            {/* Main Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              {/* Checkbox & Details */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                <button
                  onClick={(e) => onToggleSelect(q.id, e)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    color: isSelected ? 'var(--brand-primary)' : 'var(--text-muted)',
                    marginTop: '2px'
                  }}
                  title="Select question"
                >
                  {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Metadata Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.725rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {q.section_label || q.section}
                    </span>

                    {q.subtopic && (
                      <>
                        <span style={{ color: 'var(--border-medium)' }}>•</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{q.subtopic}</span>
                      </>
                    )}

                    <span style={{ color: 'var(--border-medium)' }}>•</span>

                    <span
                      className={`badge ${(q.difficulty || '').toLowerCase() === 'easy' ? 'badge-emerald' : (q.difficulty || '').toLowerCase() === 'hard' ? 'badge-rose' : 'badge-amber'}`}
                      style={{ textTransform: 'capitalize', fontSize: '0.65rem' }}
                    >
                      {q.difficulty}
                    </span>

                    <span className="badge badge-emerald" style={{ fontSize: '0.65rem', fontWeight: 600 }}>
                      <Award size={10} /> {q.final_score}/100
                    </span>

                    {q.mcat_scaled_score && (
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          background: 'rgba(2, 132, 199, 0.12)',
                          color: '#0284c7',
                          border: '1px solid rgba(2, 132, 199, 0.28)'
                        }}
                      >
                        MCAT {q.mcat_scaled_score}
                      </span>
                    )}

                    {q.aamc_skill && (
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.625rem',
                          fontWeight: 600,
                          background: 'rgba(124, 58, 237, 0.1)',
                          color: '#8b5cf6',
                          border: '1px solid rgba(124, 58, 237, 0.25)'
                        }}
                      >
                        {q.aamc_skill.replace(/_/g, ' ')}
                      </span>
                    )}

                    {(q.image_svg || q.image_url || q.stage_outcomes?.visual_stimulus?.image_svg || q.stage_outcomes?.visual_stimulus?.image_url || q.stage_outcomes?.passage_visual_stimulus?.image_svg) && (
                      <span className="badge badge-purple" style={{ fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <ImageIcon size={10} /> {q.stimulus_text ? 'Passage Diagram' : 'Diagram'}
                      </span>
                    )}

                    <span className="badge badge-emerald" style={{ fontSize: '0.625rem', padding: '1px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <CheckCircle2 size={10} /> Approved
                    </span>
                    {q.passage_id ? (
                      <span className="badge badge-cyan" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                        Passage Set
                      </span>
                    ) : (q.passage_required === 'Yes' || (q.stimulus_text && q.stimulus_text.split(/\s+/).length >= 180)) ? (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>• Passage</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>• Direct</span>
                    )}

                    {(() => {
                      const trapInfo = getEffectiveTrapInfo(q);
                      if (!trapInfo?.label) return null;
                      return (
                        <span
                          className="badge badge-purple"
                          style={{ fontSize: '0.62rem', padding: '1px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          title={`Primary Cognitive Trap: ${trapInfo.label}`}
                        >
                          <AlertTriangle size={10} /> Trap: {trapInfo.label}
                        </span>
                      );
                    })()}

                    {q.likely_mistake_pattern && (
                      <span
                        className="badge"
                        style={{
                          fontSize: '0.62rem',
                          padding: '1px 6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: 'var(--status-warning, #d97706)',
                          border: '1px solid rgba(245, 158, 11, 0.3)'
                        }}
                        title={`Targeted Student Misconception: ${q.likely_mistake_pattern}`}
                      >
                        <Target size={10} /> Misconception: {q.likely_mistake_pattern}
                      </span>
                    )}
                  </div>

                  {/* Question Stem */}
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                    {q.question_stem}
                  </div>

                  {/* Stimulus Snippet */}
                  {q.stimulus_text && q.stimulus_text.trim() && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '780px' }}>
                      {q.stimulus_text}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => onSelectQuestion(q)}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', whiteSpace: 'nowrap', gap: '6px' }}
                  title="Open in Question Generator"
                >
                  <Eye size={13} /> Open Question
                </button>

                <button
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  className="btn-secondary"
                  style={{ padding: '6px' }}
                  title={isExpanded ? 'Collapse preview' : 'Expand preview inline'}
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                <button
                  onClick={(e) => onCopy(q, e)}
                  className="btn-secondary"
                  style={{ padding: '6px' }}
                  title="Copy formatted question text"
                >
                  {copiedId === q.id ? <Check size={14} color="var(--status-success-text)" /> : <Copy size={14} />}
                </button>

                <button
                  onClick={(e) => onDelete(q.id, e)}
                  className="btn-danger"
                  style={{ padding: '6px' }}
                  title="Delete question"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Inline Expansion Drawer */}
            {isExpanded && (
              <div
                style={{
                  paddingTop: '14px',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {q.stimulus_text && (
                  <SharedPassageCard
                    title={q.passage_id ? 'Shared Reading Passage' : 'Stimulus Vignette'}
                    passageText={q.stimulus_text}
                    questionCount={1}
                    diagramQuestion={q}
                    collapsible={false}
                    style={{ padding: '14px 18px', borderLeft: '3px solid var(--brand-primary)' }}
                  />
                )}

                {!q.stimulus_text && <VisualStimulusViewer question={q} />}

                {/* Options Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {(() => {
                    const correctList = Array.isArray(q.correct_answer_ids) && q.correct_answer_ids.length > 0
                      ? q.correct_answer_ids.map(k => String(k).trim().toUpperCase())
                      : (q.correct_answer_id || '').split(',').map(k => k.trim().toUpperCase()).filter(Boolean);

                    return q.options?.map(opt => {
                      const isCorrect = correctList.includes(opt.id.toUpperCase());
                      return (
                        <div
                          key={opt.id}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            background: isCorrect ? 'var(--status-success-bg)' : 'var(--bg-surface-elevated)',
                            border: isCorrect ? '1px solid var(--status-success-border)' : '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.8rem'
                          }}
                        >
                          <span style={{ fontWeight: 700, color: isCorrect ? 'var(--status-success-text)' : 'var(--text-muted)' }}>
                            {opt.id}:
                          </span>
                          <span style={{ color: isCorrect ? 'var(--status-success-text)' : 'var(--text-primary)', fontWeight: isCorrect ? 600 : 400 }}>
                            {opt.text}
                          </span>
                          {isCorrect && (
                            <span className="badge badge-emerald" style={{ marginLeft: 'auto', fontSize: '0.62rem' }}>
                              Key
                            </span>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div
                    style={{
                      padding: '14px 16px',
                      background: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <MentorExplanationView
                      explanation={q.explanation}
                      isCompact={true}
                      options={q.options}
                      correctAnswerId={q.correct_answer_id}
                      primaryTrap={q.primary_trap}
                      likelyMistakePattern={q.likely_mistake_pattern}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
