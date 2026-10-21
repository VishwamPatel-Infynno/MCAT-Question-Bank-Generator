import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  BookOpen,
  BrainCircuit,
  Calculator,
  Shapes,
  Scale,
  Edit3
} from 'lucide-react';

const SECTION_METADATA = {
  verbal_reasoning: {
    id: 'verbal_reasoning',
    label: 'Verbal Reasoning',
    shortCode: 'VR',
    icon: BookOpen,
    tag: 'Reading Comprehension',
    color: '#3B82F6',
    desc: 'Critically evaluate written passages, test propositional logic, and draw calibrated inferences under exam time constraints.'
  },
  decision_making: {
    id: 'decision_making',
    label: 'Decision Making',
    shortCode: 'DM',
    icon: BrainCircuit,
    tag: 'Logic & Arguments',
    color: '#8B5CF6',
    desc: 'Solve complex deductive logic puzzles, syllogisms, Euler/Venn diagram arguments, and probabilistic scenarios.'
  },
  quantitative_reasoning: {
    id: 'quantitative_reasoning',
    label: 'Quantitative Reasoning',
    shortCode: 'QR',
    icon: Calculator,
    tag: 'Numerical Calculations',
    color: '#10B981',
    desc: 'Solve multi-step numerical problems, proportional changes, currency exchanges, geometry, and data interpretation.'
  },
  abstract_reasoning: {
    id: 'abstract_reasoning',
    label: 'Abstract Reasoning',
    shortCode: 'AR',
    icon: Shapes,
    tag: 'Visual Pattern Logic',
    color: '#F59E0B',
    desc: 'Identify spatial shape rules, rotational symmetry, Set A vs Set B attributes, and sequential transformation patterns.'
  },
  situational_judgement: {
    id: 'situational_judgement',
    label: 'Situational Judgement',
    shortCode: 'SJT',
    icon: Scale,
    tag: 'Medical Ethics',
    color: '#EC4899',
    desc: 'Assess professional integrity, patient perspective, medical ethics, and appropriate conduct according to GMC guidelines.'
  }
};

const CONTENT_DOMAINS = [
  'Medicine & Clinical Care',
  'Biomedical Science',
  'Public Health & Policy',
  'Medical Ethics & Law',
  'Technology & Diagnostics',
  'General Academia'
];

const COGNITIVE_TRAPS = [
  { id: 'Automatic', label: 'Automatic (AI Calibrated)', desc: 'Agent evaluates the hardest trap for the section' },
  { id: 'Keyword_Trap', label: 'Keyword Match Trap', desc: 'Distractor matches wording verbatim but contradicts nuance' },
  { id: 'Scope_Shift', label: 'Scope Shift', desc: 'Distractor generalizes beyond stated evidence' },
  { id: 'Correlation_Causation', label: 'Correlation vs Causation', desc: 'Distractor confuses an observed link with causality' },
  { id: 'Extreme_Language', label: 'Extreme Language', desc: 'Distractor uses rigid qualifiers (always, never, must)' }
];

