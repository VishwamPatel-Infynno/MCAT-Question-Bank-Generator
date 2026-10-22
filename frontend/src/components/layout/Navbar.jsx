import React from 'react';
import { Sparkles, Database, Sun, Moon, ExternalLink } from 'lucide-react';
import InfynnoLogo from '../common/InfynnoLogo';

export default function Navbar({
  activeTab,
  setActiveTab,
  backendStatus,
  theme,
  onToggleTheme,
  onGoHome
}) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 24px',
        borderBottom: '1px solid var(--border-light)',
        background: 'var(--bg-surface)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}
    >
      {/* Brand & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Infynno Solutions Logo & Corporate Anchor */}
        <a
          href="https://infynno.com/"
          target="_blank"
          rel="noopener noreferrer"
          title="Visit Infynno Solutions LLP (https://infynno.com)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-light)',
            transition: 'all var(--transition-fast)'
          }}
        >
          <InfynnoLogo width={26} height={17} />
          <span
            style={{
              fontWeight: 800,
              fontSize: '0.725rem',
              letterSpacing: '0.05em',
              color: 'var(--text-primary)'
            }}
          >
            INFYNNO
          </span>
        </a>

        {/* Hairline Divider */}
        <div
          style={{
            width: '1px',
            height: '18px',
            background: 'var(--border-light)'
          }}
          aria-hidden="true"
        />

        {/* Product Identity */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            if (onGoHome) {
              onGoHome();
            } else {
              window.location.href = '/';
            }
          }}
          className="brand-refresh-link"
          title="Refresh application and return to home"
          aria-label="Infynno MCAT Question Bank Generator home - click to reload application"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
            cursor: 'pointer'
          }}
        >
          <h1
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              color: 'var(--text-primary)',
              margin: 0,
              transition: 'color var(--transition-fast)'
            }}
          >
            Infynno MCAT Question Bank Generator
          </h1>
        </a>
      </div>

      {/* Center Nav Tabs (Quiet Minimalist Pill Track) */}
      <nav className="pill-track">
        <button
          id="nav-tab-generator"
          type="button"
          onClick={() => setActiveTab('generator')}
          className={`pill-track-btn ${activeTab === 'generator' ? 'active' : ''}`}
        >
          <Sparkles size={12} color={activeTab === 'generator' ? 'var(--brand-primary)' : 'currentColor'} />
          <span>Question Generator</span>
        </button>

        <button
          id="nav-tab-bank"
          type="button"
          onClick={() => setActiveTab('bank')}
          className={`pill-track-btn ${activeTab === 'bank' ? 'active' : ''}`}
        >
          <Database size={12} color={activeTab === 'bank' ? 'var(--brand-primary)' : 'currentColor'} />
          <span>Question Bank</span>
        </button>
      </nav>

      {/* Right Tools */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Infynno Website Pill Link */}
        <a
          href="https://infynno.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="infynno-pill-link"
          id="btn-nav-infynno"
          title="Visit Infynno Solutions (infynno.com)"
          style={{ padding: '4px 10px', fontSize: '0.725rem' }}
        >
          <span>Visit Infynno</span>
          <ExternalLink size={11} />
        </a>

        {/* Backend Status Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 8px',
            background: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.7rem',
            fontWeight: 500,
            border: '1px solid var(--border-light)'
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: backendStatus ? 'var(--status-success)' : 'var(--status-warning)'
            }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>
            {backendStatus ? 'Online' : 'Connecting...'}
          </span>
        </div>

        {/* Theme Switcher Button */}
        <button
          id="btn-toggle-theme"
          onClick={onToggleTheme}
          className="btn-secondary"
          style={{ padding: '5px 8px', fontSize: '0.75rem', borderRadius: 'var(--radius-xs)' }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode (Press T)`}
        >
          {theme === 'dark' ? <Sun size={13} color="#fbbf24" /> : <Moon size={13} color="var(--brand-primary)" />}
          <span className="kbd-hint" style={{ fontSize: '0.575rem', padding: '1px 3px', marginLeft: '3px' }}>T</span>
        </button>
      </div>
    </header>
  );
}
