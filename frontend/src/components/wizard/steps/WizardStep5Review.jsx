import React from 'react';
import { Edit3, Sparkles } from 'lucide-react';

export default function WizardStep5Review({
  sectionMeta,
  pacing,
  setStep,
  selectedSubtopic,
  customPrompt,
  difficulty,
  totalQuestions,
  singleChoiceCount,
  multiChoiceCount,
  passageMode,
  passageQuestionCount,
  passageRequired,
  totalImagesCount,
  hasPassageImage,
  activeQuestionImagesCount,
  COGNITIVE_TRAPS,
  primaryTrap
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="wizard-heading-group">
        <h2 className="wizard-step-title">Everything looks ready! Review your setup</h2>
        <p className="wizard-step-subtitle">
          Check your settings below. Click 'Edit' beside any row to adjust it, or generate your questions now!
        </p>
      </div>

      <div className="wizard-summary-card">
        {/* Row 1: Section */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Target Section</div>
            <div className="wizard-summary-value" style={{ marginTop: '4px' }}>
              <span style={{ color: sectionMeta.color, fontWeight: 700 }}>{sectionMeta.label}</span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span className="badge-minimal">⏱️ {pacing.target || '~28s / Q'} Target Speed</span>
            </div>
          </div>
          <button
            type="button"
            id="btn-wizard-summary-edit-section"
            className="wizard-summary-edit-btn"
            onClick={() => setStep(1)}
            title="Edit Exam Section"
          >
            <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Edit Section
          </button>
        </div>

        {/* Row 2: Topic Focus & Custom Scenario */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Topic Focus & Custom Scenario</div>
            <div className="wizard-summary-value" style={{ marginTop: '4px' }}>
              <span style={{ fontWeight: 600 }}>{selectedSubtopic || 'General Practice'}</span>
              {customPrompt && (
                <>
                  <span style={{ color: 'var(--text-muted)' }}>•</span>
                  <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{customPrompt.slice(0, 48)}{customPrompt.length > 48 ? '...' : ''}"</span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            id="btn-wizard-summary-edit-topic"
            className="wizard-summary-edit-btn"
            onClick={() => setStep(2)}
            title="Edit Topic & Custom Prompt"
          >
            <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Edit Topic
          </button>
        </div>

        {/* Row 3: Difficulty & Quantity */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Difficulty & Question Count</div>
            <div className="wizard-summary-value" style={{ marginTop: '4px' }}>
              <span style={{ textTransform: 'capitalize' }}>{difficulty} Difficulty</span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span>{totalQuestions} {totalQuestions === 1 ? 'Question' : 'Questions'} total</span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span>({singleChoiceCount} Single Best Answer, {multiChoiceCount} Multi Statement)</span>
            </div>
          </div>
          <button
            type="button"
            className="wizard-summary-edit-btn"
            onClick={() => setStep(3)}
            title="Edit Difficulty & Quantity"
          >
            <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Edit
          </button>
        </div>

        {/* Row 4: Reading Material Structure */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Reading Passage Setup</div>
            <div className="wizard-summary-value" style={{ marginTop: '4px' }}>
              {totalQuestions > 1 ? (
                passageMode === 'single_passage' ? (
                  <span>
                    Shared Reading Passage ({passageQuestionCount} questions linked to passage{totalQuestions > passageQuestionCount ? `, ${totalQuestions - passageQuestionCount} standalone items` : ''})
                  </span>
                ) : (
                  <span>Independent Questions ({totalQuestions} standalone questions, no shared passage)</span>
                )
              ) : (
                <span>{passageRequired === 'Yes' ? 'Reading Passage Attached (250-400 words)' : 'Direct Standalone Question (No Passage)'}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="wizard-summary-edit-btn"
            onClick={() => setStep(totalQuestions > 1 ? 3 : 4)}
            title="Edit Reading Material Structure"
          >
            <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Edit
          </button>
        </div>

        {/* Row 5: Visual Stimuli & Diagram Budget */}
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

        {/* Row 6: Cognitive Traps & Directives */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Tricky Distractor Trap</div>
            <div className="wizard-summary-value" style={{ marginTop: '4px' }}>
              <span>{COGNITIVE_TRAPS.find(t => t.id === primaryTrap)?.label || primaryTrap}</span>
              {customPrompt && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  • "{customPrompt.length > 40 ? `${customPrompt.slice(0, 40)}...` : customPrompt}"
                </span>
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
            Edit
          </button>
        </div>
      </div>

      {/* Generation Summary Banner */}
      <div style={{
        padding: '16px 20px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(79, 48, 185, 0.08)',
        border: '1px solid rgba(79, 48, 185, 0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Sparkles size={20} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          Clicking <strong>Generate Questions</strong> will create your questions, verify them against official UCAT rubrics (&gt; 90 quality score),
          and balance all answer choices in ~15-25 seconds.
        </div>
      </div>
    </div>
  );
}
