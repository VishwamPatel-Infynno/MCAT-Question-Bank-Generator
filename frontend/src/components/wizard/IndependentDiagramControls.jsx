import React from 'react';
import NumberStepper from '../common/NumberStepper';
import { DEFAULT_IMAGE_MODEL, IMAGE_PRICING } from '../../constants/config';

const EMPTY_ARRAY = [];

export default function IndependentDiagramControls({
  isAbstractReasoning = false,
  numIndependentQs = 0,
  passageMode = 'single_passage',
  activeQuestionImagesCount = 0,
  indSingleTotal = 0,
  indSingleIndices = EMPTY_ARRAY,
  activeSingleImageCount = 0,
  setSingleImageCount
}) {
  const imageUnitRate = IMAGE_PRICING[DEFAULT_IMAGE_MODEL]?.baseRate ?? 0.014;

  if (isAbstractReasoning || numIndependentQs <= 0) {
    return null;
  }

  const effectiveTotal = indSingleTotal || numIndependentQs;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--border-light)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {passageMode === 'single_passage' ? 'Independent Qs with Diagrams' : 'Questions with Diagrams'}
        </span>
        <span className="badge-minimal" style={{ fontSize: '0.625rem' }}>
          {activeQuestionImagesCount > 0
            ? `${activeQuestionImagesCount} of ${numIndependentQs} Qs ($${(activeQuestionImagesCount * imageUnitRate).toFixed(3)} flat)`
            : 'No Diagrams'}
        </span>
      </div>

      {/* Discrete Questions Diagrams Control */}
      {effectiveTotal > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '8px 10px',
            background: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Independent Questions with Diagrams
            </span>
            <span className="badge-minimal" style={{ fontSize: '0.62rem' }}>
              {activeSingleImageCount > 0
                ? `${activeSingleImageCount} of ${effectiveTotal} ($${(activeSingleImageCount * imageUnitRate).toFixed(3)} flat)`
                : 'No Diagrams'}
            </span>
          </div>

          <NumberStepper
            value={activeSingleImageCount}
            min={0}
            max={effectiveTotal}
            onChange={(cnt) => setSingleImageCount && setSingleImageCount(cnt, indSingleIndices, EMPTY_ARRAY)}
            idPrefix="btn-single-img"
            size="sm"
            bgCard={true}
            activeColor="var(--brand-primary)"
            titleMinus="Decrease independent questions with diagrams"
            titlePlus="Increase independent questions with diagrams"
          />
        </div>
      )}
    </div>
  );
}
