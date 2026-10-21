import React from 'react';
import { Sparkles } from 'lucide-react';

export default function WizardStep1Section({
  selectedSection,
  onSelectSection,
  SECTION_METADATA,
  sectionMeta,
  pacing
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="wizard-heading-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h2 className="wizard-step-title">Which UCAT section would you like to practice?</h2>
          <span className="badge-minimal">
            ⏱️ {pacing.target || '~28s / Q'} Target Speed
          </span>
        </div>
        <p className="wizard-step-subtitle">
          Select one of the five official exam sections below. Each section activates tailored questions, timing guidelines, and scoring criteria.
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
              onClick={() => onSelectSection(sec.id)}
              role="button"
              tabIndex={0}
            >
              <div className="wizard-section-top">
                <div
                  className="wizard-section-icon-badge"
                  style={{
                    background: isSelected ? 'var(--infynno-gradient)' : 'rgba(79, 48, 185, 0.1)',
                    color: isSelected ? '#ffffff' : sec.color
                  }}
                >
                  <Icon size={18} />
                </div>
                <span className="badge-minimal">{sec.tag}</span>
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
          borderRadius: 'var(--radius-md)',
          background: 'rgba(79, 48, 185, 0.08)',
          border: '1px solid rgba(79, 48, 185, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '0.85rem',
          color: 'var(--text-primary)'
        }}>
          <Sparkles size={18} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
          <div>
            <strong style={{ color: 'var(--brand-primary)' }}>Coach Tip for {sectionMeta.label}:</strong>{' '}
            <span style={{ color: 'var(--text-secondary)' }}>
              {sectionMeta.coachTip.replace(/^⚡ Exam Coach Tip:\s*/, '')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
