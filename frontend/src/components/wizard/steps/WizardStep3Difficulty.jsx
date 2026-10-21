import React from 'react';
import NumberStepper from '../../common/NumberStepper';
import QuestionStyleMixSection from '../QuestionStyleMixSection';

export default function WizardStep3Difficulty({
  difficulty,
  setDifficulty,
  DIFFICULTY_TIERS,
  totalQuestions,
  handleTotalChange,
  SINGLE_ANSWER_FORMATS,
  interactionType,
  setInteractionType,
  setSingleChoiceCount,
  setMultiChoiceCount,
  passageMode,
  handlePassageModeChange,
  passageQuestionCount,
  handlePassageQuestionCountChange,
  passageSingleCount,
  handlePassageSingleChange,
  passageMultiCount,
  handlePassageMultiChange,
  independentSingleCount,
  handleIndependentSingleChange,
  independentMultiCount,
  handleIndependentMultiChange,
  singleChoiceCount,
  handleSingleCountChange,
  multiChoiceCount,
  handleMultiCountChange,
  passageCount,
  handlePassageCountChange
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div className="wizard-heading-group">
        <h2 className="wizard-step-title">How challenging should this be, and how many questions do you need?</h2>
        <p className="wizard-step-subtitle">
          Pick your challenge level and choose how many single-choice or multi-statement items to generate.
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
                role="button"
                tabIndex={0}
              >
                <div className="wizard-tier-title">{tier.title}</div>
                <div className="wizard-tier-desc">{tier.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Total Questions Stepper */}
      <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              How Many Questions?
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Create a single quick question or a practice batch of up to 5 questions.
            </div>
          </div>
          <div style={{ width: '130px' }}>
            <NumberStepper
              value={totalQuestions}
              min={1}
              max={5}
              onChange={handleTotalChange}
              idPrefix="btn-wizard-qty"
              label={(val) => `${val} Qs`}
              titleMinus="Decrease questions"
              titlePlus="Increase questions"
            />
          </div>
        </div>
      </div>

      {/* If 1 Question: Answer Style Single vs Multiple Answers */}
      {totalQuestions === 1 && (
        <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-light)' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
            Question Answer Format:
          </label>
          <div className="pill-track" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
            {SINGLE_ANSWER_FORMATS.map(opt => {
              const isSel = interactionType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  id={`btn-wizard-mode-${opt.id}`}
                  onClick={() => {
                    setInteractionType(opt.id);
                    setSingleChoiceCount(opt.id === 'multi_choice' ? 0 : 1);
                    setMultiChoiceCount(opt.id === 'multi_choice' ? 1 : 0);
                  }}
                  className={`pill-track-btn ${isSel ? 'active' : ''}`}
                  style={{ width: '100%', padding: '8px' }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* If > 1 Question: Full Batch Allocation & Question Style Mix */}
      {totalQuestions > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-light)' }}>
          {/* Reading Material Mode: Single Passage Set vs Independent Questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Reading Passage Setup
              </span>
              <span className="badge badge-purple" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                {passageMode === 'single_passage' ? '1 Passage • Linked Questions' : 'Separate Scenarios'}
              </span>
            </div>

            <div className="pill-track" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {[
                { id: 'single_passage', label: 'Shared Reading Passage (Common Story)' },
                { id: 'independent', label: 'Independent Questions (Separate Vignettes)' }
              ].map(opt => {
                const isSel = passageMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    id={`btn-wizard-passage-mode-${opt.id}`}
                    onClick={() => handlePassageModeChange(opt.id)}
                    className={`pill-track-btn ${isSel ? 'active' : ''}`}
                    style={{ width: '100%', padding: '8px' }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {passageMode === 'single_passage' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Questions attached to the Shared Passage:
                  </span>
                  <div style={{ width: '140px' }}>
                    <NumberStepper
                      value={passageQuestionCount}
                      min={1}
                      max={totalQuestions}
                      onChange={handlePassageQuestionCountChange}
                      idPrefix="btn-wizard-passage-qty"
                      activeColor="var(--status-purple)"
                      label={(val) => `${val} of ${totalQuestions}`}
                      titleMinus="Decrease passage question count"
                      titlePlus="Increase passage question count"
                    />
                  </div>
                </div>

                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--brand-light)',
                    border: '1px solid var(--border-brand)',
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.4
                  }}
                >
                  {passageQuestionCount === totalQuestions ? (
                    <>
                      <strong style={{ color: 'var(--brand-primary)' }}>Full Passage Set:</strong> All {totalQuestions} questions will share 1 reading passage (250–400 words), just like real UCAT exam sets.
                    </>
                  ) : (
                    <>
                      <strong style={{ color: 'var(--status-purple)' }}>Mixed Practice Set:</strong> {passageQuestionCount} questions will share the reading passage; the remaining {totalQuestions - passageQuestionCount} will be standalone questions.
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Precision Answer Style Breakdown */}
          <div style={{ borderTop: '1px dashed var(--border-light)', paddingTop: '12px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
              Answer Style Mix:
            </label>
            <QuestionStyleMixSection
              totalQuestions={totalQuestions}
              passageMode={passageMode}
              passageQuestionCount={passageQuestionCount}
              passageSingleCount={passageSingleCount}
              passageMultiCount={passageMultiCount}
              independentSingleCount={independentSingleCount}
              independentMultiCount={independentMultiCount}
              singleChoiceCount={singleChoiceCount}
              multiChoiceCount={multiChoiceCount}
              passageCount={passageCount}
              handlePassageSingleChange={handlePassageSingleChange}
              handlePassageMultiChange={handlePassageMultiChange}
              handleIndependentSingleChange={handleIndependentSingleChange}
              handleIndependentMultiChange={handleIndependentMultiChange}
              handleSingleCountChange={handleSingleCountChange}
              handleMultiCountChange={handleMultiCountChange}
              handlePassageCountChange={handlePassageCountChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
