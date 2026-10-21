import React from 'react';
import { Image } from 'lucide-react';
import NumberStepper from '../common/NumberStepper';

export default function IndependentDiagramControls({
  isAbstractReasoning = false,
  numIndependentQs = 0,
  passageMode = 'single_passage',
  activeQuestionImagesCount = 0,
  indSingleTotal = 0,
  indMultiTotal = 0,
  indSingleIndices = [],
  indMultiIndices = [],
  activeSingleImageCount = 0,
  activeMultiImageCount = 0,
  setSingleImageCount,
  setMultiImageCount
}) {
  if (isAbstractReasoning || numIndependentQs <= 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--border-light)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {passageMode === 'single_passage' ? 'Independent Qs with Diagrams' : 'Questions with Diagrams'}
        </span>
        <span className="badge-minimal" style={{ fontSize: '0.625rem' }}>
          {activeQuestionImagesCount > 0
            ? `${activeQuestionImagesCount} of ${numIndependentQs} Qs ($${(activeQuestionImagesCount * 0.002).toFixed(4)})`
            : 'No Diagrams'}
        </span>
      </div>

      {/* 1. Single Choice Diagrams Control */}
      {indSingleTotal > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '6px 8px',
            background: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Single Choice Diagrams
            </span>
            <span className="badge-minimal" style={{ fontSize: '0.585rem' }}>
              {activeSingleImageCount > 0
                ? `${activeSingleImageCount} of ${indSingleTotal} ($${(activeSingleImageCount * 0.002).toFixed(4)})`
                : 'No Diagrams'}
            </span>
          </div>

          {indSingleTotal === 1 ? (
            <div className="pill-track" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {[
                { id: 'no', label: 'No Diagram' },
                { id: 'yes', label: 'With Diagram' }
              ].map(opt => {
                const hasImage = activeSingleImageCount > 0;
                const isSel = opt.id === 'yes' ? hasImage : !hasImage;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    id={`btn-single-choice-diag-${opt.id}`}
                    onClick={() => {
                      if (setSingleImageCount) {
                        setSingleImageCount(opt.id === 'yes' ? 1 : 0, indSingleIndices, indMultiIndices);
                      }
                    }}
                    className={`pill-track-btn ${isSel ? 'active' : ''}`}
                    style={{ width: '100%', padding: '4px' }}
                  >
                    {opt.id === 'yes' && <Image size={11} />}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <NumberStepper
              value={activeSingleImageCount}
              min={0}
              max={indSingleTotal}
              onChange={(cnt) => setSingleImageCount && setSingleImageCount(cnt, indSingleIndices, indMultiIndices)}
              idPrefix="btn-single-img"
              chipIdPrefix="btn-chip-single-img"
              quickChips={true}
              size="sm"
              bgCard={true}
              activeColor="var(--brand-primary)"
              titleMinus="Decrease single choice questions with diagrams"
              titlePlus="Increase single choice questions with diagrams"
            />
          )}
        </div>
      )}

      {/* 2. Multiple Choice Diagrams Control */}
      {indMultiTotal > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '6px 8px',
            background: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Multiple Choice Diagrams
            </span>
            <span className="badge-minimal" style={{ fontSize: '0.585rem' }}>
              {activeMultiImageCount > 0
                ? `${activeMultiImageCount} of ${indMultiTotal} ($${(activeMultiImageCount * 0.002).toFixed(4)})`
                : 'No Diagrams'}
            </span>
          </div>

          {indMultiTotal === 1 ? (
            <div className="pill-track" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {[
                { id: 'no', label: 'No Diagram' },
                { id: 'yes', label: 'With Diagram' }
              ].map(opt => {
                const hasImage = activeMultiImageCount > 0;
                const isSel = opt.id === 'yes' ? hasImage : !hasImage;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    id={`btn-multi-choice-diag-${opt.id}`}
                    onClick={() => {
                      if (setMultiImageCount) {
                        setMultiImageCount(opt.id === 'yes' ? 1 : 0, indSingleIndices, indMultiIndices);
                      }
                    }}
                    className={`pill-track-btn ${isSel ? 'active' : ''}`}
                    style={{ width: '100%', padding: '4px' }}
                  >
                    {opt.id === 'yes' && <Image size={11} />}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <NumberStepper
              value={activeMultiImageCount}
              min={0}
              max={indMultiTotal}
              onChange={(cnt) => setMultiImageCount && setMultiImageCount(cnt, indSingleIndices, indMultiIndices)}
              idPrefix="btn-multi-img"
              chipIdPrefix="btn-chip-multi-img"
              quickChips={true}
              size="sm"
              bgCard={true}
              activeColor="var(--brand-indigo)"
              titleMinus="Decrease multiple choice questions with diagrams"
              titlePlus="Increase multiple choice questions with diagrams"
            />
          )}
        </div>
      )}
    </div>
  );
}
