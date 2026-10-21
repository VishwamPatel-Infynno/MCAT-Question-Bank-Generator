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
          <span>Infynno Solutions • Smart UCAT Exam Studio</span>
        </div>

        {/* Hero Title */}
        <h1 className="hero-title">
          <span className="infynno-text-gradient">Infynno UCAT</span> Question Bank Generator
        </h1>

        {/* Tagline */}
        <p className="hero-tagline">
          Create realistic UK UCAT exam questions in seconds. Powered by intelligent AI agents that draft,
          review, and polish high-scoring practice items to official exam standards.
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
            <div className="hero-feature-title">5 Official Exam Sections</div>
            <div className="hero-feature-desc">
              Practice Verbal, Decision Making, Quantitative, Abstract & Situational Judgement with realistic timing.
            </div>
          </div>

          <div className="hero-feature-card">
            <div className="hero-feature-icon">
              <ShieldCheck size={18} />
            </div>
            <div className="hero-feature-title">AI Quality Review</div>
            <div className="hero-feature-desc">
              Every question is automatically evaluated by a reviewer agent for clarity, accuracy, and fairness.
            </div>
          </div>

          <div className="hero-feature-card">
            <div className="hero-feature-icon">
              <Compass size={18} />
            </div>
            <div className="hero-feature-title">Smart Answer Choices</div>
            <div className="hero-feature-desc">
              No obvious giveaways. Wrong answers look realistic to test true understanding and spot tricky traps.
            </div>
          </div>

          <div className="hero-feature-card">
            <div className="hero-feature-icon">
              <Database size={18} />
            </div>
            <div className="hero-feature-title">Save, Review & Export</div>
            <div className="hero-feature-desc">
              Organize questions in your searchable library, approve drafts, and export anytime to CSV or JSON.
            </div>
          </div>
        </div>

        {/* 1-Click Preset Shortcuts */}
        <div className="hero-presets-container">
          <div className="hero-presets-label">✨ Or start instantly with a popular practice set:</div>
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
