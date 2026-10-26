import React from 'react';
import { ShieldCheck, RefreshCw, Database } from 'lucide-react';

const EMPTY_COUNTS = {};

export default function AiValidatedStatsBar({
  counts = EMPTY_COUNTS,
  questionsCount = 0,
  refreshing = false,
  onRefresh,
  onNavigateToBank
}) {
  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--status-success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldCheck size={18} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              AI Validated Questions
            </h2>
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--status-success)',
                borderRadius: '12px',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                border: '1px solid rgba(16, 185, 129, 0.25)'
              }}
            >
              Score &gt; 90 Benchmark Passed
            </span>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: 0 }}>
            Candidate questions generated and verified with psychometric score &gt; 90. Review and select questions to place into your official Question Bank or discard.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', fontSize: '0.78rem' }}
            title="Refresh AI Validated Questions"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          {onNavigateToBank && (
            <button
              type="button"
              onClick={onNavigateToBank}
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', fontSize: '0.78rem' }}
            >
              <Database size={13} />
              <span>Open Question Bank</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          paddingTop: '12px',
          borderTop: '1px solid var(--border-light)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending AI Validated (&gt;90):</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--status-success)' }}>
            {counts.ai_validated || questionsCount}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>In Question Bank:</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
            {counts.in_bank || 0}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Batch Only (86-90):</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--brand-indigo, #6366f1)' }}>
            {counts.batch_only || 0}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Discarded:</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-muted)' }}>
            {counts.discarded || 0}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Below Threshold (&le;85):</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f59e0b' }}>
            {counts.below_threshold || 0}
          </span>
        </div>
      </div>
    </div>
  );
}
