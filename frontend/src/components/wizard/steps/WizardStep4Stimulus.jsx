import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import IndependentDiagramControls from '../IndependentDiagramControls';
import { DEFAULT_IMAGE_MODEL, IMAGE_PRICING } from '../../../constants/config';

export default function WizardStep4Stimulus({
  totalQuestions,
  passageRequired,
  setPassageRequired,
  setPassageCount,
  setPassageMode,
  requirePassageImage,
  setRequirePassageImage,
  isAbstractReasoning,
  imageQuestionIndices,
  imageMode,
  setImageCount,
  passageMode,
  numIndependentQs,
  activeQuestionImagesCount,
  indSingleTotal,
  indMultiTotal,
  indSingleIndices,
  indMultiIndices,
  activeSingleImageCount,
  activeMultiImageCount,
  setSingleImageCount,
  setMultiImageCount,
  COGNITIVE_TRAPS,
  primaryTrap,
  setPrimaryTrap,
  customPrompt,
  setCustomPrompt
}) {
  const imageUnitRate = IMAGE_PRICING[DEFAULT_IMAGE_MODEL]?.baseRate ?? 0.014;
  const imagePriceLabel = `$${imageUnitRate.toFixed(3)} / img`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div className="wizard-heading-group">
        <h2 className="wizard-step-title">Add reading passages, diagrams, and tricky traps</h2>
        <p className="wizard-step-subtitle">
          Customise your practice set with reading passages, AI-generated diagrams, and specific distractor traps.
        </p>
      </div>

      {/* 1 Question Passage & Diagram Toggles */}
      {totalQuestions === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-light)' }}>
          {/* Reading Material */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Reading Passage Story
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Include a 250-400 word realistic clinical or academic reading passage.
              </div>
            </div>
            <div className="pill-track" style={{ width: '260px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {[
                { id: 'No', label: 'Standalone Item' },
                { id: 'Yes', label: 'With Passage' }
              ].map(opt => {
                const isSel = passageRequired === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    id={`btn-wizard-p-${opt.id.toLowerCase()}`}
                    onClick={() => {
                      setPassageRequired(opt.id);
                      setPassageCount(opt.id === 'Yes' ? 1 : 0);
                      setPassageMode(opt.id === 'Yes' ? 'single_passage' : 'independent');
                    }}
                    className={`pill-track-btn ${isSel ? 'active' : ''}`}
                    style={{ width: '100%', padding: '6px' }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* If Passage Active: Passage Diagram Toggle */}
          {passageRequired === 'Yes' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed var(--border-light)', paddingTop: '10px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Passage Diagram
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Attach an AI-generated diagram illustration to the reading passage ({imagePriceLabel} flat).
                </div>
              </div>
              <div className="pill-track" style={{ width: '220px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <button
                  type="button"
                  id="btn-wizard-single-p-diag-no"
                  onClick={() => setRequirePassageImage && setRequirePassageImage(false)}
                  className={`pill-track-btn ${!requirePassageImage ? 'active' : ''}`}
                  style={{ width: '100%', padding: '6px' }}
                >
                  No Diagram
                </button>
                <button
                  type="button"
                  id="btn-wizard-single-p-diag-yes"
                  onClick={() => setRequirePassageImage && setRequirePassageImage(true)}
                  className={`pill-track-btn ${requirePassageImage ? 'active' : ''}`}
                  style={{ width: '100%', padding: '6px' }}
                >
                  <ImageIcon size={12} />
                  <span>With Diagram</span>
                </button>
              </div>
            </div>
          )}

          {/* If Direct Question & Not Abstract Reasoning: Question Diagram Toggle */}
          {!isAbstractReasoning && passageRequired === 'No' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed var(--border-light)', paddingTop: '10px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Question Diagram
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Attach an AI visual pattern or diagram to the question stem ({imagePriceLabel} flat).
                </div>
              </div>
              <div className="pill-track" style={{ width: '220px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {[
                  { id: 'no', label: 'Text Only' },
                  { id: 'yes', label: 'With Diagram' }
                ].map(opt => {
                  const hasImage = (imageQuestionIndices || []).includes(1) || imageMode === 'all';
                  const isSel = opt.id === 'yes' ? hasImage : !hasImage;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      id={`btn-wizard-single-diag-${opt.id}`}
                      onClick={() => {
                        if (opt.id === 'yes') {
                          if (setImageCount) setImageCount(1, [1]);
                        } else {
                          if (setImageCount) setImageCount(0, [1]);
                        }
                      }}
                      className={`pill-track-btn ${isSel ? 'active' : ''}`}
                      style={{ width: '100%', padding: '6px' }}
                    >
                      {opt.id === 'yes' && <ImageIcon size={12} />}
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* If > 1 Question: Passage Diagram & Independent Diagram Controls */}
      {totalQuestions > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-light)' }}>
          {passageMode === 'single_passage' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Shared Passage Diagram
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Generate a dedicated AI diagram for the shared reading passage ({imagePriceLabel} flat).
                </div>
              </div>
              <div className="pill-track" style={{ width: '220px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <button
                  type="button"
                  id="btn-wizard-p-diag-no"
                  onClick={() => setRequirePassageImage && setRequirePassageImage(false)}
                  className={`pill-track-btn ${!requirePassageImage ? 'active' : ''}`}
                  style={{ width: '100%', padding: '6px' }}
                >
                  No Diagram
                </button>
                <button
                  type="button"
                  id="btn-wizard-p-diag-yes"
                  onClick={() => setRequirePassageImage && setRequirePassageImage(true)}
                  className={`pill-track-btn ${requirePassageImage ? 'active' : ''}`}
                  style={{ width: '100%', padding: '6px' }}
                >
                  <ImageIcon size={12} />
                  <span>With Diagram</span>
                </button>
              </div>
            </div>
          )}

          {/* Independent Questions with Diagrams Controls */}
          <IndependentDiagramControls
            isAbstractReasoning={isAbstractReasoning}
            numIndependentQs={numIndependentQs}
            passageMode={passageMode}
            activeQuestionImagesCount={activeQuestionImagesCount}
            indSingleTotal={indSingleTotal}
            indMultiTotal={indMultiTotal}
            indSingleIndices={indSingleIndices}
            indMultiIndices={indMultiIndices}
            activeSingleImageCount={activeSingleImageCount}
            activeMultiImageCount={activeMultiImageCount}
            setSingleImageCount={setSingleImageCount}
            setMultiImageCount={setMultiImageCount}
          />
        </div>
      )}

      {/* Cognitive Trap Selector */}
      <div>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
          Choose a tricky trap for the wrong answers (distractors):
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px' }}>
          {COGNITIVE_TRAPS.map((trap) => {
            const isSelected = primaryTrap === trap.id;
            return (
              <div
                key={trap.id}
                className={`wizard-tier-card ${isSelected ? 'selected' : ''}`}
                style={{ padding: '12px 14px' }}
                onClick={() => setPrimaryTrap(trap.id)}
                role="button"
                tabIndex={0}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                  {trap.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {trap.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Guidelines Prompt */}
      <div>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
          Any custom instructions for the AI? (Optional):
        </label>
        <textarea
          className="input-textarea"
          rows={2}
          placeholder="e.g. Focus on enzyme kinetics with Lineweaver-Burk plots, make Option B a tempting Out of Scope trap, or test Michaelis-Menten constants..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          style={{ width: '100%', resize: 'vertical' }}
        />
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          💡 Tip: Type any specific MCAT biochemical pathway, equation, research design, or distractor style you want the AI to include!
        </div>
      </div>
    </div>
  );
}
