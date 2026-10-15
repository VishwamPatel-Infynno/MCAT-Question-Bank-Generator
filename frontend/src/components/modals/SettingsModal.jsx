import React, { useState, useEffect } from 'react';
import { X, Settings, Sliders, Image, ExternalLink } from 'lucide-react';
import { fetchSettings, updateSettings } from '../../services/api';
import { MODEL_OPTIONS, DEFAULT_TEXT_MODEL, IMAGE_RESOLUTION_PRESETS } from '../../constants/config';
import InfynnoLogo from '../common/InfynnoLogo';

export default function SettingsModal({ onClose }) {
  const [model, setModel] = useState(DEFAULT_TEXT_MODEL);
  const [deepinfraKey, setDeepinfraKey] = useState('');
  const [maxRegenerations, setMaxRegenerations] = useState(3);

  // FLUX-1-schnell Image Settings
  const [imageWidth, setImageWidth] = useState(1024);
  const [imageHeight, setImageHeight] = useState(1024);
  const [imageIters, setImageIters] = useState(4);

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings().then(cfg => {
      if (cfg.default_text_model) setModel(cfg.default_text_model);
      if (cfg.max_regenerations) setMaxRegenerations(cfg.max_regenerations);
      if (cfg.image_width) setImageWidth(cfg.image_width);
      if (cfg.image_height) setImageHeight(cfg.image_height);
      if (cfg.image_iters) setImageIters(cfg.image_iters);
    }).catch(() => {});
  }, []);

  const liveImageCost = (0.0005 * (imageWidth / 1024) * (imageHeight / 1024) * imageIters).toFixed(5);

  const handleSave = async () => {
    const payload = {
      default_text_model: model,
      max_regenerations: maxRegenerations,
      image_width: imageWidth,
      image_height: imageHeight,
      image_iters: imageIters
    };
    if (deepinfraKey.trim()) payload.deepinfra_api_key = deepinfraKey.trim();

    await updateSettings(payload);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px'
      }}
    >
      <div
        className="glass-panel-elevated"
        style={{
          width: '100%',
          maxWidth: '580px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'var(--brand-light)',
                border: '1px solid var(--border-brand)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-primary)'
              }}
            >
              <Settings size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Enterprise Engine &amp; Gateway Configuration
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Configure high-throughput inference keys, multi-agent reasoning thresholds, and visual stimulus parameters.
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn-secondary" style={{ padding: '6px', borderRadius: '50%' }}>
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Text Model */}
          <div>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Autonomous Reasoning Engine
            </label>
            <select
              id="settings-select-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{ width: '100%' }}
            >
              {MODEL_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              High-throughput multi-agent inference: $0.10 input / $0.32 output per 1M tokens.
            </div>
          </div>

          {/* Gateway API Key Input */}
          <div
            style={{
              background: 'var(--brand-light)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-brand)'
            }}
          >
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: 'var(--brand-primary)', marginBottom: '6px' }}>
              Inference Gateway Key
            </label>
            <input
              id="settings-input-deepinfra-key"
              type="password"
              placeholder="Enter gateway credentials or configure via server environment (.env)"
              value={deepinfraKey}
              onChange={(e) => setDeepinfraKey(e.target.value)}
              style={{ width: '100%' }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', marginTop: '6px', fontWeight: 500 }}>
              Supply your enterprise gateway key for high-throughput generation, or set in backend environment.
            </div>
          </div>

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
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Stimulus Engine: High-Resolution Psychometric Diagram Engine
                </span>
              </div>
              <span className="badge badge-cyan" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
                ${liveImageCost} / image
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
                  Inference Precision Steps (iters)
                </label>
                <span className="badge badge-amber" style={{ fontSize: '0.72rem' }}>
                  {imageIters} steps
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
                Optimized for 1–4 steps (4 steps recommended for crisp psychometric diagrams).
              </div>
            </div>

            {/* Cost Formula Card */}
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
              <strong>Engine Rate:</strong> $0.0005 × ({imageWidth} / 1024) × ({imageHeight} / 1024) × {imageIters} iters = <strong>${liveImageCost}</strong>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
            UK UCAT Question Studio v2.0 • An Infynno Solutions Product
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>

            <button
              id="settings-btn-save"
              onClick={handleSave}
              className="btn-primary"
              style={{ background: savedSuccess ? '#10b981' : undefined }}
            >
              {savedSuccess ? 'Saved Successfully!' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
