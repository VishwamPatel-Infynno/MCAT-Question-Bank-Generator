import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Check,
  Trash2,
  Eye,
  ShieldCheck
} from 'lucide-react';

const EMPTY_ARRAY = Object.freeze([]);
const EMPTY_SET = new Set();

export default function StagedDuplicateClustersView({
  clusters = EMPTY_ARRAY,
  stagedQuestions = EMPTY_ARRAY,
  savedIds = EMPTY_SET,
  onDiscardQuestion,
  onApproveSingle,
  onOpenAudit,
  onSwitchToGrid
}) {
  const [resolvingClusterIds, setResolvingClusterIds] = useState(new Set());

  if (!clusters || clusters.length === 0) {
    return (
      <div
        style={{
          padding: '40px 20px',
          textAlign: 'center',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}
      >
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(34, 197, 94, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--status-success)'
          }}
        >
          <ShieldCheck size={24} />
        </div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          No Duplicate Clusters Found
        </div>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '440px' }}>
          All {stagedQuestions.length} staged questions in this batch are unique and exhibit healthy conceptual divergence.
        </div>
        {onSwitchToGrid && (
          <button
            type="button"
            onClick={onSwitchToGrid}
            className="btn-primary"
            style={{ marginTop: '8px', padding: '6px 14px', fontSize: '0.8rem' }}
          >
            Return to Grid View
          </button>
        )}
      </div>
    );
  }

  const totalDuplicates = clusters.reduce((sum, c) => sum + (c.duplicates?.length || 0), 0);

  const handleResolveCluster = async (cluster) => {
    setResolvingClusterIds((prev) => new Set([...prev, cluster.cluster_id]));
    try {
      const leader = cluster.leader_question;
      const dups = cluster.duplicates || [];

      // Approve leader if needed
      if (onApproveSingle && leader && !savedIds.has(leader.id)) {
        await onApproveSingle(leader);
      }

      // Discard duplicates
      if (onDiscardQuestion) {
        for (const d of dups) {
          if (d.question?.id) {
            onDiscardQuestion(d.question.id);
          }
        }
      }
    } finally {
      setResolvingClusterIds((prev) => {
        const next = new Set(prev);
        next.delete(cluster.cluster_id);
        return next;
      });
    }
  };

  const handleResolveAll = async () => {
    await Promise.all(clusters.map((cluster) => handleResolveCluster(cluster)));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* ── Banner ────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '14px 18px',
          background: 'rgba(245, 158, 11, 0.05)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 'var(--radius-sm)',
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
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--status-warning)'
            }}
          >
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {totalDuplicates} Duplicate Questions in {clusters.length} Collision Clusters
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              These questions share high linguistic overlap. Review each cluster to approve the best-scoring question and discard redundant copies.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResolveAll}
          className="btn-primary"
          style={{
            padding: '7px 14px',
            fontSize: '0.78rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderColor: '#d97706',
            color: '#ffffff'
          }}
        >
          <Check size={14} />
          <span>Resolve All Clusters ({totalDuplicates} Duplicates)</span>
        </button>
      </div>

      {/* ── Cluster Cards ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {clusters.map((cluster, cIdx) => {
          const leader = cluster.leader_question;
          const dups = cluster.duplicates || [];
          const isResolving = resolvingClusterIds.has(cluster.cluster_id);
          const isLeaderSaved = leader && savedIds.has(leader.id);

          return (
            <div
              key={cluster.cluster_id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 9px',
                      borderRadius: '4px',
                      background: 'rgba(51, 90, 207, 0.1)',
                      color: 'var(--brand-primary)'
                    }}
                  >
                    Cluster {cIdx + 1}
                  </span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {cluster.size} Questions &bull; Similarity: {Math.round(cluster.highest_similarity * 100)}%
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleResolveCluster(cluster)}
                  disabled={isResolving}
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    color: 'var(--status-warning)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '5px 12px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Check size={12} />
                  <span>{isResolving ? 'Resolving...' : `Keep Leader & Discard ${dups.length} Duplicates`}</span>
                </button>
              </div>

              {/* Side-by-Side Comparison */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '12px'
                }}
              >
                {/* Leader Question */}
                <div
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(34, 197, 94, 0.04)',
                    border: '1px solid rgba(34, 197, 94, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      className="badge badge-success"
                      style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <CheckCircle2 size={11} />
                      ⭐ Best Scored Leader (Score: {leader?.final_score || 95})
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {isLeaderSaved ? 'Saved to Bank' : 'Staged'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.45 }}>
                    {leader?.question_stem}
                  </div>

                  <div style={{ fontSize: '0.76rem', color: 'var(--status-success)', marginTop: '4px' }}>
                    <strong>Correct Key:</strong> {leader?.correct_answer_id} &bull; {leader?.options?.find(o => o.id === leader.correct_answer_id)?.text || ''}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                    {onOpenAudit && (
                      <button
                        type="button"
                        onClick={() => onOpenAudit(leader)}
                        className="btn-ghost"
                        style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={12} />
                        <span>Audit Trail</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Duplicate Questions */}
                {dups.map((dup, dIdx) => (
                  <div
                    key={dup.question?.id || dIdx}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(239, 68, 68, 0.03)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span
                        className="badge badge-danger"
                        style={{ fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <AlertTriangle size={11} />
                        ⚠️ Duplicate ({Math.round(dup.similarity_score * 100)}% Overlap)
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Score: {dup.question?.final_score || 90}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.45 }}>
                      {dup.question?.question_stem}
                    </div>

                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      <strong>Answer:</strong> {dup.question?.correct_answer_id} &bull; {dup.question?.options?.find(o => o.id === dup.question.correct_answer_id)?.text || ''}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '8px' }}>
                      {onOpenAudit && (
                        <button
                          type="button"
                          onClick={() => onOpenAudit(dup.question)}
                          className="btn-ghost"
                          style={{ padding: '4px 8px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={12} />
                          <span>Audit Trail</span>
                        </button>
                      )}

                      {onDiscardQuestion && (
                        <button
                          type="button"
                          onClick={() => onDiscardQuestion(dup.question?.id)}
                          className="btn-ghost"
                          style={{ padding: '4px 8px', fontSize: '0.72rem', color: 'var(--status-danger)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Trash2 size={12} />
                          <span>Discard</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
