import React from 'react';
import {
  Layers,
  FileText,
  CheckCircle2
} from 'lucide-react';

const DEFAULT_DIFFICULTY_TIERS = [];

export default function WizardStep4LevelFormat({
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
        <h2 className="wizard-step-title">Calibrate Level, Format &amp; Scope</h2>
        <p className="wizard-step-subtitle">
          Calibrate challenge difficulty, question format, and execution scope according to official AAMC specifications.
        </p>
      </div>

      {/* Decision 1: Challenge Level */}
      <div className="wizard-stacked-decision">
        <div className="wizard-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="wizard-decision-num">1</span>
            <span className="wizard-decision-title">Challenge Difficulty</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>AAMC Scaled</span>
        </div>

        <div className="wizard-difficulty-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {DIFFICULTY_TIERS.map((tier) => {
            const isSelected = difficulty?.toLowerCase() === tier.id.toLowerCase();
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <div className="wizard-tier-title" style={{ fontSize: '0.88rem', margin: 0 }}>{tier.title}</div>
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

      {/* Subtle connector */}
      <div className="wizard-decision-connector" />

      {/* Decision 2: MCAT Question Format */}
      <div className="wizard-stacked-decision">
        <div className="wizard-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="wizard-decision-num">2</span>
            <span className="wizard-decision-title">Question Format</span>
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
                  Passage-Based MCQ (Single Choice)
                </span>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                  AAMC CARS standard: strictly passage-based (500-650 words) with linked reasoning questions.
                </p>
              </div>
            </div>
            <span className="badge badge-purple" style={{ fontSize: '0.68rem', flexShrink: 0 }}>
              CARS Locked
            </span>
          </div>
        ) : (
          /* Sciences Mode: Binary choice between Passage-Based MCQ OR Independent MCQ */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
            {/* Mode A: Passage-Based MCQ */}
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
                    Passage-Based MCQ
                  </span>
                </div>
                {isPassage && (
                  <CheckCircle2 size={14} style={{ color: 'var(--brand-primary)' }} />
                )}
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Shared experimental or clinical research stimulus passage with linked questions.
              </p>
            </div>

            {/* Mode B: Independent MCQ */}
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
                    Independent Discrete MCQ
                  </span>
                </div>
                {!isPassage && (
                  <CheckCircle2 size={14} style={{ color: 'var(--brand-primary)' }} />
                )}
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Standalone discrete questions without shared reading passages.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Subtle connector */}
      <div className="wizard-decision-connector" />

      {/* Decision 3: Generation Scope & Workflow Mode */}
      <div className="wizard-stacked-decision">
        <div className="wizard-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="wizard-decision-num">3</span>
            <span className="wizard-decision-title">Generation Scope</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {totalQuestions === 50 ? '10 Jobs Async' : '1 Job Live'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
          {/* Preset 1: Live Mini-Set */}
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
                  Live Mini-Set (5 Qs)
                </span>
              </div>
              {totalQuestions === 5 && (
                <CheckCircle2 size={14} style={{ color: 'var(--brand-primary)' }} />
              )}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', fontWeight: 600, marginBottom: '2px' }}>
              1 Job &bull; Staged Desk (~35-50s)
            </div>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Streamed live into the staging desk with inline editing and multi-agent observability.
            </p>
          </div>

          {/* Preset 2: Full Mock Section */}
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
                <span style={{ fontSize: '0.9rem' }}>📚</span>
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Full Mock Section (50 Qs)
                </span>
              </div>
              {totalQuestions === 50 && (
                <CheckCircle2 size={14} style={{ color: 'var(--brand-primary)' }} />
              )}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--status-purple)', fontWeight: 600, marginBottom: '2px' }}>
              10 Jobs &bull; Global Worker Pool
            </div>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Enterprise background batch across 10 concurrent workers with automated psychometric scoring.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
