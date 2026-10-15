import React from 'react';
import { ExternalLink, Sparkles, Shield, Cpu } from 'lucide-react';
import InfynnoLogo from '../common/InfynnoLogo';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-light)',
        background: 'var(--bg-surface)',
        padding: '32px 24px 24px',
        color: 'var(--text-secondary)',
        fontSize: '0.8rem'
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {/* Main Footer Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px'
          }}
        >
          {/* Brand Info */}
          <div style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <a
                href="https://infynno.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
              >
                <InfynnoLogo width={36} height={22} showText={true} />
              </a>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  borderLeft: '1px solid var(--border-medium)',
                  paddingLeft: '10px'
                }}
              >
                Solutions LLP
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              <span className="infynno-text-gradient" style={{ fontWeight: 700 }}>
                Infinite Innovations
              </span>{' '}
              — UK UCAT Question Studio is a proprietary multi-agent psychometric authoring platform engineered by{' '}
              <strong style={{ color: 'var(--text-primary)' }}>Infynno Solutions LLP</strong>.
            </p>
          </div>

          {/* Product Badges */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-light)',
                fontSize: '0.725rem'
              }}
            >
              <Cpu size={14} style={{ color: 'var(--brand-primary)' }} />
              <span>Multi-Agent Swarm</span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-light)',
                fontSize: '0.725rem'
              }}
            >
              <Shield size={14} style={{ color: 'var(--status-success)' }} />
              <span>90+ Psychometric Rubric</span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-light)',
                fontSize: '0.725rem'
              }}
            >
              <Sparkles size={14} style={{ color: '#818cf8' }} />
              <span>Zero Hallucination Traps</span>
            </div>
          </div>

          {/* Corporate Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <a
              href="https://infynno.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="infynno-pill-link"
              id="link-infynno-home"
            >
              <span>Infynno Website</span>
              <ExternalLink size={12} />
            </a>

            <a
              href="https://infynno.com/case-studies"
              target="_blank"
              rel="noopener noreferrer"
              className="infynno-pill-link"
              id="link-infynno-case-studies"
            >
              <span>Case Studies</span>
              <ExternalLink size={12} />
            </a>

            <a
              href="https://infynno.com/contact-us"
              target="_blank"
              rel="noopener noreferrer"
              className="infynno-pill-link"
              id="link-infynno-contact"
            >
              <span>Contact Team</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border-light)' }} />

        {/* Bottom Attribution */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            fontSize: '0.725rem',
            color: 'var(--text-muted)'
          }}
        >
          <div>
            © {CURRENT_YEAR} <strong>Infynno Solutions LLP</strong>. All rights reserved.
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span>Custom Software &amp; AI Product Engineering</span>
            <span>•</span>
            <a
              href="https://infynno.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
              infynno.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
