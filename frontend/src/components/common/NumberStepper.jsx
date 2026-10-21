import React from 'react';
import { Minus, Plus } from 'lucide-react';

export default function NumberStepper({
  value = 0,
  min = 0,
  max = 10,
  onChange,
  idPrefix = 'stepper',
  label = null,
  quickChips = null,
  chipIdPrefix = null,
  chipLabel = null,
  size = 'md',
  activeColor = 'var(--brand-primary)',
  activeBgColor = null,
  activeTextColor = null,
  bgCard = false,
  disabled = false,
  titleMinus = 'Decrease value',
  titlePlus = 'Increase value'
}) {
  const isSm = size === 'sm';
  const btnWidth = isSm ? '22px' : '26px';
  const btnHeight = isSm ? '22px' : '24px';
  const iconSize = isSm ? 10 : 11;
  const fontSize = isSm ? '0.725rem' : '0.75rem';

  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < max;

  const displayLabel = label
    ? (typeof label === 'function' ? label(value) : label)
    : `${value} of ${max}`;

  const resolvedChips = Array.isArray(quickChips)
    ? quickChips
    : (quickChips === true ? Array.from({ length: max - min + 1 }, (_, i) => min + i) : null);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: bgCard ? 'var(--bg-card)' : 'var(--bg-surface-subtle)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-xs)',
          padding: '2px',
          flex: 1
        }}
      >
        <button
          type="button"
          id={idPrefix ? `${idPrefix}-minus` : undefined}
          onClick={() => canDecrease && onChange && onChange(value - 1)}
          disabled={!canDecrease}
          style={{
            width: btnWidth,
            height: btnHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            color: !canDecrease ? 'var(--text-disabled)' : 'var(--text-primary)',
            cursor: !canDecrease ? 'not-allowed' : 'pointer'
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
            color: value > min ? activeColor : 'var(--text-primary)'
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
            width: btnWidth,
            height: btnHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'transparent',
            color: !canIncrease ? 'var(--text-disabled)' : 'var(--text-primary)',
            cursor: !canIncrease ? 'not-allowed' : 'pointer'
          }}
          title={titlePlus}
        >
          <Plus size={iconSize} />
        </button>
      </div>

      {resolvedChips && (
        <div style={{ display: 'flex', gap: isSm ? '2px' : '3px' }}>
          {resolvedChips.map(cnt => {
            const isChipActive = value === cnt;
            const chipId = chipIdPrefix
              ? `${chipIdPrefix}-${cnt}`
              : (idPrefix ? `btn-chip-${idPrefix}-${cnt}` : undefined);
            const chipText = chipLabel
              ? (typeof chipLabel === 'function' ? chipLabel(cnt) : `${cnt}${chipLabel}`)
              : cnt;
            const bg = isChipActive
              ? (activeBgColor || activeColor)
              : (bgCard ? 'var(--bg-card)' : 'var(--bg-surface-subtle)');
            const textClr = isChipActive
              ? (activeTextColor || '#ffffff')
              : 'var(--text-muted)';
            const borderClr = isChipActive
              ? (activeBgColor || activeColor)
              : 'var(--border-light)';

            return (
              <button
                key={cnt}
                type="button"
                id={chipId}
                onClick={() => !disabled && onChange && onChange(cnt)}
                disabled={disabled}
                style={{
                  padding: isSm ? '3px 6px' : '4px 7px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: isSm ? '0.65rem' : '0.675rem',
                  fontWeight: isChipActive ? 600 : 400,
                  background: bg,
                  color: textClr,
                  border: `1px solid ${borderClr}`,
                  cursor: disabled ? 'not-allowed' : 'pointer'
                }}
              >
                {chipText}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
