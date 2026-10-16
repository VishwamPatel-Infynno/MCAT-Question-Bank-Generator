import React from 'react';
import {
  Sparkles,
  Zap,
  BookOpen,
  ArrowRight,
  FileText
} from 'lucide-react';
import { SECTION_ICONS, PACING_INFO } from '../../constants/ucat';
import InfynnoLogo from '../common/InfynnoLogo';
import MultiAgentPipelineVisualizer from './MultiAgentPipelineVisualizer';

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
  onApplyPreset,
  isGenerating = false,
  activeAgent = null,
  iterationCount = 1,
  events = [],
  latestReview = null
}) {
  const currentSectionObj = sectionsData?.find(s => s.id === selectedSection) || { label: 'Verbal Reasoning', id: 'verbal_reasoning' };
  const SectionIcon = SECTION_ICONS[selectedSection] || FileText;
  const pacing = PACING_INFO[selectedSection] || PACING_INFO.verbal_reasoning;

  const quickPresets = [
    {
      id: 'official-simulation',
      title: 'Official Exam Simulation',
      tag: 'Recommended',
      badgeClass: 'badge-purple',
      icon: Sparkles,
      iconColor: 'var(--status-purple)',
      description: 'Balanced 5-question mock reflecting official UCAT distribution with reading passages and multiple answers.',
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
      badgeClass: 'badge-emerald',
      icon: Zap,
      iconColor: 'var(--status-success)',
      description: '10 quick single-answer questions to train fast decision making without lengthy passages.',
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
      badgeClass: 'badge-cyan',
      icon: BookOpen,
      iconColor: 'var(--brand-primary)',
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Sleek Minimalist Setup Canvas */}
      <div className="blueprint-card" style={{ padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Target Setup
              </span>
              <span style={{ color: 'var(--border-medium)' }}>•</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', fontWeight: 500 }}>
                90+ Quality Standard
              </span>
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
              Ready to Create {totalQuestions} {totalQuestions === 1 ? 'Question' : 'Questions'}
            </h2>

            {/* Quiet Inline Specification Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                marginTop: '8px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)'
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--text-primary)', fontWeight: 600 }}>
                <SectionIcon size={13} style={{ color: 'var(--brand-primary)' }} />
                {currentSectionObj.label}
              </span>
              <span style={{ color: 'var(--border-medium)' }}>•</span>
              <span style={{ textTransform: 'capitalize' }}>{difficulty} Difficulty</span>
              <span style={{ color: 'var(--border-medium)' }}>•</span>
              <span>
                {singleChoiceCount > 0 && `${singleChoiceCount} Single`}
                {singleChoiceCount > 0 && multiChoiceCount > 0 && ', '}
                {multiChoiceCount > 0 && `${multiChoiceCount} Multi`}
              </span>
              <span style={{ color: 'var(--border-medium)' }}>•</span>
              <span>{passageCount > 0 ? `${passageCount} Passage${passageCount !== 1 ? 's' : ''}` : 'Short Scenarios'}</span>
              <span style={{ color: 'var(--border-medium)' }}>•</span>
              <span style={{ color: 'var(--text-muted)' }}>
                {primaryTrap && primaryTrap !== 'Automatic' ? primaryTrap.replace(/_/g, ' ') : 'Balanced Traps'}
              </span>
              <span style={{ color: 'var(--border-medium)' }}>•</span>
              <span style={{ color: 'var(--text-muted)' }}>{pacing.target || '~28s / Q'}</span>
            </div>

            {(selectedSubtopic || customPrompt) && (
              <div
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '10px',
                  fontSize: '0.725rem'
                }}
              >
                {selectedSubtopic && (
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Focus: <strong style={{ color: 'var(--text-primary)' }}>{selectedSubtopic}</strong>
                  </span>
                )}
                {customPrompt && (
                  <span style={{ color: 'var(--text-muted)' }}>
                    Directive: <em style={{ color: 'var(--text-secondary)' }}>"{customPrompt.length > 55 ? customPrompt.slice(0, 55) + '...' : customPrompt}"</em>
                  </span>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            id="btn-blueprint-generate"
            onClick={onGenerate}
            className="btn-primary"
            style={{
              padding: '9px 18px',
              fontSize: '0.825rem',
              fontWeight: 600,
              gap: '7px',
              borderRadius: 'var(--radius-xs)'
            }}
          >
            <Sparkles size={14} />
            <span>Generate Now</span>
            <span className="kbd-hint" style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: 'none', padding: '1px 5px' }}>
              ⌘↵
            </span>
          </button>
        </div>
      </div>

      {/* 4-Agent Pipeline Showcase */}
      {!isGenerating && (
        <MultiAgentPipelineVisualizer
          isGenerating={false}
          activeAgent={activeAgent}
          iterationCount={iterationCount}
          events={events}
          latestReview={latestReview}
        />
      )}

      {/* Quick-Start Practice Sets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Quick-Start Practice Sets
            </h3>
            <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
              Pre-configured test setups optimized for realistic UK UCAT preparation.
            </p>
          </div>
          <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
            1-Click Pre-Configuration
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
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
                      width: '28px',
                      height: '28px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: preset.iconColor
                    }}
                  >
                    <Icon size={14} />
                  </div>
                  <span className={`badge ${preset.badgeClass}`} style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                    {preset.tag}
                  </span>
                </div>

                <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {preset.title}
                </div>

                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
                  {preset.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--brand-primary)',
                    marginTop: 'auto',
                    paddingTop: '4px'
                  }}
                >
                  <span>Apply Preset</span>
                  <ArrowRight size={11} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Understated Minimalist Quality Assurance Strip */}
      <div
        style={{
          padding: '12px 16px',
          background: 'transparent',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.725rem',
          color: 'var(--text-muted)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <InfynnoLogo width={16} height={10} />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
            Infynno Solutions Quality Assurance:
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
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
            <span style={{ color: 'var(--status-success)' }}>✓</span> Review Before Saving
          </span>
        </div>
      </div>
    </div>
  );
}

