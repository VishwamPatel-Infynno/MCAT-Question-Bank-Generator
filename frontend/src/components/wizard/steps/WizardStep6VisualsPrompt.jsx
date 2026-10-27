import React, { useState } from 'react';
import {
  Lightbulb,
  Sparkles,
  Lock,
  CheckCircle2,
  Info
} from 'lucide-react';
import {
  DEFAULT_IMAGE_MODEL,
  IMAGE_PRICING,
  LIKELY_MISTAKE_PATTERNS
} from '../../../constants';

export default function WizardStep6VisualsPrompt({
  selectedSection = 'chem_phys',
  passageMode = 'single_passage',
  allowAiImages = false,
  setAllowAiImages,
  likelyMistakePattern = '',
  setLikelyMistakePattern,
  customMistakePattern = '',
  setCustomMistakePattern,
  customPrompt = '',
  setCustomPrompt
}) {
  const [isCustomMistake, setIsCustomMistake] = useState(Boolean(customMistakePattern));

  const isCars = selectedSection === 'cars';
  const imageUnitRate = IMAGE_PRICING[DEFAULT_IMAGE_MODEL]?.baseRate ?? 0.014;
  const imagePriceLabel = `$${imageUnitRate.toFixed(3)} / image`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="wizard-heading-group">
        <h2 className="wizard-step-title">Visuals &amp; Custom Directives</h2>
        <p className="wizard-step-subtitle">
          Configure autonomous scientific diagrams, targeted student mistake patterns, and optional clinical vignette guidance.
        </p>
      </div>

      {/* Decision 1: Scientific Diagrams & Visuals */}
      <div className="wizard-stacked-decision">
        <div className="wizard-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="wizard-decision-num">1</span>
            <span className="wizard-decision-title">Scientific Figures &amp; Visuals</span>
          </div>
          {isCars ? (
            <span className="badge-minimal" style={{ fontSize: '0.7rem', color: '#e11d48' }}>
              CARS: Text-Only Standard
            </span>
          ) : (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Autonomous AI Discretion
            </span>
          )}
        </div>

        {isCars ? (
          /* CARS Mode: Strictly Text-Only Notice */
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--radius-xs)',
                background: 'rgba(245, 158, 11, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--amber-warning, #f59e0b)',
                flexShrink: 0
              }}
            >
              <Lock size={14} />
            </div>
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                AAMC CARS Standard (Text-Only)
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                Official CARS passages are strictly text-based humanities &amp; social sciences. Figures are locked out.
              </div>
            </div>
          </div>
        ) : (
          /* Science Mode: Unified AI-Determined Diagram Toggle */
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 260px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    AI-Determined Scientific Visuals
                  </span>
                  <span
                    className="badge-minimal"
                    style={{
                      fontSize: '0.66rem',
                      color: allowAiImages ? 'var(--brand-primary)' : 'var(--text-muted)'
                    }}
                  >
                    {allowAiImages ? 'Active' : 'Off'}
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {passageMode === 'single_passage'
                    ? 'Evaluates whether your passage study (e.g. enzyme kinetics or assay data) requires a figure, and generates on-demand.'
                    : 'Evaluates each item and generates an illustrative diagram (e.g. circuit or ray diagram) only when essential.'}
                </div>
              </div>

              {/* Toggle Pill Track */}
              <div
                className="pill-track"
                style={{
                  width: '220px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  flexShrink: 0
                }}
              >
                <button
                  type="button"
                  id="btn-wizard-ai-visuals-off"
                  onClick={() => setAllowAiImages?.(false)}
                  className={`pill-track-btn ${!allowAiImages ? 'active' : ''}`}
                  style={{ width: '100%', padding: '6px 10px', fontSize: '0.75rem' }}
                >
                  Disabled
                </button>
                <button
                  type="button"
                  id="btn-wizard-ai-visuals-on"
                  onClick={() => setAllowAiImages?.(true)}
                  className={`pill-track-btn ${allowAiImages ? 'active' : ''}`}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Sparkles size={12} />
                  <span>When Needed</span>
                </button>
              </div>
            </div>

            {/* Sub-card with pricing & status indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--radius-xs)',
                background: allowAiImages ? 'var(--brand-light)' : 'var(--bg-surface-subtle)',
                border: `1px solid ${allowAiImages ? 'var(--border-brand)' : 'var(--border-light)'}`,
                fontSize: '0.72rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: allowAiImages ? 'var(--brand-primary)' : 'var(--text-muted)' }}>
                {allowAiImages ? <CheckCircle2 size={13} /> : <Info size={13} />}
                <span>
                  {allowAiImages
                    ? 'AI Discretion Active: Only rendered if scientifically necessary.'
                    : 'Text-Only Mode: Strictly textual items with zero diagram compute.'}
                </span>
              </div>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                {allowAiImages ? `${imagePriceLabel}` : '$0.00 cost'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Subtle connector */}
      <div className="wizard-decision-connector" />

      {/* Decision 2: Student Mistake Pattern & Vignette Prompt */}
      <div className="wizard-stacked-decision">
        <div className="wizard-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="wizard-decision-num">2</span>
            <span className="wizard-decision-title">Mistake Pattern &amp; Vignette Directives</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Optional Focus</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Likely Mistake Pattern */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Target Student Mistake Pattern:
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomMistake(!isCustomMistake);
                  if (isCustomMistake) {
                    setCustomMistakePattern?.('');
                  }
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--brand-primary)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {isCustomMistake ? 'Select Preset Pattern' : '+ Custom Pattern'}
              </button>
            </div>

            {isCustomMistake ? (
              <input
                type="text"
                placeholder="e.g. Inverts Lineweaver-Burk slope (Km/Vmax instead of 1/Vmax)..."
                value={customMistakePattern || ''}
                onChange={(e) => {
                  setCustomMistakePattern?.(e.target.value);
                  setLikelyMistakePattern?.(e.target.value);
                }}
                className="input-field"
                style={{ width: '100%', fontSize: '0.78rem', height: '32px' }}
              />
            ) : (
              <select
                value={likelyMistakePattern || 'Automatic'}
                onChange={(e) => setLikelyMistakePattern?.(e.target.value)}
                className="input-field"
                style={{ width: '100%', fontSize: '0.78rem', height: '32px' }}
              >
                <option value="Automatic">✨ Automatic (Smart AI Student Misconception Diagnosis)</option>
                <option value="None">None (Standard distractor design without specific error focus)</option>
                <optgroup label="Preset AAMC Student Mistake Patterns">
                  {LIKELY_MISTAKE_PATTERNS.map((mp) => (
                    <option key={mp.id} value={mp.id}>
                      {mp.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            )}
          </div>

          {/* Custom Prompt / Scenario */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Lightbulb size={13} style={{ color: 'var(--brand-primary)' }} />
              <span>Custom Vignette Focus / Research Guidance (Optional):</span>
            </label>
            <textarea
              placeholder="e.g. Include an SDS-PAGE assay or Western Blot in a neurodegenerative disease context..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt?.(e.target.value)}
              rows={2}
              className="input-field"
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: '0.78rem',
                resize: 'vertical',
                lineHeight: 1.45
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
