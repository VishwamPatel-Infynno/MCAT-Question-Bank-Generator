import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Layers,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { fetchBatches, fetchBatchDetail, deleteBatch } from '../../services/api';
import { SECTION_CODE_MAP } from '../../constants/mcat';
import BatchStatsHeader from './BatchStatsHeader';
import BatchFiltersBar from './BatchFiltersBar';
import BatchCard from './BatchCard';

export default function BatchActivityView({
  onOpenAudit,
  onNavigateToBank,
  onNavigateToValidated,
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
  const expandedBatchIdRef = useRef(expandedBatchId);
  const onShowToastRef = useRef(onShowToast);

  useEffect(() => {
    expandedBatchIdRef.current = expandedBatchId;
  }, [expandedBatchId]);

  useEffect(() => {
    onShowToastRef.current = onShowToast;
  }, [onShowToast]);

  // Load batch list
  const loadBatches = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const data = await fetchBatches();
      setBatches(data.batches || []);
      setActiveCount(data.active_running_batches || 0);

      // If an expanded batch is currently in progress, re-fetch its detail as well
      const currExpandedId = expandedBatchIdRef.current;
      if (currExpandedId) {
        const currentExp = data.batches?.find((b) => b.id === currExpandedId);
        if (currentExp && currentExp.status === 'in_progress') {
          fetchBatchDetail(currExpandedId)
            .then((detail) => {
              setBatchDetails((prev) => ({ ...prev, [currExpandedId]: detail }));
            })
            .catch(() => {});
        }
      }
    } catch (err) {
      console.error('Failed to load batches:', err);
      if (!isSilent && onShowToastRef.current) {
        onShowToastRef.current({
          type: 'error',
          title: 'Failed to Refresh',
          message: 'Could not connect to database to fetch batch logs.'
        });
      }
    } finally {
      setLoading(false);
      if (!isSilent) setRefreshing(false);
    }
  }, []);

  // Initial load on mount
  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const data = await fetchBatches();
        if (!ignore) {
          setBatches(data.batches || []);
          setActiveCount(data.active_running_batches || 0);
        }
      } catch (err) {
        console.error('Failed to load batches:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const hasActiveBatches = activeCount > 0 || batches.some((b) => b.status === 'in_progress');

  // Auto-polling effect (every 3 seconds if active batches or expanded batch is running)
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalMs = hasActiveBatches ? 3000 : 8000;

    pollTimerRef.current = setInterval(() => {
      loadBatches(true);
    }, intervalMs);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [autoRefresh, hasActiveBatches, loadBatches]);

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
        setBatchDetails((prev) => ({ ...prev, [batchId]: detail }));
      } catch (err) {
        console.error('Failed to load batch detail:', err);
      } finally {
        setLoadingDetail(false);
      }
    }
  };

  // Toggle individual job accordion
  const handleToggleJob = (jobId) => {
    setExpandedJobIds((prev) => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

  // Delete a batch
  const handleDeleteBatch = async (e, batchId) => {
    e.stopPropagation();
    if (
      !window.confirm(
        'Are you sure you want to delete this batch and its logged jobs? Questions already saved will remain in your Question Bank.'
      )
    ) {
      return;
    }
    try {
      await deleteBatch(batchId);
      setBatches((prev) => prev.filter((b) => b.id !== batchId));
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
  const filteredBatches = batches.filter((b) => {
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

  const currentDetail = expandedBatchId ? batchDetails[expandedBatchId] : null;

  return (
    <div
      style={{
        maxWidth: '1240px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
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
              <h1
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  margin: 0
                }}
              >
                Batch Activity &amp; Job Monitor
              </h1>
              <p
                style={{
                  fontSize: '0.825rem',
                  color: 'var(--text-secondary)',
                  margin: '2px 0 0 0'
                }}
              >
                Track 50-question background batches, inspect 10 constituent jobs, and view
                generated questions.
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
            style={{
              padding: '7px 12px',
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Refresh batches from database"
          >
            <RefreshCw size={13} className={refreshing ? 'spin-icon' : ''} />
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={onNavigateToWizard}
            style={{
              padding: '7px 14px',
              fontSize: '0.8rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={14} />
            <span>New 50-Question Batch</span>
          </button>
        </div>
      </div>

      {/* Top Telemetry Stat Cards */}
      <BatchStatsHeader batches={batches} activeCount={activeCount} />

      {/* Filter and Search Bar */}
      <BatchFiltersBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sectionFilter={sectionFilter}
        onSectionFilterChange={setSectionFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        autoRefresh={autoRefresh}
        onAutoRefreshChange={setAutoRefresh}
      />

      {/* Batches List Container */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              border: '2px solid var(--border-medium)',
              borderTopColor: 'var(--brand-primary)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px'
            }}
          />
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
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'rgba(79, 48, 185, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-primary)'
            }}
          >
            <Layers size={26} />
          </div>
          <div>
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '4px'
              }}
            >
              No Batches Found
            </h3>
            <p
              style={{
                fontSize: '0.825rem',
                color: 'var(--text-secondary)',
                maxWidth: '420px',
                margin: '0 auto'
              }}
            >
              {searchQuery || statusFilter !== 'all' || sectionFilter !== 'all'
                ? 'No generation batches match your active filters. Try clearing your search.'
                : 'You have not executed any background batches yet. Launch a 50-question batch with 10 jobs to see live activity.'}
            </p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={onNavigateToWizard}
            style={{
              padding: '8px 20px',
              fontSize: '0.85rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={14} />
            <span>Start Background Batch</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredBatches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              isExpanded={expandedBatchId === batch.id}
              onToggleExpand={handleToggleExpandBatch}
              onDeleteBatch={handleDeleteBatch}
              detail={expandedBatchId === batch.id ? currentDetail : null}
              loadingDetail={loadingDetail}
              expandedJobIds={expandedJobIds}
              onToggleJob={handleToggleJob}
              onNavigateToBank={onNavigateToBank}
              onNavigateToValidated={onNavigateToValidated}
              onOpenAudit={onOpenAudit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
