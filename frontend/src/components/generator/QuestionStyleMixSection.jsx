import React from 'react';
import NumberStepper from '../common/NumberStepper';

export default function QuestionStyleMixSection({
  totalQuestions = 1,
  passageMode = 'single_passage',
  passageQuestionCount = 2,
  passageSingleCount = 1,
  passageMultiCount = 1,
  independentSingleCount = 1,
  independentMultiCount = 1,
  singleChoiceCount = 1,
  multiChoiceCount = 0,
  passageCount = 0,
  handlePassageSingleChange,
  handlePassageMultiChange,
  handleIndependentSingleChange,
  handleIndependentMultiChange,
  handleSingleCountChange,
  handleMultiCountChange,
  handlePassageCountChange
}) {
  const isMixedSet = totalQuestions > 1 && passageMode === 'single_passage' && passageQuestionCount < totalQuestions;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {isMixedSet ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {/* Passage Group Formats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Passage Items ({passageQuestionCount} Qs) Style
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {/* Passage Single */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '3px 6px',
                  background: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <span style={{ fontSize: '0.675rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Single</span>
                <div style={{ width: '74px' }}>
                  <NumberStepper
                    value={passageSingleCount}
                    min={0}
                    max={passageQuestionCount}
                    onChange={(val) => handlePassageSingleChange && handlePassageSingleChange(val)}
                    idPrefix="btn-p-single"
                    size="sm"
                    label={(val) => val}
                    bgCard={true}
                    titleMinus="Decrease passage single choice questions"
                    titlePlus="Increase passage single choice questions"
                  />
                </div>
              </div>

              {/* Passage Multi */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '3px 6px',
                  background: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <span style={{ fontSize: '0.675rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Multi</span>
                <div style={{ width: '74px' }}>
                  <NumberStepper
                    value={passageMultiCount}
                    min={0}
                    max={passageQuestionCount}
                    onChange={(val) => handlePassageMultiChange && handlePassageMultiChange(val)}
                    idPrefix="btn-p-multi"
                    size="sm"
                    label={(val) => val}
                    bgCard={true}
                    activeColor="var(--brand-indigo)"
                    titleMinus="Decrease passage multiple choice questions"
                    titlePlus="Increase passage multiple choice questions"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Independent Group Formats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Independent Items ({totalQuestions - passageQuestionCount} Qs) Style
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '3px 6px',
                  background: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <span style={{ fontSize: '0.675rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Single</span>
                <div style={{ width: '74px' }}>
                  <NumberStepper
                    value={independentSingleCount}
                    min={0}
                    max={totalQuestions - passageQuestionCount}
                    onChange={(val) => handleIndependentSingleChange && handleIndependentSingleChange(val)}
                    idPrefix="btn-ind-single"
                    size="sm"
                    label={(val) => val}
                    bgCard={true}
                    titleMinus="Decrease independent single choice questions"
                    titlePlus="Increase independent single choice questions"
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '3px 6px',
                  background: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <span style={{ fontSize: '0.675rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Multi</span>
                <div style={{ width: '74px' }}>
                  <NumberStepper
                    value={independentMultiCount}
                    min={0}
                    max={totalQuestions - passageQuestionCount}
                    onChange={(val) => handleIndependentMultiChange && handleIndependentMultiChange(val)}
                    idPrefix="btn-ind-multi"
                    size="sm"
                    label={(val) => val}
                    bgCard={true}
                    activeColor="var(--brand-indigo)"
                    titleMinus="Decrease independent multiple choice questions"
                    titlePlus="Increase independent multiple choice questions"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Question Style Mix ({singleChoiceCount} Single, {multiChoiceCount} Multi)
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {/* Single Choice Counter */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '3px 6px',
                background: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-light)'
              }}
            >
              <span style={{ fontSize: '0.675rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Single Choice</span>
              <div style={{ width: '74px' }}>
                <NumberStepper
                  value={singleChoiceCount}
                  min={0}
                  max={totalQuestions}
                  onChange={(val) => handleSingleCountChange && handleSingleCountChange(val)}
                  idPrefix="btn-single-count"
                  size="sm"
                  label={(val) => val}
                  bgCard={true}
                  titleMinus="Decrease single choice count"
                  titlePlus="Increase single choice count"
                />
              </div>
            </div>

            {/* Multi Choice Counter */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '3px 6px',
                background: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-light)'
              }}
            >
              <span style={{ fontSize: '0.675rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Multiple Choice</span>
              <div style={{ width: '74px' }}>
                <NumberStepper
                  value={multiChoiceCount}
                  min={0}
                  max={totalQuestions}
                  onChange={(val) => handleMultiCountChange && handleMultiCountChange(val)}
                  idPrefix="btn-multi-count"
                  size="sm"
                  label={(val) => val}
                  bgCard={true}
                  activeColor="var(--brand-indigo)"
                  titleMinus="Decrease multiple choice count"
                  titlePlus="Increase multiple choice count"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stimulus Length Breakdown (Only when passageMode === 'independent') */}
      {passageMode === 'independent' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Question Format Breakdown
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {/* Passage Counter */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '3px 6px',
                background: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-light)'
              }}
            >
              <span style={{ fontSize: '0.675rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Reading Passage</span>
              <div style={{ width: '74px' }}>
                <NumberStepper
                  value={passageCount}
                  min={0}
                  max={totalQuestions}
                  onChange={(val) => handlePassageCountChange && handlePassageCountChange(val)}
                  idPrefix="btn-passage-count"
                  size="sm"
                  label={(val) => val}
                  bgCard={true}
                  titleMinus="Decrease passage questions"
                  titlePlus="Increase passage questions"
                />
              </div>
            </div>

            {/* Direct Question (No Passage) (Derived) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '3px 6px',
                background: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-light)',
                minHeight: '28px',
                boxSizing: 'border-box'
              }}
            >
              <span style={{ fontSize: '0.675rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Direct (No Passage)</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, paddingRight: '12px', color: 'var(--text-muted)' }}>
                {totalQuestions - passageCount}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
