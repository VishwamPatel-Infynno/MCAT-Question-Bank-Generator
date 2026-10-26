import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

/**
 * ErrorBoundary
 *
 * Catches JavaScript errors anywhere in their child component tree,
 * logs those errors, and displays a graceful fallback UI instead of crashing the tree.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const label = this.props.fallbackLabel || 'this view';
      return (
        <div
          style={{
            padding: '48px 24px',
            maxWidth: '600px',
            margin: '40px auto',
            background: 'var(--bg-surface)',
            border: '1px solid var(--status-danger-border, #fca5a5)',
            borderRadius: 'var(--radius-lg, 12px)',
            boxShadow: 'var(--shadow-md)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--status-danger, #ef4444)'
            }}
          >
            <AlertTriangle size={28} />
          </div>

          <div>
            <h3
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '0 0 6px 0'
              }}
            >
              Unable to load {label}
            </h3>
            <p
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
                margin: 0
              }}
            >
              An unexpected runtime error occurred while rendering this screen. You can try reloading the view or returning to the generator.
            </p>
          </div>

          {this.state.error?.message && (
            <div
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm, 6px)',
                background: 'var(--bg-surface-elevated, #f3f4f6)',
                border: '1px solid var(--border-subtle, #e5e7eb)',
                fontSize: '0.75rem',
                fontFamily: 'monospace',
                color: 'var(--status-danger, #ef4444)',
                textAlign: 'left',
                overflowX: 'auto',
                wordBreak: 'break-all'
              }}
            >
              {this.state.error.message}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={this.handleReset}
              className="btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                fontSize: '0.825rem'
              }}
            >
              <RefreshCw size={14} />
              <span>Retry View</span>
            </button>

            <button
              type="button"
              onClick={() => {
                window.location.href = '/';
              }}
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                fontSize: '0.825rem'
              }}
            >
              <Home size={14} />
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
