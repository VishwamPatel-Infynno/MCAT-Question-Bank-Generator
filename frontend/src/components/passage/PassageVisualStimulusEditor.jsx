import React from 'react';
import { Image as ImageIcon, Trash2 } from 'lucide-react';
import VisualStimulusViewer from '../question/VisualStimulusViewer';

/**
 * PassageVisualStimulusEditor
 *
 * Dedicated figure showcase card for an MCAT reading passage.
 * Displays the visual stimulus clearly and provides a direct 'Discard Image'
 * option if an image is attached. If no image exists, renders nothing to eliminate clutter.
 */
export default function PassageVisualStimulusEditor({
  imageUrl = '',
  imageSvg = '',
  imageDescription = '',
  onDiscardImage
}) {
  const hasConfiguredVisual = Boolean(imageUrl || imageSvg);

  if (!hasConfiguredVisual) {
    return null;
  }

  return (
    <div
      style={{
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-surface-elevated)',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ImageIcon size={15} color="var(--brand-primary)" />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Passage Figure / Diagram
          </span>
          <span className="badge badge-emerald" style={{ fontSize: '0.62rem' }}>
            Attached
          </span>
        </div>

        {onDiscardImage && (
          <button
            type="button"
            onClick={onDiscardImage}
            className="btn-ghost"
            style={{
              padding: '4px 8px',
              fontSize: '0.72rem',
              color: 'var(--status-danger)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Remove this image from the passage"
          >
            <Trash2 size={12} />
            <span>Discard Image</span>
          </button>
        )}
      </div>

      <VisualStimulusViewer
        imageUrl={imageUrl}
        imageSvg={imageSvg}
        imageDescription={imageDescription}
      />
    </div>
  );
}
