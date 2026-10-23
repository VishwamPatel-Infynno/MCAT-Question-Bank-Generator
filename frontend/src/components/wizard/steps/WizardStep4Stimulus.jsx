import React, { useState, useMemo } from 'react';
import {
  Image as ImageIcon,
  Target,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Tag
} from 'lucide-react';
import IndependentDiagramControls from '../IndependentDiagramControls';
import { DEFAULT_IMAGE_MODEL, IMAGE_PRICING } from '../../../constants/config';
import {
  getSkillsForSection,
  getSubskillsForSkill,
  LIKELY_MISTAKE_PATTERNS,
  CONTENT_DOMAINS
} from '../../../constants/mcat';

export default function WizardStep4Stimulus({
  selectedSection = 'chem_phys',
  totalQuestions,
  _passageRequired,
  _setPassageRequired,
  _setPassageCount,
  _setPassageMode,
  requirePassageImage,
  setRequirePassageImage,
  isAbstractReasoning,
  _imageQuestionIndices,
  _imageMode,
  _setImageCount,
  passageMode,
  numIndependentQs,
  activeQuestionImagesCount,
  indSingleTotal,
  indMultiTotal,
  indSingleIndices,
  indMultiIndices,
  activeSingleImageCount,
  activeMultiImageCount,
  setSingleImageCount,
  setMultiImageCount,
  COGNITIVE_TRAPS,
  primaryTrap,
  setPrimaryTrap,
  customPrompt,
  setCustomPrompt,
  // New taxonomy props
  selectedSkill,
  setSelectedSkill,
  selectedSubskill,
  setSelectedSubskill,
  contentDomains = [],
  onToggleContentDomain,
  likelyMistakePattern,
  setLikelyMistakePattern,
  customMistakePattern,
  setCustomMistakePattern
}) {
  const [trapFilter, setTrapFilter] = useState('');
  const [isCustomMistake, setIsCustomMistake] = useState(Boolean(customMistakePattern));

  const imageUnitRate = IMAGE_PRICING[DEFAULT_IMAGE_MODEL]?.baseRate ?? 0.014;
  const imagePriceLabel = `$${imageUnitRate.toFixed(3)} / img`;

  // Filter skills for active section
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

  // Filtered cognitive traps
  const filteredTraps = useMemo(() => {
    const q = trapFilter.trim().toLowerCase();
    if (!q) return COGNITIVE_TRAPS;
    return COGNITIVE_TRAPS.filter(t =>
      t.label.toLowerCase().includes(q) ||
      (t.desc && t.desc.toLowerCase().includes(q))
    );
  }, [COGNITIVE_TRAPS, trapFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div className="wizard-heading-group">
        <h2 className="wizard-step-title">Calibrate Skills, Distractor Traps & Cognitive Stimulus</h2>
        <p className="wizard-step-subtitle">
          Configure official reasoning skills, distractor traps, likely student mistake patterns, diagrams, and domain tags.
        </p>
      </div>

      {/* 1. Official AAMC Skill & Subskill Focus */}
      <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Target size={16} style={{ color: 'var(--brand-primary)' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              AAMC Inquiry & Reasoning Skill (SIRS / CARS)
            </span>
          </div>
          <span className="badge-minimal">Official Standard</span>
        </div>

        {/* Skill Selection Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {availableSkills.map((sk) => {
            const isSel = (activeSkill?.id === sk.id);
            return (
              <button
                key={sk.id}
                type="button"
                className={`badge-minimal ${isSel ? 'active' : ''}`}
                style={{
                  padding: '7px 12px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  background: isSel ? 'var(--infynno-gradient)' : 'var(--bg-surface)',
                  borderColor: isSel ? 'transparent' : 'var(--border-light)',
                  color: isSel ? '#ffffff' : 'var(--text-primary)',
                  fontWeight: isSel ? 600 : 500
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
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
              Specific Subskill Competency:
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
                      padding: '5px 10px',
                      borderRadius: 'var(--radius-xs)',
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      background: isSel ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-card)',
                      border: isSel ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                      color: isSel ? 'var(--brand-primary)' : 'var(--text-muted)',
                      fontWeight: isSel ? 600 : 500
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

      {/* 2. Primary Cognitive Distractor Trap (25 Traps) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={15} style={{ color: 'var(--status-warning)' }} />
            <span>Target Cognitive Distractor Trap (25 Traps):</span>
          </label>
          <div style={{ position: 'relative', width: '200px' }}>
            <input
              type="text"
              placeholder="Search traps..."
              value={trapFilter}
              onChange={(e) => setTrapFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '4px 8px',
                fontSize: '0.75rem',
                borderRadius: 'var(--radius-xs)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '8px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' }}>
          {filteredTraps.map((trap) => {
            const isSelected = primaryTrap === trap.id;
            return (
              <div
                key={trap.id}
                className={`wizard-tier-card ${isSelected ? 'selected' : ''}`}
                style={{ padding: '10px 12px', cursor: 'pointer' }}
                onClick={() => setPrimaryTrap(trap.id)}
                role="button"
                tabIndex={0}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    {trap.label}
                  </div>
                  {isSelected && <CheckCircle2 size={13} style={{ color: 'var(--brand-primary)' }} />}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                  {trap.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Likely Student Mistake Pattern */}
      <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lightbulb size={16} style={{ color: 'var(--brand-primary)' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Likely Student Mistake Pattern (Distractor Lure)
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsCustomMistake(prev => !prev);
              if (isCustomMistake) setCustomMistakePattern?.('');
            }}
            className="badge-minimal"
            style={{ cursor: 'pointer', fontSize: '0.72rem' }}
          >
            {isCustomMistake ? 'Switch to Preset List' : '+ Enter Custom Error'}
          </button>
        </div>

        {isCustomMistake ? (
          <div>
            <input
              type="text"
              placeholder="e.g. Inverts Michaelis-Menten Lineweaver-Burk slope (Km/Vmax instead of 1/Vmax)..."
              value={customMistakePattern || ''}
              onChange={(e) => {
                setCustomMistakePattern?.(e.target.value);
                setLikelyMistakePattern?.(e.target.value);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '0.82rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)'
              }}
            />
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              The question generator will deliberately craft a tempting incorrect answer for students making this mistake.
            </div>
          </div>
        ) : (
          <select
            value={likelyMistakePattern || ''}
            onChange={(e) => setLikelyMistakePattern?.(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              fontSize: '0.82rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <option value="">None / Smart AI Choice (Automatic)</option>
            {LIKELY_MISTAKE_PATTERNS.map((mp) => (
              <option key={mp.id} value={mp.id}>
                {mp.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 4. Multi-Select Content Domains (33 Domains) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Tag size={15} style={{ color: 'var(--brand-primary)' }} />
            <span>Content Domains / Context Themes (Optional Multi-Select):</span>
          </label>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {contentDomains.length} selected
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
          {CONTENT_DOMAINS.map((domain) => {
            const isSel = contentDomains.includes(domain.id) || contentDomains.includes(domain.label);
            return (
              <button
                key={domain.id}
                type="button"
                onClick={() => onToggleContentDomain?.(domain.id)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  background: isSel ? 'rgba(79, 48, 185, 0.2)' : 'var(--bg-surface-elevated)',
                  border: isSel ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                  color: isSel ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  fontWeight: isSel ? 600 : 500
                }}
              >
                {isSel && <CheckCircle2 size={11} style={{ display: 'inline', marginRight: '4px' }} />}
                <span>{domain.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Diagrams / Visual Stimulus Controls */}
      {totalQuestions > 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-light)' }}>
          {passageMode === 'single_passage' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Shared Passage Diagram
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Generate a dedicated AI diagram for the shared reading passage ({imagePriceLabel} flat).
                </div>
              </div>
              <div className="pill-track" style={{ width: '220px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                <button
                  type="button"
                  id="btn-wizard-p-diag-no"
                  onClick={() => setRequirePassageImage && setRequirePassageImage(false)}
                  className={`pill-track-btn ${!requirePassageImage ? 'active' : ''}`}
                  style={{ width: '100%', padding: '6px' }}
                >
                  No Diagram
                </button>
                <button
                  type="button"
                  id="btn-wizard-p-diag-yes"
                  onClick={() => setRequirePassageImage && setRequirePassageImage(true)}
                  className={`pill-track-btn ${requirePassageImage ? 'active' : ''}`}
                  style={{ width: '100%', padding: '6px' }}
                >
                  <ImageIcon size={12} />
                  <span>With Diagram</span>
                </button>
              </div>
            </div>
          )}

          <IndependentDiagramControls
            isAbstractReasoning={isAbstractReasoning}
            numIndependentQs={numIndependentQs}
            passageMode={passageMode}
            activeQuestionImagesCount={activeQuestionImagesCount}
            indSingleTotal={indSingleTotal}
            indMultiTotal={indMultiTotal}
            indSingleIndices={indSingleIndices}
            indMultiIndices={indMultiIndices}
            activeSingleImageCount={activeSingleImageCount}
            activeMultiImageCount={activeMultiImageCount}
            setSingleImageCount={setSingleImageCount}
            setMultiImageCount={setMultiImageCount}
          />
        </div>
      )}

      {/* 6. Custom AI Instructions Prompt */}
      <div>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
          Any custom instructions for the AI? (Optional):
        </label>
        <textarea
          className="input-textarea"
          rows={2}
          placeholder="e.g. Focus on enzyme kinetics with Lineweaver-Burk plots, test Michaelis-Menten constants..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          style={{ width: '100%', resize: 'vertical' }}
        />
      </div>
    </div>
  );
}
