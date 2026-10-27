import React, { useState, useMemo } from 'react';
import {
  Edit3,
  Zap,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle2,
  Search,
  Lightbulb,
  Image
} from 'lucide-react';
import {
  getSkillsForSection,
  getSubskillsForSkill,
  LIKELY_MISTAKE_PATTERNS
} from '../../../constants';

export default function WizardStep3ReviewAdvanced({
  selectedSection = 'chem_phys',
  sectionMeta = {},
  pacing = {},
  setStep,
  selectedSubject = '',
  selectedUnit = '',
  selectedTopic = '',
  selectedSubtopic = '',
  selectedSubtopics = [],
  difficulty = 'medium',
  totalQuestions = 50,
  setTotalQuestions,
  questionType = 'PASSAGE_BASED_MCQ',
  allowAiImages = false,
  setAllowAiImages,
  COGNITIVE_TRAPS = [],
  primaryTrap = 'Automatic',
  setPrimaryTrap,
  primaryTraps = [],
  onTogglePrimaryTrap,
  selectedSkill = '',
  setSelectedSkill,
  selectedSubskill = '',
  setSelectedSubskill,
  selectedSubskills = [],
  onToggleSubskill,
  likelyMistakePattern = '',
  setLikelyMistakePattern,
  likelyMistakePatterns = [],
  onToggleMistakePattern,
  customMistakePattern = '',
  setCustomMistakePattern
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [trapFilter, setTrapFilter] = useState('');
  const [mistakeFilter, setMistakeFilter] = useState('');
  const [isCustomMistake, setIsCustomMistake] = useState(Boolean(customMistakePattern));

  const isCars = selectedSection === 'cars';

  // Effective multi-select sets with fallback to legacy single-string props
  const effectiveTraps = useMemo(() => {
    if (primaryTraps && primaryTraps.length > 0) return primaryTraps;
    if (primaryTrap && primaryTrap !== 'Automatic') return [primaryTrap];
    return [];
  }, [primaryTraps, primaryTrap]);

  const trapSummaryLabel = useMemo(() => {
    if (effectiveTraps.length === 0) return 'Automatic (Smart AI Choice)';
    if (effectiveTraps.length === 1) {
      const t = COGNITIVE_TRAPS?.find((item) => item.id === effectiveTraps[0]);
      return t?.label || effectiveTraps[0];
    }
    return `${effectiveTraps.length} Traps Selected (${effectiveTraps
      .map((id) => COGNITIVE_TRAPS?.find((t) => t.id === id)?.label || id)
      .join(', ')})`;
  }, [effectiveTraps, COGNITIVE_TRAPS]);

  // Available skills for the selected section
  const availableSkills = useMemo(() => {
    return getSkillsForSection(selectedSection);
  }, [selectedSection]);

  const activeSkill = useMemo(() => {
    return availableSkills.find((s) => s.id === selectedSkill) || availableSkills[0] || null;
  }, [availableSkills, selectedSkill]);

  const availableSubskills = useMemo(() => {
    if (!activeSkill) return [];
    return activeSkill.subskills || [];
  }, [activeSkill]);

  const effectiveSubskills = useMemo(() => {
    if (selectedSubskills && selectedSubskills.length > 0) return selectedSubskills;
    if (selectedSubskill && selectedSubskill !== '' && selectedSubskill !== 'All') return [selectedSubskill];
    return [];
  }, [selectedSubskills, selectedSubskill]);

  const subskillsSummaryLabel = useMemo(() => {
    if (effectiveSubskills.length === 0) return 'All Subskills in Competency';
    if (effectiveSubskills.length === 1) return effectiveSubskills[0];
    return `${effectiveSubskills.length} Subskills Focus`;
  }, [effectiveSubskills]);

  // Effective mistake patterns
  const effectiveMistakes = useMemo(() => {
    if (customMistakePattern) return [customMistakePattern];
    if (likelyMistakePatterns && likelyMistakePatterns.length > 0) return likelyMistakePatterns;
    if (
      likelyMistakePattern &&
      likelyMistakePattern !== 'Automatic' &&
      likelyMistakePattern !== 'None' &&
      likelyMistakePattern !== ''
    ) {
      return [likelyMistakePattern];
    }
    return [];
  }, [customMistakePattern, likelyMistakePatterns, likelyMistakePattern]);

  const mistakeSummaryLabel = useMemo(() => {
    if (customMistakePattern) return `Custom: ${customMistakePattern}`;
    if (effectiveMistakes.length === 0) return 'Automatic (Smart AI Diagnosis)';
    if (effectiveMistakes.length === 1) return effectiveMistakes[0];
    return `${effectiveMistakes.length} Misconception Patterns`;
  }, [customMistakePattern, effectiveMistakes]);

  const handleSkillSelect = (skillId) => {
    setSelectedSkill?.(skillId);
    // Reset subskills for new skill competency to 'All'
    if (onToggleSubskill) {
      onToggleSubskill('All');
    } else {
      const subskills = getSubskillsForSkill(skillId);
      setSelectedSubskill?.(subskills[0] || '');
    }
  };

  // Filter cognitive traps (exclude Automatic since Chip 0 is the dedicated Automatic chip)
  const filteredTraps = useMemo(() => {
    const q = trapFilter.trim().toLowerCase();
    const traps = (COGNITIVE_TRAPS || []).filter((t) => t.id !== 'Automatic');
    if (!q) return traps;
    return traps.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        (t.desc && t.desc.toLowerCase().includes(q))
    );
  }, [trapFilter, COGNITIVE_TRAPS]);

  // Filter mistake patterns (exclude Automatic/None since dedicated chips handle them)
  const filteredMistakePatterns = useMemo(() => {
    const q = mistakeFilter.trim().toLowerCase();
    const patterns = (LIKELY_MISTAKE_PATTERNS || []).filter(
      (m) => m.id !== 'Automatic' && m.id !== 'None'
    );
    if (!q) return patterns;
    return patterns.filter(
      (m) =>
        m.label.toLowerCase().includes(q) ||
        (m.id && m.id.toLowerCase().includes(q))
    );
  }, [mistakeFilter]);

  // Check if topic focus is specific
  const effectiveSubtopics = useMemo(() => {
    if (selectedSubtopics && selectedSubtopics.length > 0) return selectedSubtopics;
    if (
      selectedSubtopic &&
      selectedSubtopic !== 'All Core Topics (Balanced Mix)' &&
      selectedSubtopic !== 'All High-Yield Topics (Balanced Mix)' &&
      selectedSubtopic !== 'General Practice'
    ) {
      return [selectedSubtopic];
    }
    return [];
  }, [selectedSubtopics, selectedSubtopic]);

  const isFocusSpecific = effectiveSubtopics.length > 0;

  const topicFocusSummaryText = useMemo(() => {
    if (effectiveSubtopics.length === 0) return 'All High-Yield Topics (Balanced Mix)';
    if (effectiveSubtopics.length === 1) return effectiveSubtopics[0];
    return `${effectiveSubtopics.length} Concepts: ${effectiveSubtopics.join(', ')}`;
  }, [effectiveSubtopics]);

  const hasAdvancedCustomization = Boolean(
    effectiveTraps.length > 0 ||
    effectiveSubskills.length > 0 ||
    effectiveMistakes.length > 0
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="wizard-heading-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h2 className="wizard-step-title">Review &amp; Launch Batch</h2>
          <span className="badge-minimal" style={{ fontSize: '0.72rem' }}>
            Final Review &bull; Step 3 of 3
          </span>
        </div>
        <p className="wizard-step-subtitle">
          Confirm your syllabus configuration, difficulty level, and batch scope. Advanced psychometrics can be tuned optionally below.
        </p>
      </div>

      {/* Main Review Summary Card */}
      <div className="wizard-summary-card">
        {/* Row 1: Section & Topic Focus */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Target Section &amp; Focus</div>
            <div className="wizard-summary-value" style={{ marginTop: '3px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ color: sectionMeta?.color, fontWeight: 700 }}>
                {sectionMeta?.label}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {topicFocusSummaryText}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
              <span className="badge-minimal" style={{ fontSize: '0.7rem' }}>
                ⏱️ {pacing?.target || '~96s / Q'} Target Pacing
              </span>
            </div>
            {isFocusSpecific && selectedSubject && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {selectedSubject} {selectedUnit ? `› ${selectedUnit}` : ''} {selectedTopic ? `› ${selectedTopic}` : ''}
              </div>
            )}
          </div>
          <button
            type="button"
            className="wizard-summary-edit-btn"
            onClick={() => setStep(1)}
            title="Edit Section & Topic"
          >
            <Edit3 size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Edit
          </button>
        </div>

        {/* Row 2: Level, Scope & Format */}
        <div className="wizard-summary-row">
          <div>
            <div className="wizard-summary-label">Difficulty, Scope &amp; Format</div>
            <div className="wizard-summary-value" style={{ marginTop: '3px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                {difficulty} Difficulty
              </span>
              <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
              <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>
                {totalQuestions === 5
                  ? 'Mini-Batch (1 Job • 5 Qs)'
                  : `Full Mock Section (10 Jobs • ${totalQuestions} Qs)`}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>&bull;</span>
              <span className="badge-minimal" style={{ fontSize: '0.7rem' }}>
                {questionType === 'PASSAGE_BASED_MCQ' ? 'Passage-Based MCQ' : 'Independent Discrete MCQ'}
              </span>
            </div>

            {/* Quick Scope switcher */}
            {setTotalQuestions && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Switch scope:</span>
                {[
                  { count: 5, label: '1 Job (5 Qs Batch)' },
                  { count: 50, label: '10 Jobs (50 Qs Batch)' }
                ].map(({ count, label }) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setTotalQuestions(count)}
                    style={{
                      padding: '2px 8px',
                      fontSize: '0.68rem',
                      fontWeight: totalQuestions === count ? 600 : 500,
                      borderRadius: 'var(--radius-xs)',
                      background: totalQuestions === count ? 'var(--brand-light)' : 'var(--bg-surface-subtle)',
                      border: totalQuestions === count ? '1px solid var(--border-brand)' : '1px solid var(--border-light)',
                      color: totalQuestions === count ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            className="wizard-summary-edit-btn"
            onClick={() => setStep(2)}
            title="Edit Difficulty & Format"
          >
            <Edit3 size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Edit
          </button>
        </div>
      </div>

      {/* Scientific Figures & Visual Stimuli Card (Elevated Above Optional Directives) */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-xs)',
              background: (!isCars && allowAiImages) ? 'var(--brand-light)' : 'var(--bg-surface-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: (!isCars && allowAiImages) ? 'var(--brand-primary)' : 'var(--text-muted)',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }}
          >
            <Image size={16} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Scientific Figures &amp; Visual Stimuli
            </div>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {isCars
                ? '🔒 CARS passages are strictly text-based per official AAMC exam guidelines.'
                : 'Permit AI to synthesize Flux diagrams/charts when required for data analysis'}
            </div>
          </div>
        </div>

        {!isCars && (
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              fontSize: '0.76rem',
              fontWeight: 600,
              color: allowAiImages ? 'var(--brand-primary)' : 'var(--text-secondary)',
              userSelect: 'none',
              padding: '4px 8px',
              borderRadius: 'var(--radius-xs)',
              background: allowAiImages ? 'var(--brand-light)' : 'transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <input
              type="checkbox"
              checked={allowAiImages}
              onChange={(e) => setAllowAiImages?.(e.target.checked)}
              style={{ accentColor: 'var(--brand-primary)', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <span>Enable AI Visuals</span>
          </label>
        )}
      </div>

      {/* Expandable "Advanced Parameters & Directives (Optional)" Accordion */}
      <div
        style={{
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-light)',
          overflow: 'hidden',
          transition: 'all 0.2s ease'
        }}
      >
        {/* Accordion Header / Toggle */}
        <div
          onClick={() => setShowAdvanced((prev) => !prev)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowAdvanced((prev) => !prev);
            }
          }}
          style={{
            padding: '12px 16px',
            background: showAdvanced ? 'var(--bg-surface-subtle)' : 'var(--bg-surface)',
            borderBottom: showAdvanced ? '1px solid var(--border-light)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Sliders size={15} style={{ color: 'var(--brand-primary)' }} />
            <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Advanced Parameters &amp; Directives (Optional)
            </span>
            {!showAdvanced && (
              <span className="badge-minimal" style={{ fontSize: '0.68rem', color: hasAdvancedCustomization ? 'var(--brand-primary)' : 'var(--text-muted)' }}>
                {hasAdvancedCustomization ? '⚡ Custom Directives Active' : '✨ Smart Defaults Active'}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
            <span>{showAdvanced ? 'Collapse' : 'Customize'}</span>
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>

        {/* Collapsed State Summary Hint */}
        {!showAdvanced && (
          <div style={{ padding: '8px 16px', fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-surface-subtle)', lineHeight: 1.5 }}>
            Traps: <strong>{trapSummaryLabel}</strong> &bull; Skills: <strong>{activeSkill?.id || 'Skill 1'} ({subskillsSummaryLabel})</strong> &bull; Errors: <strong>{mistakeSummaryLabel}</strong>
          </div>
        )}

        {/* Expanded Accordion Body */}
        {showAdvanced && (
          <div className="wizard-step-fade-enter" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Setting 1: Cognitive Distractor Traps (Multi-Select) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={13} style={{ color: 'var(--status-purple)' }} />
                  Target Cognitive Distractor Traps (Multi-Select)
                </label>
                <span className="badge-minimal" style={{ fontSize: '0.68rem' }}>
                  {effectiveTraps.length > 0 ? `${effectiveTraps.length} Traps Selected` : 'Automatic (Smart AI Choice)'}
                </span>
              </div>

              {/* Traps filter input */}
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search cognitive trap mechanisms..."
                  value={trapFilter}
                  onChange={(e) => setTrapFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px 6px 30px',
                    borderRadius: 'var(--radius-xs)',
                    background: 'var(--bg-surface-subtle)',
                    border: '1px solid var(--border-light)',
                    fontSize: '0.74rem',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Traps pill list with multi-select */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '130px', overflowY: 'auto', padding: '2px' }}>
                {/* Automatic Choice Chip */}
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
                    cursor: 'pointer',
                    transition: 'all 0.12s ease'
                  }}
                >
                  {effectiveTraps.length === 0 && <CheckCircle2 size={11} />}
                  <span>✨ Automatic (Smart AI Choice)</span>
                </button>

                {filteredTraps.map((trap) => {
                  const isSelected = effectiveTraps.includes(trap.id);
                  return (
                    <button
                      key={trap.id}
                      type="button"
                      onClick={() => {
                        if (onTogglePrimaryTrap) onTogglePrimaryTrap(trap.id);
                        else setPrimaryTrap?.(trap.id);
                      }}
                      title={trap.desc}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 9px',
                        borderRadius: 'var(--radius-full)',
                        background: isSelected ? 'var(--status-purple)' : 'var(--bg-surface-subtle)',
                        border: isSelected ? '1px solid var(--status-purple)' : '1px solid var(--border-light)',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                        fontSize: '0.72rem',
                        fontWeight: isSelected ? 600 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {isSelected && <CheckCircle2 size={11} />}
                      <span>{trap.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Setting 2: AAMC Reasoning Skills & Subskills (Multi-Select) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '6px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  AAMC Scientific Inquiry &amp; Reasoning Competency
                </label>
                <span className="badge-minimal" style={{ fontSize: '0.68rem' }}>
                  {effectiveSubskills.length > 0 ? `${effectiveSubskills.length} Subskills Focus` : 'All Subskills'}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                {availableSkills.map((sk) => {
                  const isSelected = (selectedSkill || availableSkills[0]?.id) === sk.id;
                  return (
                    <div
                      key={sk.id}
                      onClick={() => handleSkillSelect(sk.id)}
                      role="button"
                      tabIndex={0}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-xs)',
                        background: isSelected ? 'var(--brand-light)' : 'var(--bg-surface-subtle)',
                        border: isSelected ? '1px solid var(--border-brand)' : '1px solid var(--border-light)',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                          {sk.id}: {sk.name}
                        </span>
                        {isSelected && <CheckCircle2 size={12} style={{ color: 'var(--brand-primary)' }} />}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {sk.desc}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Subskill Chips Multi-Select */}
              {availableSubskills.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      Specific Reasoning Subskills (Multi-Select):
                    </span>
                    <span className="badge-minimal" style={{ fontSize: '0.68rem' }}>
                      {effectiveSubskills.length > 0 ? `${effectiveSubskills.length} Selected` : 'All Subskills'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {/* All Subskills Chip */}
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
                        padding: '3px 9px',
                        borderRadius: 'var(--radius-full)',
                        background: effectiveSubskills.length === 0 ? 'var(--brand-primary)' : 'var(--bg-surface-subtle)',
                        border: effectiveSubskills.length === 0 ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                        color: effectiveSubskills.length === 0 ? '#ffffff' : 'var(--text-secondary)',
                        fontSize: '0.7rem',
                        fontWeight: effectiveSubskills.length === 0 ? 600 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      {effectiveSubskills.length === 0 && <CheckCircle2 size={11} />}
                      <span>✨ All Subskills in this Competency</span>
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
                            padding: '3px 9px',
                            borderRadius: 'var(--radius-full)',
                            background: isSubSelected ? 'var(--brand-primary)' : 'var(--bg-surface-subtle)',
                            border: isSubSelected ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                            color: isSubSelected ? '#ffffff' : 'var(--text-secondary)',
                            fontSize: '0.7rem',
                            fontWeight: isSubSelected ? 600 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.12s ease'
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
            </div>

            {/* Setting 3: Target Student Misconceptions & Mistake Patterns (Multi-Select) */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lightbulb size={13} style={{ color: 'var(--brand-primary)' }} />
                  Target Student Misconceptions &amp; Error Patterns (Multi-Select)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setIsCustomMistake((prev) => !prev)}
                    style={{
                      fontSize: '0.68rem',
                      color: 'var(--brand-primary)',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    {isCustomMistake ? 'Use Preset Patterns' : '+ Custom Pattern'}
                  </button>
                  <span className="badge-minimal" style={{ fontSize: '0.68rem' }}>
                    {isCustomMistake ? 'Custom' : effectiveMistakes.length > 0 ? `${effectiveMistakes.length} Selected` : 'Automatic (Smart AI)'}
                  </span>
                </div>
              </div>

              {isCustomMistake ? (
                <div>
                  <input
                    type="text"
                    placeholder="e.g. Inverting reciprocal x-axis intercepts in Lineweaver-Burk plots..."
                    value={customMistakePattern}
                    onChange={(e) => setCustomMistakePattern?.(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-light)',
                      fontSize: '0.74rem',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Specify a custom psychometric error pattern or diagnostic flaw for distractors to target.
                  </div>
                </div>
              ) : (
                <>
                  {/* Search filter for mistake patterns */}
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Search 24 MCAT student error patterns..."
                      value={mistakeFilter}
                      onChange={(e) => setMistakeFilter(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px 6px 30px',
                        borderRadius: 'var(--radius-xs)',
                        background: 'var(--bg-surface-subtle)',
                        border: '1px solid var(--border-light)',
                        fontSize: '0.74rem',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Mistake patterns chip cloud with multi-select */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '130px', overflowY: 'auto', padding: '2px' }}>
                    {/* Automatic Chip */}
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
                        color: effectiveMistakes.length === 0 ? '#ffffff' : 'var(--text-secondary)',
                        fontSize: '0.72rem',
                        fontWeight: effectiveMistakes.length === 0 ? 600 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.12s ease'
                      }}
                    >
                      {effectiveMistakes.length === 0 && <CheckCircle2 size={11} />}
                      <span>✨ Automatic (Smart AI Diagnosis)</span>
                    </button>

                    {filteredMistakePatterns.map((mp) => {
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
                            padding: '4px 9px',
                            borderRadius: 'var(--radius-full)',
                            background: isSelected ? 'var(--brand-primary)' : 'var(--bg-surface-subtle)',
                            border: isSelected ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                            color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                            fontSize: '0.72rem',
                            fontWeight: isSelected ? 600 : 500,
                            cursor: 'pointer',
                            transition: 'all 0.12s ease'
                          }}
                        >
                          {isSelected && <CheckCircle2 size={11} />}
                          <span>{mp.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
