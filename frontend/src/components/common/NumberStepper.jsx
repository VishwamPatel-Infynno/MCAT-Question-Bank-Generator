import React from 'react';
import { Minus, Plus } from 'lucide-react';

export default function NumberStepper({
  value = 0,
  min = 0,
  max = 10,
  onChange,
  idPrefix = 'stepper',
  label = null,
  size = 'md',
  activeColor = 'var(--brand-primary)',
  bgCard = false,
  disabled = false,
  titleMinus = 'Decrease value',
  titlePlus = 'Increase value'
}) {
  const isSm = size === 'sm';
  const btnSize = isSm ? '24px' : '30px';
  const iconSize = isSm ? 11 : 13;
  const fontSize = isSm ? '0.75rem' : '0.825rem';

  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < max;

  const displayLabel = label
    ? (typeof label === 'function' ? label(value) : label)
    : `${value} of ${max}`;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        background: bgCard ? 'var(--bg-card)' : 'var(--bg-surface-subtle)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-xs)',
        padding: isSm ? '2px 4px' : '4px 6px',
        boxSizing: 'border-box'
      }}
    >
      <button
        type="button"
        id={idPrefix ? `${idPrefix}-minus` : undefined}
        onClick={() => canDecrease && onChange && onChange(value - 1)}
        disabled={!canDecrease}
        style={{
          width: btnSize,
          height: btnSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid transparent',
          borderRadius: 'var(--radius-xs)',
          background: 'transparent',
          color: !canDecrease ? 'var(--text-disabled)' : 'var(--text-primary)',
          cursor: !canDecrease ? 'not-allowed' : 'pointer',
          transition: 'all var(--transition-fast)'
        }}
        title={titleMinus}
      >
        <Minus size={iconSize} />
      </button>

      <div
        style={{
          flex: 1,
          textAlign: 'center',
          fontSize,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: value > min ? activeColor : 'var(--text-primary)',
          userSelect: 'none'
        }}
      >
        {displayLabel}
      </div>

      <button
        type="button"
        id={idPrefix ? `${idPrefix}-plus` : undefined}
        onClick={() => canIncrease && onChange && onChange(value + 1)}
        disabled={!canIncrease}
        style={{
          width: btnSize,
          height: btnSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid transparent',
          borderRadius: 'var(--radius-xs)',
          background: 'transparent',
          color: !canIncrease ? 'var(--text-disabled)' : 'var(--text-primary)',
          cursor: !canIncrease ? 'not-allowed' : 'pointer',
          transition: 'all var(--transition-fast)'
        }}
        title={titlePlus}
      >
        <Plus size={iconSize} />
      </button>
    </div>
  );
}
