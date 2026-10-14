import React from 'react';
import { Sparkles, FileText } from 'lucide-react';
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
  const currentSectionObj = sectionsData.find(s => s.id === selectedSection) || sectionsData[0];
  const subtopics = currentSectionObj?.subtopics || [];
  const pacing = PACING_INFO[selectedSection] || PACING_INFO.verbal_reasoning;

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
          1. Select UK UCAT Subtest
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Choose one of the 5 official subtests evaluated in UK medical &amp; dental admissions.
        </p>
      </div>

      {/* 5 Section Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '10px'
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
                gap: '8px',
                padding: '12px 10px',
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
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isSelected ? 'var(--brand-primary)' : 'var(--bg-canvas)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isSelected ? '#ffffff' : 'var(--brand-primary)'
              }}>
                <Icon size={18} />
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.2 }}>
                {sec.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Pacing Advice Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'var(--brand-primary-light)',
        border: '1px solid #bae6fd',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.8rem'
      }}>
        <span style={{ color: 'var(--brand-primary-dark)', fontWeight: 600 }}>
          Pacing Benchmark: <strong>{pacing.target}</strong>
        </span>
        <span style={{ color: 'var(--brand-primary)', fontSize: '0.75rem' }}>
          {pacing.desc}
        </span>
      </div>

      {/* Subtopic & Difficulty Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Curriculum Focus / Subtopic
          </label>
          <select
            id="select-subtopic"
            value={selectedSubtopic}
            onChange={(e) => setSelectedSubtopic(e.target.value)}
            style={{ width: '100%' }}
          >
            {subtopics.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Target Difficulty
          </label>
          <select
            id="select-difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="easy">Easy (Foundational)</option>
            <option value="medium">Medium (Standard Exam)</option>
            <option value="hard">Hard (Top Percentile 9th Decile)</option>
          </select>
        </div>
      </div>

      {/* Image / Diagram Checkbox Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        background: 'var(--bg-canvas)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-light)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Generate Visual Stimulus (Image Generator Agent)
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Creates clean programmatic SVG or AI diagram for geometric, Venn, or data patterns.
            </div>
          </div>
        </div>

        <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
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
              height: '18px',
              width: '18px',
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

      {/* Custom Prompt Context */}
      <div>
        <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
          Custom Focus / Clinical Scenario (Optional)
        </label>
        <textarea
          id="textarea-custom-prompt"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="e.g. Focus on NHS hospital junior doctor triage ethics, or complex time-speed-distance conversion..."
          rows={2}
          style={{ width: '100%', resize: 'none' }}
        />
      </div>

      {/* Action Button */}
      <button
        id="btn-generate-question"
        className="btn-primary"
        onClick={onGenerate}
        disabled={isGenerating}
        style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
      >
        <Sparkles size={18} />
        {isGenerating ? 'Running Multi-Agent Workflow...' : 'Generate UK UCAT Question'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7' }} />
        <span>Inference Provider: <strong>DeepInfra</strong> &bull; Meta Llama 3.3 70B Instruct Turbo ($0.10 in / $0.32 out / 1M tokens)</span>
      </div>
    </div>
  );
}
