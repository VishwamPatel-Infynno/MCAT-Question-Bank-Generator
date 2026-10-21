import React from 'react';
import { Minus, Plus } from 'lucide-react';

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
                  padding: '5px 8px',
                  background: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Single</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    id="btn-p-single-minus"
                    onClick={() => handlePassageSingleChange && handlePassageSingleChange(passageSingleCount - 1)}
                    disabled={passageSingleCount <= 0}
                    style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <Minus size={9} />
                  </button>
                  <span style={{ fontSize: '0.725rem', fontWeight: 700, minWidth: '12px', textAlign: 'center' }}>
                    {passageSingleCount}
                  </span>
                  <button
                    type="button"
                    id="btn-p-single-plus"
                    onClick={() => handlePassageSingleChange && handlePassageSingleChange(passageSingleCount + 1)}
                    disabled={passageSingleCount >= passageQuestionCount}
                    style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <Plus size={9} />
                  </button>
                </div>
              </div>

              {/* Passage Multi */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  background: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Multi</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    id="btn-p-multi-minus"
                    onClick={() => handlePassageMultiChange && handlePassageMultiChange(passageMultiCount - 1)}
                    disabled={passageMultiCount <= 0}
                    style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <Minus size={9} />
                  </button>
                  <span style={{ fontSize: '0.725rem', fontWeight: 700, minWidth: '12px', textAlign: 'center', color: passageMultiCount > 0 ? 'var(--brand-indigo)' : 'var(--text-primary)' }}>
                    {passageMultiCount}
                  </span>
                  <button
                    type="button"
                    id="btn-p-multi-plus"
                    onClick={() => handlePassageMultiChange && handlePassageMultiChange(passageMultiCount + 1)}
                    disabled={passageMultiCount >= passageQuestionCount}
                    style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <Plus size={9} />
                  </button>
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
                  padding: '5px 8px',
                  background: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Single</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    id="btn-ind-single-minus"
                    onClick={() => handleIndependentSingleChange && handleIndependentSingleChange(independentSingleCount - 1)}
                    disabled={independentSingleCount <= 0}
                    style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <Minus size={9} />
                  </button>
                  <span style={{ fontSize: '0.725rem', fontWeight: 700, minWidth: '12px', textAlign: 'center' }}>
                    {independentSingleCount}
                  </span>
                  <button
                    type="button"
                    id="btn-ind-single-plus"
                    onClick={() => handleIndependentSingleChange && handleIndependentSingleChange(independentSingleCount + 1)}
                    disabled={independentSingleCount >= (totalQuestions - passageQuestionCount)}
                    style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <Plus size={9} />
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  background: 'var(--bg-surface-subtle)',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Multi</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    id="btn-ind-multi-minus"
                    onClick={() => handleIndependentMultiChange && handleIndependentMultiChange(independentMultiCount - 1)}
                    disabled={independentMultiCount <= 0}
                    style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <Minus size={9} />
                  </button>
                  <span style={{ fontSize: '0.725rem', fontWeight: 700, minWidth: '12px', textAlign: 'center', color: independentMultiCount > 0 ? 'var(--brand-indigo)' : 'var(--text-primary)' }}>
                    {independentMultiCount}
                  </span>
                  <button
                    type="button"
                    id="btn-ind-multi-plus"
                    onClick={() => handleIndependentMultiChange && handleIndependentMultiChange(independentMultiCount + 1)}
                    disabled={independentMultiCount >= (totalQuestions - passageQuestionCount)}
                    style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <Plus size={9} />
                  </button>
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
                padding: '5px 8px',
                background: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-light)'
              }}
            >
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Single Choice</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  id="btn-single-count-minus"
                  onClick={() => handleSingleCountChange && handleSingleCountChange(singleChoiceCount - 1)}
                  disabled={singleChoiceCount <= 0}
                  style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <Minus size={9} />
                </button>
                <span style={{ fontSize: '0.725rem', fontWeight: 700, minWidth: '12px', textAlign: 'center' }}>
                  {singleChoiceCount}
                </span>
                <button
                  type="button"
                  id="btn-single-count-plus"
                  onClick={() => handleSingleCountChange && handleSingleCountChange(singleChoiceCount + 1)}
                  disabled={singleChoiceCount >= totalQuestions}
                  style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <Plus size={9} />
                </button>
              </div>
            </div>

            {/* Multi Choice Counter */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 8px',
                background: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-light)'
              }}
            >
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Multiple Choice</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  id="btn-multi-count-minus"
                  onClick={() => handleMultiCountChange && handleMultiCountChange(multiChoiceCount - 1)}
                  disabled={multiChoiceCount <= 0}
                  style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <Minus size={9} />
                </button>
                <span style={{ fontSize: '0.725rem', fontWeight: 700, minWidth: '12px', textAlign: 'center', color: multiChoiceCount > 0 ? 'var(--brand-indigo)' : 'var(--text-primary)' }}>
                  {multiChoiceCount}
                </span>
                <button
                  type="button"
                  id="btn-multi-count-plus"
                  onClick={() => handleMultiCountChange && handleMultiCountChange(multiChoiceCount + 1)}
                  disabled={multiChoiceCount >= totalQuestions}
                  style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <Plus size={9} />
                </button>
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
                padding: '5px 8px',
                background: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-light)'
              }}
            >
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Reading Passage</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  id="btn-passage-count-minus"
                  onClick={() => handlePassageCountChange && handlePassageCountChange(passageCount - 1)}
                  disabled={passageCount <= 0}
                  style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <Minus size={9} />
                </button>
                <span style={{ fontSize: '0.725rem', fontWeight: 700, minWidth: '12px', textAlign: 'center', color: passageCount > 0 ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                  {passageCount}
                </span>
                <button
                  type="button"
                  id="btn-passage-count-plus"
                  onClick={() => handlePassageCountChange && handlePassageCountChange(passageCount + 1)}
                  disabled={passageCount >= totalQuestions}
                  style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <Plus size={9} />
                </button>
              </div>
            </div>

            {/* Direct Question (No Passage) (Derived) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '5px 8px',
                background: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-light)'
              }}
            >
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Direct (No Passage)</span>
              <span style={{ fontSize: '0.725rem', fontWeight: 700, paddingRight: '4px', color: 'var(--text-muted)' }}>
                {totalQuestions - passageCount}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
