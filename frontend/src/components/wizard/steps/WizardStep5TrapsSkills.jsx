import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Search,
  Sparkles,
  Zap
} from 'lucide-react';
import {
  getSkillsForSection,
  getSubskillsForSkill,
  COGNITIVE_TRAPS
} from '../../../constants/mcat';

export default function WizardStep5TrapsSkills({
  selectedSection = 'chem_phys',
  primaryTrap = 'Automatic',
  setPrimaryTrap,
  selectedSkill,
  setSelectedSkill,
  selectedSubskill,
  setSelectedSubskill
}) {
  const [trapFilter, setTrapFilter] = useState('');

  // Available skills for the selected section
  const availableSkills = useMemo(() => {
    return getSkillsForSection(selectedSection);
  }, [selectedSection]);

  const activeSkill = useMemo(() => {
    return availableSkills.find(s => s.id === selectedSkill) || availableSkills[0] || null;
  }, [availableSkills, selectedSkill]);

  const availableSubskills = useMemo(() => {
    if (!activeSkill) return [];
    return activeSkill.subskills || [];
  }, [activeSkill]);

  const handleSkillSelect = (skillId) => {
    setSelectedSkill?.(skillId);
    const subskills = getSubskillsForSkill(skillId);
    if (subskills.length > 0) {
      setSelectedSubskill?.(subskills[0]);
    }
  };

  // Filter cognitive traps
  const filteredTraps = useMemo(() => {
    const q = trapFilter.trim().toLowerCase();
    if (!q) return COGNITIVE_TRAPS;
    return COGNITIVE_TRAPS.filter(t =>
      t.label.toLowerCase().includes(q) ||
      (t.desc && t.desc.toLowerCase().includes(q))
    );
  }, [trapFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="wizard-heading-group">
        <h2 className="wizard-step-title">Calibrate Cognitive Traps & Reasoning Skills</h2>
        <p className="wizard-step-subtitle">
          Anchor question psychometrics to deliberate AAMC distractor trap mechanisms and official inquiry reasoning skills.
        </p>
      </div>

      {/* Decision 1: Primary Cognitive Distractor Trap */}
      <div className="wizard-stacked-decision">
        <div className="wizard-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="wizard-decision-num">1</span>
            <span className="wizard-decision-title">Primary Cognitive Distractor Trap</span>
          </div>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              placeholder="Filter 25 traps..."
              value={trapFilter}
              onChange={(e) => setTrapFilter(e.target.value)}
              className="input-field"
              style={{
                height: '30px',
                paddingLeft: '30px',
                fontSize: '0.75rem',
                width: '100%'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px', maxHeight: '230px', overflowY: 'auto', padding: '2px' }}>
          {filteredTraps.map((trap) => {
            const isSelected = primaryTrap === trap.id;
            const isAuto = trap.id === 'Automatic';
            return (
              <div
                key={trap.id}
                className={`wizard-tier-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setPrimaryTrap?.(trap.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setPrimaryTrap?.(trap.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                style={{ padding: '12px 14px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isAuto ? (
                      <Sparkles size={14} style={{ color: 'var(--brand-primary)' }} />
                    ) : (
                      <Zap size={14} style={{ color: 'var(--status-purple)' }} />
                    )}
                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {trap.label}
                    </span>
                  </div>
                  {isSelected && (
                    <CheckCircle2 size={15} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                  )}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {trap.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subtle connector */}
      <div className="wizard-decision-connector" />

      {/* Decision 2: Official AAMC Inquiry & Reasoning Skill */}
      <div className="wizard-stacked-decision">
        <div className="wizard-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="wizard-decision-num">2</span>
            <span className="wizard-decision-title">AAMC Reasoning Skill (SIRS / CARS)</span>
          </div>
          <span className="badge-minimal" style={{ fontSize: '0.72rem' }}>
            Official Competency
          </span>
        </div>

        {/* Skill Selection Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: availableSubskills.length > 0 ? '12px' : 0 }}>
          {availableSkills.map((sk) => {
            const isSel = (activeSkill?.id === sk.id);
            return (
              <button
                key={sk.id}
                type="button"
                className={`badge-minimal ${isSel ? 'active' : ''}`}
                style={{
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  background: isSel ? 'var(--infynno-gradient)' : 'var(--bg-surface-elevated)',
                  borderColor: isSel ? 'transparent' : 'var(--border-light)',
                  color: isSel ? '#ffffff' : 'var(--text-primary)',
                  fontWeight: isSel ? 600 : 500,
                  transition: 'all 0.15s ease'
                }}
                onClick={() => handleSkillSelect(sk.id)}
              >
                <span>{sk.id}: {sk.name}</span>
              </button>
            );
          })}
        </div>

        {/* Granular Subskill Selection */}
        {availableSubskills.length > 0 && (
          <div style={{ borderTop: '1px dashed var(--border-light)', paddingTop: '10px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
              Granular Subskill Focus:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {availableSubskills.map((subsk) => {
                const isSel = (selectedSubskill === subsk);
                return (
                  <button
                    key={subsk}
                    type="button"
                    onClick={() => setSelectedSubskill?.(subsk)}
                    style={{
                      padding: '5px 11px',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      background: isSel ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-surface)',
                      border: isSel ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                      color: isSel ? 'var(--brand-primary)' : 'var(--text-muted)',
                      fontWeight: isSel ? 600 : 500,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isSel && <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} />}
                    <span>{subsk}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
