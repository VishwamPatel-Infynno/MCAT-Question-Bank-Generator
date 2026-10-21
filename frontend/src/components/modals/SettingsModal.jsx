import React, { useState, useEffect } from 'react';
import { X, Settings, Sliders, Image, ExternalLink } from 'lucide-react';
import { fetchSettings, updateSettings } from '../../services/api';
import { IMAGE_RESOLUTION_PRESETS } from '../../constants/config';
import InfynnoLogo from '../common/InfynnoLogo';

export default function SettingsModal({ onClose }) {
  const [maxRegenerations, setMaxRegenerations] = useState(3);

  // FLUX-1-schnell Image Settings
  const [imageWidth, setImageWidth] = useState(1024);
  const [imageHeight, setImageHeight] = useState(1024);
  const [imageIters, setImageIters] = useState(4);

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings().then(cfg => {
      if (cfg.max_regenerations) setMaxRegenerations(cfg.max_regenerations);
      if (cfg.image_width) setImageWidth(cfg.image_width);
      if (cfg.image_height) setImageHeight(cfg.image_height);
      if (cfg.image_iters) setImageIters(cfg.image_iters);
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    const payload = {
      max_regenerations: maxRegenerations,
      image_width: imageWidth,
      image_height: imageHeight,
      image_iters: imageIters
    };

    await updateSettings(payload);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
    >
      <div
        className="modal-card"
        style={{
          maxWidth: '580px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--brand-light)',
                border: '1px solid var(--border-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-primary)',
                flexShrink: 0
              }}
            >
              <Settings size={20} />
            </div>
            <div>
              <h3 className="modal-title">
                Studio Engine &amp; Generation Settings
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                Configure neural diagram resolution, precision calibration, and quality remediation.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: '6px', borderRadius: 'var(--radius-sm)' }}
            title="Close Settings"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="modal-body">

          {/* Diagram & Stimulus Generator Section */}
          <div
            style={{
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Image size={16} color="var(--brand-primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Visual Stimulus &amp; Diagram Settings (FLUX-2 Klein Neural Studio)
                </span>
              </div>
              <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                $0.014 / img Flat
              </span>
            </div>

            {/* Resolution Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Image Resolution (W × H)
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {IMAGE_RESOLUTION_PRESETS.map((preset) => {
                  const isSelected = imageWidth === preset.width && imageHeight === preset.height;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setImageWidth(preset.width);
                        setImageHeight(preset.height);
                      }}
                      style={{
                        padding: '8px 6px',
                        fontSize: '0.75rem',
                        fontWeight: isSelected ? 700 : 500,
                        borderRadius: '6px',
                        border: isSelected ? '1px solid var(--border-brand)' : '1px solid var(--border-light)',
                        background: isSelected ? 'var(--brand-primary)' : 'var(--bg-surface-elevated)',
                        color: isSelected ? '#ffffff' : 'var(--text-primary)',
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {preset.width} × {preset.height}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inference Steps Slider */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Neural Detail &amp; Calibration Level
                </label>
                <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
                  {imageIters} precision levels
                </span>
              </div>
              <input
                id="settings-range-image-iters"
                type="range"
                min="1"
                max="8"
                value={imageIters}
                onChange={(e) => setImageIters(Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Calibrated for optimal crispness in UCAT geometric and pattern diagrams.
              </div>
            </div>

            {/* Quality & Synthesis Card */}
            <div
              style={{
                background: 'var(--status-success-bg)',
                border: '1px solid var(--status-success-border)',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '0.72rem',
                color: 'var(--status-success)',
                lineHeight: 1.4
              }}
            >
              <strong>Resolution &amp; Quality:</strong> Optimized {imageWidth} × {imageHeight} High-Resolution Synthesis ($0.014 flat rate, ~1.88s latency)
            </div>
          </div>

          {/* Workflow Regeneration Controls */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sliders size={14} /> Max Remediation Attempts
              </label>
              <span className="badge badge-amber" style={{ fontSize: '0.75rem' }}>{maxRegenerations} Iterations</span>
            </div>
            <input
              id="settings-range-max-regen"
              type="range"
              min="1"
              max="5"
              value={maxRegenerations}
              onChange={(e) => setMaxRegenerations(Number(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              If a question scores ≤ 90 on the psychometric rubric, the Remediation Engine will refine it up to {maxRegenerations} times.
            </div>
          </div>

          {/* About Infynno Solutions LLP */}
          <div
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <InfynnoLogo width={28} height={18} />
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Infynno Solutions LLP
                </span>
                <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                  Creator &amp; Maintainer
                </span>
              </div>
              <a
                href="https://infynno.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="infynno-pill-link"
                style={{ fontSize: '0.7rem', padding: '3px 8px' }}
              >
                <span>infynno.com</span>
                <ExternalLink size={10} />
              </a>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Infynno builds product-grade custom software, SaaS, and AI-powered systems for founders and growing businesses globally.
              Clean engineering, transparent process, measurable outcomes.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            Infynno UCAT Question Bank Generator • An Infynno Solutions Product
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>

            <button
              id="settings-btn-save"
              onClick={handleSave}
              className="btn-primary"
              style={{ background: savedSuccess ? 'var(--status-success)' : undefined }}
            >
              {savedSuccess ? 'Saved Successfully!' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
