import React, { useState } from 'react';
import {
  Image as ImageIcon,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="wizard-heading-group">
        <h2 className="wizard-step-title">Visual Stimulus & Custom Pedagogical Focus</h2>
        <p className="wizard-step-subtitle">
          Configure autonomous scientific diagrams, targeted student mistake patterns, and custom clinical vignette requirements.
        </p>
      </div>

      {/* Decision 1: Scientific Diagrams & Visuals */}
      <div className="wizard-stacked-decision">
        <div className="wizard-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="wizard-decision-num">1</span>
            <span className="wizard-decision-title">AI Visual Stimulus (Diagrams & Figures)</span>
          </div>
          {isCars ? (
            <span className="badge-minimal" style={{ fontSize: '0.72rem', color: 'var(--amber-warning, #f59e0b)', borderColor: 'var(--amber-warning, #f59e0b)' }}>
              CARS: Text-Only Standard
            </span>
          ) : (
            <span className="badge-minimal" style={{ fontSize: '0.72rem' }}>
              Autonomous AI Discretion
            </span>
          )}
        </div>

        {isCars ? (
          /* CARS Mode: Strictly Text-Only Notice */
          <div
            style={{
              padding: '16px 18px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--amber-warning, #f59e0b)',
                flexShrink: 0
              }}
            >
              <Lock size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                Strict AAMC CARS Standard (Figures Prohibited)
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Official AAMC Critical Analysis and Reasoning Skills passages and questions are strictly 100% text-based humanities and social sciences. Figures, data tables, and diagrams are locked out to protect examination fidelity.
              </div>
            </div>
          </div>
        ) : (
          /* Science Mode: Unified AI-Determined Diagram Toggle */
          <div
            style={{
              padding: '18px 20px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    AI-Determined Visuals When Needed
                  </span>
                  <span
                    className="badge-minimal"
                    style={{
                      fontSize: '0.68rem',
                      color: allowAiImages ? 'var(--brand-primary)' : 'var(--text-muted)',
                      borderColor: allowAiImages ? 'var(--brand-primary)' : 'var(--border-light)'
                    }}
                  >
                    {allowAiImages ? 'AI Active' : 'Off'}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {passageMode === 'single_passage'
                    ? 'When enabled, the AI evaluates whether your shared passage study (e.g. enzyme kinetics, metabolic pathway, or assay data) requires a scientific figure, and generates it on-demand.'
                    : 'When enabled, the AI evaluates each independent item and generates an illustrative figure (e.g. ray diagram, electric circuit, Lineweaver-Burk plot) only when pedagogically essential.'}
                </div>
              </div>

              {/* Toggle Pill Track */}
              <div
                className="pill-track"
                style={{
                  width: '280px',
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
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.78rem' }}
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
                    padding: '8px 12px',
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <Sparkles size={13} />
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
                padding: '10px 14px',
                borderRadius: 'var(--radius-xs)',
                background: allowAiImages ? 'rgba(79, 70, 229, 0.05)' : 'var(--bg-surface-subtle)',
                border: `1px dashed ${allowAiImages ? 'rgba(79, 70, 229, 0.3)' : 'var(--border-light)'}`,
                fontSize: '0.74rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: allowAiImages ? 'var(--brand-primary)' : 'var(--text-muted)' }}>
                {allowAiImages ? <CheckCircle2 size={14} /> : <Info size={14} />}
                <span>
                  {allowAiImages
                    ? 'AI Discretion Enabled: Only generated if scientifically necessary.'
                    : 'Text-Only Mode: All generated items will be strictly textual with zero diagram costs.'}
                </span>
              </div>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                {allowAiImages ? `${imagePriceLabel} (billed only when generated)` : '$0.00 image cost'}
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
            <span className="wizard-decision-title">Mistake Pattern & Vignette Focus</span>
          </div>
          <span className="wizard-decision-tag">Optional Refinement</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Likely Mistake Pattern */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
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
                  fontSize: '0.74rem',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {isCustomMistake ? 'Select Preset Pattern' : '+ Custom Mistake Pattern'}
              </button>
            </div>

            {isCustomMistake ? (
              <input
                type="text"
                placeholder="e.g. Inverts Michaelis-Menten Lineweaver-Burk slope (Km/Vmax instead of 1/Vmax)..."
                value={customMistakePattern || ''}
                onChange={(e) => {
                  setCustomMistakePattern?.(e.target.value);
                  setLikelyMistakePattern?.(e.target.value);
                }}
                className="input-field"
                style={{ width: '100%', fontSize: '0.8rem' }}
              />
            ) : (
              <select
                value={likelyMistakePattern || ''}
                onChange={(e) => setLikelyMistakePattern?.(e.target.value)}
                className="input-field"
                style={{ width: '100%', fontSize: '0.8rem' }}
              >
                <option value="">None / Smart AI Choice (Automatic)</option>
                {LIKELY_MISTAKE_PATTERNS.map((mp) => (
                  <option key={mp.id} value={mp.id}>
                    {mp.label}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Custom Prompt / Scenario */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lightbulb size={14} style={{ color: 'var(--brand-primary)' }} />
              <span>Custom Vignette Focus / Research Guidance (Optional):</span>
            </label>
            <textarea
              placeholder="e.g. Focus on SDS-PAGE reducing vs non-reducing conditions, or include a Western Blot assay in a neurodegenerative disease context..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt?.(e.target.value)}
              rows={2}
              className="input-field"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: '0.8rem',
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