export default function GuidedWizard({
  generatorForm,
  sectionsData,
  onLaunchGeneration,
  onExitToStudio
}) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const { formData, updateFields } = generatorForm;

  // Active section data
  const currentSection = formData.selectedSection || 'verbal_reasoning';
  const sectionMeta = SECTION_METADATA[currentSection] || SECTION_METADATA.verbal_reasoning;

  // Subtopics for current section
  const availableSubtopics = useMemo(() => {
    const secObj = sectionsData?.find(s => s.id === currentSection);
    return secObj?.subtopics && secObj.subtopics.length > 0
      ? secObj.subtopics
      : [
          'Critical Reading & Inferences',
          'Syllogisms & Logic Puzzles',
          'Percentages, Ratios & Geometry',
          'Set A vs Set B Patterns',
          'Appropriateness & Integrity'
        ];
  }, [sectionsData, currentSection]);

  // Ensure selectedSubtopic is valid when section changes
  useEffect(() => {
    if (availableSubtopics.length > 0 && !availableSubtopics.includes(formData.selectedSubtopic)) {
      updateFields({ selectedSubtopic: availableSubtopics[0] });
    }
  }, [availableSubtopics, formData.selectedSubtopic, updateFields]);

  // Handle section selection
  const handleSelectSection = (sectionId) => {
    const isAR = sectionId === 'abstract_reasoning';
    const isVR = sectionId === 'verbal_reasoning';
    updateFields({
      selectedSection: sectionId,
      ...(isAR && { requireImage: true, visual_type: 'SVG_Diagram' }),
      ...(!isAR && { requireImage: false, visual_type: 'None' }),
      ...(isVR && { passageRequired: 'Yes', passageCount: 1 }),
      ...(!isVR && { passageRequired: 'No', passageCount: 0 })
    });
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    } else {
      onLaunchGeneration();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    } else {
      onExitToStudio();
    }
  };

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      handleNext();
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="wizard-card" id="guided-wizard-container">
      {/* Top Navigation & Progress Bar */}
      <div className="wizard-topbar">
        <div className="wizard-topbar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="wizard-step-pill">Step {step} of {totalSteps}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {step === 1 && 'Exam Section Selection'}
              {step === 2 && 'Subtopic & Content Focus'}
              {step === 3 && 'Difficulty & Question Target'}
              {step === 4 && 'Passage, Stimuli & Cognitive Traps'}
              {step === 5 && 'Review & Confirmation'}
            </span>
          </div>

          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: '0.8rem', padding: '4px 8px' }}
            onClick={onExitToStudio}
            title="Exit wizard and switch directly to the Studio workspace"
          >
            Direct Studio Mode →
          </button>
        </div>

        {/* Progress Track */}
        <div className="wizard-progress-track">
          <div
            className="wizard-progress-fill"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Wizard Body: Render per-step questions */}
      <div className="wizard-body">
        {/* =================================================================
            STEP 1: UCAT SECTION
           ================================================================= */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="wizard-heading-group">
              <h2 className="wizard-step-title">Which UCAT section would you like to generate for?</h2>
              <p className="wizard-step-subtitle">
                Select from the five official UCAT examination sections. Each section activates a specialized
                psychometric rubric and prompt persona.
              </p>
            </div>

            <div className="wizard-sections-grid">
              {Object.values(SECTION_METADATA).map((sec) => {
                const Icon = sec.icon;
                const isSelected = currentSection === sec.id;
                return (
                  <div
                    key={sec.id}
                    className={`wizard-section-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelectSection(sec.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="wizard-section-top">
                      <div
                        className="wizard-section-icon-badge"
                        style={{
                          background: isSelected ? 'var(--infynno-gradient)' : 'rgba(79, 48, 185, 0.1)',
                          color: isSelected ? '#ffffff' : sec.color
                        }}
                      >
                        <Icon size={18} />
                      </div>
                      <span className="badge-minimal">{sec.tag}</span>
                    </div>

                    <div className="wizard-section-name">{sec.label}</div>
                    <div className="wizard-section-desc">{sec.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =================================================================
            STEP 2: SUBTOPIC & CONTENT DOMAIN
           ================================================================= */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="wizard-heading-group">
              <h2 className="wizard-step-title">Specify the subtopic and content domain</h2>
              <p className="wizard-step-subtitle">
                Target a specific cognitive construct within {sectionMeta.label}.
              </p>
            </div>

            {/* Subtopic Selector */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', display: 'block' }}>
                Subtopic Construct:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {availableSubtopics.map((st) => {
                  const isSelected = formData.selectedSubtopic === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      className={`hero-preset-chip ${isSelected ? 'active' : ''}`}
                      style={{
                        background: isSelected ? 'var(--infynno-gradient)' : 'var(--bg-surface-elevated)',
                        color: isSelected ? '#ffffff' : 'var(--text-primary)',
                        borderColor: isSelected ? 'transparent' : 'var(--border-light)',
                        fontWeight: isSelected ? 600 : 500
                      }}
                      onClick={() => updateFields({ selectedSubtopic: st })}
                    >
                      {isSelected && <CheckCircle2 size={14} />}
                      <span>{st}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Domain */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', display: 'block' }}>
                Content Domain / Theme (Optional):
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {CONTENT_DOMAINS.map((domain) => {
                  const isSelected = formData.contentDomain === domain;
                  return (
                    <button
                      key={domain}
                      type="button"
                      className="badge-minimal"
                      style={{
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        background: isSelected ? 'rgba(79, 48, 185, 0.15)' : 'var(--bg-surface-elevated)',
                        borderColor: isSelected ? 'var(--brand-primary)' : 'var(--border-light)',
                        color: isSelected ? 'var(--brand-primary)' : 'var(--text-secondary)',
                        fontWeight: isSelected ? 600 : 500
                      }}
                      onClick={() => updateFields({ contentDomain: isSelected ? '' : domain })}
                    >
                      <span>{domain}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            STEP 3: DIFFICULTY & QUESTION TARGET
           ================================================================= */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="wizard-heading-group">
              <h2 className="wizard-step-title">Choose difficulty and batch size</h2>
              <p className="wizard-step-subtitle">
                Calibrate the cognitive load and determine how many items to generate.
              </p>
            </div>

            {/* Difficulty Cards */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', display: 'block' }}>
                Target Difficulty Tier:
              </label>
              <div className="wizard-difficulty-grid">
                {[
                  { id: 'easy', title: 'Foundational', desc: 'Direct inferences, clean premises, foundational revision.' },
                  { id: 'medium', title: 'Standard Exam', desc: 'Authentic official UCAT timing & psychometric calibration.' },
                  { id: 'hard', title: 'Top Percentile', desc: 'Subtle distractor traps, high cognitive load, top decile target.' }
                ].map((tier) => {
                  const isSelected = (formData.difficulty || 'medium').toLowerCase() === tier.id;
                  return (
                    <div
                      key={tier.id}
                      className={`wizard-tier-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => updateFields({ difficulty: tier.id })}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="wizard-tier-title">{tier.title}</div>
                      <div className="wizard-tier-desc">{tier.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Question Count Stepper */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', display: 'block' }}>
                Total Questions to Generate:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {[1, 2, 3, 5].map((cnt) => {
                  const isSelected = (formData.totalQuestions || 1) === cnt;
                  return (
                    <button
                      key={cnt}
                      type="button"
                      className="hero-preset-chip"
                      style={{
                        padding: '10px 20px',
                        fontSize: '0.95rem',
                        background: isSelected ? 'var(--infynno-gradient)' : 'var(--bg-surface-elevated)',
                        color: isSelected ? '#ffffff' : 'var(--text-primary)',
                        borderColor: isSelected ? 'transparent' : 'var(--border-light)',
                        fontWeight: isSelected ? 700 : 500
                      }}
                      onClick={() => updateFields({ totalQuestions: cnt, singleChoiceCount: cnt, multiChoiceCount: 0 })}
                    >
                      <span>{cnt} {cnt === 1 ? 'Question' : 'Questions'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interaction Type Mix */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', display: 'block' }}>
                Question Interaction Style:
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="hero-preset-chip"
                  style={{
                    background: formData.interactionType !== 'multi_choice' ? 'rgba(79, 48, 185, 0.12)' : 'var(--bg-surface-elevated)',
                    borderColor: formData.interactionType !== 'multi_choice' ? 'var(--brand-primary)' : 'var(--border-light)',
                    color: formData.interactionType !== 'multi_choice' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    fontWeight: 600
                  }}
                  onClick={() => updateFields({ interactionType: 'single_choice', multiChoiceCount: 0, singleChoiceCount: formData.totalQuestions || 1 })}
                >
                  <span>Single Best Answer (A-D)</span>
                </button>
                <button
                  type="button"
                  className="hero-preset-chip"
                  style={{
                    background: formData.interactionType === 'multi_choice' ? 'rgba(79, 48, 185, 0.12)' : 'var(--bg-surface-elevated)',
                    borderColor: formData.interactionType === 'multi_choice' ? 'var(--brand-primary)' : 'var(--border-light)',
                    color: formData.interactionType === 'multi_choice' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    fontWeight: 600
                  }}
                  onClick={() => updateFields({ interactionType: 'multi_choice', multiChoiceCount: formData.totalQuestions || 1, singleChoiceCount: 0 })}
                >
                  <span>Multi-Choice (True/False Evaluation)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================
            STEP 4: PASSAGE, VISUAL STIMULUS & TRAPS
           ================================================================= */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="wizard-heading-group">
              <h2 className="wizard-step-title">Configure stimuli and cognitive traps</h2>
              <p className="wizard-step-subtitle">
                Customize reading passages, visual image diagrams, and specific distractor trap types.
              </p>
            </div>

            {/* Reading Passage Toggle */}
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Reading Passage Stimulus
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Require a multi-paragraph clinical, academic, or scientific passage for the question stem.
                  </div>
                </div>
                <button
                  type="button"
                  className="hero-preset-chip"
                  style={{
                    background: formData.passageRequired === 'Yes' ? 'var(--infynno-gradient)' : 'var(--bg-surface-subtle)',
                    color: formData.passageRequired === 'Yes' ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: 600
                  }}
                  onClick={() => updateFields({
                    passageRequired: formData.passageRequired === 'Yes' ? 'No' : 'Yes',
                    passageCount: formData.passageRequired === 'Yes' ? 0 : 1
                  })}
                >
                  {formData.passageRequired === 'Yes' ? 'Active (Yes)' : 'Disabled (No)'}
                </button>
              </div>
            </div>

            {/* Visual Stimulus Toggle */}
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Visual Image / Diagram Stimulus
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Generate geometric shapes or photorealistic illustrations (Always active for Abstract Reasoning).
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['None', 'SVG_Diagram', 'AI_FLUX_Image'].map((vType) => {
                    const isSelected = (formData.visual_type || (formData.requireImage ? 'SVG_Diagram' : 'None')) === vType;
                    return (
                      <button
                        key={vType}
                        type="button"
                        className="badge-minimal"
                        style={{
                          padding: '6px 12px',
                          cursor: 'pointer',
                          background: isSelected ? 'var(--infynno-gradient)' : 'var(--bg-surface-subtle)',
                          color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                          borderColor: isSelected ? 'transparent' : 'var(--border-light)',
                          fontWeight: isSelected ? 600 : 500
                        }}
                        onClick={() => updateFields({
                          visual_type: vType,
                          requireImage: vType !== 'None'
                        })}
                      >
                        {vType === 'None' ? 'None' : vType === 'SVG_Diagram' ? 'SVG Diagram' : 'AI FLUX Image'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Cognitive Trap Selector */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
                Primary Distractor Cognitive Trap:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                {COGNITIVE_TRAPS.map((trap) => {
                  const isSelected = (formData.primaryTrap || 'Automatic') === trap.id;
                  return (
                    <div
                      key={trap.id}
                      className={`wizard-tier-card ${isSelected ? 'selected' : ''}`}
                      style={{ padding: '12px 14px' }}
                      onClick={() => updateFields({ primaryTrap: trap.id })}
                      role="button"
                      tabIndex={0}
                    >
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {trap.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {trap.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Guidelines Prompt */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
                Custom Prompt Instructions (Optional):
              </label>
              <textarea
                className="input-textarea"
                rows={2}
                placeholder="e.g. Focus on pharmacology ethics involving adolescent patient consent..."
                value={formData.customPrompt || ''}
                onChange={(e) => updateFields({ customPrompt: e.target.value })}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
          </div>
        )}

        {/* =================================================================
            STEP 5: REVIEW & CONFIRMATION SUMMARY CARD
           ================================================================= */}
        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="wizard-heading-group">
              <h2 className="wizard-step-title">Review your configuration before generation</h2>
              <p className="wizard-step-subtitle">
                Verify parameters. You can edit any item instantly before launching the multi-agent pipeline.
              </p>
            </div>

            <div className="wizard-summary-card">
              {/* Row 1: Section & Subtopic */}
              <div className="wizard-summary-row">
                <div>
                  <div className="wizard-summary-label">Target Section & Subtopic</div>
                  <div className="wizard-summary-value" style={{ marginTop: '4px' }}>
                    <span style={{ color: sectionMeta.color, fontWeight: 700 }}>{sectionMeta.label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span>{formData.selectedSubtopic || 'Standard Examination'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="wizard-summary-edit-btn"
                  onClick={() => setStep(1)}
                  title="Edit Section & Subtopic"
                >
                  <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Edit
                </button>
              </div>

              {/* Row 2: Difficulty & Quantity */}
              <div className="wizard-summary-row">
                <div>
                  <div className="wizard-summary-label">Difficulty & Target Volume</div>
                  <div className="wizard-summary-value" style={{ marginTop: '4px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{formData.difficulty || 'Medium'}</span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span>{formData.totalQuestions || 1} Question(s)</span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span>{formData.interactionType === 'multi_choice' ? 'Multi-Choice' : 'Single Best Answer'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="wizard-summary-edit-btn"
                  onClick={() => setStep(3)}
                  title="Edit Difficulty & Quantity"
                >
                  <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Edit
                </button>
              </div>

              {/* Row 3: Stimuli & Traps */}
              <div className="wizard-summary-row">
                <div>
                  <div className="wizard-summary-label">Stimuli & Cognitive Traps</div>
                  <div className="wizard-summary-value" style={{ marginTop: '4px' }}>
                    <span>Passage: {formData.passageRequired === 'Yes' ? 'Active' : 'Disabled'}</span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span>Visuals: {formData.visual_type || (formData.requireImage ? 'Active' : 'None')}</span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span>Trap: {formData.primaryTrap || 'Automatic'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="wizard-summary-edit-btn"
                  onClick={() => setStep(4)}
                  title="Edit Stimuli & Traps"
                >
                  <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Edit
                </button>
              </div>

              {/* Row 4: Custom Directives */}
              {formData.customPrompt && (
                <div className="wizard-summary-row">
                  <div>
                    <div className="wizard-summary-label">Custom Directives</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px', fontStyle: 'italic' }}>
                      "{formData.customPrompt}"
                    </div>
                  </div>
                  <button
                    type="button"
                    className="wizard-summary-edit-btn"
                    onClick={() => setStep(4)}
                  >
                    <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Launch Banner */}
            <div style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(79, 48, 185, 0.08)',
              border: '1px solid rgba(79, 48, 185, 0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Sparkles size={20} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Clicking <strong>Launch Multi-Agent Generation</strong> will execute the Question Generator,
                Reviewer self-critique, and Psychometric Quality Gate (&gt; 90). Live tokens, latency, and costs will stream in real-time.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="wizard-footer">
        <button
          type="button"
          className="btn-secondary"
          onClick={handleBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} />
          <span>{step === 1 ? 'Cancel / Exit' : 'Back'}</span>
        </button>

        {/* Step Dots */}
        <div className="wizard-step-indicators">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((dot) => (
            <div
              key={dot}
              className={`wizard-dot ${step === dot ? 'active' : step > dot ? 'completed' : ''}`}
            />
          ))}
        </div>

        <button
          type="button"
          className="studio-action-btn-primary"
          id={step === totalSteps ? 'btn-wizard-launch-generation' : 'btn-wizard-next-step'}
          onClick={handleNext}
          style={{ padding: '10px 22px', fontSize: '0.95rem' }}
        >
          {step === totalSteps ? (
            <>
              <Sparkles size={16} />
              <span>🚀 Launch Multi-Agent Generation</span>
            </>
          ) : (
            <>
              <span>Next</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
