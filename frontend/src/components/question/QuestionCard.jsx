import React, { useState, useMemo } from 'react';
import { 
  CheckCircle, 
  Award, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Trash2,
  Edit3,
  FileText,
  BarChart3,
  Code2,
  ShieldCheck,
  Scale,
  Image as ImageIcon
} from 'lucide-react';
import StageJsonInspector from '../staged/StageJsonInspector';
import VisualStimulusViewer from './VisualStimulusViewer';
import MentorExplanationView from './MentorExplanationView';
import QuestionScorecardTab from './QuestionScorecardTab';
import QuestionInlineEditor from './QuestionInlineEditor';
import { getEffectiveTrapInfo, calculateOptionSymmetry } from '../../utils';
import { formatDifficulty, getDifficultyBadgeClass } from '../../constants/mcat';

export default function QuestionCard({ 
  question, 
  isSaved = false, 
  onApprove, 
  onDiscard, 
  onOpenAudit, 
  onNextQuestion,
  onUpdateQuestion 
}) {
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'scorecard' | 'telemetry'
  const [showExplanation, setShowExplanation] = useState(true);
  const [isApproving, setIsApproving] = useState(false);

  // Quick Inline Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editedStem, setEditedStem] = useState(question?.question_stem || '');
  const [editedStimulus, setEditedStimulus] = useState(question?.stimulus_text || '');
  const [editedOptions, setEditedOptions] = useState(question?.options || []);
  const [editedExplanation, setEditedExplanation] = useState(question?.explanation || '');
  const [editedImageDescription, setEditedImageDescription] = useState(question?.image_description || '');
  const [showStimulusField, setShowStimulusField] = useState(Boolean(question?.stimulus_text && question.stimulus_text.trim().length > 0));

  const effectiveTrapInfo = getEffectiveTrapInfo(question);

  const optionSymmetry = useMemo(() => {
    if (!question) return null;
    if (question.option_symmetry && Object.keys(question.option_symmetry).length > 0) {
      return question.option_symmetry;
    }
    if (question.stage_outcomes?.option_symmetry) {
      return question.stage_outcomes.option_symmetry;
    }
    const currentOptions = isEditing ? editedOptions : (question.options || []);
    return calculateOptionSymmetry(currentOptions);
  }, [question, isEditing, editedOptions]);

  const hasStimulus = Boolean(
    (question?.stimulus_text && question.stimulus_text.trim()) ||
    (isEditing && (showStimulusField || (editedStimulus && editedStimulus.trim())))
  );

  const hasImage = Boolean(
    question?.image_svg ||
    question?.image_url ||
    question?.stage_outcomes?.visual_stimulus?.image_svg ||
    question?.stage_outcomes?.visual_stimulus?.image_url ||
    question?.stage_outcomes?.passage_visual_stimulus?.image_svg ||
    question?.stage_outcomes?.passage_visual_stimulus?.image_url
  );

  if (!question) return null;

  const handleApproveClick = async () => {
    if (!onApprove || isApproving) return;
    setIsApproving(true);
    try {
      await onApprove(question);
    } finally {
      setIsApproving(false);
    }
  };

  const handleSaveEdit = () => {
    const updated = {
      ...question,
      question_stem: editedStem,
      stimulus_text: editedStimulus,
      options: editedOptions,
      explanation: editedExplanation,
      image_description: editedImageDescription
    };
    if (onUpdateQuestion) onUpdateQuestion(updated);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedStem(question.question_stem);
    setEditedStimulus(question.stimulus_text || '');
    setEditedOptions(question.options || []);
    setEditedExplanation(question.explanation || '');
    setEditedImageDescription(question.image_description || '');
    setShowStimulusField(Boolean(question.stimulus_text && question.stimulus_text.trim().length > 0));
    setIsEditing(false);
  };

  const review = question.review_rubric;
  const pillars = [
    { label: 'AAMC MCAT Style & Scientific Tone', score: review?.authenticity_score ?? 24, max: 25, color: 'var(--brand-primary)' },
    { label: 'Clarity & Logic', score: review?.clarity_score ?? 24, max: 25, color: 'var(--brand-indigo)' },
    { label: 'Wrong Answer Quality', score: review?.distractor_score ?? 23, max: 25, color: 'var(--status-warning)' },
    { label: 'Explanation & Key Accuracy', score: review?.explanation_score ?? 24, max: 25, color: 'var(--status-success)' },
  ];

  const diffBadgeClass = getDifficultyBadgeClass(question.difficulty);
  const diffLabel = formatDifficulty(question.difficulty);

  const correctKeysList = Array.isArray(question.correct_answer_ids) && question.correct_answer_ids.length > 0
    ? question.correct_answer_ids.map(k => String(k).trim().toUpperCase())
    : (question.correct_answer_id || '').split(',').map(k => k.trim().toUpperCase()).filter(Boolean);

  return (
    <div
      className="glass-panel"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        position: 'relative'
      }}
    >
      {/* Top Header Metadata Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--border-light)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {isSaved ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.725rem', fontWeight: 600, color: 'var(--status-success)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-success)' }} />
              Saved
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.725rem', fontWeight: 600, color: 'var(--status-warning)' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-warning)' }} />
              Ready
            </span>
          )}

          <span style={{ color: 'var(--border-medium)' }}>|</span>

          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {question.section_label || question.section}
          </span>

          <span className={`badge ${diffBadgeClass}`} style={{ fontSize: '0.65rem', textTransform: 'capitalize' }}>
            {diffLabel}
          </span>

          {hasImage && (
            <span className="badge badge-purple" style={{ fontSize: '0.675rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ImageIcon size={11} /> Diagram
            </span>
          )}

          <span className="badge badge-emerald" style={{ fontSize: '0.675rem', fontWeight: 600 }}>
            <Award size={11} /> {question.final_score}/100
          </span>
        </div>

        {/* Top Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onOpenAudit && (
            <button
              onClick={() => onOpenAudit(question)}
              className="btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.75rem' }}
              title="Open quality breakdown modal"
            >
              <ShieldCheck size={12} color="var(--brand-primary)" />
              <span>Quality Review</span>
            </button>
          )}

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-secondary"
            style={{ padding: '5px 10px', fontSize: '0.75rem' }}
            title="Edit question text (Press E)"
          >
            <Edit3 size={12} />
            <span>{isEditing ? 'Cancel' : 'Quick Edit'}</span>
            <span className="kbd-hint" style={{ fontSize: '0.6rem' }}>E</span>
          </button>
        </div>
      </div>

      {/* Desk Tab Navigation */}
      <div className="pill-track">
        {[
          { id: 'preview', label: 'Question & Options', icon: FileText },
          { id: 'scorecard', label: 'Quality & Score Review', icon: BarChart3 },
          { id: 'telemetry', label: 'Technical Data', icon: Code2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pill-track-btn ${isSel ? 'active' : ''}`}
            >
              <Icon size={12} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- TAB 1: CANDIDATE PREVIEW --- */}
      {activeTab === 'preview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Edit Mode Alert */}
          {isEditing && (
            <QuestionInlineEditor
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
            />
          )}

          {/* Clinical Vignette (Stimulus) */}
          {((question.stimulus_text && question.stimulus_text.trim()) || (isEditing && (showStimulusField || (editedStimulus && editedStimulus.trim())))) ? (
            <div
              className="vignette-editorial"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                border: '1px solid var(--border-light)',
                borderLeft: '3px solid var(--brand-primary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-sans)' }}>
                  Scenario / Reading Passage
                </span>
                <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                  ~{isEditing ? (editedStimulus ? editedStimulus.split(/\s+/).filter(Boolean).length : 0) : (question.stimulus_text ? question.stimulus_text.split(/\s+/).filter(Boolean).length : 0)} words
                </span>
              </div>

              {isEditing ? (
                <textarea
                  value={editedStimulus}
                  onChange={(e) => setEditedStimulus(e.target.value)}
                  rows={6}
                  placeholder="Enter optional reading passage or context..."
                  style={{ width: '100%', fontSize: '0.95rem', fontFamily: 'var(--font-serif)', lineHeight: 1.65 }}
                />
              ) : (
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '0.975rem',
                    lineHeight: '1.72',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {question.stimulus_text}
                </div>
              )}

              {hasImage && (
                <div style={{ marginTop: '10px', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
                  <VisualStimulusViewer
                    question={question}
                    isEditing={isEditing}
                    editedDescription={editedImageDescription}
                    onDescriptionChange={setEditedImageDescription}
                  />
                </div>
              )}
            </div>
          ) : isEditing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setShowStimulusField(true)}
                className="btn-secondary"
                style={{ fontSize: '0.75rem', padding: '4px 10px', color: 'var(--text-secondary)' }}
              >
                + Add Passage / Stimulus
              </button>
            </div>
          ) : null}

          {/* Visual Stimulus Diagram / Image for standalone questions (without passage) */}
          {!hasStimulus && hasImage && (
            <VisualStimulusViewer
              question={question}
              isEditing={isEditing}
              editedDescription={editedImageDescription}
              onDescriptionChange={setEditedImageDescription}
            />
          )}

          {/* Question Stem */}
          <div style={{ padding: '2px 4px' }}>
            {isEditing ? (
              <textarea
                value={editedStem}
                onChange={(e) => setEditedStem(e.target.value)}
                rows={2}
                style={{ width: '100%', fontSize: '1rem', fontWeight: 600 }}
              />
            ) : (
              <h3
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  lineHeight: '1.5',
                  color: 'var(--text-primary)'
                }}
              >
                {question.question_stem}
              </h3>
            )}
          </div>

          {/* Options Header & Anti-Guessability Symmetry Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
            <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Options ({question.options?.length || 4} Choices)
            </span>
            {optionSymmetry && (
              <span
                className={`badge ${optionSymmetry.is_balanced ? 'badge-emerald' : 'badge-amber'}`}
                style={{ fontSize: '0.675rem', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '2px 8px' }}
                title={`Option Symmetry: ${optionSymmetry.disparity_ratio}x length disparity. Range: ${optionSymmetry.min_word_count} to ${optionSymmetry.max_word_count} words. Prevents guessability cues.`}
              >
                <Scale size={11} />
                <span>
                  Option Length Balance: {optionSymmetry.status} ({optionSymmetry.min_word_count}-{optionSymmetry.max_word_count} words)
                </span>
              </span>
            )}
          </div>

          {/* Options List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(question.options || []).map((opt, idx) => {
              const optId = (opt.id || '').trim().toUpperCase();
              const isCorrectKey = correctKeysList.includes(optId);
              const currentText = isEditing ? (editedOptions[idx]?.text || '') : (opt.text || '');
              const optWordCount = currentText.trim().split(/\s+/).filter(Boolean).length;
              let cardClass = 'choice-option-card';
              if (isCorrectKey) cardClass += ' is-correct';

              return (
                <div
                  key={opt.id}
                  className={cardClass}
                >
                  {/* Option Letter Indicator */}
                  <div className="choice-letter-badge">
                    {opt.id}
                  </div>

                  {/* Option Text */}
                  <div style={{ flex: 1, paddingTop: '2px' }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedOptions[idx]?.text || opt.text}
                        onChange={(e) => {
                          const updated = [...editedOptions];
                          updated[idx] = { ...updated[idx], text: e.target.value };
                          setEditedOptions(updated);
                        }}
                        style={{ width: '100%', fontSize: '0.85rem' }}
                      />
                    ) : (
                      <div
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: isCorrectKey ? 600 : 400,
                          color: isCorrectKey ? 'var(--status-success)' : 'var(--text-primary)',
                          lineHeight: 1.5
                        }}
                      >
                        {opt.text}
                      </div>
                    )}
                  </div>

                  {/* Option Word Count Indicator */}
                  <span
                    style={{
                      fontSize: '0.675rem',
                      color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)',
                      background: 'var(--bg-surface-subtle)',
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-xs)',
                      flexShrink: 0
                    }}
                    title={`Word count for Option ${opt.id}: ${optWordCount} words`}
                  >
                    {optWordCount}w
                  </span>

                  {/* Answer Key Badge */}
                  {isCorrectKey && (
                    <span
                      className="badge badge-emerald"
                      style={{ fontSize: '0.675rem', padding: '2px 8px', flexShrink: 0 }}
                    >
                      <CheckCircle size={11} /> Correct Answer
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation Accordion Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowExplanation(!showExplanation)}
              style={{ gap: '6px', fontSize: '0.775rem' }}
            >
              {showExplanation ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              <span>{showExplanation ? 'Hide Answer Explanations' : 'View Answer Explanations'}</span>
            </button>

            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Correct Answer: <strong style={{ color: 'var(--status-success)' }}>Option {question.correct_answer_id}</strong>
            </span>
          </div>

          {/* Explanation Box */}
          {showExplanation && (
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                border: '1px solid var(--border-light)',
                fontSize: '0.85rem',
                lineHeight: '1.65',
                color: 'var(--text-secondary)'
              }}
            >
              {isEditing ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--brand-primary)', fontWeight: 600 }}>
                    <HelpCircle size={15} />
                    <span>Why Answers are Right or Wrong</span>
                  </div>
                  <textarea
                    value={editedExplanation}
                    onChange={(e) => setEditedExplanation(e.target.value)}
                    rows={4}
                    style={{ width: '100%', fontSize: '0.85rem', lineHeight: '1.6' }}
                  />
                </>
              ) : (
                <MentorExplanationView
                  explanation={question.explanation}
                  options={question.options}
                  correctAnswerId={question.correct_answer_id}
                  primaryTrap={question.primary_trap || effectiveTrapInfo?.key}
                  likelyMistakePattern={question.likely_mistake_pattern}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: 100-PT QUALITY SCORECARD --- */}
      {activeTab === 'scorecard' && (
        <QuestionScorecardTab question={question} pillars={pillars} />
      )}

      {/* --- TAB 3: STAGE JSON TELEMETRY --- */}
      {activeTab === 'telemetry' && (
        <StageJsonInspector question={question} />
      )}

      {/* Bottom Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          paddingTop: '14px',
          borderTop: '1px solid var(--border-light)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isSaved && onApprove ? (
            <>
              <button
                type="button"
                id="btn-admin-approve-bottom"
                className="btn-success"
                onClick={handleApproveClick}
                disabled={isApproving}
                style={{ padding: '8px 18px', fontSize: '0.825rem' }}
                title="Save question to Question Bank (Press A)"
              >
                <CheckCircle size={15} />
                <span>{isApproving ? 'Saving...' : 'Save to Question Bank'}</span>
                <span className="kbd-hint" style={{ fontSize: '0.6rem', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}>A</span>
              </button>

              {onDiscard && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => onDiscard(question)}
                  style={{ padding: '8px 14px', fontSize: '0.825rem' }}
                  title="Discard question (Press D)"
                >
                  <Trash2 size={13} />
                  <span>Discard Question</span>
                  <span className="kbd-hint" style={{ fontSize: '0.6rem' }}>D</span>
                </button>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--status-success)', fontWeight: 600, fontSize: '0.825rem' }}>
              <CheckCircle size={16} /> Saved in Question Bank
            </div>
          )}
        </div>

        {onNextQuestion && (
          <button
            type="button"
            id="btn-generate-another"
            className="btn-primary-luminous"
            onClick={onNextQuestion}
            style={{ padding: '8px 16px', fontSize: '0.825rem' }}
            title="Generate Next Question (Press ⌘↵)"
          >
            <Sparkles size={14} />
            <span>Generate Next</span>
            <span className="kbd-hint" style={{ fontSize: '0.6rem', color: '#ffffff', border: 'none', background: 'rgba(255,255,255,0.2)' }}>⌘↵</span>
          </button>
        )}
      </div>
    </div>
  );
}
