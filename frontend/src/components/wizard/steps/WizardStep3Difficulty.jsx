import React from 'react';
import {
  Layers,
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export default function WizardStep3Difficulty({
  selectedSection,
  difficulty,
  setDifficulty,
  DIFFICULTY_TIERS,
  passageMode,
  handlePassageModeChange,
  _totalQuestions = 50,
  questionType = 'PASSAGE_BASED_MCQ',
  setQuestionType
}) {
  const isCars = selectedSection === 'cars';

  const selectPassageMode = (mode) => {
    handlePassageModeChange?.(mode);
    setQuestionType?.(mode === 'single_passage' ? 'PASSAGE_BASED_MCQ' : 'DISCRETE_MCQ');
  };

  const isPassage = isCars || passageMode === 'single_passage' || questionType === 'PASSAGE_BASED_MCQ';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div className="wizard-heading-group">
        <h2 className="wizard-step-title">Calibrate Challenge Level & Question Type</h2>
        <p className="wizard-step-subtitle">
          Calibrated to official AAMC MCAT standards. Tailor the cognitive demand and choose between Passage-Based or Independent Single-Choice MCQs.
        </p>
      </div>

      {/* Difficulty Cards */}
      <div>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', display: 'block' }}>
          Select Challenge Level:
        </label>
        <div className="wizard-difficulty-grid">
          {DIFFICULTY_TIERS.map((tier) => {
            const isSelected = difficulty?.toLowerCase() === tier.id.toLowerCase();
            return (
              <div
                key={tier.id}
                className={`wizard-tier-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setDifficulty(tier.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setDifficulty(tier.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
              >
                <div className="wizard-tier-title">{tier.title}</div>
                <div className="wizard-tier-desc">{tier.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unified MCAT Question Type Selector (Single Choice Only) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            MCAT Question Type (Single Choice MCQs Only):
          </label>
          <span className="badge-minimal" style={{ fontSize: '0.72rem' }}>
            Single Best Answer (A–D)
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
                All 50 questions are organized into passage sets across 10 jobs. Independent discretes are not permitted.
              </div>
            </div>

            <div
              className="wizard-tier-card selected"
              style={{ padding: '16px 18px', cursor: 'default' }}
            >
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
                10 continuous scholarly passages (500–650 words each) with 5 linked single-choice questions per passage testing comprehension, reasoning within the text, and reasoning beyond the text.
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
                    Passage-Based MCQ (Single Choice)
                  </span>
                </div>
                {isPassage && (
                  <CheckCircle2 size={16} style={{ color: 'var(--brand-primary)' }} />
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                50 questions organized into 10 passage sets (1 dedicated experimental or research passage stimulus per job, 5 linked single-choice questions each).
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
                    Independent MCQ (Single Choice)
                  </span>
                </div>
                {!isPassage && (
                  <CheckCircle2 size={16} style={{ color: 'var(--brand-primary)' }} />
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                50 standalone discrete single-choice questions with zero reading passages (problem stated directly in the question stem across all 10 jobs).
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Standard 50-Question Full-Section Batch Informational Card */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(79, 48, 185, 0.07)',
          border: '1px solid rgba(79, 48, 185, 0.22)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}
      >
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--infynno-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            flexShrink: 0
          }}
        >
          <Layers size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Standard Full-Section Batch: 50 Questions
            </span>
            <span className="badge badge-purple" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
              10 Parallel Jobs
            </span>
            <span className="badge-minimal" style={{ fontSize: '0.7rem' }}>
              AAMC Standard Size
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
            Generates 50 single-choice questions organized across <strong>10 distinct jobs (5 questions/job)</strong> running in the background with 2-worker concurrency. Live progress and questions are tracked in the <strong>Batch Activity</strong> view.
          </div>
        </div>
      </div>
    </div>
  );
}
