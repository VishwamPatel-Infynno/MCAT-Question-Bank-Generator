import React, { useState } from 'react';
import { Target, SlidersHorizontal, ChevronUp, ChevronDown } from 'lucide-react';
import CustomSelect from '../common/CustomSelect';

const TRAP_OPTIONS = [
  { value: 'Automatic', label: 'Automatic Trap Balancing', description: 'AI evaluates and injects realistic traps for this subtest' },
  { value: 'Keyword_Trap', label: 'Matching Words Trap', description: 'Similar words from passage with opposite or skewed meaning' },
  { value: 'Partial_Match', label: 'Incomplete Information', description: 'Missing a computation step or omitting key constraints' },
  { value: 'Extreme_Language', label: 'Extreme Words Trap', description: 'Absolute terms (always, never, only) not justified by facts' },
  { value: 'Formula_Inversion', label: 'Inverted Ratio / Formula', description: 'Reversed numerator/denominator or swapped operators' },
  { value: 'Distractor_Rounding', label: 'Premature Rounding Error', description: 'Rounding intermediate calculation values prematurely' },
  { value: 'Scope_Shift', label: 'Unwarranted Scope Shift', description: 'Broadens or narrows the context beyond passage limits' },
  { value: 'Emotional_Distractor', label: 'Emotional Distractor Trap', description: 'Morally intuitive response that violates official UCAT guidelines' },
  { value: 'Authority_Bias', label: 'Deferral to Authority Trap', description: 'Avoiding appropriate action due to hierarchy or seniority' }
];

export default function ExamTrapsSection({
  primaryTrap = 'Automatic',
  setPrimaryTrap,
  customPrompt = '',
  setCustomPrompt
}) {
  const [showAdvancedDirectives, setShowAdvancedDirectives] = useState(false);

  return (
    <div className="dock-section">
      <div className="section-header-minimal">
        <span className="section-header-title">Exam Traps &amp; Rules</span>
        <Target size={12} color="var(--text-muted)" />
      </div>

      {/* Question Trick Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label htmlFor="select-primary-trap" style={{ fontSize: '0.675rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Wrong Answer Traps
        </label>
        <CustomSelect
          id="select-primary-trap"
          label="Wrong Answer Traps"
          value={primaryTrap}
          onChange={(newTrap) => setPrimaryTrap && setPrimaryTrap(newTrap)}
          options={TRAP_OPTIONS}
        />
      </div>

      {/* Advanced Accordion (Custom Directives) */}
      <div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowAdvancedDirectives(!showAdvancedDirectives)}
          style={{ width: '100%', justifyContent: 'space-between', padding: '5px 8px', fontSize: '0.725rem', borderRadius: 'var(--radius-xs)' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <SlidersHorizontal size={11} color="var(--brand-primary)" />
            <span>Custom Instructions &amp; Directives</span>
          </span>
          {showAdvancedDirectives ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>

        {showAdvancedDirectives && (
          <div
            style={{
              marginTop: '8px',
              padding: '10px',
              background: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            {/* Custom Prompt Textarea */}
            <div>
              <label htmlFor="input-custom-prompt" style={{ display: 'block', fontSize: '0.675rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
                Custom Instructions &amp; Topics
              </label>
              <textarea
                id="input-custom-prompt"
                aria-label="Custom Instructions and Topics"
                value={customPrompt}
                onChange={(e) => setCustomPrompt && setCustomPrompt(e.target.value)}
                placeholder="e.g. Focus on cardiology dosages or medical ethics..."
                rows={2}
                style={{ width: '100%', fontSize: '0.725rem', resize: 'vertical', borderRadius: 'var(--radius-xs)' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
