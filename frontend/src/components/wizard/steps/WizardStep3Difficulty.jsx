import React from 'react';
import { Layers, FileText, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export default function WizardStep3Difficulty({
  selectedSection,
  difficulty,
  setDifficulty,
  DIFFICULTY_TIERS,
  passageMode,
  handlePassageModeChange
}) {
  const isCars = selectedSection === 'cars';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div className="wizard-heading-group">
        <h2 className="wizard-step-title">How challenging should this be, and what is your set format?</h2>
        <p className="wizard-step-subtitle">
          Calibrated to official AAMC MCAT standards. Generates an authentic, publication-grade 5-question batch.
        </p>
      </div>

      {/* Difficulty Cards */}
      <div>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', display: 'block' }}>
          Select Challenge Level:
        </label>
        <div className="wizard-difficulty-grid">
          {DIFFICULTY_TIERS.map((tier) => {
            const isSelected = difficulty.toLowerCase() === tier.id;
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

      {/* Fixed 5-Question Batch Size Card */}
      <div
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Batch Quantity: Exactly 5 Questions
            </span>
            <span className="badge badge-purple" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
              Official MCAT Standard
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Each generation run strictly produces a calibrated set of 5 AAMC MCAT items (fixed batch size).
          </div>
        </div>
        <div
          style={{
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--brand-light)',
            border: '1px solid var(--border-brand)',
            fontSize: '0.85rem',
            fontWeight: 700,
            color: 'var(--brand-primary)'
          }}
        >
          5 Questions (Fixed)
        </div>
      </div>

      {/* Binary Passage Selection */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
          Question Set Structure (Passage vs. Discretes):
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
                All 5 questions are strictly linked to a single scholarly passage (500–650 words). Independent discretes are not permitted.
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
                    Passage-Based Set (All 5 Questions)
                  </span>
                </div>
                <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                  AAMC CARS Locked
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                1 continuous scholarly passage (humanities or social sciences, 500–650 words) with all 5 questions testing comprehension, reasoning within the text, and reasoning beyond the text.
              </p>
            </div>
          </div>
        ) : (
          /* Sciences Mode: Binary choice between 1 Passage Set OR 5 Discretes */
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
              style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={18} style={{ color: 'var(--brand-primary)' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Passage-Based Set (5 Questions)
                  </span>
                </div>
                {passageMode === 'single_passage' && (
                  <CheckCircle2 size={16} style={{ color: 'var(--brand-primary)' }} />
                )}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                All 5 questions are anchored to <strong>1 single shared passage</strong> (scientific experiment, biochemical pathway, or research data). 100% passage-linked.
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '6px' }}>
                <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                  Authentic AAMC Exam Set
                </span>
              </div>
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
              style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} style={{ color: 'var(--status-teal)' }} />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Independent Discretes (5 Questions)
                  </span>
                </div>
                {passageMode === 'independent' && (
                  <CheckCircle2 size={16} style={{ color: 'var(--status-teal)' }} />
                )}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                All 5 questions are <strong>independent standalone items</strong> with separate stems and distinct scientific concepts (no shared passage).
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '6px' }}>
                <span className="badge badge-teal" style={{ fontSize: '0.7rem' }}>
                  High-Yield Discrete Practice
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Status Callout Banner */}
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-xs)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-light)',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Sparkles size={14} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
          <span>
            {passageMode === 'single_passage' || isCars ? (
              <>
                <strong>Selected:</strong> 1 shared passage (500–650 words) + 5 passage-linked questions with step-by-step rationales.
              </>
            ) : (
              <>
                <strong>Selected:</strong> 5 independent discrete questions with individual stems and scientific explanations.
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
