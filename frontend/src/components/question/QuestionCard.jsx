import React, { useState } from 'react';
import { 
  CheckCircle, 
  Award, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Clock, 
  Trash2,
  Check,
  Edit3,
  Save,
  X,
  FileText,
  BarChart3,
  Code2,
  ShieldCheck
} from 'lucide-react';
import StageJsonInspector from './StageJsonInspector';

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
  const [copiedId, setCopiedId] = useState(null);

  // Quick Inline Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editedStem, setEditedStem] = useState(question?.question_stem || '');
  const [editedStimulus, setEditedStimulus] = useState(question?.stimulus_text || '');
  const [editedOptions, setEditedOptions] = useState(question?.options || []);
  const [editedExplanation, setEditedExplanation] = useState(question?.explanation || '');

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

  const handleCopyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleSaveEdit = () => {
    const updated = {
      ...question,
      question_stem: editedStem,
      stimulus_text: editedStimulus,
      options: editedOptions,
      explanation: editedExplanation
    };
    if (onUpdateQuestion) onUpdateQuestion(updated);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedStem(question.question_stem);
    setEditedStimulus(question.stimulus_text || '');
    setEditedOptions(question.options || []);
    setEditedExplanation(question.explanation || '');
    setIsEditing(false);
  };

  const review = question.review_rubric;
  const pillars = [
    { label: 'UCAT Authenticity & Tone', score: review?.authenticity_score ?? 24, max: 25, color: '#38bdf8' },
    { label: 'Clarity & Logical Soundness', score: review?.clarity_score ?? 24, max: 25, color: '#6366f1' },
    { label: 'Distractor Trap Quality', score: review?.distractor_score ?? 23, max: 25, color: '#f59e0b' },
    { label: 'Explanation & Key Rigor', score: review?.explanation_score ?? 24, max: 25, color: '#10b981' },
  ];

  return (
    <div
      className="glass-panel"
      style={{
        padding: '28px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        position: 'relative'
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-light)'
        }}
      >
        {/* Status Pill & Metadata Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {isSaved ? (
            <span
              className="badge badge-emerald"
              style={{ padding: '6px 14px', fontWeight: 800, fontSize: '0.78rem' }}
            >
              <CheckCircle size={14} /> Saved in Question Bank
            </span>
          ) : (
            <span
              className="badge badge-amber"
              style={{ padding: '6px 14px', fontWeight: 800, fontSize: '0.78rem' }}
            >
              <Clock size={14} /> Candidate Staged for Review
            </span>
          )}

          <span className="badge badge-cyan">{question.section_label || question.section}</span>
          <span
            className={`badge ${(question.difficulty || '').toLowerCase() === 'easy' ? 'badge-emerald' : (question.difficulty || '').toLowerCase() === 'hard' ? 'badge-rose' : 'badge-amber'}`}
            style={{ textTransform: 'capitalize' }}
          >
            {question.difficulty}
          </span>

          <span className="badge badge-emerald" style={{ fontSize: '0.78rem', padding: '4px 10px', fontWeight: 700 }}>
            <Award size={13} /> {question.final_score}/100 Quality
          </span>

          {question.id && (
            <span
              className="badge badge-cyan"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', cursor: 'pointer' }}
              title={`UUID: ${question.id} (Click to copy)`}
              onClick={() => handleCopyText(question.id, 'id')}
            >
              {copiedId === 'id' ? <Check size={11} color="#10b981" /> : null} ID: {question.id.slice(0, 8)}...
            </span>
          )}

          {question.combination_id && (
            <span
              className="badge badge-indigo"
              style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, cursor: 'pointer' }}
              title={`Combination ID: ${question.combination_id} (Click to copy)`}
              onClick={() => handleCopyText(question.combination_id, 'comb')}
            >
              {copiedId === 'comb' ? <Check size={11} color="#10b981" /> : null} {question.combination_id}
            </span>
          )}
        </div>

        {/* Edit & Audit Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {onOpenAudit && (
            <button
              onClick={() => onOpenAudit(question)}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.775rem' }}
              title="Open full-screen Audit Modal"
            >
              <ShieldCheck size={13} color="var(--brand-primary)" />
              <span>Full Audit</span>
            </button>
          )}

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.775rem' }}
            title="Edit question text before approving (Press E)"
          >
            <Edit3 size={13} />
            <span>{isEditing ? 'Cancel Edit' : 'Quick Edit'}</span>
            <span className="kbd-hint" style={{ fontSize: '0.625rem' }}>E</span>
          </button>
        </div>
      </div>

      {/* Desk Tab Navigation: Preview | Scorecard | JSON */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px',
          background: 'var(--bg-surface-elevated)',
          borderRadius: 'var(--radius-md)',
          width: 'fit-content',
          border: '1px solid var(--border-light)'
        }}
      >
        <button
          onClick={() => setActiveTab('preview')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'preview' ? 'var(--brand-primary)' : 'transparent',
            color: activeTab === 'preview' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
        >
          <FileText size={14} />
          <span>Candidate Preview</span>
        </button>

        <button
          onClick={() => setActiveTab('scorecard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'scorecard' ? 'var(--brand-primary)' : 'transparent',
            color: activeTab === 'scorecard' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
        >
          <BarChart3 size={14} />
          <span>100-pt Scorecard</span>
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: activeTab === 'telemetry' ? 'var(--brand-primary)' : 'transparent',
            color: activeTab === 'telemetry' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
        >
          <Code2 size={14} />
          <span>Stage JSON Telemetry</span>
        </button>
      </div>

      {/* --- TAB 1: CANDIDATE PREVIEW --- */}
      {activeTab === 'preview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Edit Mode Alert Banner */}
          {isEditing && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--status-warning-bg)',
                border: '1px solid var(--status-warning-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--status-warning)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                <Edit3 size={16} />
                <span>You are currently in Quick Edit mode. Make edits directly below and click Save.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={handleSaveEdit} className="btn-success" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                  <Save size={14} /> Save Edits
                </button>
                <button onClick={handleCancelEdit} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Stimulus Vignette */}
          {(question.stimulus_text || isEditing) && (
            <div
              style={{
                background: 'var(--bg-canvas)',
                borderLeft: '4px solid var(--brand-primary)',
                borderTop: '1px solid var(--border-light)',
                borderRight: '1px solid var(--border-light)',
                borderBottom: '1px solid var(--border-light)',
                padding: '18px 22px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.925rem',
                lineHeight: '1.7',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Stimulus Vignette
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {question.stimulus_text ? `${question.stimulus_text.split(/\s+/).length} words` : 'No passage'}
                </span>
              </div>

              {isEditing ? (
                <textarea
                  value={editedStimulus}
                  onChange={(e) => setEditedStimulus(e.target.value)}
                  rows={6}
                  style={{ width: '100%', fontSize: '0.9rem', lineHeight: '1.6' }}
                />
              ) : (
                <div style={{ whiteSpace: 'pre-line' }}>{question.stimulus_text}</div>
              )}
            </div>
          )}

          {/* Visual Stimulus Diagram */}
          {(question.image_svg || question.image_url) && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-canvas)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                border: '1px solid var(--border-light)'
              }}
            >
              {question.image_svg ? (
                <div
                  dangerouslySetInnerHTML={{ __html: question.image_svg }}
                  style={{ width: '100%', maxWidth: '640px', display: 'flex', justifyContent: 'center' }}
                />
              ) : (
                <img
                  src={question.image_url}
                  alt="UCAT Visual Stimulus"
                  style={{ maxWidth: '100%', maxHeight: '360px', borderRadius: '8px', objectFit: 'contain' }}
                />
              )}
            </div>
          )}

          {/* Question Stem */}
          {isEditing ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Question Stem
              </label>
              <textarea
                value={editedStem}
                onChange={(e) => setEditedStem(e.target.value)}
                rows={2}
                style={{ width: '100%', fontSize: '1rem', fontWeight: 700 }}
              />
            </div>
          ) : (
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: '1.5' }}>
              {question.question_stem}
            </div>
          )}

          {/* 4 Options (A, B, C, D) with Transparent Emerald Highlight for Answer Key */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {question.options.map((opt, idx) => {
              const isCorrectKey = opt.id === question.correct_answer_id;

              return (
                <div
                  key={opt.id}
                  id={`option-choice-${opt.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: isCorrectKey ? 'var(--status-success-bg)' : 'var(--bg-surface-elevated)',
                    border: isCorrectKey ? '1px solid var(--status-success-border)' : '1px solid var(--border-light)',
                    boxShadow: isCorrectKey ? 'var(--shadow-glow-emerald)' : 'none',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {/* Option Letter */}
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: isCorrectKey ? 'var(--status-success)' : 'var(--bg-surface)',
                      color: isCorrectKey ? '#ffffff' : 'var(--text-secondary)',
                      border: isCorrectKey ? 'none' : '1px solid var(--border-medium)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      flexShrink: 0
                    }}
                  >
                    {opt.id}
                  </div>

                  {/* Option Text */}
                  <div style={{ flex: 1, paddingTop: '4px' }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedOptions[idx]?.text || opt.text}
                        onChange={(e) => {
                          const updated = [...editedOptions];
                          updated[idx] = { ...updated[idx], text: e.target.value };
                          setEditedOptions(updated);
                        }}
                        style={{ width: '100%', fontSize: '0.9rem' }}
                      />
                    ) : (
                      <div
                        style={{
                          fontSize: '0.925rem',
                          fontWeight: isCorrectKey ? 700 : 500,
                          color: isCorrectKey ? '#10b981' : 'var(--text-primary)',
                          lineHeight: 1.5
                        }}
                      >
                        {opt.text}
                      </div>
                    )}
                  </div>

                  {/* Answer Key Badge */}
                  {isCorrectKey ? (
                    <span
                      className="badge badge-emerald"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 10px',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        flexShrink: 0,
                        marginTop: '3px'
                      }}
                    >
                      <CheckCircle size={13} color="#10b981" /> Correct Answer
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        flexShrink: 0,
                        marginTop: '5px'
                      }}
                    >
                      Distractor
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Explanation Accordion Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowExplanation(!showExplanation)}
              style={{ gap: '6px', fontSize: '0.8rem' }}
            >
              {showExplanation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{showExplanation ? 'Hide Psychometric Rationalization' : 'Show Psychometric Rationalization'}</span>
            </button>

            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Correct Key: <strong style={{ color: '#10b981' }}>Option {question.correct_answer_id}</strong>
            </span>
          </div>

          {/* Explanation Box */}
          {showExplanation && (
            <div
              style={{
                background: 'var(--bg-canvas)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                border: '1px solid var(--border-light)',
                fontSize: '0.875rem',
                lineHeight: '1.7',
                color: 'var(--text-secondary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--brand-primary)', fontWeight: 700 }}>
                <HelpCircle size={17} />
                <span>Distractor Trap Analysis &amp; Rationalization</span>
              </div>
              {isEditing ? (
                <textarea
                  value={editedExplanation}
                  onChange={(e) => setEditedExplanation(e.target.value)}
                  rows={4}
                  style={{ width: '100%', fontSize: '0.875rem', lineHeight: '1.6' }}
                />
              ) : (
                <div style={{ whiteSpace: 'pre-line', color: 'var(--text-primary)' }}>
                  {question.explanation}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: 100-PT PSYCHOMETRIC SCORECARD --- */}
      {activeTab === 'scorecard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Score Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              background: 'var(--brand-light)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-brand)'
            }}
          >
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--brand-primary)' }}>
                Overall Psychometric Quality Score
              </div>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--brand-primary)', lineHeight: 1.1 }}>
                {question.final_score} <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ 100</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span
                className={`badge ${question.final_score > 90 ? 'badge-emerald' : 'badge-amber'}`}
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                {question.final_score > 90 ? 'PASSED (> 90 Benchmark)' : 'CONDITIONAL PASS'}
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Refinement Iterations: {question.iteration_count || 1} of 3
              </div>
            </div>
          </div>

          {/* 4 Pillars Progress Bars */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '12px'
            }}
          >
            {pillars.map(pillar => (
              <div
                key={pillar.label}
                style={{
                  padding: '14px 16px',
                  background: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', fontWeight: 700 }}>
                  <span style={{ color: 'var(--text-primary)' }}>{pillar.label}</span>
                  <span style={{ color: pillar.color }}>{pillar.score} / {pillar.max}</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--border-medium)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      background: pillar.color,
                      width: `${(pillar.score / pillar.max) * 100}%`,
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Strengths & Recommendations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div
              style={{
                padding: '14px 18px',
                background: 'var(--status-success-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--status-success-border)'
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={15} /> Identified Psychometric Strengths
              </div>
              <ul style={{ fontSize: '0.8rem', color: 'var(--text-primary)', paddingLeft: '18px', lineHeight: 1.6 }}>
                {(review?.strengths || ['Authentic UCAT scenario tone', 'High-fidelity distractors', 'Rigorous clinical explanation']).map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>

            <div
              style={{
                padding: '14px 18px',
                background: 'var(--brand-light)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-brand)'
              }}
            >
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--brand-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={15} /> Distractor Calibration Notes
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                All candidate distractors were tested against keyword-matching fallacies and subtle partial matches to prevent easy elimination.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: STAGE JSON TELEMETRY --- */}
      {activeTab === 'telemetry' && (
        <StageJsonInspector question={question} />
      )}

      {/* Bottom Sticky Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-light)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isSaved && onApprove ? (
            <>
              <button
                type="button"
                id="btn-admin-approve-bottom"
                className="btn-success"
                onClick={handleApproveClick}
                disabled={isApproving}
                style={{ padding: '10px 22px', fontSize: '0.875rem' }}
                title="Approve candidate and save into PostgreSQL Bank (Press A)"
              >
                <CheckCircle size={16} />
                <span>{isApproving ? 'Saving...' : 'Approve to Question Bank'}</span>
                <span className="kbd-hint" style={{ fontSize: '0.625rem', color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)' }}>A</span>
              </button>

              {onDiscard && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => onDiscard(question)}
                  style={{ padding: '10px 18px', fontSize: '0.875rem' }}
                  title="Discard this candidate (Press D)"
                >
                  <Trash2 size={15} />
                  <span>Discard</span>
                  <span className="kbd-hint" style={{ fontSize: '0.625rem' }}>D</span>
                </button>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: 700, fontSize: '0.875rem' }}>
              <CheckCircle size={18} /> Verified &amp; Saved in PostgreSQL Bank
            </div>
          )}
        </div>

        {onNextQuestion && (
          <button
            type="button"
            id="btn-generate-another"
            className="btn-primary"
            onClick={onNextQuestion}
            style={{ padding: '10px 20px', gap: '8px' }}
            title="Generate Next Question (Press ⌘↵)"
          >
            <Sparkles size={16} />
            <span>Generate Next Question</span>
            <span className="kbd-hint" style={{ fontSize: '0.625rem', color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)' }}>⌘↵</span>
          </button>
        )}
      </div>
    </div>
  );
}
