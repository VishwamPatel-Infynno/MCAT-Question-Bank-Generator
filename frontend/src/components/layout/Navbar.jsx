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
        padding: '8px 24px',
        borderBottom: '1px solid var(--border-light)',
        background: 'var(--bg-surface)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)'
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
          <InfynnoLogo width={28} height={18} />
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
            height: '20px',
            background: 'var(--border-light)'
          }}
          aria-hidden="true"
        />

        {/* Product Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1
            style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              letterSpacing: '-0.01em',
              color: 'var(--text-primary)',
              margin: 0
            }}
          >
            Infynno UCAT Question Bank Generator
          </h1>
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              background: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-light)',
              padding: '1px 6px',
              borderRadius: 'var(--radius-xs)'
            }}
          >
            v2.0
          </span>
        </div>
      </div>

      {/* Center Nav Tabs (Quiet Segmented Switcher) */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          padding: '2px',
          background: 'var(--bg-surface-subtle)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-light)'
        }}
      >
        <button
          id="nav-tab-generator"
          onClick={() => setActiveTab('generator')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 14px',
            borderRadius: 'var(--radius-xs)',
            background: activeTab === 'generator' ? 'var(--bg-surface-elevated)' : 'transparent',
            border: activeTab === 'generator' ? '1px solid var(--border-medium)' : '1px solid transparent',
            color: activeTab === 'generator' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'generator' ? 600 : 500,
            fontSize: '0.8rem',
            cursor: 'pointer',
            boxShadow: activeTab === 'generator' ? 'var(--shadow-sm)' : 'none',
            transition: 'all var(--transition-fast)'
          }}
        >
          <Sparkles size={13} color={activeTab === 'generator' ? 'var(--brand-primary)' : 'currentColor'} />
          <span>Question Generator</span>
        </button>

        <button
          id="nav-tab-bank"
          onClick={() => setActiveTab('bank')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 14px',
            borderRadius: 'var(--radius-xs)',
            background: activeTab === 'bank' ? 'var(--bg-surface-elevated)' : 'transparent',
            border: activeTab === 'bank' ? '1px solid var(--border-medium)' : '1px solid transparent',
            color: activeTab === 'bank' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'bank' ? 600 : 500,
            fontSize: '0.8rem',
            cursor: 'pointer',
            boxShadow: activeTab === 'bank' ? 'var(--shadow-sm)' : 'none',
            transition: 'all var(--transition-fast)'
          }}
        >
          <Database size={13} color={activeTab === 'bank' ? 'var(--brand-primary)' : 'currentColor'} />
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

        {/* Settings Button */}
        <button
          id="btn-settings-open"
          onClick={onOpenSettings}
          className="btn-secondary"
          style={{ padding: '5px 10px', fontSize: '0.75rem', borderRadius: 'var(--radius-xs)', gap: '5px' }}
          title="Configure API Keys & Settings"
        >
          <Settings size={13} />
          <span>Settings</span>
        </button>
      </div>
    </header>
  );
}
