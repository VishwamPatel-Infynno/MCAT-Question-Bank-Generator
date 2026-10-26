import React from 'react';
import {
  Layers,
  FileText,
  AlertCircle,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="wizard-heading-group">
        <h2 className="wizard-step-title">Calibrate Challenge Level & Question Format</h2>
        <p className="wizard-step-subtitle">
          Calibrated to official AAMC standards. Set the cognitive demand and choose between Passage-Based or Independent Single-Choice MCQs.
        </p>
      </div>

      {/* Decision 1: Challenge Level */}
      <div className="wizard-stacked-decision">
        <div className="wizard-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="wizard-decision-num">1</span>
            <span className="wizard-decision-title">Challenge Level</span>
          </div>
          <span className="wizard-decision-tag">AAMC Scaled</span>
        </div>

        <div className="wizard-difficulty-grid">
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
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div className="wizard-tier-title">{tier.title}</div>
                  {isSelected && (
                    <CheckCircle2 size={16} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                  )}
                </div>
                <div className="wizard-tier-desc">{tier.desc}</div>
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
            <span className="wizard-decision-title">MCAT Question Format</span>
          </div>
          <span className="badge-minimal" style={{ fontSize: '0.72rem' }}>
            Single Best Answer (A-D)
          </span>
        </div>

        {isCars ? (
          /* CARS Mode: Strictly 100% Passage-Based */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(225, 29, 72, 0.08)',
                border: '1px solid rgba(225, 29, 72, 0.25)',
                fontSize: '0.8rem',
                color: '#e11d48',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>AAMC CARS Standard:</strong> Critical Analysis and Reasoning Skills (CARS) is 100% passage-based.
                Questions are organized into continuous passage sets. Independent discretes are not permitted.
              </div>
            </div>

            <div className="wizard-tier-card selected" style={{ padding: '16px 18px', cursor: 'default' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} style={{ color: 'var(--brand-primary)' }} />
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Passage-Based MCQ (Single Choice)
                  </span>
                </div>
                <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                  AAMC CARS Locked
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                10 continuous scholarly passages (500-650 words each) with 5 linked single-choice questions per passage testing comprehension, reasoning within the text, and reasoning beyond the text.
              </p>
            </div>
          </div>
        ) : (
          /* Sciences Mode: Binary choice between Passage-Based MCQ OR Independent MCQ */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
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
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} style={{ color: 'var(--brand-primary)' }} />
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Passage-Based MCQ
                  </span>
                </div>
                {isPassage && (
                  <CheckCircle2 size={16} style={{ color: 'var(--brand-primary)' }} />
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                Dedicated experimental or research passage stimulus (500-650 words) with linked questions evaluating scientific comprehension and data analysis.
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
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} style={{ color: 'var(--status-purple)' }} />
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Independent MCQ
                  </span>
                </div>
                {!isPassage && (
                  <CheckCircle2 size={16} style={{ color: 'var(--brand-primary)' }} />
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                Standalone discrete single-choice questions with zero reading passages. The complete scenario and question are stated directly in the question stem.
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
            <span className="wizard-decision-title">Generation Scope & Execution Mode</span>
          </div>
          <span className="badge-minimal" style={{ fontSize: '0.72rem' }}>
            {totalQuestions === 50 ? 'Background Batch' : 'Real-Time Live SSE'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
          {/* Preset 1: Quick Single Item */}
          <div
            className={`wizard-tier-card ${totalQuestions === 1 ? 'selected' : ''}`}
            onClick={() => setTotalQuestions?.(1)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setTotalQuestions?.(1);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem' }}>⚡</span>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Quick Single Item (1 Q)
                </span>
              </div>
              {totalQuestions === 1 && (
                <CheckCircle2 size={16} style={{ color: 'var(--brand-primary)' }} />
              )}
            </div>
            <div style={{ marginBottom: '6px' }}>
              <span className="badge badge-emerald" style={{ fontSize: '0.675rem' }}>Live Workspace (~15-25s)</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
              Live real-time stream into the interactive Question Desk with live conduit telemetry and inline editing.
            </p>
          </div>

          {/* Preset 2: Live Mini-Set */}
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
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem' }}>🎯</span>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Live Mini-Set (5 Qs)
                </span>
              </div>
              {totalQuestions === 5 && (
                <CheckCircle2 size={16} style={{ color: 'var(--brand-primary)' }} />
              )}
            </div>
            <div style={{ marginBottom: '6px' }}>
              <span className="badge badge-purple" style={{ fontSize: '0.675rem' }}>Staged Batch Desk (~35-50s)</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
              Parallel drafting linked to a shared reading passage (or 5 discretes) reviewed on the multi-slot staging desk.
            </p>
          </div>

          {/* Preset 3: Full Mock Section */}
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
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem' }}>📚</span>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Full Mock Section (50 Qs)
                </span>
              </div>
              {totalQuestions === 50 && (
                <CheckCircle2 size={16} style={{ color: 'var(--brand-primary)' }} />
              )}
            </div>
            <div style={{ marginBottom: '6px' }}>
              <span className="badge badge-cyan" style={{ fontSize: '0.675rem' }}>Background 10 Jobs (Async)</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
              Enterprise batch generation across 10 concurrent background worker jobs with automatic quality validation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
