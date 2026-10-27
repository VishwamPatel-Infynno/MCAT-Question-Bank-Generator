import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function WizardStep1Section({
  selectedSection,
  onSelectSection,
  SECTION_METADATA,
  sectionMeta,
  pacing,
  onAutoAdvance,
  presets = [],
  onApplyPreset,
  totalQuestions
}) {
  const handleCardClick = (secId) => {
    onSelectSection(secId);
    if (onAutoAdvance) {
      setTimeout(() => {
        onAutoAdvance();
      }, 220);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Step Header */}
      <div className="wizard-heading-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h2 className="wizard-step-title">Choose MCAT Exam Section</h2>
          <span className="badge-minimal" style={{ fontSize: '0.72rem' }}>
            ⏱️ {pacing.target || '~96s / Q'} Target Pacing
          </span>
        </div>
        <p className="wizard-step-subtitle">
          Select an official AAMC section. Each section calibrates scientific disciplines, high-yield topics, and cognitive distractor traps.
        </p>
      </div>

      {/* Sleek Quick Presets Pill Row */}
      {presets && presets.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-light)',
            fontSize: '0.75rem'
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={12} color="var(--brand-primary)" />
            <span>Quick Start:</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
            {presets.map((preset) => {
              const isMatch = selectedSection === preset.section && totalQuestions === preset.total;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onApplyPreset?.(preset)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 9px',
                    borderRadius: 'var(--radius-full)',
                    background: isMatch ? 'var(--brand-light)' : 'var(--bg-surface)',
                    border: isMatch ? '1px solid var(--border-brand)' : '1px solid var(--border-light)',
                    color: isMatch ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    fontWeight: isMatch ? 600 : 500,
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={preset.desc}
                >
                  <span>{preset.label}</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.75 }}>({preset.tag})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4 Section Selection Cards */}
      <div className="wizard-sections-grid">
        {Object.values(SECTION_METADATA).map((sec) => {
          const Icon = sec.icon;
          const isSelected = selectedSection === sec.id;
          return (
            <div
              key={sec.id}
              className={`wizard-section-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleCardClick(sec.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(sec.id);
                }
              }}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
            >
              <div className="wizard-section-top">
                <div
                  className="wizard-section-icon-badge"
                  style={{
                    background: isSelected ? 'var(--brand-primary)' : 'var(--bg-surface-hover)',
                    color: isSelected ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  <Icon size={16} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isSelected && (
                    <CheckCircle2 size={15} style={{ color: 'var(--brand-primary)' }} />
                  )}
                  <span className="badge-minimal" style={{ fontSize: '0.68rem' }}>{sec.tag}</span>
                </div>
              </div>

              <div className="wizard-section-name">{sec.label}</div>
              <div className="wizard-section-desc">{sec.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Minimalist Section Coach Tip */}
      {sectionMeta.coachTip && (
        <div style={{
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderLeft: '3px solid var(--brand-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}>
          <Sparkles size={14} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>{sectionMeta.label} Tip:</strong>{' '}
            <span>
              {sectionMeta.coachTip.replace(/^⚡ Exam Coach Tip:\s*/, '')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
