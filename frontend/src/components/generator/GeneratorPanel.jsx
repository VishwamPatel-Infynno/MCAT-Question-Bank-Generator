import React, { useState } from 'react';
import { Sparkles, FileText, ChevronDown, ChevronUp, SlidersHorizontal, Target, Zap, Flame } from 'lucide-react';
import { SECTION_ICONS, PACING_INFO } from '../../constants/ucat';

export default function GeneratorPanel({
  sectionsData,
  selectedSection,
  setSelectedSection,
  selectedSubtopic,
  setSelectedSubtopic,
  difficulty,
  setDifficulty,
  requireImage,
  setRequireImage,
  customPrompt,
  setCustomPrompt,
  onGenerate,
  isGenerating
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentSectionObj = sectionsData.find(s => s.id === selectedSection) || sectionsData[0];
  const subtopics = currentSectionObj?.subtopics || [];
  const pacing = PACING_INFO[selectedSection] || PACING_INFO.verbal_reasoning;

  // Presets mapping
  const presets = [
    { id: 'standard', label: 'Exam Standard', icon: Target, diff: 'medium', desc: 'Real exam difficulty & pacing' },
    { id: 'speed', label: 'Speed Drill', icon: Zap, diff: 'easy', desc: 'Fast pattern recognition' },
    { id: 'mastery', label: 'Hard Mastery', icon: Flame, diff: 'hard', desc: '9th decile top-percentile traps' }
  ];

  const handlePresetClick = (preset) => {
    setDifficulty(preset.diff);
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Step 1: Select UCAT Subtest */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: 'var(--brand-primary)',
              color: '#ffffff',
              fontSize: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}>1</span>
            Select UCAT Subtest
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Official 2025/2026 Format</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
          Choose which section of the exam you want to practice.
        </p>

        {/* 5 Section Buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '8px'
        }}>
          {sectionsData.map(sec => {
            const Icon = SECTION_ICONS[sec.id] || FileText;
            const isSelected = selectedSection === sec.id;
            return (
              <button
                key={sec.id}
                id={`section-btn-${sec.id}`}
                onClick={() => {
                  setSelectedSection(sec.id);
                  if (sec.subtopics && sec.subtopics.length > 0) {
                    setSelectedSubtopic(sec.subtopics[0]);
                  }
                  if (sec.id === 'abstract_reasoning') {
                    setRequireImage(true);
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '6px',
                  padding: '10px 8px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--brand-primary-light)' : '#ffffff',
                  border: isSelected ? '2px solid var(--brand-primary)' : '1px solid var(--border-light)',
                  color: isSelected ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  boxShadow: isSelected ? '0 2px 8px rgba(2, 132, 199, 0.15)' : 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: isSelected ? 'var(--brand-primary)' : 'var(--bg-canvas)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isSelected ? '#ffffff' : 'var(--brand-primary)'
                }}>
                  <Icon size={16} />
                </div>
                <span style={{ fontSize: '0.775rem', fontWeight: 700, lineHeight: 1.2 }}>
                  {sec.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Pacing Advice Bar */}
        <div style={{
          marginTop: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'var(--brand-light)',
          border: '1px solid #bae6fd',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.775rem'
        }}>
          <span style={{ color: 'var(--brand-primary-dark)', fontWeight: 600 }}>
            Target Pacing: <strong>{pacing.target}</strong>
          </span>
          <span style={{ color: 'var(--brand-primary)', fontSize: '0.725rem' }}>
            {pacing.desc}
          </span>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)' }} />

      {/* Step 2: Difficulty & Quick Presets */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: 'var(--brand-primary)',
              color: '#ffffff',
              fontSize: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}>2</span>
            Difficulty &amp; Practice Mode
          </h2>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
          Pick a 1-click preset or select your target difficulty.
        </p>

        {/* 1-Click Presets */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {presets.map(p => {
            const Icon = p.icon;
            const isActive = difficulty === p.diff;
            return (
              <button
                key={p.id}
                type="button"
                className={`preset-chip ${isActive ? 'active' : ''}`}
                onClick={() => handlePresetClick(p)}
                title={p.desc}
              >
                <Icon size={14} color={isActive ? 'var(--brand-primary)' : 'inherit'} />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Difficulty Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {['easy', 'medium', 'hard'].map(d => {
            const isSel = difficulty === d;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                style={{
                  padding: '8px 4px',
                  borderRadius: 'var(--radius-md)',
                  border: isSel ? '2px solid var(--brand-primary)' : '1px solid var(--border-light)',
                  background: isSel ? 'var(--brand-primary-light)' : '#ffffff',
                  color: isSel ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  fontWeight: 700,
                  fontSize: '0.775rem',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                {d === 'easy' ? 'Foundational' : d === 'medium' ? 'Standard Exam' : 'Top Decile (Hard)'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Collapsible Advanced Customization Accordion */}
      <div>
        <button
          type="button"
          className="accordion-toggle"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={15} color="var(--brand-primary)" />
            <span>Advanced Customization</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              (Topic, Visuals, Clinical Scenario)
            </span>
          </span>
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showAdvanced && (
          <div style={{
            marginTop: '10px',
            padding: '16px',
            background: 'var(--bg-canvas)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            {/* Subtopic */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Curriculum Topic / Question Type
              </label>
              <select
                id="select-subtopic"
                value={selectedSubtopic}
                onChange={(e) => setSelectedSubtopic(e.target.value)}
                style={{ width: '100%', fontSize: '0.85rem' }}
              >
                {subtopics.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Visual Stimulus Toggle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              background: '#ffffff',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Visual Stimulus (Diagram / Graph)
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                  Generates clean SVG diagrams or FLUX.1 image stimuli.
                </div>
              </div>

              <label style={{ position: 'relative', display: 'inline-block', width: '42px', height: '22px', cursor: 'pointer' }}>
                <input
                  id="checkbox-require-image"
                  type="checkbox"
                  checked={requireImage || selectedSection === 'abstract_reasoning'}
                  disabled={selectedSection === 'abstract_reasoning'}
                  onChange={(e) => setRequireImage(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: (requireImage || selectedSection === 'abstract_reasoning') ? 'var(--brand-primary)' : '#cbd5e1',
                  borderRadius: '24px',
                  transition: '0.2s'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '16px',
                    width: '16px',
                    left: (requireImage || selectedSection === 'abstract_reasoning') ? '22px' : '3px',
                    bottom: '3px',
                    backgroundColor: '#ffffff',
                    borderRadius: '50%',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    transition: '0.2s'
                  }} />
                </span>
              </label>
            </div>

            {/* Custom Scenario Prompt */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Custom Clinical Focus or Prompt (Optional)
              </label>
              <textarea
                id="textarea-custom-prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Focus on pediatric emergency triage ethics or time-distance calculations..."
                rows={2}
                style={{ width: '100%', fontSize: '0.825rem', resize: 'none' }}
              />
            </div>
          </div>
        )}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border-light)' }} />

      {/* Step 3: Generate Button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          id="btn-generate-question"
          className="btn-primary"
          onClick={onGenerate}
          disabled={isGenerating}
          style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700 }}
        >
          <Sparkles size={18} />
          {isGenerating ? 'AI Agents Collaborating...' : 'Generate UK UCAT Question'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7' }} />
          <span>Meta Llama 3.3 70B Turbo &bull; Precision Cost Tracked</span>
        </div>
      </div>
    </div>
  );
}
