import React from 'react';
import { FileText, ChevronDown, ChevronRight } from 'lucide-react';
import BatchQuestionItem from './BatchQuestionItem';

export default function BatchJobCard({
  job,
  isExpanded = false,
  onToggleExpand,
  onNavigateToBank,
  onOpenAudit
}) {
  if (!job) return null;

  const jobQuestions = job.questions || [];
  const isJobDone = job.status === 'completed';
  const isJobRunning = job.status === 'running';
  const isJobFailed = job.status === 'failed';

  return (
    <div
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

        <span
          style={{
            fontSize: '0.725rem',
            fontWeight: 600,
            color: isJobDone ? 'var(--status-success)' : 'var(--text-muted)'
          }}
        >
          {job.actual_count} / {job.target_count || 5} Qs
        </span>
      </div>

      {/* Job Details / Telemetry */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.7rem',
          color: 'var(--text-muted)'
        }}
      >
        <span>Tokens: {(job.total_tokens || 0).toLocaleString()}</span>
        <span>${(job.cost_usd || 0).toFixed(4)}</span>
        {job.completed_at && (
          <span>
            Finished{' '}
            {new Date(job.completed_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        )}
      </div>

      {job.error_message && (
        <div
          style={{
            fontSize: '0.72rem',
            color: 'var(--status-danger)',
            background: 'rgba(244, 63, 94, 0.08)',
            padding: '6px 8px',
            borderRadius: 'var(--radius-xs)'
          }}
        >
          Error: {job.error_message}
        </div>
      )}

      {/* Action button: Expand/Hide questions */}
      {jobQuestions.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => onToggleExpand && onToggleExpand(job.id)}
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
              {isExpanded
                ? 'Hide 5 Generated Questions'
                : `View ${jobQuestions.length} Generated Questions`}
            </span>
            {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </button>
        </div>
      )}

      {/* Expanded Questions inside Job */}
      {isExpanded && jobQuestions.length > 0 && (
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
            <BatchQuestionItem
              key={q.id || qIdx}
              question={q}
              index={qIdx}
              onNavigateToBank={onNavigateToBank}
              onOpenAudit={onOpenAudit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
