import React from 'react';
import { Layers, Zap, ShieldCheck } from 'lucide-react';

export default function BatchStatsHeader({ batches = [], activeCount = 0 }) {
  const totalQuestionsAuthored = batches.reduce((acc, b) => acc + (b.actual_count || 0), 0);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}
    >
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(79, 48, 185, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--brand-primary)'
          }}
        >
          <Layers size={18} />
        </div>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {batches.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Total Generation Batches
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(51, 90, 207, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--infynno-blue)'
          }}
        >
          <Zap size={18} />
        </div>
        <div>
          <div
            style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: activeCount > 0 ? 'var(--infynno-cyan)' : 'var(--text-primary)'
            }}
          >
            {activeCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Running in Background
          </div>
        </div>
      </div>

      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--status-success)'
          }}
        >
          <ShieldCheck size={18} />
        </div>
        <div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {totalQuestionsAuthored}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Questions Authored
          </div>
        </div>
      </div>
    </div>
  );
}
