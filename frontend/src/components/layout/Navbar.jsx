import React from 'react';
import { Sparkles, Database, Settings, Sun, Moon, ExternalLink } from 'lucide-react';
import InfynnoLogo from '../common/InfynnoLogo';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenSettings,
  backendStatus,
  theme,
  onToggleTheme
}) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        borderBottom: '1px solid var(--border-light)',
        background: 'var(--bg-surface)',
        position: 'sticky',
        top: 0,
        zIndex: 50
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
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-light)',
            transition: 'all var(--transition-fast)'
          }}
        >
          <InfynnoLogo width={30} height={19} />
          <span
            style={{
              fontWeight: 800,
              fontSize: '0.75rem',
              letterSpacing: '0.04em',
              color: 'var(--text-primary)'
            }}
          >
            INFYNNO
          </span>
        </a>

        {/* Vertical Divider */}
        <div
          style={{
            width: '1px',
            height: '24px',
            background: 'var(--border-medium)'
          }}
          aria-hidden="true"
        />

        {/* Product Identity */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1
              style={{
                fontSize: '0.975rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                margin: 0
              }}
            >
              UK UCAT Question Studio
            </h1>
            <span className="badge badge-neutral" style={{ fontSize: '0.625rem' }}>
              v2.0
            </span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
            An Infynno Solutions Product • <span className="infynno-text-gradient" style={{ fontWeight: 600 }}>Infinite Innovations</span>
          </p>
        </div>
      </div>

      {/* Center Nav Tabs */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          padding: '3px',
          background: 'var(--bg-surface-elevated)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)'
        }}
      >
        <button
          id="nav-tab-generator"
          onClick={() => setActiveTab('generator')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'generator' ? 'var(--brand-primary)' : 'transparent',
            border: 'none',
            color: activeTab === 'generator' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.825rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
        >
          <Sparkles size={14} />
          Generator Studio
        </button>

        <button
          id="nav-tab-bank"
          onClick={() => setActiveTab('bank')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-sm)',
            background: activeTab === 'bank' ? 'var(--brand-primary)' : 'transparent',
            border: 'none',
            color: activeTab === 'bank' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.825rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)'
          }}
        >
          <Database size={14} />
          Question Bank
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
        >
          <span>Visit Infynno</span>
          <ExternalLink size={12} />
        </a>

        {/* Backend Status Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.725rem',
            fontWeight: 600,
            border: '1px solid var(--border-light)'
          }}
        >
          <div
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
          style={{ padding: '6px 10px' }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode (Press T)`}
        >
          {theme === 'dark' ? <Sun size={14} color="#fbbf24" /> : <Moon size={14} color="#0284c7" />}
          <span className="kbd-hint" style={{ fontSize: '0.6rem', marginLeft: '2px' }}>T</span>
        </button>

        {/* Settings Button */}
        <button
          id="btn-settings-open"
          onClick={onOpenSettings}
          className="btn-secondary"
          style={{ padding: '6px 10px' }}
          title="Configure Models & DeepInfra API Key"
        >
          <Settings size={14} />
          Settings
        </button>
      </div>
    </header>
  );
}
