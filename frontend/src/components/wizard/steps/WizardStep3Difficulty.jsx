import React from 'react';
import {
  Layers,
  FileText,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { QUESTION_TYPES as ALL_QUESTION_TYPES } from '../../../constants/mcat';

export default function WizardStep3Difficulty({
  selectedSection,
  difficulty,
  setDifficulty,
  DIFFICULTY_TIERS,
  passageMode,
  handlePassageModeChange,
  totalQuestions = 5,
  setTotalQuestions,
  questionType = 'DISCRETE_MCQ',
  setQuestionType
}) {
  const isCars = selectedSection === 'cars';
  const typesList = ALL_QUESTION_TYPES;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div className="wizard-heading-group">
        <h2 className="wizard-step-title">Calibrate Difficulty, Question Type & Batch Size</h2>
        <p className="wizard-step-subtitle">
          Calibrated to official AAMC MCAT standards. Tailor the cognitive demand, interaction format, and batch size.
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

      {/* Official Question Type Selector (8 types from Manager Taxonomy) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Official AAMC Question Type:
          </label>
          <span className="badge-minimal">8 Standard Types</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '8px' }}>
          {typesList.map((qt) => {
            const isSelected = questionType === qt.id;
            return (
              <div
                key={qt.id}
                onClick={() => setQuestionType?.(qt.id)}
                className={`wizard-tier-card ${isSelected ? 'selected' : ''}`}
                style={{
                  padding: '12px 14px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    {qt.label}
                  </span>
                  {isSelected && <CheckCircle2 size={14} style={{ color: 'var(--brand-primary)' }} />}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                  {qt.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Configurable Batch Quantity (1 to 10 Questions) */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Batch Quantity: {totalQuestions} {totalQuestions === 1 ? 'Question' : 'Questions'}
              </span>
              <span className="badge badge-purple" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                Configurable Batch
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Select how many questions to generate in this batch (1 to 10 questions, default 5).
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[1, 3, 5, 8, 10].map((qty) => (
              <button
                key={qty}
                type="button"
                onClick={() => setTotalQuestions?.(qty)}
                className={`pill-track-btn ${totalQuestions === qty ? 'active' : ''}`}
                style={{
                  padding: '5px 12px',
                  fontSize: '0.8rem',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                {qty} Q
              </button>
            ))}
            <button
              type="button"
              id="btn-preset-50-batch"
              onClick={() => setTotalQuestions?.(50)}
              className={`pill-track-btn ${totalQuestions === 50 ? 'active' : ''}`}
              style={{
                padding: '5px 14px',
                fontSize: '0.8rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                background: totalQuestions === 50 ? 'var(--infynno-gradient)' : 'rgba(79, 48, 185, 0.12)',
                color: totalQuestions === 50 ? '#ffffff' : 'var(--brand-primary)',
                border: '1px solid rgba(79, 48, 185, 0.3)'
              }}
            >
              ⚡ 50 Q (10 Jobs)
            </button>
          </div>
        </div>

        {/* Range Slider for granular control (up to 10 for standard, 50 for full section) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>1</span>
          <input
            type="range"
            min={1}
            max={50}
            step={1}
            value={totalQuestions}
            onChange={(e) => setTotalQuestions?.(parseInt(e.target.value, 10))}
            style={{
              flex: 1,
              accentColor: 'var(--brand-primary)',
              cursor: 'pointer'
            }}
          />
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>50</span>
        </div>

        {totalQuestions === 50 && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(79, 48, 185, 0.08)',
              border: '1px solid rgba(79, 48, 185, 0.25)',
              fontSize: '0.8rem',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '4px'
            }}
          >
            <Layers size={20} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
            <div>
              <strong style={{ color: 'var(--brand-primary)' }}>50-Question Background Section Batch:</strong>{' '}
              Generates 50 questions organized into <strong>10 distinct jobs</strong> (5 questions per job) with controlled 2-job concurrency. Execution runs securely in the background and is tracked live in the <strong>Batch Activity</strong> screen.
            </div>
          </div>
        )}
      </div>

      {/* Binary Passage Selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
          Stimulus Arrangement (Passage Set vs. Standalone Discretes):
        </label>

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
                All questions are strictly linked to a single scholarly passage (500–650 words). Independent discretes are not permitted.
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
                    Passage-Based Set (All {totalQuestions} Questions)
                  </span>
                </div>
                <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                  AAMC CARS Locked
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                1 continuous scholarly passage (humanities or social sciences, 500–650 words) with all {totalQuestions} questions testing comprehension, reasoning within the text, and reasoning beyond the text.
              </p>
            </div>
          </div>
        ) : (
          /* Sciences Mode: Binary choice between 1 Passage Set OR Discretes */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
            {/* Mode A: Single Passage Set */}
            <div
              className={`wizard-tier-card ${passageMode === 'single_passage' ? 'selected' : ''}`}
              onClick={() => handlePassageModeChange('single_passage')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePassageModeChange('single_passage');
                }
              }}
              role="button"
              tabIndex={0}
              id="btn-passage-mode-single"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} style={{ color: 'var(--brand-primary)' }} />
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Passage-Based Set
                  </span>
                </div>
                {passageMode === 'single_passage' && (
                  <CheckCircle2 size={16} style={{ color: 'var(--brand-primary)' }} />
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                All {totalQuestions} questions linked to 1 continuous research or experimental passage stimulus.
              </p>
            </div>

            {/* Mode B: Independent Discretes */}
            <div
              className={`wizard-tier-card ${passageMode === 'independent' ? 'selected' : ''}`}
              onClick={() => handlePassageModeChange('independent')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePassageModeChange('independent');
                }
              }}
              role="button"
              tabIndex={0}
              id="btn-passage-mode-independent"
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} style={{ color: 'var(--status-purple)' }} />
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Independent Discretes
                  </span>
                </div>
                {passageMode === 'independent' && (
                  <CheckCircle2 size={16} style={{ color: 'var(--brand-primary)' }} />
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                {totalQuestions} standalone questions with zero reading passage (problem stated directly in the question stem).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
