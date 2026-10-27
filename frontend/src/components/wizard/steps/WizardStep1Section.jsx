import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function WizardStep1Section({
  selectedSection,
  onSelectSection,
  SECTION_METADATA,
  sectionMeta,
  pacing,
  onAutoAdvance
}) {
  const handleCardClick = (secId) => {
    onSelectSection(secId);
    if (onAutoAdvance) {
      setTimeout(() => {
        onAutoAdvance();
      }, 240);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="wizard-heading-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h2 className="wizard-step-title">Which AAMC MCAT section would you like to practice?</h2>
          <span className="badge-minimal">
            ⏱️ {pacing.target || '~96s / Q'} Target Speed
          </span>
        </div>
        <p className="wizard-step-subtitle">
          Select one of the four official exam sections below. Each section activates tailored scientific disciplines, official pacing guidelines, and scoring criteria.
        </p>
      </div>

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
                  <Icon size={18} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isSelected && (
                    <CheckCircle2 size={15} style={{ color: 'var(--brand-primary)' }} />
                  )}
                  <span className="badge-minimal">{sec.tag}</span>
                </div>
              </div>

              <div className="wizard-section-name">{sec.label}</div>
              <div className="wizard-section-desc">{sec.desc}</div>
            </div>
          );
        })}
      </div>

      {/* Interactive Section Coach Tip */}
      {sectionMeta.coachTip && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-surface-subtle)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.825rem',
          color: 'var(--text-secondary)'
        }}>
          <Sparkles size={16} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>Tip for {sectionMeta.label}:</strong>{' '}
            <span>
              {sectionMeta.coachTip.replace(/^⚡ Exam Coach Tip:\s*/, '')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
