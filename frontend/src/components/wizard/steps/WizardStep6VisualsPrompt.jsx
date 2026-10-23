import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Lightbulb
} from 'lucide-react';
import IndependentDiagramControls from '../IndependentDiagramControls';
import { DEFAULT_IMAGE_MODEL, IMAGE_PRICING } from '../../../constants/config';
import {
  LIKELY_MISTAKE_PATTERNS
} from '../../../constants/mcat';

const EMPTY_ARRAY = [];

export default function WizardStep6VisualsPrompt({
  passageMode = 'single_passage',
  requirePassageImage = false,
  setRequirePassageImage,
  numIndependentQs = 0,
  activeQuestionImagesCount = 0,
  indSingleTotal = 0,
  indSingleIndices = EMPTY_ARRAY,
  activeSingleImageCount = 0,
  setSingleImageCount,
  likelyMistakePattern = '',
  setLikelyMistakePattern,
  customMistakePattern = '',
  setCustomMistakePattern,
  customPrompt = '',
  setCustomPrompt
}) {
  const [isCustomMistake, setIsCustomMistake] = useState(Boolean(customMistakePattern));

  const imageUnitRate = IMAGE_PRICING[DEFAULT_IMAGE_MODEL]?.baseRate ?? 0.014;
  const imagePriceLabel = `$${imageUnitRate.toFixed(3)} / img`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="wizard-heading-group">
        <h2 className="wizard-step-title">Visual Stimulus & Custom Pedagogical Focus</h2>
        <p className="wizard-step-subtitle">
          Configure optional scientific figures, targeted student mistake patterns, and custom clinical vignette requirements.
        </p>
      </div>

      {/* Decision 1: Scientific Diagrams & Visuals */}
      <div className="wizard-stacked-decision">
        <div className="wizard-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="wizard-decision-num">1</span>
            <span className="wizard-decision-title">Scientific Figures & Diagrams</span>
          </div>
          <span className="badge-minimal" style={{ fontSize: '0.72rem' }}>
            Optional Stimulus
          </span>
        </div>

        {passageMode === 'single_passage' ? (
          /* Passage Mode Diagram Control */
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-light)' }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '3px' }}>
                Shared Passage Scientific Figure
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                Generate an experimental chart, pathway diagram, or clinical figure for the reading passage ({imagePriceLabel} via DeepInfra).
              </div>
            </div>

            <div className="pill-track" style={{ width: '220px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <button
                type="button"
                id="btn-wizard-p-diag-no"
                onClick={() => setRequirePassageImage?.(false)}
                className={`pill-track-btn ${!requirePassageImage ? 'active' : ''}`}
                style={{ width: '100%', padding: '7px 12px', fontSize: '0.78rem' }}
              >
                No Diagram
              </button>
              <button
                type="button"
                id="btn-wizard-p-diag-yes"
                onClick={() => setRequirePassageImage?.(true)}
                className={`pill-track-btn ${requirePassageImage ? 'active' : ''}`}
                style={{ width: '100%', padding: '7px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <ImageIcon size={13} />
                <span>+1 Diagram</span>
              </button>
            </div>
          </div>
        ) : (
          /* Independent Mode Diagram Controls */
          <div style={{ padding: '16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-light)' }}>
            <IndependentDiagramControls
              numIndependentQs={numIndependentQs}
              activeQuestionImagesCount={activeQuestionImagesCount}
              indSingleTotal={indSingleTotal}
              indSingleIndices={indSingleIndices}
              activeSingleImageCount={activeSingleImageCount}
              setSingleImageCount={setSingleImageCount}
            />
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
