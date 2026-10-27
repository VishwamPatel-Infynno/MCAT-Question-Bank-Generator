import React from 'react';
import { Edit3, Sparkles, Zap } from 'lucide-react';

export default function WizardStep7Review({
  selectedSection = 'chem_phys',
  sectionMeta,
  pacing,
  setStep,
  selectedSubject,
  selectedUnit,
  selectedTopic,
  selectedSubtopic,
  customPrompt,
  difficulty,
  totalQuestions = 50,
  setTotalQuestions,
  questionType = 'PASSAGE_BASED_MCQ',
  allowAiImages = false,
  COGNITIVE_TRAPS,
  primaryTrap,
  selectedSkill,
  selectedSubskill,
  likelyMistakePattern,
  customMistakePattern
}) {
  const trapObj = COGNITIVE_TRAPS?.find(t => t.id === primaryTrap);
  const trapLabel = trapObj?.label || primaryTrap || 'Automatic';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="wizard-heading-group">
        <h2 className="wizard-step-title">Review &amp; Finalize Parameters</h2>
        <p className="wizard-step-subtitle">
          Verify your syllabus hierarchy, cognitive traps, and visual stimuli before launching question authoring.
        </p>
      </div>

      <div className="wizard-summary-card">
        {/* Row 1: Section & Pacing (Step 1) */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Target Section &amp; Pacing</div>
            <div className="wizard-summary-value" style={{ marginTop: '3px' }}>
              <span style={{ color: sectionMeta?.color, fontWeight: 700 }}>{sectionMeta?.label}</span>
              <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
              <span className="badge-minimal" style={{ fontSize: '0.7rem' }}>⏱️ {pacing?.target || '~96s / Q'} Target Pacing</span>
            </div>
          </div>
          <button
            type="button"
            className="wizard-summary-edit-btn"
            onClick={() => setStep(1)}
            title="Edit Exam Section"
          >
            <Edit3 size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Edit
          </button>
        </div>

        {/* Row 2: Discipline & Major Unit (Step 2) */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Discipline &amp; Syllabus Unit</div>
            <div className="wizard-summary-value" style={{ marginTop: '3px' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {selectedSubject || 'Discipline'}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {selectedUnit || 'Major Unit'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="wizard-summary-edit-btn"
            onClick={() => setStep(2)}
            title="Edit Discipline and Unit"
          >
            <Edit3 size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Edit
          </button>
        </div>

        {/* Row 3: Topic & Specific Subtopic (Step 3) */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Topic &amp; Target Concept</div>
            <div className="wizard-summary-value" style={{ marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong style={{ color: 'var(--text-primary)' }}>{selectedSubtopic || 'General Practice'}</strong>
              {selectedTopic && (
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  ({selectedTopic})
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="wizard-summary-edit-btn"
            onClick={() => setStep(3)}
            title="Edit Topic and Subtopic"
          >
            <Edit3 size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Edit
          </button>
        </div>

        {/* Row 4: Challenge Level, Scope & Format (Step 4) */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Level, Scope &amp; Format</div>
            <div className="wizard-summary-value" style={{ marginTop: '3px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{difficulty} Difficulty</span>
              <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
              <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>
                {totalQuestions === 5
                  ? 'Live Mini-Set (1 Job &bull; 5 Qs)'
                  : `Full Mock Section (10 Jobs &bull; ${totalQuestions} Qs)`}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
              <span className="badge-minimal" style={{ fontSize: '0.7rem' }}>
                {questionType === 'PASSAGE_BASED_MCQ' ? 'Passage-Based MCQ' : 'Independent MCQ'}
              </span>
            </div>
            {setTotalQuestions && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Switch scope:</span>
                {[
                  { count: 5, label: '1 Job (5 Qs Live)' },
                  { count: 50, label: '10 Jobs (50 Qs Batch)' }
                ].map(({ count, label }) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setTotalQuestions(count)}
                    style={{
                      padding: '2px 7px',
                      fontSize: '0.68rem',
                      fontWeight: totalQuestions === count ? 600 : 500,
                      borderRadius: 'var(--radius-xs)',
                      background: totalQuestions === count ? 'var(--brand-light)' : 'var(--bg-surface-subtle)',
                      border: totalQuestions === count ? '1px solid var(--border-brand)' : '1px solid var(--border-light)',
                      color: totalQuestions === count ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            className="wizard-summary-edit-btn"
            onClick={() => setStep(4)}
            title="Edit Difficulty & Format"
          >
            <Edit3 size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Edit
          </button>
        </div>

        {/* Row 5: Cognitive Traps & Reasoning Skills (Step 5) */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Distractor Trap &amp; Reasoning Competency</div>
            <div className="wizard-summary-value" style={{ marginTop: '3px', flexWrap: 'wrap' }}>
              <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                {primaryTrap === 'Automatic' ? (
                  <Sparkles size={11} style={{ marginRight: '4px', display: 'inline', color: 'var(--brand-primary)' }} />
                ) : (
                  <Zap size={11} style={{ marginRight: '4px', display: 'inline' }} />
                )}
                {trapLabel}
              </span>
              {(selectedSkill || selectedSubskill) && (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem' }}>{selectedSkill}</span>
                  {selectedSubskill && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>: {selectedSubskill}</span>
                  )}
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            className="wizard-summary-edit-btn"
            onClick={() => setStep(5)}
            title="Edit Traps & Skills"
          >
            <Edit3 size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Edit
          </button>
        </div>

        {/* Row 6: Visual Stimulus & Custom Focus (Step 6) */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Visuals &amp; Directives</div>
            <div className="wizard-summary-value" style={{ marginTop: '3px', flexWrap: 'wrap' }}>
              <span>
                {selectedSection === 'cars'
                  ? 'Disabled (Strict CARS Standard)'
                  : allowAiImages
                  ? 'AI Figures When Needed'
                  : 'Text-Only Items'}
              </span>
              {customMistakePattern ? (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    Misconception: <em>{customMistakePattern}</em>
                  </span>
                </>
              ) : likelyMistakePattern === 'None' ? null : (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
                  <span className="badge-minimal" style={{ fontSize: '0.68rem' }}>
                    {likelyMistakePattern && likelyMistakePattern !== 'Automatic'
                      ? `Trap: ${likelyMistakePattern}`
                      : 'Smart AI Trap Analysis'}
                  </span>
                </>
              )}
              {customPrompt && (
                <div style={{ fontSize: '0.74rem', fontStyle: 'italic', color: 'var(--text-muted)', width: '100%', marginTop: '2px' }}>
                  "{customPrompt}"
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            className="wizard-summary-edit-btn"
            onClick={() => setStep(6)}
            title="Edit Visuals & Guidance"
          >
            <Edit3 size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Edit
          </button>
        </div>
      </div>

      {/* Generation Summary Banner */}
      <div style={{
        padding: '12px 16px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--brand-light)',
        border: '1px solid var(--border-brand)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Sparkles size={18} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          {totalQuestions === 5 ? (
            <>
              Clicking <strong>Generate 5-Question Set (Live)</strong> launches real-time SSE streaming into your staged review desk with inline editing and multi-agent verification (~35-50s).
            </>
          ) : (
            <>
              Clicking <strong>Launch 50-Question Batch</strong> dispatches 10 parallel drafting worker jobs in the global worker pool. Approved questions will automatically stream into your <strong>AI Validated</strong> workspace.
            </>
          )}
        </div>
      </div>
    </div>
  );
}
