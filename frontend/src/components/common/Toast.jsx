import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const icons = {
    success: <CheckCircle2 size={18} color="var(--status-success)" />,
    error: <AlertCircle size={18} color="var(--status-danger)" />,
    info: <Info size={18} color="var(--brand-primary)" />
  };

  const borderColors = {
    success: 'var(--status-success-border)',
    error: 'var(--status-danger-border)',
    info: 'var(--border-brand)'
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        minWidth: '300px',
        maxWidth: '420px',
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        background: 'var(--bg-surface-elevated)',
        border: `1px solid ${borderColors[toast.type] || 'var(--border-medium)'}`,
        boxShadow: 'var(--shadow-lg)',
        backdropFilter: 'blur(16px)',
        color: 'var(--text-primary)',
        animation: 'toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'auto'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {icons[toast.type] || icons.info}
        <div>
          {toast.title && (
            <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {toast.title}
            </div>
          )}
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {toast.message}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {toast.action && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toast.action.onClick?.();
              onDismiss(toast.id);
            }}
            className="btn-primary"
            style={{
              padding: '4px 10px',
              fontSize: '0.72rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-xs)',
              whiteSpace: 'nowrap',
              cursor: 'pointer'
            }}
          >
            {toast.action.label}
          </button>
        )}

        <button
          onClick={() => onDismiss(toast.id)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            transition: 'color var(--transition-fast)'
          }}
          title="Dismiss notification"
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        pointerEvents: 'none'
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
