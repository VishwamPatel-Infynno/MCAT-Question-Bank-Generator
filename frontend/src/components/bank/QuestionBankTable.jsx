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
  MinusSquare,
  Trash2,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle2,
  Target,
  FileText
} from 'lucide-react';
import VisualStimulusViewer from '../question/VisualStimulusViewer';
import SharedPassageCard from '../question/SharedPassageCard';
import MentorExplanationView from '../question/MentorExplanationView';
import { getEffectiveTrapInfo } from '../../utils';
import { formatDifficulty, getDifficultyBadgeClass } from '../../constants/mcat';

const SECTION_BADGE_CLASS = {
  chem_phys: 'badge-purple',
  cars: 'badge-cyan',
  bio_biochem: 'badge-emerald',
  psych_soc: 'badge-rose'
};

const SECTION_SHORT_LABEL = {
  chem_phys: 'Chem / Phys',
  cars: 'CARS',
  bio_biochem: 'Bio / Biochem',
  psych_soc: 'Psych / Soc'
};

/**
 * QuestionBankTable
 *
 * Renders the question repository in either:
 * 1. High-density accessible Table Grid (`viewMode === 'grid'`) with sticky headers,
 *    column alignment, quick action icons, and inline expansion drawers.
 * 2. Rich Editorial Cards (`viewMode === 'cards'`) with large-format cards.
 */
