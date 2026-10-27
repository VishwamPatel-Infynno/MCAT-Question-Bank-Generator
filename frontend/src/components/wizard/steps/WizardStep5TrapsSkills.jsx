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
} from '../../../constants';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="wizard-heading-group">
        <h2 className="wizard-step-title">Cognitive Traps &amp; Reasoning Skills</h2>
        <p className="wizard-step-subtitle">
          Anchor distractor options to deliberate AAMC fallacy traps and official inquiry reasoning skills.
        </p>
      </div>

      {/* Decision 1: Primary Cognitive Distractor Trap */}
      <div className="wizard-stacked-decision">
        <div className="wizard-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="wizard-decision-num">1</span>
            <span className="wizard-decision-title">Distractor Trap Mechanism</span>
          </div>
          <div style={{ position: 'relative', width: '200px' }}>
            <Search
              size={12}
              style={{
                position: 'absolute',
                left: '9px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              placeholder="Filter traps..."
              value={trapFilter}
              onChange={(e) => setTrapFilter(e.target.value)}
              className="input-field"
              style={{
                height: '28px',
                paddingLeft: '28px',
                fontSize: '0.74rem',
                width: '100%'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px', maxHeight: '200px', overflowY: 'auto', padding: '1px' }}>
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
                style={{ padding: '10px 12px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {isAuto ? (
                      <Sparkles size={13} style={{ color: 'var(--brand-primary)' }} />
                    ) : (
                      <Zap size={13} style={{ color: 'var(--status-purple)' }} />
                    )}
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {trap.label}
                    </span>
                  </div>
                  {isSelected && (
                    <CheckCircle2 size={14} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                  )}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
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
            <span className="wizard-decision-title">AAMC Reasoning Competency</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Official Syllabus
          </span>
        </div>

        {/* Skill Selection Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: availableSubskills.length > 0 ? '10px' : 0 }}>
          {availableSkills.map((sk) => {
            const isSel = (activeSkill?.id === sk.id);
            return (
              <button
                key={sk.id}
                type="button"
                className={`pill-chip ${isSel ? 'selected' : ''}`}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  fontSize: '0.76rem',
                  background: isSel ? 'var(--brand-light)' : 'var(--bg-surface)',
                  border: isSel ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                  color: isSel ? 'var(--brand-primary)' : 'var(--text-primary)',
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
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
              Subskill Focus:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {availableSubskills.map((subsk) => {
                const isSel = (selectedSubskill === subsk);
                return (
                  <button
                    key={subsk}
                    type="button"
                    onClick={() => setSelectedSubskill?.(subsk)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      background: isSel ? 'var(--brand-light)' : 'var(--bg-surface)',
                      border: isSel ? '1px solid var(--border-brand)' : '1px solid var(--border-light)',
                      color: isSel ? 'var(--brand-primary)' : 'var(--text-secondary)',
                      fontWeight: isSel ? 600 : 500,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isSel && <CheckCircle2 size={11} style={{ display: 'inline', marginRight: '4px' }} />}
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
