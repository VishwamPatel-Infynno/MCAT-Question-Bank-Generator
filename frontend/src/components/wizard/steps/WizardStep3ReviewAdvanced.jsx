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

export default function WizardStep3ReviewAdvanced({
  selectedSection = 'chem_phys',
  sectionMeta = {},
  setStep,
  selectedSubject = '',
  selectedTopic = '',
  selectedSubtopic = '',
  difficulty = 'medium',
  totalQuestions = 50,
  questionType = 'PASSAGE_BASED_MCQ',
  allowAiImages = false,
  setAllowAiImages,
  COGNITIVE_TRAPS = [],
  primaryTrap = 'Automatic',
  setPrimaryTrap,
  primaryTraps = [],
  onTogglePrimaryTrap,
  selectedSkill = '',
  setSelectedSkill: _setSelectedSkill,
  selectedSubskill = '',
  setSelectedSubskill,
  selectedSubskills = [],
  onToggleSubskill,
  likelyMistakePattern = '',
  setLikelyMistakePattern,
  likelyMistakePatterns = [],
  onToggleMistakePattern,
  customMistakePattern = '',
  setCustomMistakePattern: _setCustomMistakePattern
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isCars = selectedSection === 'cars';

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={14} style={{ color: 'var(--brand-primary)' }} />
            <span>Advanced Settings</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
              (Cognitive Traps, Skills, Visuals)
            </span>
          </div>
          {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {showAdvanced && (
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Cognitive Traps */}
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Cognitive Trap Focus
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
                Student Misconception Targets
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
                  <span>Automatic (AI Diagnosis)</span>
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

            {/* AI Image Generation Toggle (Sciences only) */}
            {!isCars && (
              <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-light)' }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={allowAiImages}
                    onChange={(e) => setAllowAiImages?.(e.target.checked)}
                    style={{ accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
                  />
                  <ImageIcon size={14} style={{ color: 'var(--brand-primary)' }} />
                  <span>Generate Scientific Diagrams &amp; Reaction Schemes</span>
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
