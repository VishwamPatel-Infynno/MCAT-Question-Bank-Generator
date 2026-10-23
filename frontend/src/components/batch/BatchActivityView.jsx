import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Layers,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Trash2,
  FileText,
  Sparkles,
  ShieldCheck,
  Zap,
  Image as ImageIcon
} from 'lucide-react';
import { fetchBatches, fetchBatchDetail, deleteBatch } from '../../services/api';
import { SECTION_CODE_MAP, MCAT_SECTION_LABELS } from '../../constants/mcat';

export default function BatchActivityView({
  onOpenAudit,
  onNavigateToBank,
  onNavigateToWizard,
  onShowToast
}) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCount, setActiveCount] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'in_progress' | 'completed' | 'failed'
  const [sectionFilter, setSectionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Expanded batch details cache: { [batchId]: { batch, jobs, questions, total_questions_count } }
  const [expandedBatchId, setExpandedBatchId] = useState(null);
  const [batchDetails, setBatchDetails] = useState({});
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Expanded job within the expanded batch: { [jobId]: boolean }
  const [expandedJobIds, setExpandedJobIds] = useState({});

  // Auto-refresh control
  const [autoRefresh, setAutoRefresh] = useState(true);
  const pollTimerRef = useRef(null);

  // Load batch list
  const loadBatches = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const data = await fetchBatches();
      setBatches(data.batches || []);
      setActiveCount(data.active_running_batches || 0);

      // If an expanded batch is currently in progress, re-fetch its detail as well
      if (expandedBatchId) {
        const currentExp = data.batches?.find(b => b.id === expandedBatchId);
        if (currentExp && currentExp.status === 'in_progress') {
          fetchBatchDetail(expandedBatchId)
            .then(detail => {
              setBatchDetails(prev => ({ ...prev, [expandedBatchId]: detail }));
            })
            .catch(() => {});
        }
      }
    } catch (err) {
      console.error('Failed to load batches:', err);
      if (!isSilent && onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Failed to Refresh',
          message: 'Could not connect to database to fetch batch logs.'
        });
      }
    } finally {
      setLoading(false);
      if (!isSilent) setRefreshing(false);
    }
  }, [expandedBatchId, onShowToast]);

  // Initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      loadBatches(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-polling effect (every 3 seconds if active batches or expanded batch is running)
  useEffect(() => {
    if (!autoRefresh) return;

    const hasActiveBatches = activeCount > 0 || batches.some(b => b.status === 'in_progress');
    const intervalMs = hasActiveBatches ? 3000 : 8000;

    pollTimerRef.current = setInterval(() => {
      loadBatches(true);
    }, intervalMs);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [autoRefresh, activeCount, batches, loadBatches]);

  // Handle batch expansion
  const handleToggleExpandBatch = async (batchId) => {
    if (expandedBatchId === batchId) {
      setExpandedBatchId(null);
      return;
    }
    setExpandedBatchId(batchId);

    // Fetch batch detail if not yet cached or if in progress
    if (!batchDetails[batchId] || batchDetails[batchId]?.batch?.status === 'in_progress') {
      setLoadingDetail(true);
      try {
        const detail = await fetchBatchDetail(batchId);
        setBatchDetails(prev => ({ ...prev, [batchId]: detail }));
      } catch (err) {
        console.error('Failed to load batch detail:', err);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  // Toggle individual job accordion
  const handleToggleJob = (jobId) => {
    setExpandedJobIds(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

  // Delete a batch
  const handleDeleteBatch = async (e, batchId) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this batch and its logged jobs? Questions already saved will remain in your Question Bank.')) {
      return;
    }
    try {
      await deleteBatch(batchId);
      setBatches(prev => prev.filter(b => b.id !== batchId));
      if (expandedBatchId === batchId) setExpandedBatchId(null);
      if (onShowToast) {
        onShowToast({
          type: 'info',
          title: 'Batch Deleted',
          message: 'The batch log has been deleted.'
        });
      }
    } catch (err) {
      console.error('Failed to delete batch:', err);
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Delete Failed',
          message: err.message
        });
      }
    }
  };

  // Filtered batches
  const filteredBatches = batches.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (sectionFilter !== 'all') {
      const code = SECTION_CODE_MAP[b.section] || b.section;
      if (code !== sectionFilter && b.section !== sectionFilter) return false;
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchTopic = (b.subtopic || '').toLowerCase().includes(query);
      const matchSection = (b.section || '').toLowerCase().includes(query);
      const matchId = b.id.toLowerCase().includes(query);
      if (!matchTopic && !matchSection && !matchId) return false;
    }
    return true;
  });

  const getSectionBadgeColor = (sec) => {
    const s = (sec || '').toLowerCase();
    if (s.includes('chem') || s.includes('cp')) return '#38bdf8';
    if (s.includes('cars')) return '#f43f5e';
    if (s.includes('bio') || s.includes('bb')) return '#10b981';
    if (s.includes('psych') || s.includes('ps')) return '#a855f7';
    return 'var(--brand-primary)';
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in_progress':
        return (
          <span className="badge" style={{ background: 'rgba(51, 90, 207, 0.15)', color: 'var(--brand-primary)', border: '1px solid rgba(51, 90, 207, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-primary)', animation: 'pulse 1.5s infinite' }} />
            In Progress
          </span>
        );
      case 'completed':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} />
            Completed
          </span>
        );
      case 'partially_completed':
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={12} />
            Partially Complete
          </span>
        );
      case 'failed':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <AlertCircle size={12} />
            Failed
          </span>
        );
      default:
        return (
          <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
            {status || 'Pending'}
          </span>
        );
    }
  };

  const currentDetail = expandedBatchId ? batchDetails[expandedBatchId] : null;

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--infynno-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: 'var(--infynno-glow)'
              }}
            >
              <Layers size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
                Batch Activity & Job Monitor
              </h1>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Track 50-question background batches, inspect 10 constituent jobs, and view generated questions.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => loadBatches(false)}
            disabled={refreshing}
            style={{ padding: '7px 12px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Refresh batches from database"
          >
            <RefreshCw size={13} className={refreshing ? 'spin-icon' : ''} />
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={onNavigateToWizard}
            style={{ padding: '7px 14px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={13} />
            <span>New 50-Q Batch</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Badges */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(79, 48, 185, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
            <Layers size={18} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{batches.length}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Batches Logged</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(51, 90, 207, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--infynno-blue)' }}>
            <Zap size={18} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: activeCount > 0 ? 'var(--infynno-cyan)' : 'var(--text-primary)' }}>
              {activeCount}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Running in Background</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-success)' }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {batches.reduce((acc, b) => acc + (b.actual_count || 0), 0)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Questions Authored</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search batches by topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            onChange={(e) => setSectionFilter(e.target.value)}
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
                onClick={() => setStatusFilter(st)}
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
          <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
            />
            <span>Live Auto-Sync</span>
          </label>
        </div>
      </div>

      {/* Batches List Container */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div style={{ width: '28px', height: '28px', border: '2px solid var(--border-medium)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <span style={{ fontSize: '0.85rem' }}>Loading batch records...</span>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '50px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px'
          }}
        >
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(79, 48, 185, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
            <Layers size={26} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              No Batches Found
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto' }}>
              {searchQuery || statusFilter !== 'all' || sectionFilter !== 'all'
                ? 'No generation batches match your active filters. Try clearing your search.'
                : 'You have not executed any background batches yet. Launch a 50-question batch with 10 jobs to see live activity.'}
            </p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={onNavigateToWizard}
            style={{ padding: '8px 20px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={14} />
            <span>Launch 50-Question Batch</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredBatches.map((batch) => {
            const isExpanded = expandedBatchId === batch.id;
            const secColor = getSectionBadgeColor(batch.section);
            const totalTarget = batch.target_count || 50;
            const actualTotal = batch.actual_count || 0;
            const completedJobs = batch.completed_jobs || 0;
            const totalJobs = batch.total_jobs || 10;
            const progressPercent = Math.min(100, Math.round((actualTotal / totalTarget) * 100));

            return (
              <div
                key={batch.id}
                style={{
                  background: 'var(--bg-surface)',
                  border: isExpanded ? '1px solid var(--border-medium)' : '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {/* Batch Header Row */}
                <div
                  onClick={() => handleToggleExpandBatch(batch.id)}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    gap: '16px',
                    flexWrap: 'wrap',
                    background: isExpanded ? 'var(--bg-surface-subtle)' : 'transparent',
                    borderBottom: isExpanded ? '1px solid var(--border-light)' : 'none'
                  }}
                >
                  {/* Left: Section, Title & Timestamp */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '280px', flex: 1.2 }}>
                    <div
                      style={{
                        width: '4px',
                        height: '42px',
                        borderRadius: '2px',
                        background: secColor
                      }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            background: `${secColor}15`,
                            color: secColor,
                            border: `1px solid ${secColor}30`
                          }}
                        >
                          {MCAT_SECTION_LABELS[batch.section] || batch.section}
                        </span>
                        <span className="badge-minimal" style={{ fontSize: '0.7rem', textTransform: 'capitalize' }}>
                          {batch.difficulty || 'Medium'}
                        </span>
                        <span className="badge-minimal" style={{ fontSize: '0.7rem' }}>
                          {batch.passage_mode === 'single_passage' ? 'Passage Set' : 'Discretes'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {batch.subtopic || 'Comprehensive Section Batch'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={11} />
                        <span>{new Date(batch.created_at).toLocaleString()}</span>
                        <span>•</span>
                        <span>ID: {batch.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Progress & Metrics */}
                  <div style={{ minWidth: '220px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '5px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {completedJobs} / {totalJobs} Jobs Completed
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>
                        {actualTotal} / {totalTarget} Questions ({progressPercent}%)
                      </span>
                    </div>

                    {/* Progress Bar Track */}
                    <div
                      style={{
                        height: '6px',
                        width: '100%',
                        borderRadius: '3px',
                        background: 'var(--border-light)',
                        overflow: 'hidden'
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${progressPercent}%`,
                          background: batch.status === 'failed' ? 'var(--status-danger)' : 'var(--infynno-gradient)',
                          borderRadius: '3px',
                          transition: 'width 0.4s ease'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <span>Tokens: {(batch.total_tokens || 0).toLocaleString()}</span>
                      <span>•</span>
                      <span>Cost: ${(batch.cost_usd || 0).toFixed(4)}</span>
                    </div>
                  </div>

                  {/* Right: Status Pill & Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {getStatusBadge(batch.status)}

                    <button
                      type="button"
                      onClick={(e) => handleDeleteBatch(e, batch.id)}
                      className="btn-icon"
                      style={{ color: 'var(--text-muted)', padding: '5px' }}
                      title="Delete batch log"
                    >
                      <Trash2 size={14} />
                    </button>

                    <div style={{ color: 'var(--text-muted)' }}>
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </div>
                  </div>
                </div>

                {/* Expanded Batch Detail: 10 Jobs & Questions */}
                {isExpanded && (
                  <div style={{ padding: '20px', background: 'var(--bg-canvas)' }}>
                    {loadingDetail && !currentDetail ? (
                      <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                        <div style={{ width: '22px', height: '22px', border: '2px solid var(--border-medium)', borderTopColor: 'var(--brand-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px' }} />
                        <span style={{ fontSize: '0.8rem' }}>Loading 10 constituent jobs...</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Layers size={15} style={{ color: 'var(--brand-primary)' }} />
                            <span>Constituent Jobs ({currentDetail?.jobs?.length || 0} Jobs, exactly 5 Questions per Job):</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Controlled Concurrency: 2 Parallel Jobs
                          </div>
                        </div>

                        {/* 10 Jobs Grid */}
                        {(!currentDetail?.jobs || currentDetail.jobs.length === 0) ? (
                          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.8rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-medium)' }}>
                            No constituent jobs recorded for this batch (legacy batch generated before multi-job tracking).
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
                            {currentDetail.jobs.map((job) => {
                            const isJobExpanded = Boolean(expandedJobIds[job.id]);
                            const jobQuestions = job.questions || [];
                            const isJobDone = job.status === 'completed';
                            const isJobRunning = job.status === 'running';
                            const isJobFailed = job.status === 'failed';

                            return (
                              <div
                                key={job.id}
                                style={{
                                  background: 'var(--bg-surface)',
                                  border: isJobRunning
                                    ? '1px solid rgba(51, 90, 207, 0.4)'
                                    : isJobDone
                                      ? '1px solid var(--border-light)'
                                      : '1px solid var(--border-light)',
                                  borderRadius: 'var(--radius-sm)',
                                  padding: '12px 14px',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '8px',
                                  transition: 'border-color var(--transition-fast)'
                                }}
                              >
                                {/* Job Card Header */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span
                                      style={{
                                        fontWeight: 800,
                                        fontSize: '0.8rem',
                                        color: isJobRunning ? 'var(--brand-primary)' : 'var(--text-primary)'
                                      }}
                                    >
                                      Job #{job.job_number}
                                    </span>
                                    <span
                                      className="badge"
                                      style={{
                                        fontSize: '0.675rem',
                                        padding: '1px 6px',
                                        background: isJobDone
                                          ? 'rgba(16, 185, 129, 0.1)'
                                          : isJobRunning
                                            ? 'rgba(51, 90, 207, 0.15)'
                                            : isJobFailed
                                              ? 'rgba(244, 63, 94, 0.1)'
                                              : 'var(--bg-surface-subtle)',
                                        color: isJobDone
                                          ? 'var(--status-success)'
                                          : isJobRunning
                                            ? 'var(--brand-primary)'
                                            : isJobFailed
                                              ? 'var(--status-danger)'
                                              : 'var(--text-muted)'
                                      }}
                                    >
                                      {job.status.toUpperCase()}
                                    </span>
                                  </div>

                                  <span style={{ fontSize: '0.725rem', fontWeight: 600, color: isJobDone ? 'var(--status-success)' : 'var(--text-muted)' }}>
                                    {job.actual_count} / {job.target_count || 5} Qs
                                  </span>
                                </div>

                                {/* Job Details / Telemetry */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  <span>Tokens: {(job.total_tokens || 0).toLocaleString()}</span>
                                  <span>${(job.cost_usd || 0).toFixed(4)}</span>
                                  {job.completed_at && (
                                    <span>Finished {new Date(job.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  )}
                                </div>

                                {job.error_message && (
                                  <div style={{ fontSize: '0.72rem', color: 'var(--status-danger)', background: 'rgba(244, 63, 94, 0.08)', padding: '6px 8px', borderRadius: 'var(--radius-xs)' }}>
                                    Error: {job.error_message}
                                  </div>
                                )}

                                {/* Action button: Expand/Hide questions */}
                                {jobQuestions.length > 0 && (
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleJob(job.id)}
                                      className="btn-secondary"
                                      style={{
                                        width: '100%',
                                        padding: '5px 8px',
                                        fontSize: '0.725rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        marginTop: '4px'
                                      }}
                                    >
                                      <FileText size={12} />
                                      <span>
                                        {isJobExpanded
                                          ? 'Hide 5 Generated Questions'
                                          : `View ${jobQuestions.length} Generated Questions`}
                                      </span>
                                      {isJobExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                                    </button>
                                  </div>
                                )}

                                {/* Expanded Questions inside Job */}
                                {isJobExpanded && jobQuestions.length > 0 && (
                                  <div
                                    style={{
                                      marginTop: '8px',
                                      paddingTop: '8px',
                                      borderTop: '1px solid var(--border-light)',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '10px'
                                    }}
                                  >
                                    {jobQuestions.map((q, qIdx) => (
                                      <div
                                        key={q.id || qIdx}
                                        style={{
                                          background: 'var(--bg-canvas)',
                                          border: '1px solid var(--border-light)',
                                          borderRadius: 'var(--radius-xs)',
                                          padding: '10px 12px',
                                          fontSize: '0.78rem'
                                        }}
                                      >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                          <span style={{ fontWeight: 700, color: 'var(--brand-primary)', fontSize: '0.725rem' }}>
                                            Question {qIdx + 1}
                                          </span>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '1px 5px' }}>
                                              Score {q.final_score || 95}/100
                                            </span>
                                            {q.image_svg && (
                                              <span className="badge-minimal" style={{ fontSize: '0.65rem', padding: '1px 4px' }} title="Has visual diagram">
                                                <ImageIcon size={10} /> Diagram
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Question Stem */}
                                        <div
                                          style={{
                                            color: 'var(--text-primary)',
                                            lineHeight: 1.4,
                                            fontWeight: 500,
                                            marginBottom: '8px'
                                          }}
                                        >
                                          {q.question_stem}
                                        </div>

                                        {/* Options List */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                                          {(q.options || []).map((opt) => {
                                            const isCorrect = (q.correct_answer_ids && q.correct_answer_ids.includes(opt.id)) || q.correct_answer_id === opt.id;
                                            return (
                                              <div
                                                key={opt.id}
                                                style={{
                                                  display: 'flex',
                                                  alignItems: 'flex-start',
                                                  gap: '6px',
                                                  padding: '4px 8px',
                                                  borderRadius: 'var(--radius-xs)',
                                                  background: isCorrect ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface-subtle)',
                                                  border: isCorrect ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent',
                                                  fontSize: '0.74rem'
                                                }}
                                              >
                                                <span style={{ fontWeight: 700, color: isCorrect ? 'var(--status-success)' : 'var(--text-muted)', minWidth: '16px' }}>
                                                  {opt.id}.
                                                </span>
                                                <span style={{ color: isCorrect ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                                  {opt.text}
                                                </span>
                                                {isCorrect && (
                                                  <CheckCircle2 size={12} style={{ color: 'var(--status-success)', marginLeft: 'auto', flexShrink: 0 }} />
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>

                                        {/* Question Tools */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px dashed var(--border-light)' }}>
                                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {q.aamc_skill || q.primary_trap || 'MCAT Standard'}
                                          </div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {onNavigateToBank && (
                                              <button
                                                type="button"
                                                onClick={onNavigateToBank}
                                                className="btn-secondary"
                                                style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                                                title="Open in Question Bank"
                                              >
                                                Bank
                                              </button>
                                            )}
                                            {onOpenAudit && (
                                              <button
                                                type="button"
                                                onClick={() => onOpenAudit(q)}
                                                className="btn-secondary"
                                                style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                                              >
                                                Audit Rubric
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
