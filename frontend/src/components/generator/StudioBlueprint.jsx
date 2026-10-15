import React from 'react';
import {
  Sparkles,
  Zap,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  ListChecks,
  Target,
  FileText
} from 'lucide-react';
import { SECTION_ICONS, PACING_INFO } from '../../constants/ucat';
import InfynnoLogo from '../common/InfynnoLogo';

export default function StudioBlueprint({
  selectedSection,
  selectedSubtopic,
  difficulty,
  totalQuestions,
  singleChoiceCount,
  multiChoiceCount,
  passageCount,
  primaryTrap,
  customPrompt,
  sectionsData,
  onGenerate,
  onApplyPreset
}) {
  const currentSectionObj = sectionsData?.find(s => s.id === selectedSection) || { label: 'Verbal Reasoning', id: 'verbal_reasoning' };
  const SectionIcon = SECTION_ICONS[selectedSection] || FileText;
  const pacing = PACING_INFO[selectedSection] || PACING_INFO.verbal_reasoning;

  const quickPresets = [
    {
      id: 'official-simulation',
      title: 'Official Exam Simulation',
      tag: 'Most Popular',
      tagColor: '#818cf8',
      icon: Sparkles,
      iconColor: '#6366f1',
      description: 'Balanced 5-question mock reflecting official UCAT question distribution with reading passages and multiple answers.',
      config: {
        section: 'verbal_reasoning',
        difficulty: 'medium',
        totalQuestions: 5,
        singleChoiceCount: 3,
        multiChoiceCount: 2,
        passageCount: 2,
        primaryTrap: 'Automatic'
      }
    },
    {
      id: 'speed-drill',
      title: 'Rapid Speed Drill',
      tag: 'Time Training',
      tagColor: '#10b981',
      icon: Zap,
      iconColor: '#10b981',
      description: '10 quick-paced single answer questions to train sub-30 second decision making without lengthy passages.',
      config: {
        section: selectedSection || 'decision_making',
        difficulty: 'medium',
        totalQuestions: 10,
        singleChoiceCount: 10,
        multiChoiceCount: 0,
        passageCount: 0,
        primaryTrap: 'Keyword_Trap'
      }
    },
    {
      id: 'passage-master',
      title: 'Passage Master Challenge',
      tag: 'High Rigor',
      tagColor: '#38bdf8',
      icon: BookOpen,
      iconColor: '#38bdf8',
      description: '3 comprehensive ~350-word reading passages with multi-answer questions testing critical inference.',
      config: {
        section: 'verbal_reasoning',
        difficulty: 'hard',
        totalQuestions: 3,
        singleChoiceCount: 1,
        multiChoiceCount: 2,
        passageCount: 3,
        primaryTrap: 'Extreme_Language'
      }
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Live Generation Blueprint Card */}
      <div className="blueprint-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-indigo" style={{ fontSize: '0.675rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Generation Blueprint
              </span>
              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                Live Studio Mirror
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Ready to Create {totalQuestions} {totalQuestions === 1 ? 'Question' : 'Questions'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
              AI agents are calibrated to generate your questions according to the blueprint below.
            </p>
          </div>

          <button
            type="button"
            id="btn-blueprint-generate"
            onClick={onGenerate}
            className="btn-primary"
            style={{
              padding: '9px 18px',
              fontSize: '0.825rem',
              fontWeight: 700,
              gap: '6px',
              boxShadow: '0 0 20px rgba(2, 132, 199, 0.35)'
            }}
          >
            <Sparkles size={15} />
            <span>Generate Now</span>
            <span className="kbd-hint" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: 'none' }}>
              ⌘↵
            </span>
          </button>
        </div>

        {/* Dynamic Blueprint Spec Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            background: 'var(--bg-surface-subtle)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)'
          }}
        >
          {/* Subtest & Pacing */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--brand-light)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <SectionIcon size={16} />
            </div>
            <div>
              <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Target Subtest
              </span>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {currentSectionObj.label}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--brand-primary)' }}>
                {pacing.target || '~28s / question'} • {difficulty.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Question Mix */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#818cf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <ListChecks size={16} />
            </div>
            <div>
              <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Answer Formats
              </span>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {singleChoiceCount} Single • {multiChoiceCount} Multi
              </div>
              <span style={{ fontSize: '0.7rem', color: multiChoiceCount > 0 ? '#818cf8' : 'var(--text-muted)' }}>
                {multiChoiceCount > 0 ? 'Multiple answers supported' : 'Single correct choice'}
              </span>
            </div>
          </div>

          {/* Stimulus Length */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <BookOpen size={16} />
            </div>
            <div>
              <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Passage Setup
              </span>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {passageCount} Reading Passage{passageCount !== 1 ? 's' : ''}
              </div>
              <span style={{ fontSize: '0.7rem', color: passageCount > 0 ? '#38bdf8' : 'var(--text-muted)' }}>
                {totalQuestions - passageCount} short scenario{totalQuestions - passageCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Trap & Quality */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Target size={16} />
            </div>
            <div>
              <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Trap &amp; Rigor
              </span>
              <div style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {primaryTrap ? primaryTrap.replace(/_/g, ' ') : 'Balanced Traps'}
              </div>
              <span style={{ fontSize: '0.7rem', color: 'var(--status-success)' }}>
                ✓ Guaranteed 90+ Score
              </span>
            </div>
          </div>
        </div>

        {(selectedSubtopic || customPrompt) && (
          <div
            style={{
              marginTop: '12px',
              paddingTop: '10px',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              fontSize: '0.725rem'
            }}
          >
            {selectedSubtopic && (
              <span style={{ color: 'var(--text-secondary)' }}>
                Target Topic: <strong style={{ color: 'var(--text-primary)' }}>{selectedSubtopic}</strong>
              </span>
            )}
            {customPrompt && (
              <span style={{ color: 'var(--text-muted)' }}>
                Custom Directive: <em style={{ color: 'var(--text-secondary)' }}>"{customPrompt.length > 50 ? customPrompt.slice(0, 50) + '...' : customPrompt}"</em>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quick-Start Practice Sets Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Quick-Start Practice Sets
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
              Click any verified test preset to pre-fill the studio settings instantly.
            </p>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            1-Click Pre-Configuration
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          {quickPresets.map(preset => {
            const Icon = preset.icon;
            return (
              <div
                key={preset.id}
                id={`preset-${preset.id}`}
                className="preset-card"
                onClick={() => onApplyPreset && onApplyPreset(preset.config)}
                title="Click to apply this preset configuration"
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-surface-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: preset.iconColor
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-surface-subtle)',
                      color: preset.tagColor,
                      border: `1px solid ${preset.tagColor}33`
                    }}
                  >
                    {preset.tag}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {preset.title}
                </div>

                <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
                  {preset.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    color: 'var(--brand-primary)',
                    marginTop: 'auto',
                    paddingTop: '6px'
                  }}
                >
                  <span>Apply Preset</span>
                  <ArrowRight size={12} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quality Pillars Assurance Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.75rem',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)', fontWeight: 600 }}>
            <ShieldCheck size={16} color="var(--status-success)" />
            <span>Automatic 4-Agent Verification Standard:</span>
          </div>

          <span
            className="badge badge-indigo"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '0.675rem',
              padding: '2px 8px'
            }}
          >
            <InfynnoLogo width={16} height={10} />
            <span>Engineered by Infynno Solutions LLP</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--status-success)' }}>✓</span> 90+ Score Threshold
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--status-success)' }}>✓</span> Realistic Fallacies &amp; Traps
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--status-success)' }}>✓</span> Full Explanations &amp; Working
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--status-success)' }}>✓</span> Zero Database Pollution Until Confirmed
          </span>
        </div>
      </div>
    </div>
  );
}
