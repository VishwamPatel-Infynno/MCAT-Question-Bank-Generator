import React, { useState, useEffect } from 'react';
import { X, Settings, Sliders, Image } from 'lucide-react';
import { fetchSettings, updateSettings } from '../../services/api';
import { MODEL_OPTIONS, DEFAULT_TEXT_MODEL, IMAGE_RESOLUTION_PRESETS } from '../../constants/config';

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
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '580px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        borderRadius: 'var(--radius-lg)',
        background: '#ffffff',
        border: '1px solid var(--border-light)',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: 'var(--brand-primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--brand-primary)'
            }}>
              <Settings size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                DeepInfra &amp; Model Configuration
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Configure DeepInfra API key, Llama 3.3 Turbo, and FLUX-1-schnell image generator.
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
              DeepInfra Primary Text Model
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
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Ultra-low latency: $0.10 input / $0.32 output per 1M tokens.
            </div>
          </div>

          {/* DeepInfra API Key Input */}
          <div style={{
            background: 'var(--brand-primary-light)',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #bae6fd'
          }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: 'var(--brand-primary-dark)', marginBottom: '6px' }}>
              DeepInfra API Key (Required for Turbo Llama &amp; FLUX.1)
            </label>
            <input
              id="settings-input-deepinfra-key"
              type="password"
              placeholder="e.g. your_deepinfra_api_key_here (or set in .env)"
              value={deepinfraKey}
              onChange={(e) => setDeepinfraKey(e.target.value)}
              style={{ width: '100%', background: '#ffffff' }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', marginTop: '6px', fontWeight: 500 }}>
              Get your key from <a href="https://deepinfra.com/dash/api_keys" target="_blank" rel="noreferrer" style={{ color: 'var(--brand-primary)', textDecoration: 'underline', fontWeight: 700 }}>deepinfra.com/dash/api_keys</a>
            </div>
          </div>

          {/* FLUX-1-schnell Image Generator Section */}
          <div style={{
            background: '#fafafa',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-md)',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Image size={16} color="var(--brand-primary)" />
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Image Model: black-forest-labs/FLUX-1-schnell
                </span>
              </div>
              <span className="badge badge-primary" style={{ fontSize: '0.72rem', fontWeight: 700 }}>
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
                        border: isSelected ? '2px solid var(--brand-primary)' : '1px solid #cbd5e1',
                        background: isSelected ? 'var(--brand-primary-light)' : '#ffffff',
                        color: isSelected ? 'var(--brand-primary-dark)' : 'var(--text-primary)',
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
                  Inference Steps (iters)
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
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                FLUX.1 Schnell is optimized for 1–4 steps (4 steps recommended for crisp diagrams).
              </div>
            </div>

            {/* Mathematical Cost Formula Card */}
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              padding: '8px 10px',
              fontSize: '0.72rem',
              color: '#166534',
              lineHeight: 1.4
            }}>
              <strong>Official Formula:</strong> $0.0005 × ({imageWidth} / 1024) × ({imageHeight} / 1024) × {imageIters} iters = <strong>${liveImageCost}</strong>
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
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              If a question scores ≤ 90 on the psychometric rubric, the Re-Generator agent will refine it up to {maxRegenerations} times.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-light)' }}>
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
  );
}
