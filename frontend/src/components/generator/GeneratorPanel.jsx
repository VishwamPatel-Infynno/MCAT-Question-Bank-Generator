import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Target,
  Zap,
  Flame,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
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
  isGenerating,
  isCollapsed,
  onToggleCollapse
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentSectionObj = sectionsData.find(s => s.id === selectedSection) || sectionsData[0];
  const subtopics = currentSectionObj?.subtopics || [];
  const pacing = PACING_INFO[selectedSection] || PACING_INFO.verbal_reasoning;

  // Render Collapsed Sidebar Dock
  if (isCollapsed) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '16px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          width: '64px'
        }}
      >
        <button
          onClick={onToggleCollapse}
          className="btn-secondary"
          style={{ padding: '8px', border: 'none', background: 'transparent' }}
          title="Expand Generator Panel"
        >
          <PanelLeftOpen size={18} color="var(--brand-primary)" />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sectionsData.map(sec => {
            const Icon = SECTION_ICONS[sec.id] || FileText;
            const isSelected = selectedSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => {
                  setSelectedSection(sec.id);
                  if (sec.subtopics?.length > 0) setSelectedSubtopic(sec.subtopics[0]);
                }}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSelected ? 'var(--brand-primary)' : 'var(--bg-surface-elevated)',
                  border: isSelected ? '1px solid var(--border-brand)' : '1px solid var(--border-light)',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
                title={sec.label}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>

        <div style={{ width: '100%', height: '1px', background: 'var(--border-light)' }} />

        {/* Difficulty Mini Indicator */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.65rem',
            fontWeight: 700,
            color: difficulty === 'easy' ? '#10b981' : difficulty === 'medium' ? '#f59e0b' : '#f43f5e'
          }}
          title={`Difficulty: ${difficulty}`}
        >
          {difficulty === 'easy' ? <Zap size={16} /> : difficulty === 'medium' ? <Target size={16} /> : <Flame size={16} />}
          <span style={{ textTransform: 'capitalize' }}>{difficulty[0]}</span>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="btn-primary"
            style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%' }}
            title="Generate Question (⌘↵)"
          >
            <Sparkles size={18} />
          </button>
        </div>
      </div>
    );
  }

  // Render Expanded Studio Parameter Panel
  return (
    <div
      className="glass-panel"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      {/* Header with Collapse Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'var(--brand-primary)',
              color: '#ffffff',
              fontSize: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800
            }}
          >
            1
          </span>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Select UCAT Subtest
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Official 2025/2026</span>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="btn-secondary"
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              title="Collapse Dock to maximize review space"
            >
              <PanelLeftClose size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 5 Section Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px'
        }}
      >
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
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                background: isSelected ? 'var(--brand-light)' : 'var(--bg-surface-elevated)',
                border: isSelected ? '1px solid var(--border-brand)' : '1px solid var(--border-light)',
                color: isSelected ? 'var(--brand-primary)' : 'var(--text-secondary)',
                boxShadow: isSelected ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all var(--transition-fast)'
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: isSelected ? 'var(--brand-primary)' : 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isSelected ? '#ffffff' : 'var(--brand-primary)',
                  boxShadow: isSelected ? '0 2px 6px rgba(2, 132, 199, 0.4)' : 'none',
                  flexShrink: 0
                }}
              >
                <Icon size={16} />
              </div>
              <span style={{ fontSize: '0.785rem', fontWeight: 700, lineHeight: 1.25 }}>
                {sec.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Pacing Advice Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'var(--brand-light)',
          border: '1px solid var(--border-brand)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem'
        }}
      >
        <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>
          Pacing: <strong>{pacing.target}</strong>
        </span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
          {pacing.desc}
        </span>
      </div>

      <div style={{ height: '1px', background: 'var(--border-light)' }} />

      {/* Step 2: Target Difficulty Level */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--brand-primary)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800
              }}
            >
              2
            </span>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Difficulty Level
            </h2>
          </div>
          <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>Strict Standard</span>
        </div>

        {/* 3-Segment Difficulty Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            {
              id: 'easy',
              label: 'Easy',
              icon: Zap,
              desc: 'Direct & Foundational',
              color: '#10b981',
              activeBg: 'var(--status-success-bg)',
              activeBorder: 'var(--status-success-border)'
            },
            {
              id: 'medium',
              label: 'Medium',
              icon: Target,
              desc: 'Official Standard',
              color: '#f59e0b',
              activeBg: 'var(--status-warning-bg)',
              activeBorder: 'var(--status-warning-border)'
            },
            {
              id: 'hard',
              label: 'Hard',
              icon: Flame,
              desc: 'High-Decile Traps',
              color: '#f43f5e',
              activeBg: 'var(--status-danger-bg)',
              activeBorder: 'var(--status-danger-border)'
            }
          ].map(opt => {
            const Icon = opt.icon;
            const isSel = difficulty === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                id={`btn-diff-${opt.id}`}
                onClick={() => setDifficulty(opt.id)}
                style={{
                  padding: '12px 8px',
                  borderRadius: 'var(--radius-md)',
                  border: isSel ? `1px solid ${opt.activeBorder}` : '1px solid var(--border-light)',
                  background: isSel ? opt.activeBg : 'var(--bg-surface-elevated)',
                  boxShadow: isSel ? `0 0 16px ${opt.color}35` : 'var(--shadow-sm)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: isSel ? 'var(--bg-surface)' : 'transparent',
                    color: opt.color
                  }}
                >
                  <Icon size={15} color={opt.color} />
                </div>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: '0.825rem',
                    color: isSel ? opt.color : 'var(--text-primary)'
                  }}
                >
                  {opt.label}
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    color: isSel ? opt.color : 'var(--text-muted)',
                    fontWeight: 500,
                    lineHeight: 1.2
                  }}
                >
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Customization Accordion */}
      <div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{ width: '100%', justifyContent: 'space-between', padding: '10px 14px' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={14} color="var(--brand-primary)" />
            <span style={{ fontSize: '0.825rem', fontWeight: 700 }}>Advanced Directives &amp; Visuals</span>
          </span>
          {showAdvanced ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>

        {showAdvanced && (
          <div
            style={{
              marginTop: '10px',
              padding: '14px',
              background: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* Subtopic */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Subcategory / Question Type
              </label>
              <select
                id="select-subtopic"
                value={selectedSubtopic}
                onChange={(e) => setSelectedSubtopic(e.target.value)}
                style={{ width: '100%', fontSize: '0.825rem' }}
              >
                {subtopics.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>


            {/* Visual Stimulus Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)'
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Visual Stimulus (Diagram / Graph)
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Clean SVG diagrams or FLUX.1 image stimuli.
                </div>
              </div>

              <label style={{ position: 'relative', display: 'inline-block', width: '38px', height: '20px', cursor: 'pointer' }}>
                <input
                  id="checkbox-require-image"
                  type="checkbox"
                  checked={requireImage || selectedSection === 'abstract_reasoning'}
                  disabled={selectedSection === 'abstract_reasoning'}
                  onChange={(e) => setRequireImage(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: (requireImage || selectedSection === 'abstract_reasoning') ? 'var(--brand-primary)' : 'var(--border-medium)',
                    borderRadius: '20px',
                    transition: '0.2s'
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      height: '14px',
                      width: '14px',
                      left: (requireImage || selectedSection === 'abstract_reasoning') ? '21px' : '3px',
                      bottom: '3px',
                      backgroundColor: '#ffffff',
                      borderRadius: '50%',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                      transition: '0.2s'
                    }}
                  />
                </span>
              </label>
            </div>

            {/* Custom Clinical Scenario Prompt */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Custom Clinical Focus or Scenario Prompt (Optional)
              </label>
              <textarea
                id="textarea-custom-prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Focus on pediatric emergency triage ethics or medication dosage calculations..."
                rows={2}
                style={{ width: '100%', fontSize: '0.8rem', resize: 'none' }}
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ height: '1px', background: 'var(--border-light)' }} />

      {/* Primary Action Button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          id="btn-generate-question"
          className="btn-primary"
          onClick={onGenerate}
          disabled={isGenerating}
          style={{ width: '100%', padding: '12px 20px', fontSize: '0.95rem', fontWeight: 700 }}
        >
          <Sparkles size={18} />
          <span>{isGenerating ? 'Agents Collaborating...' : 'Generate UK UCAT Question'}</span>
          <span className="kbd-hint" style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
            ⌘↵
          </span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }} />
          <span>Meta Llama 3.3 70B Turbo &bull; Precision Cost Tracked</span>
        </div>
      </div>
    </div>
  );
}
