import React from 'react';
import { Edit3, Sparkles } from 'lucide-react';

const EMPTY_ARRAY = [];

export default function WizardStep5Review({
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
  totalQuestions = 5,
  questionType = 'DISCRETE_MCQ',
  totalImagesCount,
  hasPassageImage,
  activeQuestionImagesCount,
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
          Verify your full syllabus lineage, skills, and distractor traps before triggering the multi-agent generation swarm.
        </p>
      </div>

      <div className="wizard-summary-card">
        {/* Row 1: Section & Pacing */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Target Section & Pacing</div>
            <div className="wizard-summary-value" style={{ marginTop: '4px' }}>
              <span style={{ color: sectionMeta.color, fontWeight: 700 }}>{sectionMeta.label}</span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span className="badge-minimal">⏱️ {pacing.target || '~96s / Q'} Target Speed</span>
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

        {/* Row 2: Syllabus Lineage */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Syllabus Lineage</div>
            <div className="wizard-summary-value" style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>{selectedSubtopic || 'General Practice'}</strong>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                {selectedSubject && <span>{selectedSubject}</span>}
                {selectedUnit && <span> &bull; {selectedUnit}</span>}
                {selectedTopic && <span> &bull; {selectedTopic}</span>}
              </div>
              {customPrompt && (
                <div style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Prompt: "{customPrompt}"
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            className="wizard-summary-edit-btn"
            onClick={() => setStep(2)}
            title="Edit Syllabus Hierarchy"
          >
            <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Edit Topic
          </button>
        </div>

        {/* Row 3: Difficulty, Question Type & Quantity */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Question Format & Batch Quantity</div>
            <div className="wizard-summary-value" style={{ marginTop: '4px', flexWrap: 'wrap' }}>
              <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{difficulty} Difficulty</span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>{totalQuestions} Questions</span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span className="badge-minimal">{questionType.replace(/_/g, ' ')}</span>
            </div>
          </div>
          <button
            type="button"
            className="wizard-summary-edit-btn"
            onClick={() => setStep(3)}
            title="Edit Difficulty & Format"
          >
            <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Edit Format
          </button>
        </div>

        {/* Row 4: Reading Material Structure */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Passage Arrangement</div>
            <div className="wizard-summary-value" style={{ marginTop: '4px' }}>
              {passageMode === 'single_passage' ? (
                <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
                  Passage-Based Set (All {totalQuestions} Questions Linked to 1 Shared Passage)
                </span>
              ) : (
                <span style={{ color: 'var(--status-purple)', fontWeight: 600 }}>
                  Independent Discretes ({totalQuestions} Standalone Items)
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="wizard-summary-edit-btn"
            onClick={() => setStep(3)}
            title="Edit Question Set Structure"
          >
            <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Edit Passage
          </button>
        </div>

        {/* Row 5: AAMC Skill & Subskill */}
        {(selectedSkill || selectedSubskill) && (
          <div className="wizard-summary-row">
            <div>
              <div className="wizard-summary-label">AAMC Inquiry Skill Focus</div>
              <div className="wizard-summary-value" style={{ marginTop: '4px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedSkill}</span>
                {selectedSubskill && (
                  <>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{selectedSubskill}</span>
                  </>
                )}
              </div>
            </div>
            <button
              type="button"
              className="wizard-summary-edit-btn"
              onClick={() => setStep(4)}
              title="Edit Skill Focus"
            >
              <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
              Edit Skill
            </button>
          </div>
        )}

        {/* Row 6: Cognitive Distractor Trap & Likely Mistake Pattern */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Distractor Trap & Student Mistake Lure</div>
            <div className="wizard-summary-value" style={{ marginTop: '4px', flexWrap: 'wrap' }}>
              <span className="badge badge-purple" style={{ fontSize: '0.76rem' }}>
                {trapLabel}
              </span>
              {(likelyMistakePattern || customMistakePattern) && (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Mistake: <em>{customMistakePattern || likelyMistakePattern}</em>
                  </span>
                </>
              )}
              {contentDomains.length > 0 && (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {contentDomains.length} Domains tagged
                  </span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            className="wizard-summary-edit-btn"
            onClick={() => setStep(4)}
            title="Edit Traps & Directives"
          >
            <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Edit Traps
          </button>
        </div>

        {/* Row 7: Diagrams & Visual Budget */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Visual Stimuli & Diagrams</div>
            <div className="wizard-summary-value" style={{ marginTop: '4px' }}>
              <span>
                {totalImagesCount > 0
                  ? `${totalImagesCount} ${totalImagesCount === 1 ? 'Diagram' : 'Diagrams'} (High-Resolution)`
                  : 'No Visual Stimuli (Text Only)'}
              </span>
              {hasPassageImage && <span className="badge-minimal">Passage Diagram</span>}
              {activeQuestionImagesCount > 0 && <span className="badge-minimal">{activeQuestionImagesCount} Q-Diagrams</span>}
            </div>
          </div>
          <button
            type="button"
            className="wizard-summary-edit-btn"
            onClick={() => setStep(4)}
            title="Edit Visual Stimuli"
          >
            <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Edit
          </button>
        </div>
      </div>

      {/* Generation Summary Banner */}
      <div style={{
        padding: '16px 20px',
        borderRadius: 'var(--radius-md)',
        background: totalQuestions === 50 ? 'rgba(79, 48, 185, 0.12)' : 'rgba(79, 48, 185, 0.08)',
        border: '1px solid rgba(79, 48, 185, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Sparkles size={20} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          {totalQuestions === 50 ? (
            <>
              Clicking <strong>Launch 50-Question Background Batch</strong> will initiate an asynchronous background process with <strong>10 dedicated jobs</strong> (5 questions each) running at controlled 2-job concurrency. You can safely navigate the application or inspect real-time progress inside the <strong>Batch Activity</strong> screen.
            </>
          ) : (
            <>
              Clicking <strong>Generate Questions</strong> will deploy the multi-agent question writing, peer review, and anti-guessability balance swarm
              to create publication-grade MCAT questions with detailed mentor explanations in seconds.
            </>
          )}
        </div>
      </div>
    </div>
  );
}
