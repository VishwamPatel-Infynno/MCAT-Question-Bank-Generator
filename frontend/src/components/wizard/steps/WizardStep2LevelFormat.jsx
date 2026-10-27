import React from 'react';
import {
  Layers,
  FileText,
  CheckCircle2
} from 'lucide-react';

const DEFAULT_DIFFICULTY_TIERS = [];

export default function WizardStep2LevelFormat({
  selectedSection = 'chem_phys',
  difficulty = 'medium',
  setDifficulty,
  DIFFICULTY_TIERS = DEFAULT_DIFFICULTY_TIERS,
  passageMode = 'single_passage',
  handlePassageModeChange,
  questionType = 'PASSAGE_BASED_MCQ',
  setQuestionType,
  totalQuestions = 50,
  setTotalQuestions
}) {
  const isCars = selectedSection === 'cars';

  const selectPassageMode = (mode) => {
    handlePassageModeChange?.(mode);
    setQuestionType?.(mode === 'single_passage' ? 'PASSAGE_BASED_MCQ' : 'DISCRETE_MCQ');
  };

  const isPassage = isCars || passageMode === 'single_passage' || questionType === 'PASSAGE_BASED_MCQ';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="wizard-heading-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h2 className="wizard-step-title">Choose Difficulty, Format &amp; Question Count</h2>
          <span className="badge-minimal" style={{ fontSize: '0.72rem' }}>
            Difficulty &amp; Format &bull; Step 2 of 3
          </span>
        </div>
        <p className="wizard-step-subtitle">
          Select challenge difficulty, whether to include reading passages, and your desired question count.
        </p>
      </div>

      {/* Decision 1: Challenge Level */}
      <div className="wizard-stacked-decision">
        <div className="wizard-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="wizard-decision-num">1</span>
            <span className="wizard-decision-title">Question Difficulty</span>
          </div>
        </div>

        <div className="wizard-difficulty-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {DIFFICULTY_TIERS.map((tier) => {
            const diffNormalized = (difficulty || '').toLowerCase();
            const tierId = tier.id.toLowerCase();
            const isSelected = diffNormalized === tierId ||
              (tierId === 'low' && diffNormalized === 'easy') ||
              (tierId === 'high' && diffNormalized === 'hard');

            return (
              <div
                key={tier.id}
                className={`wizard-tier-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setDifficulty?.(tier.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setDifficulty?.(tier.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                style={{ padding: '12px 14px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div className="wizard-tier-title" style={{ fontSize: '0.88rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: tier.color || 'var(--brand-primary)',
                        display: 'inline-block',
                        flexShrink: 0
                      }}
                    />
                    {tier.title}
                  </div>
                  {isSelected && (
                    <CheckCircle2 size={14} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                  )}
                </div>
                <div className="wizard-tier-desc" style={{ fontSize: '0.72rem' }}>{tier.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="wizard-decision-connector" />

      {/* Decision 2: MCAT Question Format */}
      <div className="wizard-stacked-decision">
        <div className="wizard-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="wizard-decision-num">2</span>
            <span className="wizard-decision-title">Passage &amp; Question Format</span>
          </div>
          <span className="badge-minimal" style={{ fontSize: '0.7rem' }}>
            Single Best Answer (A-D)
          </span>
        </div>

        {isCars ? (
          /* CARS Mode: Strictly 100% Passage-Based */
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-subtle)',
              border: '1px solid rgba(225, 29, 72, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileText size={18} style={{ color: '#e11d48', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Reading Passage + Questions (Official CARS Standard)
                </span>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  Official AAMC CARS standard: strictly passage-based (500-650 words) with linked humanities reasoning questions.
                </p>
              </div>
            </div>
            <span className="badge badge-purple" style={{ fontSize: '0.68rem', flexShrink: 0 }}>
              CARS Standard
            </span>
          </div>
        ) : (
          /* Sciences Mode: Binary choice between Passage-Based MCQ OR Independent MCQ */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
            {/* Mode A: Reading Passage + Questions */}
            <div
              className={`wizard-tier-card ${isPassage ? 'selected' : ''}`}
              onClick={() => selectPassageMode('single_passage')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectPassageMode('single_passage');
                }
              }}
              role="button"
              tabIndex={0}
              id="btn-question-type-passage"
              style={{ padding: '12px 14px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={15} style={{ color: 'var(--brand-primary)' }} />
                  <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Reading Passage + Questions
                  </span>
                </div>
                {isPassage && (
                  <CheckCircle2 size={14} style={{ color: 'var(--brand-primary)' }} />
                )}
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Questions linked to a scientific experiment or clinical research study passage.
              </p>
            </div>

            {/* Mode B: Standalone Questions */}
            <div
              className={`wizard-tier-card ${!isPassage ? 'selected' : ''}`}
              onClick={() => selectPassageMode('independent')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  selectPassageMode('independent');
                }
              }}
              role="button"
              tabIndex={0}
              id="btn-question-type-independent"
              style={{ padding: '12px 14px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={15} style={{ color: 'var(--status-purple)' }} />
                  <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Standalone Questions (No Passage)
                  </span>
                </div>
                {!isPassage && (
                  <CheckCircle2 size={14} style={{ color: 'var(--brand-primary)' }} />
                )}
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Individual questions testing science concepts directly without a passage.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="wizard-decision-connector" />

      {/* Decision 3: Practice Size */}
      <div className="wizard-stacked-decision">
        <div className="wizard-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="wizard-decision-num">3</span>
            <span className="wizard-decision-title">Practice Size</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {totalQuestions === 50 ? '50 Questions Full Section' : '5 Questions Quick Set'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
          {/* Preset 1: Quick Practice Set */}
          <div
            className={`wizard-tier-card ${totalQuestions === 5 ? 'selected' : ''}`}
            onClick={() => setTotalQuestions?.(5)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setTotalQuestions?.(5);
              }
            }}
            role="button"
            tabIndex={0}
            style={{ padding: '12px 14px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.9rem' }}>🎯</span>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Quick Practice Set (5 Questions)
                </span>
              </div>
              {totalQuestions === 5 && (
                <CheckCircle2 size={14} style={{ color: 'var(--brand-primary)' }} />
              )}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', fontWeight: 600, marginBottom: '2px' }}>
              Fast Practice &bull; Ready in ~45 seconds
            </div>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              5 questions sharing a reading passage (or 5 standalone questions). Reviewed by AI and saved to your bank.
            </p>
          </div>

          {/* Preset 2: Full Exam Section */}
          <div
            className={`wizard-tier-card ${totalQuestions === 50 ? 'selected' : ''}`}
            onClick={() => setTotalQuestions?.(50)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setTotalQuestions?.(50);
              }
            }}
            role="button"
            tabIndex={0}
            style={{ padding: '12px 14px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.9rem' }}>📦</span>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Full Exam Section (50 Questions)
                </span>
              </div>
              {totalQuestions === 50 && (
                <CheckCircle2 size={14} style={{ color: 'var(--brand-primary)' }} />
              )}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', fontWeight: 600, marginBottom: '2px' }}>
              Complete Test &bull; Ready in ~1-2 minutes
            </div>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              A full 50-question mock exam section generated in parallel in the background. Reviewed and organized for study.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
