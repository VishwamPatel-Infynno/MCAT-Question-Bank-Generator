import React, { useState } from 'react';
import { AlertTriangle, X, Trash2, BookOpen, Layers } from 'lucide-react';
import { useFocusTrap } from '../../hooks';

export default function DeletePassageModal({
  isOpen,
  onClose,
  passage,
  onConfirmDelete
}) {
  const modalRef = useFocusTrap({ isActive: Boolean(isOpen), onClose });
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen || !passage) return null;

  const titleOrId = passage.title || passage.id;
  const questionCount = typeof passage.question_count === 'number'
    ? passage.question_count
    : (Array.isArray(passage.questions) ? passage.questions.length : 0);

  const handleConfirm = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await onConfirmDelete(passage);
      onClose();
    } catch (err) {
      console.error('Failed to cascade delete passage:', err);
      setErrorMessage(err.message || 'Failed to delete passage and associated questions.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-passage-title"
      aria-describedby="delete-passage-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: 'var(--bg-card, #1e293b)',
          borderRadius: '12px',
          border: '1px solid var(--border-light, rgba(255, 255, 255, 0.1))',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeInModal 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-light, rgba(255, 255, 255, 0.1))',
            backgroundColor: 'rgba(239, 68, 68, 0.08)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.18)',
                color: 'var(--status-danger, #ef4444)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3
                id="delete-passage-title"
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  color: 'var(--text-primary, #f8fafc)'
                }}
              >
                Delete Reading Passage
              </h3>
              <p
                style={{
                  margin: '2px 0 0 0',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted, #94a3b8)'
                }}
              >
                Permanent cascade deletion
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="btn-ghost"
            style={{
              padding: '6px',
              borderRadius: '6px',
              color: 'var(--text-muted, #94a3b8)',
              cursor: isDeleting ? 'not-allowed' : 'pointer'
            }}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Passage Overview Card */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-card-subtle, rgba(255, 255, 255, 0.03))',
              border: '1px solid var(--border-light, rgba(255, 255, 255, 0.08))',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={14} style={{ color: 'var(--accent-primary, #38bdf8)' }} />
                <strong
                  style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-primary, #f8fafc)',
                    wordBreak: 'break-word'
                  }}
                >
                  {titleOrId}
                </strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {passage.section && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(56, 189, 248, 0.12)',
                      color: 'var(--accent-primary, #38bdf8)'
                    }}
                  >
                    {passage.section}
                  </span>
                )}
                {typeof passage.word_count === 'number' && passage.word_count > 0 && (
                  <span
                    style={{
                      fontSize: '0.68rem',
                      color: 'var(--text-muted, #94a3b8)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    {passage.word_count} words
                  </span>
                )}
              </div>
            </div>

            {passage.text && (
              <p
                style={{
                  margin: 0,
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-serif, serif)',
                  fontStyle: 'italic',
                  color: 'var(--text-secondary, #cbd5e1)',
                  lineHeight: 1.45,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                "{passage.text.slice(0, 160).trim()}..."
              </p>
            )}

            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted, #64748b)', fontFamily: 'monospace' }}>
              ID: {passage.id}
            </div>
          </div>

          {/* Cascade Warning Callout */}
          <div
            id="delete-passage-desc"
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--status-danger, #ef4444)' }}>
              <Layers size={16} />
              <strong style={{ fontSize: '0.85rem' }}>
                {questionCount > 0
                  ? `Cascade Deletion: ${questionCount} Question${questionCount === 1 ? '' : 's'} Affected`
                  : 'Cascade Deletion Warning'}
              </strong>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: '0.8rem',
                lineHeight: 1.5,
                color: 'var(--text-secondary, #cbd5e1)'
              }}
            >
              {questionCount > 0 ? (
                <>
                  Deleting this passage will <strong>remove it from the Passage Bank and remove all {questionCount} associated question{questionCount === 1 ? '' : 's'}</strong> from your Question Bank and Review queue. All questions, passage stimulus, and generation metrics will <strong>remain safely intact in your Batch Progress</strong> history.
                </>
              ) : (
                <>
                  Deleting this passage will remove it from the Passage Bank. It will remain preserved in your Batch Progress history.
                </>
              )}
            </p>

            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--text-muted, #94a3b8)',
                marginTop: '2px'
              }}
            >
              You can view and restore these items anytime from the Batch Progress view.
            </span>
          </div>

          {/* Error Message if deletion failed */}
          {errorMessage && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid var(--status-danger, #ef4444)',
                color: 'var(--status-danger, #ef4444)',
                fontSize: '0.8rem'
              }}
            >
              {errorMessage}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            padding: '14px 20px',
            borderTop: '1px solid var(--border-light, rgba(255, 255, 255, 0.1))',
            backgroundColor: 'var(--bg-card-subtle, rgba(255, 255, 255, 0.02))'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="btn-secondary"
            style={{
              padding: '7px 14px',
              fontSize: '0.82rem',
              cursor: isDeleting ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            id="btn-confirm-delete-passage"
            onClick={handleConfirm}
            disabled={isDeleting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: isDeleting ? 'rgba(239, 68, 68, 0.6)' : 'var(--status-danger, #ef4444)',
              border: 'none',
              borderRadius: '6px',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            {isDeleting ? (
              <>
                <div
                  className="lazy-spinner-ring"
                  style={{ width: '13px', height: '13px', borderWidth: '2px', marginRight: '4px' }}
                />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>
                  {questionCount > 0
                    ? `Delete Passage & ${questionCount} Question${questionCount === 1 ? '' : 's'}`
                    : 'Delete Passage'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

