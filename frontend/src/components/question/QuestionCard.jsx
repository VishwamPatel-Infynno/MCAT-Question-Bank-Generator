import React, { useState } from 'react';
import { 
  CheckCircle, 
  Award, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
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

  const diffLower = (question.difficulty || '').toLowerCase();
  const diffBadgeClass = diffLower === 'easy' ? 'badge-emerald' : diffLower === 'hard' ? 'badge-rose' : 'badge-amber';

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
          gap: '10px',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--border-light)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {isSaved ? (
            <span className="badge badge-emerald">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-success)' }} />
              Saved in Bank
            </span>
          ) : (
            <span className="badge badge-amber">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--status-warning)' }} />
              Staged Candidate
            </span>
          )}

          <span className="badge badge-neutral">{question.section_label || question.section}</span>
          <span className={`badge ${diffBadgeClass}`} style={{ textTransform: 'capitalize' }}>
            {question.difficulty}
          </span>

          <span className="badge badge-emerald" style={{ fontWeight: 700 }}>
            <Award size={12} /> {question.final_score}/100 Quality
          </span>

          {question.id && (
            <span
              className="badge badge-neutral"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.675rem', cursor: 'pointer' }}
              title={`Question UUID: ${question.id} (Click to copy)`}
              onClick={() => handleCopyText(question.id, 'id')}
            >
              {copiedId === 'id' ? <Check size={10} color="#10b981" /> : null} {question.id.slice(0, 8)}...
            </span>
          )}
        </div>

        {/* Top Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onOpenAudit && (
            <button
              onClick={() => onOpenAudit(question)}
              className="btn-secondary"
              style={{ padding: '5px 10px', fontSize: '0.75rem' }}
              title="Open full audit modal"
            >
              <ShieldCheck size={12} color="var(--brand-primary)" />
              <span>Full Audit</span>
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '3px',
          background: 'var(--bg-surface-elevated)',
          borderRadius: 'var(--radius-sm)',
          width: 'fit-content',
          border: '1px solid var(--border-light)'
        }}
      >
        {[
          { id: 'preview', label: 'Candidate Preview', icon: FileText },
          { id: 'scorecard', label: '100-pt Scorecard', icon: BarChart3 },
          { id: 'telemetry', label: 'Stage Telemetry', icon: Code2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isSel ? 'var(--brand-primary)' : 'transparent',
                color: isSel ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isSel ? 600 : 500,
                fontSize: '0.775rem',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              <Icon size={13} />
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                background: 'var(--status-warning-bg)',
                border: '1px solid var(--status-warning-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--status-warning)',
                fontSize: '0.8rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <Edit3 size={14} />
                <span>Quick Edit Mode Active. Modify fields below and click Save.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button onClick={handleSaveEdit} className="btn-success" style={{ padding: '5px 10px', fontSize: '0.75rem' }}>
                  <Save size={12} /> Save
                </button>
                <button onClick={handleCancelEdit} className="btn-secondary" style={{ padding: '5px 10px', fontSize: '0.75rem' }}>
                  <X size={12} /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* Clinical Vignette (Stimulus) */}
          {(question.stimulus_text || isEditing) && (
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.725rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Clinical Vignette Stimulus
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  ~{question.stimulus_text ? question.stimulus_text.split(/\s+/).length : 0} words
                </span>
              </div>

              {isEditing ? (
                <textarea
                  value={editedStimulus}
                  onChange={(e) => setEditedStimulus(e.target.value)}
                  rows={6}
                  style={{ width: '100%', fontSize: '0.95rem', fontFamily: 'var(--font-serif)', lineHeight: 1.65 }}
                />
              ) : (
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '1rem',
                    lineHeight: '1.68',
                    color: 'var(--text-primary)',
                    whiteSpace: 'pre-line'
                  }}
                >
                  {question.stimulus_text}
                </div>
              )}
            </div>
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

          {/* Options List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(question.options || []).map((opt, idx) => {
              const isCorrectKey = opt.id === question.correct_answer_id;
              return (
                <div
                  key={opt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: isCorrectKey ? 'var(--status-success-bg)' : 'var(--bg-surface-elevated)',
                    border: isCorrectKey ? '1px solid var(--status-success)' : '1px solid var(--border-light)',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {/* Option Letter Circle */}
                  <div
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: isCorrectKey ? 'var(--status-success)' : 'var(--bg-surface-subtle)',
                      color: isCorrectKey ? '#ffffff' : 'var(--text-secondary)',
                      border: isCorrectKey ? 'none' : '1px solid var(--border-medium)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      flexShrink: 0
                    }}
                  >
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
                        style={{ width: '100%', fontSize: '0.875rem' }}
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

                  {/* Answer Key Badge */}
                  {isCorrectKey ? (
                    <span
                      className="badge badge-emerald"
                      style={{ fontSize: '0.7rem', padding: '3px 8px', flexShrink: 0 }}
                    >
                      <CheckCircle size={12} /> Correct Key
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0, marginTop: '3px' }}>
                      Distractor
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
              <span>{showExplanation ? 'Hide Explanation & Distractor Analysis' : 'Show Explanation & Distractor Analysis'}</span>
            </button>

            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Correct Key: <strong style={{ color: 'var(--status-success)' }}>Option {question.correct_answer_id}</strong>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--brand-primary)', fontWeight: 600 }}>
                <HelpCircle size={15} />
                <span>Distractor Trap Analysis &amp; Rationalization</span>
              </div>
              {isEditing ? (
                <textarea
                  value={editedExplanation}
                  onChange={(e) => setEditedExplanation(e.target.value)}
                  rows={4}
                  style={{ width: '100%', fontSize: '0.85rem', lineHeight: '1.6' }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Psychometric Evaluation Scorecard
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Audited against UK UCAT 100-point rubric standards
              </p>
            </div>
            <span className="badge badge-emerald" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
              Overall Score: {question.final_score}/100
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            {pillars.map(p => (
              <div
                key={p.label}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.775rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.label}</span>
                  <span style={{ fontWeight: 700, color: p.color }}>{p.score}/{p.max}</span>
                </div>
                <div style={{ width: '100%', height: '4px', background: 'var(--bg-app)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${(p.score / p.max) * 100}%`, height: '100%', background: p.color, borderRadius: '2px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
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
                title="Approve candidate and save to Question Bank (Press A)"
              >
                <CheckCircle size={15} />
                <span>{isApproving ? 'Saving...' : 'Approve & Save to Bank'}</span>
                <span className="kbd-hint" style={{ fontSize: '0.6rem', color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}>A</span>
              </button>

              {onDiscard && (
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => onDiscard(question)}
                  style={{ padding: '8px 14px', fontSize: '0.825rem' }}
                  title="Discard candidate (Press D)"
                >
                  <Trash2 size={13} />
                  <span>Discard</span>
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
            className="btn-primary"
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
