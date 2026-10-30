import React, { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Archive,
  ShieldCheck,
  Check
} from 'lucide-react';
import {
  fetchBatchDuplicateClusters,
  resolveBatchDuplicates,
  refillBatchQuestions
} from '../../services/api';

export default function BatchDuplicateAuditSection({
  batchId,
  batchTargetCount = 50,
  onBatchUpdated,
  onShowToast
}) {
  const [loading, setLoading] = useState(true);
  const [clusterData, setClusterData] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isRefilling, setIsRefilling] = useState(false);
  const [showClusters, setShowClusters] = useState(false);
  const [resolvingClusterId, setResolvingClusterId] = useState(null);

  const loadClusters = useCallback(async () => {
    if (!batchId) return;
    try {
      const data = await fetchBatchDuplicateClusters(batchId);
      setClusterData(data);
    } catch (err) {
      console.error('Failed to load duplicate clusters:', err);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    let ignore = false;
    async function initLoad() {
      if (!batchId) return;
      try {
        const data = await fetchBatchDuplicateClusters(batchId);
        if (!ignore) {
          setClusterData(data);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          console.error('Failed to load duplicate clusters:', err);
          setLoading(false);
        }
      }
    }
    initLoad();
    return () => {
      ignore = true;
    };
  }, [batchId]);

  const handleResolveAll = async () => {
    if (isResolving || !batchId) return;
    setIsResolving(true);
    try {
      const res = await resolveBatchDuplicates(batchId, { action: 'archive' });
      if (onShowToast) {
        onShowToast({
          type: 'success',
          message: res.message || 'Duplicate questions archived successfully.'
        });
      }
      await loadClusters();
      if (onBatchUpdated) onBatchUpdated();
    } catch (err) {
      console.error('Failed to resolve duplicate clusters:', err);
      if (onShowToast) {
        onShowToast({
          type: 'error',
          message: err.message || 'Failed to archive duplicate questions.'
        });
      }
    } finally {
      setIsResolving(false);
    }
  };

  const handleResolveSingleCluster = async (clusterId) => {
    if (resolvingClusterId || !batchId) return;
    setResolvingClusterId(clusterId);
    try {
      const res = await resolveBatchDuplicates(batchId, {
        action: 'archive',
        cluster_ids: [clusterId]
      });
      if (onShowToast) {
        onShowToast({
          type: 'success',
          message: res.message || `Cluster ${clusterId} resolved.`
        });
      }
      await loadClusters();
      if (onBatchUpdated) onBatchUpdated();
    } catch (err) {
      console.error(`Failed to resolve cluster ${clusterId}:`, err);
    } finally {
      setResolvingClusterId(null);
    }
  };

  const handleRefillBatch = async () => {
    if (isRefilling || !batchId) return;
    setIsRefilling(true);
    try {
      const res = await refillBatchQuestions(batchId);
      if (onShowToast) {
        onShowToast({
          type: 'success',
          message: res.message || 'Targeted refill jobs launched.'
        });
      }
      await loadClusters();
      if (onBatchUpdated) onBatchUpdated();
    } catch (err) {
      console.error('Failed to launch refill generation:', err);
      if (onShowToast) {
        onShowToast({
          type: 'error',
          message: err.message || 'Failed to launch refill jobs.'
        });
      }
    } finally {
      setIsRefilling(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          padding: '12px 16px',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.78rem',
          color: 'var(--text-muted)'
        }}
      >
        <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />
        <span>Scanning batch questions for duplicates...</span>
      </div>
    );
  }

  if (!clusterData) return null;

  const totalDuplicates = clusterData.total_duplicate_questions || 0;
  const clusters = clusterData.clusters || [];
  const activeCount = clusterData.total_active_questions || 0;
  const archivedDuplicates = clusterData.archived_duplicates_count || 0;
  const isAutoResolved = Boolean(clusterData.auto_resolved || archivedDuplicates > 0);
  const deficit = Math.max(0, batchTargetCount - (activeCount - totalDuplicates));

  if (totalDuplicates === 0) {
    if (isAutoResolved && archivedDuplicates > 0) {
      return (
        <div
          style={{
            padding: '12px 16px',
            background: 'rgba(34, 197, 94, 0.06)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="var(--status-success)" />
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Auto-Deduplicated by System</span>
                <span className="badge badge-emerald" style={{ fontSize: '0.675rem' }}>Verified Unique</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                {archivedDuplicates} redundant question{archivedDuplicates > 1 ? 's were' : ' was'} automatically archived. All {activeCount} remaining active questions in this batch are unique and meet quality standards.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={loadClusters}
            className="btn-ghost"
            style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <RefreshCw size={11} />
            <span>Re-scan</span>
          </button>
        </div>
      );
    }

    return (
      <div
        style={{
          padding: '12px 16px',
          background: 'rgba(34, 197, 94, 0.05)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} color="var(--status-success)" />
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Similarity Audit Clean &bull; 0 Duplicates Detected
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              All {activeCount} active questions in this batch are unique and non-colliding.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={loadClusters}
          className="btn-ghost"
          style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
        >
          <RefreshCw size={11} />
          <span>Re-scan</span>
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '14px 16px',
        background: 'rgba(245, 158, 11, 0.04)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: 'var(--radius-sm)'
      }}
    >
      {/* ── Summary & Action Header ────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--status-warning)'
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{totalDuplicates} Duplicate Questions Detected Across {clusters.length} Clusters</span>
              <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>
                {Math.round((totalDuplicates / (activeCount || 1)) * 100)}% Collisions
              </span>
            </div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Parallel workers generated similar stems. Resolve clusters to preserve the highest-scoring question and archive {totalDuplicates} duplicates.
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowClusters((prev) => !prev)}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            {showClusters ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            <span>{showClusters ? 'Hide Clusters' : `Inspect Clusters (${clusters.length})`}</span>
          </button>

          <button
            type="button"
            onClick={handleResolveAll}
            disabled={isResolving}
            className="btn-primary"
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--status-warning)',
              borderColor: 'var(--status-warning-border)',
              color: 'var(--text-on-brand, #ffffff)'
            }}
          >
            <Archive size={13} />
            <span>{isResolving ? 'Archiving...' : `Resolve All (${totalDuplicates} Duplicates)`}</span>
          </button>

          {deficit > 0 && (
            <button
              type="button"
              onClick={handleRefillBatch}
              disabled={isRefilling}
              className="btn-primary"
              style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title={`Generate ${deficit} fresh non-colliding questions to bring batch to ${batchTargetCount}`}
            >
              <Sparkles size={13} />
              <span>{isRefilling ? 'Refilling...' : `Refill Batch (${deficit} Needed)`}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Detailed Cluster Breakdown Cards ───────────────────────────────── */}
      {showClusters && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '6px' }}>
          {clusters.map((cluster, cIdx) => {
            const isClusterResolving = resolvingClusterId === cluster.cluster_id;
            const leader = cluster.leader_question;
            const dups = cluster.duplicates || [];

            return (
              <div
                key={cluster.cluster_id}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {/* Cluster Row Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(51, 90, 207, 0.1)',
                        color: 'var(--brand-primary)'
                      }}
                    >
                      Cluster {cIdx + 1}
                    </span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {cluster.size} Questions &bull; Max Overlap: {Math.round(cluster.highest_similarity * 100)}%
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleResolveSingleCluster(cluster.cluster_id)}
                    disabled={isClusterResolving || isResolving}
                    style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      color: 'var(--status-warning)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '4px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Check size={12} />
                    <span>{isClusterResolving ? 'Resolving...' : `Keep Leader & Archive ${dups.length} Duplicates`}</span>
                  </button>
                </div>

                {/* Question Side-by-Side Cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '10px'
                  }}
                >
                  {/* Leader Question */}
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(34, 197, 94, 0.04)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        className="badge badge-success"
                        style={{ fontSize: '0.66rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <CheckCircle2 size={10} />
                        ⭐ Best Scored Leader (Score: {leader.final_score || 95})
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        ID: {leader.id.slice(0, 8)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4 }}>
                      {leader.question_stem}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--status-success)', marginTop: '2px' }}>
                      Key: {leader.correct_answer_id} &bull; {leader.options?.find(o => o.id === leader.correct_answer_id)?.text || ''}
                    </div>
                  </div>

                  {/* Duplicate Siblings */}
                  {dups.map((dup, dIdx) => (
                    <div
                      key={dup.question?.id || dIdx}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(239, 68, 68, 0.03)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          className="badge badge-danger"
                          style={{ fontSize: '0.66rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <AlertTriangle size={10} />
                          ⚠️ Duplicate ({Math.round(dup.similarity_score * 100)}% Match)
                        </span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                          ID: {dup.question?.id?.slice(0, 8)}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 400, lineHeight: 1.4 }}>
                        {dup.question?.question_stem}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Reason: {dup.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}