import React from 'react';
import { ExternalLink, ShieldCheck, Sparkles, Cpu } from 'lucide-react';
import InfynnoLogo from '../common/InfynnoLogo';

const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer
      style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border-light)',
        background: 'var(--bg-surface)',
        padding: '20px 24px',
        color: 'var(--text-secondary)',
        fontSize: '0.75rem'
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        {/* Left: Brand Identity & Tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <a
            href="https://infynno.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}
            title="Infynno Solutions LLP"
          >
            <InfynnoLogo width={26} height={16} showText={true} />
          </a>
          <span style={{ color: 'var(--border-medium)' }}>|</span>
          <span style={{ color: 'var(--text-muted)' }}>
            AI-powered question bank generator for AAMC MCAT medical admissions.
          </span>
        </div>

        {/* Center: Subtle Quality Assurance Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Cpu size={12} style={{ color: 'var(--brand-primary)' }} />
            3-Step AI Pipeline
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={12} style={{ color: 'var(--status-success)' }} />
            90+ Quality Threshold
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Sparkles size={12} style={{ color: 'var(--status-purple)' }} />
            Realistic Exam Traps
          </span>
        </div>

        {/* Right: Corporate Links & Copyright */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <a
            href="https://infynno.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="infynno-pill-link"
            style={{ padding: '3px 8px', fontSize: '0.7rem' }}
          >
            <span>infynno.com</span>
            <ExternalLink size={10} />
          </a>
          <span style={{ color: 'var(--text-muted)' }}>
            © {CURRENT_YEAR} Infynno Solutions LLP
          </span>
        </div>
      </div>
    </footer>
  );
}

