import React from 'react';
import { Search } from 'lucide-react';

export default function BatchFiltersBar({
  searchQuery = '',
  onSearchChange,
  sectionFilter = 'all',
  onSectionFilterChange,
  statusFilter = 'all',
  onStatusFilterChange,
  autoRefresh = true,
  onAutoRefreshChange
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 18px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', flex: 1 }}>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '220px', flex: 1, maxWidth: '340px' }}>
          <Search
            size={14}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            placeholder="Search batches by topic..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 32px',
              fontSize: '0.8rem',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-medium)',
              background: 'var(--bg-canvas)',
              color: 'var(--text-primary)'
            }}
          />
        </div>

        {/* Section Filter */}
        <select
          value={sectionFilter}
          onChange={(e) => onSectionFilterChange(e.target.value)}
          style={{
            padding: '6px 12px',
            fontSize: '0.8rem',
            borderRadius: 'var(--radius-xs)',
            border: '1px solid var(--border-medium)',
            background: 'var(--bg-canvas)',
            color: 'var(--text-primary)'
          }}
        >
          <option value="all">All Sections</option>
          <option value="CP">Chemical & Physical (CP)</option>
          <option value="CARS">Critical Analysis (CARS)</option>
          <option value="BB">Biological & Biochemical (BB)</option>
          <option value="PS">Psychological & Social (PS)</option>
        </select>

        {/* Status Tabs */}
        <div className="pill-track" style={{ padding: '2px' }}>
          {['all', 'in_progress', 'completed', 'failed'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => onStatusFilterChange(st)}
              className={`pill-track-btn ${statusFilter === st ? 'active' : ''}`}
              style={{ padding: '4px 10px', fontSize: '0.75rem', textTransform: 'capitalize' }}
            >
              {st === 'in_progress' ? 'Running' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Live Polling Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label
          style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => onAutoRefreshChange(e.target.checked)}
            style={{ accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
          />
          <span>Live Auto-Sync</span>
        </label>
      </div>
    </div>
  );
}
