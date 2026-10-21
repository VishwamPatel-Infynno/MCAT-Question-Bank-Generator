import React, { useState, useEffect, useCallback } from 'react';
import { 
  Maximize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Copy, 
  Check, 
  Image as ImageIcon, 
  X,
  FileCode
} from 'lucide-react';

/**
 * VisualStimulusViewer:
 * Publication-grade renderer for UK UCAT visual stimulus diagrams (Vector SVG & AI FLUX Images).
 * Supports inline display, click-to-zoom lightbox modal, pan/zoom controls, SVG source copying,
 * and inline description editing in Quick Edit mode.
 */
export default function VisualStimulusViewer({
  question,
  isEditing = false,
  editedDescription = '',
  onDescriptionChange = null,
  compact = false
}) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [copiedSvg, setCopiedSvg] = useState(false);

  // Extract visual data from question or stage outcomes
  const svgContent = question?.image_svg || question?.stage_outcomes?.visual_stimulus?.image_svg || null;
  const imageUrl = question?.image_url || question?.stage_outcomes?.visual_stimulus?.image_url || null;
  const rawDescription = isEditing 
    ? (editedDescription ?? question?.image_description ?? '')
    : (question?.image_description || question?.stage_outcomes?.visual_stimulus?.image_description || '');

  // Handle escape key to close lightbox
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && isLightboxOpen) {
      setIsLightboxOpen(false);
      setZoomLevel(1.0);
    }
  }, [isLightboxOpen]);

  useEffect(() => {
    if (isLightboxOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isLightboxOpen, handleKeyDown]);

  if (!svgContent && !imageUrl) {
    return null;
  }

  const isSvg = Boolean(svgContent);
  const visualType = isSvg ? 'SVG Vector Diagram' : 'Infynno Neural Diagram';

  const handleCopySvg = (e) => {
    e?.stopPropagation();
    if (!svgContent) return;
    navigator.clipboard.writeText(svgContent);
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 2000);
  };

  const handleZoomIn = (e) => {
    e?.stopPropagation();
    setZoomLevel(prev => Math.min(2.5, Number((prev + 0.25).toFixed(2))));
  };

  const handleZoomOut = (e) => {
    e?.stopPropagation();
    setZoomLevel(prev => Math.max(0.5, Number((prev - 0.25).toFixed(2))));
  };

  const handleResetZoom = (e) => {
    e?.stopPropagation();
    setZoomLevel(1.0);
  };

  // Compact Thumbnail View for list cards
  if (compact) {
    return (
      <div 
        style={{
          background: '#ffffff',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          padding: '6px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          maxHeight: '120px'
        }}
      >
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase' }}>
            Visual Stimulus
          </span>
          <span className="badge badge-purple" style={{ fontSize: '0.575rem', padding: '1px 5px' }}>
            {isSvg ? 'SVG' : 'AI Diagram'}
          </span>
        </div>
        <div 
          style={{ width: '100%', maxHeight: '85px', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}
        >
          {isSvg ? (
            <div 
              style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}
              dangerouslySetInnerHTML={{ __html: svgContent }} 
            />
          ) : (
            <img 
              src={imageUrl} 
              alt={rawDescription || 'Stimulus'} 
              style={{ maxHeight: '85px', maxWidth: '100%', objectFit: 'contain' }} 
            />
          )}
        </div>
      </div>
    );
  }

  // Full Interactive Inline Viewer
  return (
    <>
      <div
        className="visual-stimulus-card"
        style={{
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {/* Stimulus Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span 
              style={{ 
                fontSize: '0.725rem', 
                fontWeight: 700, 
                color: 'var(--text-muted)', 
                textTransform: 'uppercase', 
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <ImageIcon size={13} color="var(--brand-primary)" />
              Visual Stimulus Diagram
            </span>
            <span 
              className="badge badge-purple" 
              style={{ fontSize: '0.625rem', padding: '2px 6px', fontWeight: 600 }}
            >
              {visualType}
            </span>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isSvg && (
              <button
                type="button"
                onClick={handleCopySvg}
                className="btn-secondary"
                style={{ padding: '3px 8px', fontSize: '0.675rem', gap: '4px' }}
                title="Copy raw SVG vector markup to clipboard"
              >
                {copiedSvg ? <Check size={11} color="var(--status-success)" /> : <Copy size={11} />}
                <span>{copiedSvg ? 'Copied' : 'Copy SVG'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setZoomLevel(1.0);
                setIsLightboxOpen(true);
              }}
              className="btn-secondary"
              style={{ padding: '3px 8px', fontSize: '0.675rem', gap: '4px' }}
              title="Expand diagram to fullscreen inspect mode"
            >
              <Maximize2 size={11} />
              <span>Fullscreen</span>
            </button>
          </div>
        </div>

        {/* Visual Render Container (Always Light-Themed for Standard Psychometric Contrast) */}
        <div
          onClick={() => setIsLightboxOpen(true)}
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-sm)',
            padding: '12px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '220px',
            maxHeight: '380px',
            overflow: 'hidden',
            cursor: 'zoom-in',
            position: 'relative'
          }}
          title="Click to expand full resolution diagram"
        >
          {isSvg ? (
            <div
              style={{
                width: '100%',
                maxHeight: '350px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          ) : (
            <img
              src={imageUrl}
              alt={rawDescription || 'UK UCAT Stimulus Diagram'}
              style={{
                maxWidth: '100%',
                maxHeight: '350px',
                objectFit: 'contain',
                borderRadius: '4px'
              }}
            />
          )}
        </div>

        {/* Stimulus Caption / Description */}
        <div>
          {isEditing ? (
            <div>
              <label 
                style={{ 
                  display: 'block', 
                  fontSize: '0.65rem', 
                  fontWeight: 600, 
                  color: 'var(--text-muted)', 
                  marginBottom: '2px' 
                }}
              >
                Diagram Description / Clinical Caption:
              </label>
              <input
                type="text"
                value={editedDescription}
                onChange={(e) => onDescriptionChange && onDescriptionChange(e.target.value)}
                placeholder="e.g. Set A vs Set B geometric pattern rules..."
                style={{ width: '100%', fontSize: '0.8rem', padding: '4px 8px' }}
              />
            </div>
          ) : (
            rawDescription && (
              <div
                style={{
                  fontSize: '0.725rem',
                  fontStyle: 'italic',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  paddingTop: '2px'
                }}
              >
                Fig 1: {rawDescription}
              </div>
            )
          )}
        </div>
      </div>

      {/* Lightbox Modal Overlay */}
      {isLightboxOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 8, 15, 0.88)',
            backdropFilter: 'blur(6px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
            animation: 'fadeIn 0.15s ease-out'
          }}
          onClick={() => {
            setIsLightboxOpen(false);
            setZoomLevel(1.0);
          }}
        >
          {/* Modal Header Strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                Visual Stimulus Inspector
              </span>
              <span className="badge badge-purple" style={{ fontSize: '0.675rem' }}>
                {visualType}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Zoom: {Math.round(zoomLevel * 100)}%
              </span>
            </div>

            {/* Modal Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={handleZoomIn}
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px' }}
                title="Zoom in (+25%)"
              >
                <ZoomIn size={13} />
                <span>Zoom In</span>
              </button>

              <button
                type="button"
                onClick={handleZoomOut}
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px' }}
                title="Zoom out (-25%)"
              >
                <ZoomOut size={13} />
                <span>Zoom Out</span>
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px' }}
                title="Reset zoom to 100%"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>

              {isSvg && (
                <button
                  type="button"
                  onClick={handleCopySvg}
                  className="btn-secondary"
                  style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px' }}
                  title="Copy SVG markup"
                >
                  {copiedSvg ? <Check size={13} color="var(--status-success)" /> : <FileCode size={13} />}
                  <span>{copiedSvg ? 'Copied' : 'Copy SVG'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsLightboxOpen(false);
                  setZoomLevel(1.0);
                }}
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: '0.75rem', gap: '4px', background: 'rgba(255, 255, 255, 0.1)' }}
                title="Close lightbox (Esc)"
              >
                <X size={14} />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Modal Content Stage */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'auto',
              padding: '20px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                boxShadow: 'var(--shadow-lg)',
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
                maxWidth: '90vw',
                maxHeight: '75vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'auto'
              }}
            >
              {isSvg ? (
                <div
                  style={{
                    width: '760px',
                    maxWidth: '100%',
                    display: 'flex',
                    justifyContent: 'center'
                  }}
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              ) : (
                <img
                  src={imageUrl}
                  alt={rawDescription || 'Visual Stimulus'}
                  style={{
                    maxWidth: '85vw',
                    maxHeight: '70vh',
                    objectFit: 'contain'
                  }}
                />
              )}
            </div>

            {/* Modal Caption */}
            {rawDescription && (
              <div
                style={{
                  marginTop: '16px',
                  color: '#e2e8f0',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  textAlign: 'center',
                  background: 'rgba(15, 23, 42, 0.65)',
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                Fig: {rawDescription}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
