import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Save,
  Trash2,
  BookOpen,
  Edit3,
  CheckCircle2,
  Layers,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import VisualStimulusViewer from '../question/VisualStimulusViewer';
import { formatDifficulty, getDifficultyBadgeClass } from '../../constants/mcat';
import { getEffectiveTrapInfo } from '../../utils';

const SECTION_OPTIONS = [
  { id: 'chem_phys', label: 'Chemical and Physical Foundations (CP)' },
  { id: 'cars', label: 'Critical Analysis and Reasoning Skills (CARS)' },
  { id: 'bio_biochem', label: 'Biological and Biochemical Foundations (BB)' },
  { id: 'psych_soc', label: 'Psychological, Social, and Biological Foundations (PS)' }
];

const SECTION_BADGE_CLASS = {
  chem_phys: 'badge-purple',
  cars: 'badge-cyan',
  bio_biochem: 'badge-emerald',
  psych_soc: 'badge-rose'
};

/**
 * PassageEditorialDesk
 *
 * Dedicated side-by-side MCAT editorial workspace:
 * - Left Pane: Passage typography, metadata, live word counter, and visual stimulus
 * - Right Pane: Linked questions stream with expandable inline editors
 */
export default function PassageEditorialDesk({
  passage,
  questions = [],
  onBack,
  onSavePassage,
  onDeletePassage,
  onUpdateQuestion
}) {
  // Form State
  const [title, setTitle] = useState(passage?.title || '');
  const [section, setSection] = useState(passage?.section || 'cars');
  const [subtopic, setSubtopic] = useState(passage?.subtopic || '');
  const [text, setText] = useState(passage?.text || '');
  const [imageUrl, setImageUrl] = useState(passage?.image_url || '');
  const [imageSvg, setImageSvg] = useState(passage?.image_svg || '');
  const [imageDescription, setImageDescription] = useState(passage?.image_description || '');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [showVisualEditor, setShowVisualEditor] = useState(Boolean(passage?.image_url || passage?.image_svg));
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  // Dynamic Word Count
  const liveWordCount = useMemo(() => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }, [text]);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const payload = {
        ...passage,
        id: passage.id,
        title: title.trim() || `${subtopic || 'MCAT'} Passage`,
        section,
        subtopic: subtopic.trim(),
        text: text.trim(),
        word_count: liveWordCount,
        image_url: imageUrl.trim() || null,
        image_svg: imageSvg.trim() || null,
        image_description: imageDescription.trim() || null
      };
      await onSavePassage(payload);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── Top Bar: Navigation & Action Controls ──────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 18px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Return to Passages table"
          >
            <ArrowLeft size={14} />
            <span>Back to Passages</span>
          </button>

          <div style={{ width: '1px', height: '20px', background: 'var(--border-light)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${SECTION_BADGE_CLASS[section] || 'badge-purple'}`} style={{ fontSize: '0.68rem', fontWeight: 700 }}>
              {section.toUpperCase()}
            </span>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {title || 'Draft Passage'}
            </span>
          </div>

          <span
            style={{
              background: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-full)',
              padding: '2px 8px',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--text-secondary)'
            }}
          >
            {liveWordCount} words
          </span>

          <span
            style={{
              background: 'rgba(51, 90, 207, 0.08)',
              border: '1px solid rgba(51, 90, 207, 0.25)',
              borderRadius: 'var(--radius-full)',
              padding: '2px 8px',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--brand-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Layers size={11} />
            <span>{questions.length} {questions.length === 1 ? 'question' : 'questions'} linked</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onDeletePassage && (
            <button
              type="button"
              onClick={() => onDeletePassage(passage)}
              className="btn-ghost"
              style={{ padding: '6px 10px', fontSize: '0.78rem', color: 'var(--status-danger)', gap: '5px' }}
              title="Delete this passage and unlink its questions"
            >
              <Trash2 size={13} />
              <span>Delete Passage</span>
            </button>
          )}

          <button
            type="button"
            id="btn-save-passage"
            onClick={handleSave}
            disabled={isSaving || !text.trim()}
            className="btn-primary"
            style={{
              padding: '7px 16px',
              fontSize: '0.78rem',
              gap: '6px',
              opacity: isSaving || !text.trim() ? 0.6 : 1
            }}
          >
            <Save size={13} />
            <span>{isSaving ? 'Saving Changes...' : 'Save Passage Changes'}</span>
          </button>
        </div>
      </div>

      {/* ── Side-By-Side Editorial Desk Grid ─────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(420px, 1.15fr) minmax(380px, 0.85fr)',
          gap: '18px',
          alignItems: 'start'
        }}
        className="passage-editorial-grid"
      >
        {/* ── LEFT COLUMN: Passage Editor ───────────────────────────────── */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={16} color="var(--brand-primary)" />
              <h3 style={{ fontSize: '0.94rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Passage Reading Text &amp; Metadata
              </h3>
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Live Word Count: <strong style={{ color: 'var(--text-primary)' }}>{liveWordCount}</strong>
            </div>
          </div>

          {/* Title & Section row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Passage Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cognitive Biases in Diagnostic Medicine"
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                MCAT Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-surface-elevated)',
                  color: 'var(--text-primary)',
                  fontSize: '0.82rem',
                  outline: 'none'
                }}
              >
                {SECTION_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subtopic */}
          <div>
            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Subtopic or Primary Concept
            </label>
            <input
              type="text"
              value={subtopic}
              onChange={(e) => setSubtopic(e.target.value)}
              placeholder="e.g. Heuristics, Enzyme Kinetics, Constitutional Law"
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Passage Textarea */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Passage Content (Rendered in MCAT Newsreader Serif)
              </label>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                Supports standard academic paragraphs
              </span>
            </div>

            <textarea
              id="passage-editor-textarea"
              rows={16}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or write the MCAT reading passage text here..."
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-serif)',
                fontSize: '0.98rem',
                lineHeight: 1.7,
                resize: 'vertical',
                outline: 'none',
                minHeight: '380px'
              }}
            />
          </div>

          {/* ── Visual Stimulus Editor Accordion ─────────────────────────── */}
          <div
            style={{
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden'
            }}
          >
            <button
              type="button"
              onClick={() => setShowVisualEditor(!showVisualEditor)}
              style={{
                width: '100%',
                padding: '10px 14px',
                background: 'var(--bg-surface-subtle)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--text-primary)',
                fontSize: '0.78rem',
                fontWeight: 600
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={14} color="var(--brand-primary)" />
                <span>Visual Stimulus (Scientific Figure / Vector Diagram)</span>
                {Boolean(imageUrl || imageSvg) && (
                  <span className="badge badge-emerald" style={{ fontSize: '0.62rem' }}>Configured</span>
                )}
              </div>
              {showVisualEditor ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showVisualEditor && (
              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-surface)' }}>
                {/* Visual Preview */}
                {(imageUrl || imageSvg) && (
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      Current Figure Preview:
                    </span>
                    <VisualStimulusViewer
                      imageUrl={imageUrl}
                      imageSvg={imageSvg}
                      imageDescription={imageDescription}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Image URL (PNG / JPG / WebP or Base64 data URL)
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... or data:image/png;base64,..."
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-surface-elevated)',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    SVG Code (Scalable Vector Diagram XML)
                  </label>
                  <textarea
                    rows={4}
                    value={imageSvg}
                    onChange={(e) => setImageSvg(e.target.value)}
                    placeholder="<svg ...> ... </svg>"
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-surface-elevated)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Figure Caption / Accessibility Description
                  </label>
                  <input
                    type="text"
                    value={imageDescription}
                    onChange={(e) => setImageDescription(e.target.value)}
                    placeholder="Figure 1: Lineweaver-Burk double reciprocal plot with inhibitor curves."
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-light)',
                      background: 'var(--bg-surface-elevated)',
                      color: 'var(--text-primary)',
                      fontSize: '0.78rem'
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Linked Questions Desk ───────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            position: 'sticky',
            top: '80px'
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="var(--brand-primary)" />
              <h3 style={{ fontSize: '0.94rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Linked Questions ({questions.length})
              </h3>
            </div>

            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Passage Set Questions
            </span>
          </div>

          {/* Question Cards List */}
          {questions.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)'
              }}
            >
              <Layers size={32} color="var(--text-muted)" style={{ marginBottom: '8px' }} />
              <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                No Questions Linked Yet
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '6px 0 0', maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>
                This reading passage currently has no questions linked to it in the Question Bank. You can generate passage-based questions in the Generator Studio.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {questions.map((q, idx) => {
                const isEditingThis = editingQuestionId === q.id;
                const trapInfo = getEffectiveTrapInfo(q);

                return (
                  <div
                    key={q.id}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    {/* Header Strip */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            background: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-light)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '2px 8px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)'
                          }}
                        >
                          Q{idx + 1} of {questions.length}
                        </span>

                        <span className={`badge ${getDifficultyBadgeClass(q.difficulty)}`} style={{ fontSize: '0.64rem' }}>
                          {formatDifficulty(q.difficulty)}
                        </span>

                        {q.final_score && (
                          <span className="badge badge-emerald" style={{ fontSize: '0.64rem' }}>
                            Score: {q.final_score}/100
                          </span>
                        )}

                        {trapInfo?.label && (
                          <span className="badge badge-purple" style={{ fontSize: '0.64rem' }} title={`Primary AAMC Distractor Trap: ${trapInfo.label}`}>
                            {trapInfo.label}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingQuestionId(isEditingThis ? null : q.id)}
                        className="btn-secondary"
                        style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title={isEditingThis ? 'Close editor' : 'Edit question stem, choices, or explanation'}
                      >
                        {isEditingThis ? <X size={12} /> : <Edit3 size={12} color="var(--brand-primary)" />}
                        <span>{isEditingThis ? 'Cancel' : 'Edit Question'}</span>
                      </button>
                    </div>

                    {isEditingThis ? (
                      /* Inline Editor Component */
                      <QuestionInlineEditorWrapper
                        question={q}
                        onSave={(updatedQ) => {
                          if (onUpdateQuestion) onUpdateQuestion(updatedQ);
                          setEditingQuestionId(null);
                        }}
                        onCancel={() => setEditingQuestionId(null)}
                      />
                    ) : (
                      /* Standard Question Card Summary */
                      <>
                        {/* Question Stem */}
                        <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.45 }}>
                          {q.question_stem}
                        </div>

                        {/* Options A-D */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {q.options?.map((opt) => {
                            const isCorrect = String(opt.id).toUpperCase() === String(q.correct_answer_id).toUpperCase() ||
                              (q.correct_answer_ids && q.correct_answer_ids.includes(opt.id));

                            return (
                              <div
                                key={opt.id}
                                style={{
                                  padding: '8px 10px',
                                  borderRadius: 'var(--radius-sm)',
                                  border: isCorrect ? '1px solid var(--status-success)' : '1px solid var(--border-light)',
                                  background: isCorrect ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-surface-elevated)',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '8px',
                                  fontSize: '0.78rem'
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 700,
                                    color: isCorrect ? 'var(--status-success)' : 'var(--text-secondary)',
                                    minWidth: '18px'
                                  }}
                                >
                                  {opt.id}.
                                </span>
                                <span style={{ flex: 1, color: isCorrect ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                  {opt.text}
                                </span>
                                {isCorrect && <CheckCircle2 size={13} color="var(--status-success)" style={{ marginTop: '2px' }} />}
                              </div>
                            );
                          })}
                        </div>

                        {/* Pedagogical Explanation Preview */}
                        {q.explanation && (
                          <div
                            style={{
                              padding: '10px 12px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-surface-subtle)',
                              border: '1px solid var(--border-light)',
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.45
                            }}
                          >
                            <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '3px' }}>
                              Rationale &amp; Explanation:
                            </strong>
                            <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{q.explanation}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * QuestionInlineEditorWrapper
 * Compact form for editing question details directly from the Passage Desk.
 */
function QuestionInlineEditorWrapper({ question, onSave, onCancel }) {
  const [stem, setStem] = useState(question.question_stem || '');
  const [options, setOptions] = useState(question.options || []);
  const [correctId, setCorrectId] = useState(question.correct_answer_id || 'A');
  const [explanation, setExplanation] = useState(question.explanation || '');

  const handleOptionChange = (idx, newText) => {
    setOptions(prev => prev.map((opt, i) => i === idx ? { ...opt, text: newText } : opt));
  };

  const handleSaveClick = () => {
    onSave({
      ...question,
      question_stem: stem,
      options,
      correct_answer_id: correctId,
      explanation
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '6px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '3px', fontWeight: 600 }}>
          Question Stem
        </label>
        <textarea
          rows={3}
          value={stem}
          onChange={(e) => setStem(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            fontSize: '0.8rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)',
            background: 'var(--bg-surface-elevated)',
            color: 'var(--text-primary)'
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Options &amp; Correct Answer Key
        </label>
        {options.map((opt, idx) => (
          <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setCorrectId(opt.id)}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: 'var(--radius-sm)',
                border: correctId === opt.id ? '2px solid var(--status-success)' : '1px solid var(--border-light)',
                background: correctId === opt.id ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface-elevated)',
                color: correctId === opt.id ? 'var(--status-success)' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer'
              }}
              title={`Mark Option ${opt.id} as Correct Answer`}
            >
              {opt.id}
            </button>
            <input
              type="text"
              value={opt.text}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              style={{
                flex: 1,
                padding: '5px 8px',
                fontSize: '0.78rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                background: 'var(--bg-surface-elevated)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        ))}
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '3px', fontWeight: 600 }}>
          Explanation &amp; Distractor Traps
        </label>
        <textarea
          rows={3}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          style={{
            width: '100%',
            padding: '6px 8px',
            fontSize: '0.78rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-light)',
            background: 'var(--bg-surface-elevated)',
            color: 'var(--text-primary)'
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
        <button
          type="button"
          onClick={onCancel}
          className="btn-ghost"
          style={{ padding: '4px 8px', fontSize: '0.72rem' }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSaveClick}
          className="btn-primary"
          style={{ padding: '4px 10px', fontSize: '0.72rem' }}
        >
          Save Question Updates
        </button>
      </div>
    </div>
  );
}
