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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="wizard-heading-group">
        <h2 className="wizard-step-title">Review & Finalize MCAT Generation Parameters</h2>
        <p className="wizard-step-subtitle">
          Verify your syllabus hierarchy, challenge calibration, distractor traps, and visual stimuli before launching the multi-agent swarm.
        </p>
      </div>

      <div className="wizard-summary-card">
        {/* Row 1: Section & Pacing (Step 1) */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Target Section & Pacing</div>
            <div className="wizard-summary-value" style={{ marginTop: '4px' }}>
              <span style={{ color: sectionMeta?.color, fontWeight: 700 }}>{sectionMeta?.label}</span>
              <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
              <span className="badge-minimal">⏱️ {pacing?.target || '~96s / Q'} Target Speed</span>
            </div>
          </div>
          <button
            type="button"
            className="wizard-summary-edit-btn"
            onClick={() => setStep(1)}
            title="Edit Exam Section"
          >
            <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Edit Section
          </button>
        </div>

        {/* Row 2: Discipline & Major Unit (Step 2) */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Discipline & Major Unit</div>
            <div className="wizard-summary-value" style={{ marginTop: '4px' }}>
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
            <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Edit Unit
          </button>
        </div>

        {/* Row 3: Topic & Specific Subtopic (Step 3) */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Target Topic & High-Yield Concept</div>
            <div className="wizard-summary-value" style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedSubtopic || 'General Practice'}</strong>
              </div>
              {selectedTopic && (
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Topic Area: {selectedTopic}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            className="wizard-summary-edit-btn"
            onClick={() => setStep(3)}
            title="Edit Topic and Subtopic"
          >
            <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Edit Topic
          </button>
        </div>

        {/* Row 4: Challenge Level, Scope & Format (Step 4) */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Challenge Level, Scope & Format</div>
            <div className="wizard-summary-value" style={{ marginTop: '4px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{difficulty} Difficulty</span>
              <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
              <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>
                {totalQuestions === 1
                  ? 'Quick Single Item (1 Q, Live)'
                  : totalQuestions === 5
                  ? 'Live Mini-Set (5 Qs, Staged)'
                  : `Full Mock Section (${totalQuestions} Qs, 10 Jobs)`}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
              <span className="badge-minimal">
                {questionType === 'PASSAGE_BASED_MCQ' ? 'Passage-Based MCQ (Single Choice)' : 'Independent MCQ (Single Choice)'}
              </span>
            </div>
            {setTotalQuestions && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Quick switch scope:</span>
                {[
                  { count: 1, label: '1 Q (Live)' },
                  { count: 5, label: '5 Qs (Staged)' },
                  { count: 50, label: '50 Qs (Batch)' }
                ].map(({ count, label }) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setTotalQuestions(count)}
                    style={{
                      padding: '3px 8px',
                      fontSize: '0.7rem',
                      fontWeight: totalQuestions === count ? 700 : 500,
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
            <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Edit Scope
          </button>
        </div>

        {/* Row 5: Cognitive Traps & Reasoning Skills (Step 5) */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Cognitive Trap & Reasoning Skill</div>
            <div className="wizard-summary-value" style={{ marginTop: '4px', flexWrap: 'wrap' }}>
              <span className="badge badge-purple" style={{ fontSize: '0.76rem' }}>
                <Zap size={11} style={{ marginRight: '4px', display: 'inline' }} />
                {trapLabel}
              </span>
              {(selectedSkill || selectedSubskill) && (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedSkill}</span>
                  {selectedSubskill && (
                    <span style={{ color: 'var(--text-secondary)' }}>: {selectedSubskill}</span>
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
            <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Edit Traps
          </button>
        </div>

        {/* Row 6: Visual Stimulus & Custom Focus (Step 6) */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Visual Stimuli & Guidance</div>
            <div className="wizard-summary-value" style={{ marginTop: '4px', flexWrap: 'wrap' }}>
              <span>
                {selectedSection === 'cars'
                  ? 'Disabled (Strict AAMC CARS: Text-Only)'
                  : allowAiImages
                  ? 'AI-Determined When Needed'
                  : 'Disabled (Text-Only Items)'}
              </span>
              {selectedSection === 'cars' ? (
                <span className="badge-minimal" style={{ color: 'var(--amber-warning, #f59e0b)' }}>CARS Standard</span>
              ) : allowAiImages ? (
                <span className="badge-minimal" style={{ color: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' }}>
                  Autonomous $0.014 / img on-demand
                </span>
              ) : (
                <span className="badge-minimal">$0.00 Image Cost</span>
              )}
              {(likelyMistakePattern || customMistakePattern) && (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Mistake: <em>{customMistakePattern || likelyMistakePattern}</em>
                  </span>
                </>
              )}
              {customPrompt && (
                <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-muted)', width: '100%', marginTop: '3px' }}>
                  Prompt: "{customPrompt}"
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
            <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Edit Visuals
          </button>
        </div>
      </div>

      {/* Generation Summary Banner */}
      <div style={{
        padding: '16px 20px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(79, 48, 185, 0.1)',
        border: '1px solid rgba(79, 48, 185, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Sparkles size={20} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          Clicking <strong>Launch 50-Question Batch</strong> initiates 10 parallel drafting and review jobs running with controlled concurrency. Questions that pass the strict 100-pt psychometric standard will automatically stream into the <strong>AI Validated</strong> workspace.
        </div>
      </div>
    </div>
  );
}
