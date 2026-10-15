import React from 'react';
import { Sparkles, Database, Settings, BookOpen, Cpu, Layers, Sun, Moon } from 'lucide-react';

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
        padding: '14px 28px',
        borderBottom: '1px solid var(--border-light)',
        background: 'var(--bg-surface)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {/* Brand & Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
          }}
        >
          <Cpu size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1
              style={{
                fontSize: '1.15rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)'
              }}
            >
              UK UCAT Question Bank
            </h1>
            <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
              Multi-Agent Studio
            </span>
          </div>
          <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
            Autonomous Generation, 100-pt Psychometric Audit &amp; Review Workflow
          </p>
        </div>
      </div>

      {/* Center Nav Tabs */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px',
          background: 'var(--bg-surface-elevated)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-light)'
        }}
      >
        <button
          id="nav-tab-generator"
          onClick={() => setActiveTab('generator')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 16px',
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'generator' ? 'var(--brand-primary)' : 'transparent',
            border: 'none',
            color: activeTab === 'generator' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            boxShadow: activeTab === 'generator' ? '0 2px 8px rgba(2, 132, 199, 0.4)' : 'none'
          }}
        >
          <Sparkles size={15} />
          Generator Studio
        </button>

        <button
          id="nav-tab-matrix"
          onClick={() => setActiveTab('matrix')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 16px',
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'matrix' ? 'var(--brand-primary)' : 'transparent',
            border: 'none',
            color: activeTab === 'matrix' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            boxShadow: activeTab === 'matrix' ? '0 2px 8px rgba(2, 132, 199, 0.4)' : 'none'
          }}
        >
          <Layers size={15} />
          Batch Matrix
        </button>

        <button
          id="nav-tab-bank"
          onClick={() => setActiveTab('bank')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 16px',
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'bank' ? 'var(--brand-primary)' : 'transparent',
            border: 'none',
            color: activeTab === 'bank' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            boxShadow: activeTab === 'bank' ? '0 2px 8px rgba(2, 132, 199, 0.4)' : 'none'
          }}
        >
          <Database size={15} />
          Question Bank
        </button>

        <button
          id="nav-tab-guide"
          onClick={() => setActiveTab('guide')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 16px',
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'guide' ? 'var(--brand-primary)' : 'transparent',
            border: 'none',
            color: activeTab === 'guide' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            boxShadow: activeTab === 'guide' ? '0 2px 8px rgba(2, 132, 199, 0.4)' : 'none'
          }}
        >
          <BookOpen size={15} />
          UCAT Syllabus
        </button>
      </nav>

      {/* Right Action Tools: Health + Theme Toggle + Settings */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Backend Agent Status Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '6px 12px',
            background: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
            border: '1px solid var(--border-light)'
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: backendStatus ? '#10b981' : '#f59e0b',
              boxShadow: backendStatus ? '0 0 8px #10b981' : '0 0 8px #f59e0b'
            }}
          />
          <span style={{ color: 'var(--text-secondary)' }}>
            {backendStatus ? 'Agents Online' : 'Connecting...'}
          </span>
        </div>

        {/* Theme Switcher Button */}
        <button
          id="btn-toggle-theme"
          onClick={onToggleTheme}
          className="btn-secondary"
          style={{ padding: '8px 12px' }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode (Press T)`}
        >
          {theme === 'dark' ? <Sun size={16} color="#fbbf24" /> : <Moon size={16} color="#0284c7" />}
          <span className="kbd-hint" style={{ fontSize: '0.65rem', marginLeft: '2px' }}>T</span>
        </button>

        {/* Settings Button */}
        <button
          id="btn-settings-open"
          onClick={onOpenSettings}
          className="btn-secondary"
          style={{ padding: '8px 12px' }}
          title="Configure Models & DeepInfra API Key"
        >
          <Settings size={16} />
          Settings
        </button>
      </div>
    </header>
  );
}
