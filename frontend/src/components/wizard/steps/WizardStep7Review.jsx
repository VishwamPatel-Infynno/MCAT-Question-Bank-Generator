import React from 'react';
import { Edit3, Sparkles, CheckCircle2, Zap } from 'lucide-react';

const EMPTY_ARRAY = [];

export default function WizardStep7Review({
  sectionMeta,
  pacing,
  setStep,
  selectedSubject,
  selectedUnit,
  selectedTopic,
  selectedSubtopic,
  customPrompt,
  difficulty,
  passageMode,
  totalQuestions = 50,
  questionType = 'PASSAGE_BASED_MCQ',
  totalImagesCount = 0,
  hasPassageImage = false,
  activeQuestionImagesCount = 0,
  COGNITIVE_TRAPS,
  primaryTrap,
  selectedSkill,
  selectedSubskill,
  likelyMistakePattern,
  customMistakePattern,
  contentDomains = EMPTY_ARRAY
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

        {/* Row 4: Challenge Level & Format (Step 4) */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Challenge Level & Format</div>
            <div className="wizard-summary-value" style={{ marginTop: '4px', flexWrap: 'wrap' }}>
              <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{difficulty} Difficulty</span>
              <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
              <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>Standard Batch: {totalQuestions} Questions (10 Jobs)</span>
              <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
              <span className="badge-minimal">
                {questionType === 'PASSAGE_BASED_MCQ' ? 'Passage-Based MCQ (Single Choice)' : 'Independent MCQ (Single Choice)'}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="wizard-summary-edit-btn"
            onClick={() => setStep(4)}
            title="Edit Difficulty & Format"
          >
            <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Edit Level
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
                {totalImagesCount > 0
                  ? `${totalImagesCount} ${totalImagesCount === 1 ? 'Diagram' : 'Diagrams'} (High-Resolution)`
                  : 'No Visual Stimuli (Text Only)'}
              </span>
              {hasPassageImage && <span className="badge-minimal">Passage Diagram</span>}
              {activeQuestionImagesCount > 0 && <span className="badge-minimal">{activeQuestionImagesCount} Q-Diagrams</span>}
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
