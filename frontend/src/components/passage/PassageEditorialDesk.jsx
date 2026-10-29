import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  Trash2,
  BookOpen,
  Layers,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getSectionBadgeClass } from '../../constants/mcat';
import PassageVisualStimulusEditor from './PassageVisualStimulusEditor';
import PassageLinkedQuestionCard from './PassageLinkedQuestionCard';

const EMPTY_ARRAY = Object.freeze([]);

/**
 * PassageEditorialDesk
 *
 * Dedicated side-by-side MCAT editorial workspace:
 * - Left Pane: Passage typography, live word counter, and visual stimulus figure showcase (with Discard option)
 * - Right Pane: Interactive single-question carousel (<- Question 1 of N ->) with quick-jump pills and keyboard shortcuts
 */
export default function PassageEditorialDesk({
  passage,
  questions = EMPTY_ARRAY,
  onBack,
  onSavePassage,
  onDeletePassage,
  onUpdateQuestion
}) {
  // Immutable Passage Metadata
  const title = passage?.title || '';
  const section = passage?.section || 'cars';
  const subtopic = passage?.subtopic || '';

  // Editable Form State
  const [text, setText] = useState(passage?.text || '');
  const [imageUrl, setImageUrl] = useState(passage?.image_url || '');
  const [imageSvg, setImageSvg] = useState(passage?.image_svg || '');
  const [imageDescription, setImageDescription] = useState(passage?.image_description || '');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  // Dynamic Word Count
  const liveWordCount = useMemo(() => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }, [text]);

  // Safe question index calculation
  const totalQuestions = questions.length;
  const safeIndex = totalQuestions > 0 ? Math.min(Math.max(0, activeQuestionIndex), totalQuestions - 1) : 0;
  const activeQuestion = totalQuestions > 0 ? questions[safeIndex] : null;

  // Question navigation handlers
  const goToPrev = () => {
    if (totalQuestions <= 1) return;
    setActiveQuestionIndex((prev) => (prev > 0 ? prev - 1 : totalQuestions - 1));
    setEditingQuestionId(null);
  };

  const goToNext = () => {
    if (totalQuestions <= 1) return;
    setActiveQuestionIndex((prev) => (prev < totalQuestions - 1 ? prev + 1 : 0));
    setEditingQuestionId(null);
  };

  // Keyboard navigation shortcuts (ArrowLeft / ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (totalQuestions <= 1) return;
      const activeEl = document.activeElement;
      const isInput =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable);
      if (isInput) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setActiveQuestionIndex((prev) => (prev > 0 ? prev - 1 : totalQuestions - 1));
        setEditingQuestionId(null);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setActiveQuestionIndex((prev) => (prev < totalQuestions - 1 ? prev + 1 : 0));
        setEditingQuestionId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalQuestions]);

  const handleDiscardImage = () => {
    setImageUrl('');
    setImageSvg('');
    setImageDescription('');
  };

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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span className={`badge ${getSectionBadgeClass(section)}`} style={{ fontSize: '0.68rem', fontWeight: 700 }}>
              {section.toUpperCase()}
            </span>
            {subtopic && (
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
                {subtopic}
              </span>
            )}
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {title || `${subtopic || 'MCAT'} Passage`}
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
            <span>{totalQuestions} {totalQuestions === 1 ? 'question' : 'questions'} linked</span>
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
                Passage Content &amp; Reading Text
              </h3>
            </div>

            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Live Word Count: <strong style={{ color: 'var(--text-primary)' }}>{liveWordCount}</strong>
            </div>
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

          {/* ── Visual Stimulus Showcase & Discard Option ─────────────────── */}
          <PassageVisualStimulusEditor
            imageUrl={imageUrl}
            imageSvg={imageSvg}
            imageDescription={imageDescription}
            onDescriptionChange={setImageDescription}
            onDiscardImage={handleDiscardImage}
          />
        </div>

        {/* ── RIGHT COLUMN: Linked Questions Carousel ───────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            position: 'sticky',
            top: '80px'
          }}
        >
          {/* Header with Stepper Carousel */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={16} color="var(--brand-primary)" />
              <h3 style={{ fontSize: '0.94rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Linked Questions ({totalQuestions})
              </h3>
            </div>

            {totalQuestions > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={goToPrev}
                  disabled={totalQuestions <= 1}
                  className="btn-secondary"
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    opacity: totalQuestions <= 1 ? 0.5 : 1
                  }}
                  title="Previous Question (Left Arrow ←)"
                >
                  <ChevronLeft size={14} />
                  <span>Prev</span>
                </button>

                <span
                  style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    userSelect: 'none'
                  }}
                >
                  Question {safeIndex + 1} of {totalQuestions}
                </span>

                <button
                  type="button"
                  onClick={goToNext}
                  disabled={totalQuestions <= 1}
                  className="btn-secondary"
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                    opacity: totalQuestions <= 1 ? 0.5 : 1
                  }}
                  title="Next Question (Right Arrow →)"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Active Question Card / Empty State */}
          {totalQuestions === 0 ? (
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
            <PassageLinkedQuestionCard
              key={activeQuestion.id}
              question={activeQuestion}
              index={safeIndex}
              totalQuestions={totalQuestions}
              isEditing={editingQuestionId === activeQuestion.id}
              onToggleEdit={() =>
                setEditingQuestionId(editingQuestionId === activeQuestion.id ? null : activeQuestion.id)
              }
              onSaveQuestion={(updatedQ) => {
                if (onUpdateQuestion) onUpdateQuestion(updatedQ);
                setEditingQuestionId(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
