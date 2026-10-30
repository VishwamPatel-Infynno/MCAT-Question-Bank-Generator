import React, { useState, useMemo } from 'react';
import {
  Edit3,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import {
  getSkillsForSection,
  LIKELY_MISTAKE_PATTERNS
} from '../../../constants';

const EMPTY_OBJECT = Object.freeze({});
const EMPTY_ARRAY = Object.freeze([]);

export default function WizardStep3ReviewAdvanced({
  selectedSection = 'chem_phys',
  sectionMeta = EMPTY_OBJECT,
  setStep,
  selectedSubject = '',
  selectedTopic = '',
  selectedSubtopic = '',
  difficulty = 'medium',
  totalQuestions = 50,
  questionType = 'PASSAGE_BASED_MCQ',
  allowAiImages = false,
  setAllowAiImages,
  COGNITIVE_TRAPS = EMPTY_ARRAY,
  primaryTrap = 'Automatic',
  setPrimaryTrap,
  primaryTraps = EMPTY_ARRAY,
  onTogglePrimaryTrap,
  selectedSkill = '',
  setSelectedSkill: _setSelectedSkill,
  selectedSubskill = '',
  setSelectedSubskill,
  selectedSubskills = EMPTY_ARRAY,
  onToggleSubskill,
  likelyMistakePattern = '',
  setLikelyMistakePattern,
  likelyMistakePatterns = EMPTY_ARRAY,
  onToggleMistakePattern,
  customMistakePattern = '',
  setCustomMistakePattern: _setCustomMistakePattern,
  additionalInstructions = '',
  setAdditionalInstructions
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isCars = selectedSection === 'cars';
  const hasInstructions = Boolean(additionalInstructions && additionalInstructions.trim().length > 0);

  const effectiveTraps = useMemo(() => {
    if (primaryTraps && primaryTraps.length > 0) return primaryTraps;
    if (primaryTrap && primaryTrap !== 'Automatic') return [primaryTrap];
    return [];
  }, [primaryTraps, primaryTrap]);

  const availableSkills = useMemo(() => {
    return getSkillsForSection(selectedSection);
  }, [selectedSection]);

  const activeSkill = useMemo(() => {
    return availableSkills.find((s) => s.id === selectedSkill) || availableSkills[0] || null;
  }, [availableSkills, selectedSkill]);

  const availableSubskills = useMemo(() => {
    return activeSkill?.subskills || [];
  }, [activeSkill]);

  const effectiveSubskills = useMemo(() => {
    if (selectedSubskills && selectedSubskills.length > 0) return selectedSubskills;
    if (selectedSubskill && selectedSubskill !== '' && selectedSubskill !== 'All') return [selectedSubskill];
    return [];
  }, [selectedSubskills, selectedSubskill]);

  const effectiveMistakes = useMemo(() => {
    if (customMistakePattern) return [customMistakePattern];
    if (likelyMistakePatterns && likelyMistakePatterns.length > 0) return likelyMistakePatterns;
    if (likelyMistakePattern && likelyMistakePattern !== 'Automatic' && likelyMistakePattern !== 'None') {
      return [likelyMistakePattern];
    }
    return [];
  }, [customMistakePattern, likelyMistakePatterns, likelyMistakePattern]);

  const isPassage = isCars || questionType === 'PASSAGE_BASED_MCQ';

  const formatSummary = isCars
    ? 'Reading Passage + Questions'
    : isPassage
    ? 'Passage-Based Set'
    : 'Standalone Questions';

  const diffLabel = difficulty
    ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase()
    : 'Medium';

  const topicLabel = selectedSubtopic || selectedTopic || selectedSubject || 'All Topics (Balanced Mix)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="wizard-heading-group">
        <h2 className="wizard-step-title">Review &amp; Create</h2>
      </div>

      {/* Review Summary Parameters */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1px',
            background: 'var(--border-light)'
          }}
        >
          {/* Section */}
          <div style={{ background: 'var(--bg-surface)', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Section</span>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--brand-primary)', cursor: 'pointer' }}
                title="Edit Section"
              >
                <Edit3 size={12} />
              </button>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {sectionMeta.label || selectedSection}
            </div>
          </div>

          {/* Focus */}
          <div style={{ background: 'var(--bg-surface)', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Topic Focus</span>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--brand-primary)', cursor: 'pointer' }}
                title="Edit Topic"
              >
                <Edit3 size={12} />
              </button>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {topicLabel}
            </div>
          </div>

          {/* Difficulty */}
          <div style={{ background: 'var(--bg-surface)', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Difficulty</span>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--brand-primary)', cursor: 'pointer' }}
                title="Edit Difficulty"
              >
                <Edit3 size={12} />
              </button>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {diffLabel}
            </div>
          </div>

          {/* Format */}
          <div style={{ background: 'var(--bg-surface)', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Format</span>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--brand-primary)', cursor: 'pointer' }}
                title="Edit Format"
              >
                <Edit3 size={12} />
              </button>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {formatSummary}
            </div>
          </div>

          {/* Count */}
          <div style={{ background: 'var(--bg-surface)', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Questions</span>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{ background: 'none', border: 'none', padding: 0, color: 'var(--brand-primary)', cursor: 'pointer' }}
                title="Edit Count"
              >
                <Edit3 size={12} />
              </button>
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {totalQuestions} Questions
            </div>
          </div>
        </div>
      </div>

      {/* Dedicated Scientific Diagrams & Reaction Schemes Card (Sciences Only) */}
      {!isCars && (
        <div
          role="switch"
          aria-checked={allowAiImages}
          tabIndex={0}
          onClick={() => setAllowAiImages?.(!allowAiImages)}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              setAllowAiImages?.(!allowAiImages);
            }
          }}
          style={{
            background: 'var(--bg-surface)',
            border: allowAiImages ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
            boxShadow: allowAiImages ? '0 0 0 1px var(--brand-primary), var(--shadow-sm)' : 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: allowAiImages ? 'rgba(51, 90, 207, 0.12)' : 'var(--bg-surface-subtle)',
                border: allowAiImages ? '1px solid rgba(51, 90, 207, 0.25)' : '1px solid var(--border-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: allowAiImages ? 'var(--brand-primary)' : 'var(--text-muted)',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}
            >
              <ImageIcon size={16} />
            </div>
            <span
              style={{
                fontSize: '0.84rem',
                fontWeight: 600,
                color: 'var(--text-primary)'
              }}
            >
              Include Diagrams &amp; Figures
            </span>
          </div>

          {/* Pill Toggle Switch */}
          <div
            style={{
              width: '36px',
              height: '20px',
              borderRadius: '9999px',
              background: allowAiImages ? 'var(--brand-primary)' : 'var(--border-medium)',
              position: 'relative',
              flexShrink: 0,
              transition: 'background 0.2s ease'
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#ffffff',
                position: 'absolute',
                top: '2px',
                left: allowAiImages ? '18px' : '2px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'left 0.2s ease'
              }}
            />
          </div>
        </div>
      )}

      {/* Advanced Options Collapsible Accordion */}
      <div
        style={{
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-surface)',
          overflow: 'hidden'
        }}
      >
        <button
          type="button"
          onClick={() => setShowAdvanced((prev) => !prev)}
          style={{
            width: '100%',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-subtle)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: 'var(--text-primary)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Sliders size={14} style={{ color: 'var(--brand-primary)' }} />
            <span>Advanced Settings</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              (Common Traps, Reasoning Skills, Student Mistakes)
            </span>
            {hasInstructions && (
              <span
                className="badge-minimal"
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--brand-primary)',
                  border: '1px solid var(--border-brand)',
                  background: 'var(--brand-light)',
                  padding: '1px 7px',
                  fontWeight: 600
                }}
              >
                Custom Instructions Active
              </span>
            )}
          </div>
          {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {showAdvanced && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Cognitive Traps */}
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Common Traps to Test
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (onTogglePrimaryTrap) onTogglePrimaryTrap('Automatic');
                    else setPrimaryTrap?.('Automatic');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: effectiveTraps.length === 0 ? 'var(--status-purple)' : 'var(--bg-surface-subtle)',
                    border: effectiveTraps.length === 0 ? '1px solid var(--status-purple)' : '1px solid var(--border-light)',
                    color: effectiveTraps.length === 0 ? '#ffffff' : 'var(--text-secondary)',
                    fontSize: '0.72rem',
                    fontWeight: effectiveTraps.length === 0 ? 600 : 500,
                    cursor: 'pointer'
                  }}
                >
                  {effectiveTraps.length === 0 && <CheckCircle2 size={11} />}
                  <span>Automatic (Balanced Mix)</span>
                </button>

                {(COGNITIVE_TRAPS || []).filter((t) => t.id !== 'Automatic').map((trap) => {
                  const isSelected = effectiveTraps.includes(trap.id);
                  return (
                    <button
                      key={trap.id}
                      type="button"
                      onClick={() => {
                        if (onTogglePrimaryTrap) onTogglePrimaryTrap(trap.id);
                        else setPrimaryTrap?.(trap.id);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: isSelected ? 'var(--status-purple)' : 'var(--bg-surface-subtle)',
                        border: isSelected ? '1px solid var(--status-purple)' : '1px solid var(--border-light)',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                        fontSize: '0.72rem',
                        fontWeight: isSelected ? 600 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      {isSelected && <CheckCircle2 size={11} />}
                      <span>{trap.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Subskills Selection */}
            {availableSubskills.length > 0 && (
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  AAMC Reasoning Skills
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (onToggleSubskill) onToggleSubskill('All');
                      else setSelectedSubskill?.('');
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: effectiveSubskills.length === 0 ? 'var(--brand-primary)' : 'var(--bg-surface-subtle)',
                      border: effectiveSubskills.length === 0 ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                      color: effectiveSubskills.length === 0 ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                      fontSize: '0.72rem',
                      fontWeight: effectiveSubskills.length === 0 ? 600 : 500,
                      cursor: 'pointer'
                    }}
                  >
                    {effectiveSubskills.length === 0 && <CheckCircle2 size={11} />}
                    <span>All Skills</span>
                  </button>

                  {availableSubskills.map((subsk) => {
                    const isSubSelected = effectiveSubskills.includes(subsk);
                    return (
                      <button
                        key={subsk}
                        type="button"
                        onClick={() => {
                          if (onToggleSubskill) onToggleSubskill(subsk);
                          else setSelectedSubskill?.(subsk);
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: 'var(--radius-full)',
                          background: isSubSelected ? 'var(--brand-primary)' : 'var(--bg-surface-subtle)',
                          border: isSubSelected ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                          color: isSubSelected ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                          fontSize: '0.72rem',
                          fontWeight: isSubSelected ? 600 : 500,
                          cursor: 'pointer'
                        }}
                      >
                        {isSubSelected && <CheckCircle2 size={11} />}
                        <span>{subsk}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Misconception Patterns */}
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Common Student Mistakes to Target
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (onToggleMistakePattern) onToggleMistakePattern('Automatic');
                    else setLikelyMistakePattern?.('Automatic');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: effectiveMistakes.length === 0 ? 'var(--brand-primary)' : 'var(--bg-surface-subtle)',
                    border: effectiveMistakes.length === 0 ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                    color: effectiveMistakes.length === 0 ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                    fontSize: '0.72rem',
                    fontWeight: effectiveMistakes.length === 0 ? 600 : 500,
                    cursor: 'pointer'
                  }}
                >
                  {effectiveMistakes.length === 0 && <CheckCircle2 size={11} />}
                  <span>Automatic (Recommended)</span>
                </button>

                {(LIKELY_MISTAKE_PATTERNS || []).slice(0, 8).map((mp) => {
                  const isSelected = effectiveMistakes.includes(mp.label) || effectiveMistakes.includes(mp.id);
                  return (
                    <button
                      key={mp.id}
                      type="button"
                      onClick={() => {
                        if (onToggleMistakePattern) onToggleMistakePattern(mp.label);
                        else setLikelyMistakePattern?.(mp.label);
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: isSelected ? 'var(--brand-primary)' : 'var(--bg-surface-subtle)',
                        border: isSelected ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                        color: isSelected ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                        fontSize: '0.72rem',
                        fontWeight: isSelected ? 600 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      {isSelected && <CheckCircle2 size={11} />}
                      <span>{mp.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Additional Authoring Instructions */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label
                  htmlFor="wizard-additional-instructions"
                  style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}
                >
                  Additional Authoring Instructions
                </label>
                {hasInstructions && (
                  <span className="badge-minimal" style={{ fontSize: '0.68rem', color: 'var(--brand-primary)' }}>
                    Active
                  </span>
                )}
              </div>
              <textarea
                id="wizard-additional-instructions"
                rows={3}
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions?.(e.target.value)}
                placeholder="e.g. Emphasize Lineweaver-Burk kinetic derivations; incorporate a competitive inhibitor with Ki = 2.5 uM; avoid complex trigonometric arithmetic..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '0.82rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-surface-subtle)',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: 1.5,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
