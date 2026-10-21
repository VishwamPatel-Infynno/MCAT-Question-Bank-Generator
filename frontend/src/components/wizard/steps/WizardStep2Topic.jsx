import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function WizardStep2Topic({
  sectionMeta,
  availableSubtopics,
  selectedSubtopic,
  setSelectedSubtopic,
  CONTENT_DOMAINS,
  contentDomain,
  onUpdateContentDomain
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div className="wizard-heading-group">
        <h2 className="wizard-step-title">What specific topic do you want to focus on?</h2>
        <p className="wizard-step-subtitle">
          Select the exact question style or skill you'd like to practice within {sectionMeta.label}.
        </p>
      </div>

      {/* Subtopic Selector */}
      <div>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', display: 'block' }}>
          Choose Topic or Question Type:
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {availableSubtopics.map((st) => {
            const isSelected = selectedSubtopic === st;
            return (
              <button
                key={st}
                type="button"
                className={`hero-preset-chip ${isSelected ? 'active' : ''}`}
                style={{
                  background: isSelected ? 'var(--infynno-gradient)' : 'var(--bg-surface-elevated)',
                  color: isSelected ? '#ffffff' : 'var(--text-primary)',
                  borderColor: isSelected ? 'transparent' : 'var(--border-light)',
                  fontWeight: isSelected ? 600 : 500
                }}
                onClick={() => setSelectedSubtopic(st)}
              >
                {isSelected && <CheckCircle2 size={14} />}
                <span>{st}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Domain */}
      <div>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', display: 'block' }}>
          Background Theme or Scenario (Optional):
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {CONTENT_DOMAINS.map((domain) => {
            const isSelected = contentDomain === domain;
            return (
              <button
                key={domain}
                type="button"
                className="badge-minimal"
                style={{
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  background: isSelected ? 'rgba(79, 48, 185, 0.15)' : 'var(--bg-surface-elevated)',
                  borderColor: isSelected ? 'var(--brand-primary)' : 'var(--border-light)',
                  color: isSelected ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  fontWeight: isSelected ? 600 : 500
                }}
                onClick={() => onUpdateContentDomain(isSelected ? '' : domain)}
              >
                <span>{domain}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Feedback Card */}
      {selectedSubtopic && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.84rem'
        }}>
          <CheckCircle2 size={16} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
          <span>
            Practicing: <strong>{selectedSubtopic}</strong>
            {contentDomain ? <> in <em>{contentDomain}</em></> : ''}
          </span>
        </div>
      )}
    </div>
  );
}