export default function QuestionBankTable({
  viewMode = 'grid',
  paginatedQuestions = [],
  selectedIds = [],
  expandedId,
  setExpandedId,
  copiedId,
  onToggleSelect,
  onSelectAll,
  onCopy,
  onDelete,
  onSelectQuestion,
}) {
  const allCurrentSelected =
    paginatedQuestions.length > 0 &&
    paginatedQuestions.every((q) => selectedIds.includes(q.id));
  const someCurrentSelected =
    paginatedQuestions.some((q) => selectedIds.includes(q.id)) && !allCurrentSelected;

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. DATA GRID / TABLE VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  if (viewMode === 'grid') {
    return (
      <div className="bank-grid-container">
        <table className="bank-grid-table" aria-label="MCAT Question Bank Table">
          <thead>
            <tr>
              {/* Select All Column */}
              <th style={{ width: '40px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={onSelectAll}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '2px',
                    color: allCurrentSelected || someCurrentSelected ? 'var(--brand-primary)' : 'var(--text-muted)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title={allCurrentSelected ? 'Deselect all visible' : 'Select all visible'}
                  aria-label={allCurrentSelected ? 'Deselect all visible' : 'Select all visible'}
                >
                  {allCurrentSelected ? (
                    <CheckSquare size={16} />
                  ) : someCurrentSelected ? (
                    <MinusSquare size={16} />
                  ) : (
                    <Square size={16} />
                  )}
                </button>
              </th>

              {/* Section & Type */}
              <th style={{ minWidth: '130px' }}>Section &amp; Type</th>

              {/* Topic & Skill */}
              <th style={{ minWidth: '170px' }}>Topic / Skill</th>

              {/* Question Stem Preview */}
              <th style={{ minWidth: '280px' }}>Question Stem &amp; Stimulus</th>

              {/* Difficulty & Misconception */}
              <th style={{ minWidth: '130px' }}>Difficulty</th>

              {/* Trap Analysis */}
              <th style={{ minWidth: '130px' }}>Primary Trap</th>

              {/* Score Metric */}
              <th style={{ minWidth: '110px' }}>Quality Score</th>

              {/* Status */}
              <th style={{ minWidth: '100px' }}>Status</th>

              {/* Row Actions */}
              <th style={{ minWidth: '140px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedQuestions.map((q) => {
              const isSelected = selectedIds.includes(q.id);
              const isExpanded = expandedId === q.id;
              const trapInfo = getEffectiveTrapInfo(q);
              const badgeClass = SECTION_BADGE_CLASS[q.section] || 'badge-purple';
              const sectionLabel = SECTION_SHORT_LABEL[q.section] || q.section_label || q.section;
              const hasDiagram = Boolean(
                q.image_svg ||
                q.image_url ||
                q.stage_outcomes?.visual_stimulus?.image_svg ||
                q.stage_outcomes?.visual_stimulus?.image_url ||
                q.stage_outcomes?.passage_visual_stimulus?.image_svg
              );

              return (
                <React.Fragment key={q.id}>
                  <tr className={`grid-row ${isSelected ? 'selected' : ''}`}>
                    {/* Checkbox */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={(e) => onToggleSelect(q.id, e)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '2px',
                          color: isSelected ? 'var(--brand-primary)' : 'var(--text-muted)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title={isSelected ? 'Deselect question' : 'Select question'}
                        aria-label={isSelected ? 'Deselect question' : 'Select question'}
                      >
                        {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      </button>
                    </td>

                    {/* Section & Type */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <span className={`badge ${badgeClass}`} style={{ fontSize: '0.66rem', fontWeight: 700 }}>
                          {sectionLabel}
                        </span>
                        {q.passage_id ? (
                          <span
                            className="badge badge-cyan"
                            style={{ fontSize: '0.62rem', padding: '1px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            title="Linked to shared passage"
                          >
                            <FileText size={9} /> Passage Set
                          </span>
                        ) : q.passage_required === 'Yes' || (q.stimulus_text && q.stimulus_text.split(/\s+/).length >= 180) ? (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Passage</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Discrete</span>
                        )}
                      </div>
                    </td>

                    {/* Topic & Skill */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <span
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            fontSize: '0.78rem',
                            lineHeight: 1.3
                          }}
                        >
                          {q.subtopic || 'General Foundational Concept'}
                        </span>
                        {q.aamc_skill && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              color: 'var(--text-muted)',
                              lineHeight: 1.2
                            }}
                          >
                            {q.aamc_skill.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Question Stem Preview & Stimulus */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '420px' }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            fontSize: '0.8rem',
                            lineHeight: 1.35,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                          title={q.question_stem}
                        >
                          {q.question_stem}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {hasDiagram && (
                            <span
                              className="badge badge-purple"
                              style={{ fontSize: '0.62rem', padding: '1px 5px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            >
                              <ImageIcon size={9} /> Diagram
                            </span>
                          )}
                          {q.stimulus_text && q.stimulus_text.trim() && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-muted)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: '300px'
                              }}
                              title={q.stimulus_text}
                            >
                              {q.stimulus_text.slice(0, 90)}...
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Difficulty & Misconception */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <span
                          className={`badge ${getDifficultyBadgeClass(q.difficulty)}`}
                          style={{ textTransform: 'capitalize', fontSize: '0.65rem' }}
                        >
                          {formatDifficulty(q.difficulty)}
                        </span>
                        {q.likely_mistake_pattern && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              color: 'var(--status-warning, #d97706)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              maxWidth: '120px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                            title={`Targeted Student Misconception: ${q.likely_mistake_pattern}`}
                          >
                            <Target size={9} /> {q.likely_mistake_pattern}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Primary Trap */}
                    <td>
                      {trapInfo?.label ? (
                        <span
                          className="badge badge-purple"
                          style={{ fontSize: '0.62rem', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          title={`Primary Cognitive Trap: ${trapInfo.label}`}
                        >
                          <AlertTriangle size={9} /> {trapInfo.label}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>-</span>
                      )}
                    </td>

                    {/* Quality Score */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                        <span className="badge badge-emerald" style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                          <Award size={10} /> {q.final_score || 95}/100
                        </span>
                        {q.mcat_scaled_score && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              fontWeight: 700,
                              color: '#0284c7'
                            }}
                          >
                            MCAT {q.mcat_scaled_score}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <span className="badge badge-emerald" style={{ fontSize: '0.625rem', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={10} /> Approved
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => onSelectQuestion(q)}
                          className="btn-secondary"
                          style={{ padding: '5px 8px', fontSize: '0.74rem', gap: '4px' }}
                          title="Open in Question Generator"
                        >
                          <Eye size={12} /> Open
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : q.id)}
                          className="btn-secondary"
                          style={{ padding: '5px' }}
                          title={isExpanded ? 'Collapse preview' : 'Expand preview inline'}
                        >
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => onCopy(q, e)}
                          className="btn-secondary"
                          style={{ padding: '5px' }}
                          title="Copy formatted question text"
                        >
                          {copiedId === q.id ? <Check size={13} color="var(--status-success-text)" /> : <Copy size={13} />}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => onDelete(q.id, e)}
                          className="btn-danger"
                          style={{ padding: '5px' }}
                          title="Delete question"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Row Drawer */}
                  {isExpanded && (
                    <tr className="expanded-drawer-row">
                      <td colSpan={9}>
                        <div className="grid-drawer-content">
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
                              const correctList =
                                Array.isArray(q.correct_answer_ids) && q.correct_answer_ids.length > 0
                                  ? q.correct_answer_ids.map((k) => String(k).trim().toUpperCase())
                                  : (q.correct_answer_id || '')
                                      .split(',')
                                      .map((k) => k.trim().toUpperCase())
                                      .filter(Boolean);

                              return q.options?.map((opt) => {
                                const isCorrect = correctList.includes(opt.id.toUpperCase());
                                return (
                                  <div
                                    key={opt.id}
                                    style={{
                                      padding: '8px 12px',
                                      borderRadius: 'var(--radius-sm)',
                                      background: isCorrect ? 'var(--status-success-bg)' : 'var(--bg-surface-elevated)',
                                      border: isCorrect
                                        ? '1px solid var(--status-success-border)'
                                        : '1px solid var(--border-subtle)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      fontSize: '0.8rem'
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontWeight: 700,
                                        color: isCorrect ? 'var(--status-success-text)' : 'var(--text-muted)'
                                      }}
                                    >
                                      {opt.id}:
                                    </span>
                                    <span
                                      style={{
                                        color: isCorrect ? 'var(--status-success-text)' : 'var(--text-primary)',
                                        fontWeight: isCorrect ? 600 : 400
                                      }}
                                    >
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

                          {/* Mentor Explanation */}
                          {q.explanation && (
                            <div
                              style={{
                                padding: '14px 16px',
                                background: 'var(--bg-surface-elevated)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-subtle)'
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
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. EDITORIAL CARDS VIEW
  // ─────────────────────────────────────────────────────────────────────────────
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
                  type="button"
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
                  aria-label="Select question"
                >
                  {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                </button>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Metadata Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '0.725rem' }}>
                    <span className={`badge ${SECTION_BADGE_CLASS[q.section] || 'badge-purple'}`} style={{ fontSize: '0.66rem', fontWeight: 700 }}>
                      {SECTION_SHORT_LABEL[q.section] || q.section_label || q.section}
                    </span>

                    {q.subtopic && (
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{q.subtopic}</span>
                    )}

                    <span
                      className={`badge ${getDifficultyBadgeClass(q.difficulty)}`}
                      style={{ textTransform: 'capitalize', fontSize: '0.65rem' }}
                    >
                      {formatDifficulty(q.difficulty)}
                    </span>

                    <span className="badge badge-emerald" style={{ fontSize: '0.65rem', fontWeight: 600 }}>
                      <Award size={10} /> {q.final_score || 95}/100
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

                    {q.passage_id ? (
                      <span className="badge badge-cyan" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                        Passage Set
                      </span>
                    ) : (q.passage_required === 'Yes' || (q.stimulus_text && q.stimulus_text.split(/\s+/).length >= 180)) ? (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Passage</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>Discrete</span>
                    )}

                    {(q.image_svg || q.image_url || q.stage_outcomes?.visual_stimulus?.image_svg || q.stage_outcomes?.visual_stimulus?.image_url || q.stage_outcomes?.passage_visual_stimulus?.image_svg) && (
                      <span className="badge badge-purple" style={{ fontSize: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <ImageIcon size={10} /> Diagram
                      </span>
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
                          <AlertTriangle size={9} /> {trapInfo.label}
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
                        <Target size={9} /> {q.likely_mistake_pattern}
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
                  type="button"
                  onClick={() => onSelectQuestion(q)}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.78rem', whiteSpace: 'nowrap', gap: '6px' }}
                  title="Open in Question Generator"
                >
                  <Eye size={13} /> Open Question
                </button>

                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  className="btn-secondary"
                  style={{ padding: '6px' }}
                  title={isExpanded ? 'Collapse preview' : 'Expand preview inline'}
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                <button
                  type="button"
                  onClick={(e) => onCopy(q, e)}
                  className="btn-secondary"
                  style={{ padding: '6px' }}
                  title="Copy formatted question text"
                >
                  {copiedId === q.id ? <Check size={14} color="var(--status-success-text)" /> : <Copy size={14} />}
                </button>

                <button
                  type="button"
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
