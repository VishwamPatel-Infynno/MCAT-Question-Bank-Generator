import React from 'react';
import { Sparkles, Database, Settings, BookOpen, Cpu } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenSettings, backendStatus }) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 32px',
      borderBottom: '1px solid var(--border-light)',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: 'var(--shadow-sm)'
    }}>
      {/* Brand & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
        }}>
          <Cpu size={24} color="#ffffff" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              UK UCAT Question Bank
            </h1>
            <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
              Multi-Agent AI
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Autonomous 4-Agent Generation, Review &amp; Regeneration Workflow
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          id="nav-tab-generator"
          onClick={() => setActiveTab('generator')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'generator' ? 'var(--brand-primary-light)' : 'transparent',
            border: activeTab === 'generator' ? '1px solid var(--brand-primary)' : '1px solid transparent',
            color: activeTab === 'generator' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Sparkles size={16} />
          Generator Studio
        </button>

        <button
          id="nav-tab-bank"
          onClick={() => setActiveTab('bank')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'bank' ? 'var(--brand-primary-light)' : 'transparent',
            border: activeTab === 'bank' ? '1px solid var(--brand-primary)' : '1px solid transparent',
            color: activeTab === 'bank' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Database size={16} />
          Question Bank
        </button>

        <button
          id="nav-tab-guide"
          onClick={() => setActiveTab('guide')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            background: activeTab === 'guide' ? 'var(--brand-primary-light)' : 'transparent',
            border: activeTab === 'guide' ? '1px solid var(--brand-primary)' : '1px solid transparent',
            color: activeTab === 'guide' ? 'var(--brand-primary)' : 'var(--text-secondary)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <BookOpen size={16} />
          UCAT Syllabus
        </button>
      </nav>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: 'var(--bg-canvas)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          fontWeight: 600,
          border: '1px solid var(--border-light)'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: backendStatus ? '#10b981' : '#f59e0b'
          }} />
          <span style={{ color: 'var(--text-secondary)' }}>
            {backendStatus ? 'Agents Online' : 'Connecting...'}
          </span>
        </div>

        <button
          id="btn-settings-open"
          onClick={onOpenSettings}
          className="btn-secondary"
          style={{ padding: '8px 12px' }}
          title="Configure Models & DeepInfra Settings"
        >
          <Settings size={16} />
          Settings
        </button>
      </div>
    </header>
  );
}
