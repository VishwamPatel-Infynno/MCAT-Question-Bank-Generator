import React from 'react';
import { AlertTriangle, Trash2, Info, X, Loader2 } from 'lucide-react';
import { useFocusTrap } from '../../hooks';

/**
 * ConfirmationModal
 *
 * Enterprise-grade, WCAG AA compliant confirmation modal replacing raw browser window.confirm.
 * Enforces keyboard focus trapping, Escape key dismissal, dual-theme styling,
 * contextual item counts, and loading states.
 */
export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  description = 'Are you sure you want to proceed with this action? This operation cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'info'
  itemCount = null,
  itemLabel = 'item',
  isProcessing = false
}) {
  const modalRef = useFocusTrap({ isActive: Boolean(isOpen), onClose });

  if (!isOpen) return null;

  const isDanger = variant === 'danger';
  const isWarning = variant === 'warning';

  const accentColor = isDanger
    ? 'var(--status-danger, #f43f5e)'
    : isWarning
    ? 'var(--status-warning, #f59e0b)'
    : 'var(--brand-primary, #335ACF)';

  const accentBg = isDanger
    ? 'rgba(244, 63, 94, 0.1)'
    : isWarning
    ? 'rgba(245, 158, 11, 0.1)'
    : 'rgba(51, 90, 207, 0.1)';

  const accentBorder = isDanger
    ? 'rgba(244, 63, 94, 0.3)'
    : isWarning
    ? 'rgba(245, 158, 11, 0.3)'
    : 'rgba(51, 90, 207, 0.3)';

  const confirmBtnBg = isDanger
    ? '#e11d48'
    : isWarning
    ? '#d97706'
    : 'var(--brand-primary, #335ACF)';

  return (
    <div
      className="modal-backdrop-theme"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing && onClose) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(8, 12, 20, 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        ref={modalRef}
        className="modal-card-theme"
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--bg-surface-elevated, #121826)',
          borderRadius: 'var(--radius-lg, 16px)',
          border: '1px solid var(--border-light, rgba(255, 255, 255, 0.08))',
          boxShadow: 'var(--shadow-lg, 0 20px 25px -5px rgba(0, 0, 0, 0.5))',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeIn 0.15s ease-out'
        }}
      >
        {/* Header Strip */}
        <div
          style={{
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-light, rgba(255, 255, 255, 0.06))'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-md, 10px)',
                background: accentBg,
                border: `1px solid ${accentBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: accentColor,
                flexShrink: 0
              }}
            >
              {isDanger ? (
                <Trash2 size={18} />
              ) : isWarning ? (
                <AlertTriangle size={18} />
              ) : (
                <Info size={18} />
              )}
            </div>

            <div>
              <h3
                id="confirm-modal-title"
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text-primary, #f8fafc)',
                  letterSpacing: '-0.01em'
                }}
              >
                {title}
              </h3>
              {typeof itemCount === 'number' && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted, #94a3b8)',
                    fontWeight: 500
                  }}
                >
                  Target: {itemCount} {itemLabel}{itemCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Close dialog"
            className="btn-ghost"
            style={{
              padding: '6px',
              borderRadius: 'var(--radius-sm, 6px)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-muted, #94a3b8)',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isProcessing ? 0.5 : 1
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: '20px 22px',
            fontSize: '0.875rem',
            lineHeight: 1.6,
            color: 'var(--text-secondary, #cbd5e1)'
          }}
        >
          <div id="confirm-modal-desc">
            {typeof description === 'string' ? <p style={{ margin: 0 }}>{description}</p> : description}
          </div>

          {/* Context Alert Box */}
          {isDanger && (
            <div
              style={{
                marginTop: '16px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm, 8px)',
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                fontSize: '0.78rem',
                color: 'var(--status-danger, #f43f5e)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span>This operation permanently deletes records and cannot be undone.</span>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div
          style={{
            padding: '14px 22px',
            background: 'var(--bg-surface-subtle, #0a0e18)',
            borderTop: '1px solid var(--border-light, rgba(255, 255, 255, 0.06))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          <button
            type="button"
            id="btn-cancel-confirmation"
            onClick={onClose}
            disabled={isProcessing}
            className="btn-secondary"
            style={{
              padding: '8px 16px',
              fontSize: '0.825rem',
              fontWeight: 600,
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              opacity: isProcessing ? 0.6 : 1
            }}
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            id="btn-confirm-action"
            onClick={onConfirm}
            disabled={isProcessing}
            style={{
              padding: '8px 18px',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: '#ffffff',
              backgroundColor: confirmBtnBg,
              border: `1px solid ${accentBorder}`,
              borderRadius: 'var(--radius-sm, 8px)',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
              opacity: isProcessing ? 0.8 : 1,
              transition: 'all 0.15s ease-out'
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 size={14} className="spin-animate" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

