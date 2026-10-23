import React from 'react';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Layers,
  ShieldCheck,
  Database,
  FlaskConical,
  Dna,
  Brain,
  Gauge
} from 'lucide-react';
import InfynnoLogo from '../common/InfynnoLogo';

export default function HeroLanding({
  onGetStarted,
  onOpenBank,
  onApplyPreset
}) {
  const PRESETS = [
    {
      label: 'Chem / Phys Foundations',
      tag: '50-Question Passage Batch',
      icon: FlaskConical,
      config: {
        section: 'chem_phys',
        difficulty: 'medium',
        totalQuestions: 50,
        singleChoiceCount: 50,
        passageMode: 'single_passage',
        passageQuestionCount: 50,
        passageCount: 10,
        passageRequired: 'Yes'
      }
    },
    {
      label: 'Critical Analysis (CARS)',
      tag: '50-Question Passage Batch',
      icon: BookOpen,
      config: {
        section: 'cars',
        difficulty: 'medium',
        totalQuestions: 50,
        singleChoiceCount: 50,
        passageCount: 10,
        passageMode: 'single_passage',
        passageQuestionCount: 50,
        passageRequired: 'Yes'
      }
    },
    {
      label: 'Bio / Biochem Foundations',
      tag: '50-Question Passage Batch',
      icon: Dna,
      config: {
        section: 'bio_biochem',
        difficulty: 'hard',
        totalQuestions: 50,
        singleChoiceCount: 50,
        passageMode: 'single_passage',
        passageQuestionCount: 50,
        passageCount: 10,
        passageRequired: 'Yes'
      }
    },
    {
      label: 'Psych / Soc Foundations',
      tag: '50-Question Discrete Batch',
      icon: Brain,
      config: {
        section: 'psych_soc',
        difficulty: 'medium',
        totalQuestions: 50,
        singleChoiceCount: 50,
        passageMode: 'independent',
        passageQuestionCount: 0,
        passageCount: 0,
        passageRequired: 'No'
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
          <span>Infynno Solutions • Smart AAMC MCAT Exam Studio</span>
        </div>

        {/* Hero Title */}
        <h1 className="hero-title">
          <span className="infynno-text-gradient">Infynno MCAT</span> Question Bank Generator
        </h1>

        {/* Tagline */}
        <p className="hero-tagline">
          Create publication-grade AAMC MCAT exam questions in seconds. Powered by multi-agent psychometric AI
          that drafts, reviews, and calibrates high-scoring practice items to official medical college admissions standards.
        </p>

        {/* Centered CTA Buttons */}
        <div className="hero-cta-group">
          <button
            type="button"
            className="hero-primary-cta"
            id="btn-hero-get-started"
            onClick={onGetStarted}
          >
            <span>Get Started - Create Questions</span>
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
            <div className="hero-feature-title">4 Official MCAT Sections</div>
            <div className="hero-feature-desc">
              Practice Chem/Phys, CARS, Bio/Biochem & Psych/Soc calibrated to authentic AAMC pacing (~96s & ~101s).
            </div>
          </div>

          <div className="hero-feature-card">
            <div className="hero-feature-icon">
              <ShieldCheck size={18} />
            </div>
            <div className="hero-feature-title">AAMC Psychometric Audit</div>
            <div className="hero-feature-desc">
              Every question is scored across scientific soundness, distractor plausibility, and step-by-step proof.
            </div>
          </div>

          <div className="hero-feature-card">
            <div className="hero-feature-icon">
              <Gauge size={18} />
            </div>
            <div className="hero-feature-title">Calibrated Scaled Scoring</div>
            <div className="hero-feature-desc">
              Get instant section scaled scores (118-132) and composite percentile estimates (472-528 scale).
            </div>
          </div>

          <div className="hero-feature-card">
            <div className="hero-feature-icon">
              <Database size={18} />
            </div>
            <div className="hero-feature-title">Save, Review & Export</div>
            <div className="hero-feature-desc">
              Curate items in your searchable repository, approve candidate drafts, and export to CSV or JSON.
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
