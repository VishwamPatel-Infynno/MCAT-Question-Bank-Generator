import React from 'react';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Layers,
  ShieldCheck,
  Database,
  Compass,
  Shapes,
  BrainCircuit,
  Scale
} from 'lucide-react';
import InfynnoLogo from '../common/InfynnoLogo';

export default function HeroLanding({
  onGetStarted,
  onOpenBank,
  onApplyPreset
}) {
  const PRESETS = [
    {
      label: 'Verbal Reasoning',
      tag: 'Passage Comprehension',
      icon: BookOpen,
      config: {
        section: 'verbal_reasoning',
        difficulty: 'medium',
        totalQuestions: 2,
        passageCount: 1,
        passageRequired: 'Yes'
      }
    },
    {
      label: 'Abstract Reasoning',
      tag: 'Visual Geometry',
      icon: Shapes,
      config: {
        section: 'abstract_reasoning',
        difficulty: 'hard',
        totalQuestions: 1,
        requireImage: true,
        visual_type: 'AI_FLUX_Image'
      }
    },
    {
      label: 'Decision Making',
      tag: 'Logic & Syllogisms',
      icon: BrainCircuit,
      config: {
        section: 'decision_making',
        difficulty: 'medium',
        totalQuestions: 1
      }
    },
    {
      label: 'Situational Judgement',
      tag: 'Medical Ethics',
      icon: Scale,
      config: {
        section: 'situational_judgement',
        difficulty: 'medium',
        totalQuestions: 1
      }
    }
  ];

  return (
    <div className="hero-wrapper" id="hero-landing-view">
      <div className="hero-radial-glow" />

      <div className="hero-content">
        {/* Infynno Official Brand Logo */}
        <div style={{ marginBottom: '20px' }}>
          <a
            href="https://infynno.com/"
            target="_blank"
            rel="noopener noreferrer"
            title="Visit Infynno Solutions LLP (https://infynno.com)"
            style={{ display: 'inline-block', transition: 'transform 0.2s ease' }}
          >
            <InfynnoLogo width={68} height={44} />
          </a>
        </div>

        {/* Corporate Badge */}
        <div className="hero-badge-pill">
          <Sparkles size={14} />
          <span>Infynno Solutions LLP • AI Exam Studio 2.0</span>
        </div>

        {/* Hero Title */}
        <h1 className="hero-title">
          <span className="infynno-text-gradient">Infynno UCAT</span> Question Bank Generator
        </h1>

        {/* Tagline */}
        <p className="hero-tagline">
          Autonomous Multi-Agent AI Exam Engineering Studio. Generate psychometrically verified,
          official-rubric UCAT examination items with self-critique, distractor balancing, and instant export.
        </p>

        {/* Centered CTA Buttons */}
        <div className="hero-cta-group">
          <button
            type="button"
            className="hero-primary-cta"
            id="btn-hero-get-started"
            onClick={onGetStarted}
          >
            <span>Get Started — Create Questions</span>
            <ArrowRight size={18} />
          </button>

          <button
            type="button"
            className="hero-secondary-cta"
            id="btn-hero-open-bank"
            onClick={onOpenBank}
          >
            <Database size={16} />
            <span>Browse Question Bank</span>
          </button>
        </div>

        {/* 4 Feature Pillars */}
        <div className="hero-features-grid">
          <div className="hero-feature-card">
            <div className="hero-feature-icon">
              <Layers size={18} />
            </div>
            <div className="hero-feature-title">5 Official Sections</div>
            <div className="hero-feature-desc">
              Verbal, Decision Making, Quantitative, Abstract & Situational Judgement calibrated to UCAT standards.
            </div>
          </div>

          <div className="hero-feature-card">
            <div className="hero-feature-icon">
              <ShieldCheck size={18} />
            </div>
            <div className="hero-feature-title">100-Point Quality Gate</div>
            <div className="hero-feature-desc">
              Strict multi-agent review rubric: items must score &gt; 90 on authenticity, clarity, and distractors.
            </div>
          </div>

          <div className="hero-feature-card">
            <div className="hero-feature-icon">
              <Compass size={18} />
            </div>
            <div className="hero-feature-title">Anti-Guessability Engine</div>
            <div className="hero-feature-desc">
              Automated option symmetry length balancing, distractor plausibility, and cognitive trap engineering.
            </div>
          </div>

          <div className="hero-feature-card">
            <div className="hero-feature-icon">
              <Database size={18} />
            </div>
            <div className="hero-feature-title">PostgreSQL 16 & Export</div>
            <div className="hero-feature-desc">
              Multi-question batch staging, administrative approval workflow, and one-click JSON / RFC 4180 CSV export.
            </div>
          </div>
        </div>

        {/* 1-Click Preset Shortcuts */}
        <div className="hero-presets-container">
          <div className="hero-presets-label">Or launch a pre-configured practice preset:</div>
          <div className="hero-presets-chips">
            {PRESETS.map((preset) => {
              const Icon = preset.icon;
              return (
                <button
                  key={preset.label}
                  type="button"
                  className="hero-preset-chip"
                  onClick={() => onApplyPreset(preset.config)}
                  title={`Start with ${preset.label} (${preset.tag})`}
                >
                  <Icon size={14} style={{ color: 'var(--brand-primary)' }} />
                  <span>{preset.label}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>• {preset.tag}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
