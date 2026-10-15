import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  X
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
  onCancel,
  isGenerating,
  isCollapsed,
  onToggleCollapse
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const currentSectionObj = sectionsData.find(s => s.id === selectedSection) || sectionsData[0];
  const subtopics = currentSectionObj?.subtopics || [];
  const pacing = PACING_INFO[selectedSection] || PACING_INFO.verbal_reasoning;

  // Render Collapsed Sidebar Dock (Slim 64px Icon Rail)
  if (isCollapsed) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '14px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          width: '56px'
        }}
      >
        <button
          onClick={onToggleCollapse}
          className="btn-secondary"
          style={{ padding: '6px', border: 'none', background: 'transparent' }}
          title="Expand Generator Panel"
        >
          <PanelLeftOpen size={16} color="var(--brand-primary)" />
        </button>

        <div style={{ width: '100%', height: '1px', background: 'var(--border-light)' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSelected ? 'var(--brand-primary)' : 'transparent',
                  border: isSelected ? '1px solid var(--brand-primary)' : '1px solid transparent',
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

        {/* Difficulty Dot Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface-elevated)',
            color: difficulty === 'easy' ? '#10b981' : difficulty === 'medium' ? '#f59e0b' : '#f43f5e',
            fontSize: '0.7rem',
            fontWeight: 700
          }}
          title={`Difficulty: ${difficulty}`}
        >
          {difficulty[0].toUpperCase()}
        </div>

        <div style={{ marginTop: 'auto' }}>
          {isGenerating ? (
            <button
              id="btn-cancel-generation-collapsed"
              onClick={onCancel}
              className="btn-danger"
              style={{ width: '36px', height: '36px', padding: 0, borderRadius: 'var(--radius-sm)' }}
              title="Cancel Generation"
            >
              <X size={16} />
            </button>
          ) : (
            <button
              id="btn-generate-collapsed"
              onClick={onGenerate}
              className="btn-primary"
              style={{ width: '36px', height: '36px', padding: 0, borderRadius: 'var(--radius-sm)' }}
              title="Generate Question (⌘↵)"
            >
              <Sparkles size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render Expanded Studio Parameter Panel
  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      {/* Dock Title & Collapse Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Question Configuration
          </h2>
          <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
            Set subtest and pacing parameters
          </p>
        </div>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            title="Collapse dock to maximize review space"
          >
            <PanelLeftClose size={14} />
          </button>
        )}
      </div>

      {/* Subtests Segmented List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          UCAT Subtest
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--bg-surface-hover)' : 'transparent',
                  border: isSelected ? '1px solid var(--border-medium)' : '1px solid transparent',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div
                  style={{
                    color: isSelected ? 'var(--brand-primary)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Icon size={15} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 600 : 500, flex: 1 }}>
                  {sec.label}
                </span>
                {isSelected && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--brand-primary)'
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pacing Advice Hint */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          background: 'var(--bg-surface-subtle)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.725rem',
          color: 'var(--text-muted)'
        }}
      >
        <span>Pacing: <strong style={{ color: 'var(--text-secondary)' }}>{pacing.target}</strong></span>
        <span>{pacing.desc}</span>
      </div>

      {/* Difficulty Level 3-Way Segmented Control */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Difficulty
          </label>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
            {difficulty} Level
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '3px',
            background: 'var(--bg-surface-subtle)',
            padding: '3px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)'
          }}
        >
          {[
            { id: 'easy', label: 'Easy', color: '#10b981' },
            { id: 'medium', label: 'Medium', color: '#f59e0b' },
            { id: 'hard', label: 'Hard', color: '#f43f5e' }
          ].map(opt => {
            const isSel = difficulty === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                id={`btn-diff-${opt.id}`}
                onClick={() => setDifficulty(opt.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '7px 4px',
                  borderRadius: 'var(--radius-sm)',
                  background: isSel ? 'var(--bg-surface-elevated)' : 'transparent',
                  border: isSel ? '1px solid var(--border-medium)' : '1px solid transparent',
                  color: isSel ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '0.775rem',
                  fontWeight: isSel ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: opt.color
                  }}
                />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Directives & Visuals Accordion */}
      <div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{ width: '100%', justifyContent: 'space-between', padding: '8px 12px' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={13} color="var(--brand-primary)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Advanced Directives &amp; Visuals</span>
          </span>
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showAdvanced && (
          <div
            style={{
              marginTop: '8px',
              padding: '12px',
              background: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {/* Subtopic */}
            <div>
              <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Subcategory Focus
              </label>
              <select
                id="select-subtopic"
                value={selectedSubtopic}
                onChange={(e) => setSelectedSubtopic(e.target.value)}
                style={{ width: '100%', fontSize: '0.8rem' }}
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
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Visual Stimulus
                </div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                  Include SVG diagram / graph
                </div>
              </div>

              <label style={{ position: 'relative', display: 'inline-block', width: '34px', height: '18px', cursor: 'pointer' }}>
                <input
                  id="toggle-require-image"
                  type="checkbox"
                  checked={requireImage || selectedSection === 'abstract_reasoning'}
                  onChange={(e) => setRequireImage(e.target.checked)}
                  disabled={selectedSection === 'abstract_reasoning'}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: (requireImage || selectedSection === 'abstract_reasoning') ? 'var(--brand-primary)' : 'var(--bg-surface-hover)',
                    borderRadius: '34px',
                    transition: '0.2s',
                    border: '1px solid var(--border-medium)'
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      height: '12px',
                      width: '12px',
                      left: (requireImage || selectedSection === 'abstract_reasoning') ? '17px' : '3px',
                      bottom: '2px',
                      backgroundColor: '#ffffff',
                      borderRadius: '50%',
                      transition: '0.2s'
                    }}
                  />
                </span>
              </label>
            </div>

            {/* Custom Instructions Textarea */}
            <div>
              <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Custom Clinical Directives
              </label>
              <textarea
                id="input-custom-prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Focus on cardiology drug dosages or GMC Good Medical Practice..."
                rows={2}
                style={{ width: '100%', fontSize: '0.775rem', resize: 'vertical' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Primary Generate Action / Cancel Action */}
      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
        <button
          id="btn-generate-main"
          onClick={onGenerate}
          disabled={isGenerating}
          className="btn-primary"
          style={{ flex: 1, padding: '10px 16px' }}
        >
          <Sparkles size={15} />
          <span>{isGenerating ? 'Generating Question...' : 'Generate Question'}</span>
          {!isGenerating && (
            <span className="kbd-hint" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: 'none' }}>
              ⌘↵
            </span>
          )}
        </button>

        {isGenerating && onCancel && (
          <button
            id="btn-cancel-generation"
            type="button"
            onClick={onCancel}
            className="btn-danger"
            style={{ padding: '10px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap', gap: '6px' }}
            title="Stop and abort question generation"
          >
            <X size={14} />
            <span>Cancel</span>
          </button>
        )}
      </div>
    </div>
  );
}
