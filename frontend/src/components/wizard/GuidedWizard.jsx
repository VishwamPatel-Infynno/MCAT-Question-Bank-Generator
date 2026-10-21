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
  Edit3,
  Image as ImageIcon
} from 'lucide-react';
import NumberStepper from '../common/NumberStepper';
import QuestionStyleMixSection from '../generator/QuestionStyleMixSection';
import IndependentDiagramControls from '../generator/IndependentDiagramControls';
import { PACING_INFO } from '../../constants/ucat';

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

  const form = generatorForm?.formData || {};
  const update = generatorForm?.updateField || (() => {});
  const updateFields = generatorForm?.updateFields || (() => {});

  const selectedSection = form.selectedSection || 'verbal_reasoning';
  const selectedSubtopic = form.selectedSubtopic || '';
  const setSelectedSubtopic = (v) => update('selectedSubtopic', v);
  const difficulty = form.difficulty || 'medium';
  const setDifficulty = (v) => update('difficulty', v);
  const totalQuestions = form.totalQuestions ?? 1;
  const setTotalQuestions = (v) => update('totalQuestions', v);
  const singleChoiceCount = form.singleChoiceCount ?? 1;
  const setSingleChoiceCount = (v) => update('singleChoiceCount', v);
  const multiChoiceCount = form.multiChoiceCount ?? 0;
  const setMultiChoiceCount = (v) => update('multiChoiceCount', v);
  const passageCount = form.passageCount ?? 0;
  const setPassageCount = (v) => update('passageCount', v);
  const passageMode = form.passageMode || 'single_passage';
  const setPassageMode = (v) => update('passageMode', v);
  const passageQuestionCount = form.passageQuestionCount ?? 2;
  const setPassageQuestionCount = (v) => update('passageQuestionCount', v);
  const passageSingleCount = form.passageSingleCount ?? 1;
  const setPassageSingleCount = (v) => update('passageSingleCount', v);
  const passageMultiCount = form.passageMultiCount ?? 1;
  const setPassageMultiCount = (v) => update('passageMultiCount', v);
  const independentSingleCount = form.independentSingleCount ?? 2;
  const setIndependentSingleCount = (v) => update('independentSingleCount', v);
  const independentMultiCount = form.independentMultiCount ?? 1;
  const setIndependentMultiCount = (v) => update('independentMultiCount', v);
  const interactionType = form.interactionType || 'single_choice';
  const setInteractionType = (v) => update('interactionType', v);
  const passageRequired = form.passageRequired || 'No';
  const setPassageRequired = (v) => update('passageRequired', v);
  const primaryTrap = form.primaryTrap || 'Automatic';
  const setPrimaryTrap = (v) => update('primaryTrap', v);
  const imageMode = form.imageMode || 'none';
  const setImageMode = generatorForm?.setImageMode;
  const setImageCount = generatorForm?.setImageCount;
  const setSingleImageCount = generatorForm?.setSingleImageCount;
  const setMultiImageCount = generatorForm?.setMultiImageCount;
  const imageQuestionIndices = form.imageQuestionIndices || [];
  const requirePassageImage = form.requirePassageImage || false;
  const setRequirePassageImage = generatorForm?.setRequirePassageImage;
  const customPrompt = form.customPrompt || '';
  const setCustomPrompt = (v) => update('customPrompt', v);

  const isPassageSet = totalQuestions > 1 ? (passageMode === 'single_passage') : (passageRequired === 'Yes');
  const isAbstractReasoning = selectedSection === 'abstract_reasoning';
  const sectionMeta = SECTION_METADATA[selectedSection] || SECTION_METADATA.verbal_reasoning;
  const pacing = PACING_INFO[selectedSection] || PACING_INFO.verbal_reasoning;

  // Number of passage questions vs independent questions
  const numPassageQs = totalQuestions > 1
    ? (passageMode === 'single_passage' ? Math.min(passageQuestionCount, totalQuestions) : 0)
    : (passageRequired === 'Yes' ? 1 : 0);
  const numIndependentQs = Math.max(0, totalQuestions - numPassageQs);

  const independentIndices = Array.from({ length: totalQuestions }, (_, i) => i + 1).slice(numPassageQs);

  const indSingleTotal = totalQuestions > 1
    ? (passageMode === 'single_passage' ? Math.max(0, independentSingleCount) : singleChoiceCount)
    : (interactionType === 'single_choice' ? 1 : 0);
  const indMultiTotal = totalQuestions > 1
    ? (passageMode === 'single_passage' ? Math.max(0, independentMultiCount) : multiChoiceCount)
    : (interactionType === 'multi_choice' ? 1 : 0);

  const indSingleIndices = independentIndices.slice(0, indSingleTotal);
  const indMultiIndices = independentIndices.slice(indSingleTotal, indSingleTotal + indMultiTotal);

  const activeSingleImageIndices = (imageQuestionIndices || []).filter(i => indSingleIndices.includes(i));
  const activeMultiImageIndices = (imageQuestionIndices || []).filter(i => indMultiIndices.includes(i));
  const activeSingleImageCount = activeSingleImageIndices.length;
  const activeMultiImageCount = activeMultiImageIndices.length;

  const activeQuestionImagesCount = isAbstractReasoning
    ? totalQuestions
    : (imageMode === 'all'
      ? independentIndices.length
      : activeSingleImageCount + activeMultiImageCount);
  const hasPassageImage = !isAbstractReasoning && isPassageSet && Boolean(requirePassageImage);
  const totalImagesCount = isAbstractReasoning ? totalQuestions : (activeQuestionImagesCount + (hasPassageImage ? 1 : 0));

  // Subtopics for current section
  const availableSubtopics = useMemo(() => {
    const secObj = sectionsData?.find(s => s.id === selectedSection);
    return secObj?.subtopics && secObj.subtopics.length > 0
      ? secObj.subtopics
      : [
          'Critical Reading & Inferences',
          'Syllogisms & Logic Puzzles',
          'Percentages, Ratios & Geometry',
          'Set A vs Set B Patterns',
          'Appropriateness & Integrity'
        ];
  }, [sectionsData, selectedSection]);

  // Ensure selectedSubtopic is valid when section changes
  useEffect(() => {
    if (availableSubtopics.length > 0 && !availableSubtopics.includes(selectedSubtopic)) {
      setSelectedSubtopic(availableSubtopics[0]);
    }
  }, [availableSubtopics, selectedSubtopic]); // eslint-disable-line react-hooks/exhaustive-deps

  // Section Selection handler
  const handleSelectSection = (sectionId) => {
    const isAR = sectionId === 'abstract_reasoning';
    const isVR = sectionId === 'verbal_reasoning';
    updateFields({
      selectedSection: sectionId,
      ...(isAR && { requireImage: true, visual_type: 'AI_FLUX_Image' }),
      ...(!isAR && { requireImage: false, visual_type: 'None' }),
      ...(isVR && { passageRequired: 'Yes', passageCount: 1 }),
      ...(!isVR && { passageRequired: 'No', passageCount: 0 })
    });
    if (isAR && setImageMode) {
      setImageMode('all');
    }
  };

  // Stepper & Allocation Handlers matching GeneratorPanel exactly
  const handleTotalChange = (newTotal) => {
    const clamped = Math.max(1, Math.min(5, newTotal));
    setTotalQuestions(clamped);
    if (clamped === 1) {
      setSingleChoiceCount(interactionType === 'multi_choice' ? 0 : 1);
      setMultiChoiceCount(interactionType === 'multi_choice' ? 1 : 0);
      setPassageCount(passageRequired === 'Yes' ? 1 : 0);
    } else {
      if (passageMode === 'single_passage') {
        const clampedPassage = Math.max(1, Math.min(clamped, passageQuestionCount));
        setPassageQuestionCount(clampedPassage);
        const pMulti = Math.min(passageMultiCount, clampedPassage);
        const pSingle = clampedPassage - pMulti;
        setPassageMultiCount(pMulti);
        setPassageSingleCount(pSingle);
        const indTotal = clamped - clampedPassage;
        let indMulti = 0;
        let indSingle = 0;
        if (indTotal > 0) {
          indMulti = Math.min(independentMultiCount, indTotal);
          indSingle = indTotal - indMulti;
          setIndependentMultiCount(indMulti);
          setIndependentSingleCount(indSingle);
        }
        setSingleChoiceCount(pSingle + indSingle);
        setMultiChoiceCount(pMulti + indMulti);
        setPassageCount(clampedPassage);
      } else {
        const curMulti = Math.min(multiChoiceCount, clamped);
        setMultiChoiceCount(curMulti);
        setSingleChoiceCount(clamped - curMulti);
        setPassageCount(Math.min(passageCount, clamped));
      }
    }
  };

  const handlePassageModeChange = (mode) => {
    setPassageMode(mode);
    if (mode === 'single_passage') {
      setPassageRequired('Yes');
      setPassageCount(passageQuestionCount);
    } else {
      setPassageRequired('No');
      setPassageCount(0);
    }
  };

  const handlePassageQuestionCountChange = (newVal) => {
    const val = Math.max(1, Math.min(totalQuestions, newVal));
    setPassageQuestionCount(val);
    const pMulti = Math.min(passageMultiCount, val);
    const pSingle = val - pMulti;
    setPassageMultiCount(pMulti);
    setPassageSingleCount(pSingle);

    const indTotal = totalQuestions - val;
    let indMulti = 0;
    let indSingle = 0;
    if (indTotal > 0) {
      indMulti = Math.min(independentMultiCount, indTotal);
      indSingle = indTotal - indMulti;
      setIndependentMultiCount(indMulti);
      setIndependentSingleCount(indSingle);
    }
    setSingleChoiceCount(pSingle + indSingle);
    setMultiChoiceCount(pMulti + indMulti);
    setPassageCount(val);
  };

  const handlePassageSingleChange = (newVal) => {
    const val = Math.max(0, Math.min(passageQuestionCount, newVal));
    const pMulti = passageQuestionCount - val;
    setPassageSingleCount(val);
    setPassageMultiCount(pMulti);
    const indTotal = totalQuestions - passageQuestionCount;
    const indSingle = indTotal > 0 ? independentSingleCount : 0;
    const indMulti = indTotal > 0 ? independentMultiCount : 0;
    setSingleChoiceCount(val + indSingle);
    setMultiChoiceCount(pMulti + indMulti);
  };

  const handlePassageMultiChange = (newVal) => {
    const val = Math.max(0, Math.min(passageQuestionCount, newVal));
    const pSingle = passageQuestionCount - val;
    setPassageMultiCount(val);
    setPassageSingleCount(pSingle);
    const indTotal = totalQuestions - passageQuestionCount;
    const indSingle = indTotal > 0 ? independentSingleCount : 0;
    const indMulti = indTotal > 0 ? independentMultiCount : 0;
    setSingleChoiceCount(pSingle + indSingle);
    setMultiChoiceCount(val + indMulti);
  };

  const handleIndependentSingleChange = (newVal) => {
    const indTotal = totalQuestions - passageQuestionCount;
    if (indTotal <= 0) return;
    const val = Math.max(0, Math.min(indTotal, newVal));
    const indMulti = indTotal - val;
    setIndependentSingleCount(val);
    setIndependentMultiCount(indMulti);
    setSingleChoiceCount(passageSingleCount + val);
    setMultiChoiceCount(passageMultiCount + indMulti);
  };

  const handleIndependentMultiChange = (newVal) => {
    const indTotal = totalQuestions - passageQuestionCount;
    if (indTotal <= 0) return;
    const val = Math.max(0, Math.min(indTotal, newVal));
    const indSingle = indTotal - val;
    setIndependentMultiCount(val);
    setIndependentSingleCount(indSingle);
    setSingleChoiceCount(passageSingleCount + indSingle);
    setMultiChoiceCount(passageMultiCount + val);
  };

  const handleSingleCountChange = (newVal) => {
    const val = Math.max(0, Math.min(totalQuestions, newVal));
    setSingleChoiceCount(val);
    setMultiChoiceCount(totalQuestions - val);
  };

  const handleMultiCountChange = (newVal) => {
    const val = Math.max(0, Math.min(totalQuestions, newVal));
    setMultiChoiceCount(val);
    setSingleChoiceCount(totalQuestions - val);
  };

  const handlePassageCountChange = (newVal) => {
    const val = Math.max(0, Math.min(totalQuestions, newVal));
    setPassageCount(val);
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
              {step === 2 && 'Subtopic & Content Domain'}
              {step === 3 && 'Difficulty & Question Style Mix'}
              {step === 4 && 'Passage, Diagrams & Cognitive Traps'}
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h2 className="wizard-step-title">Which UCAT section would you like to generate for?</h2>
                <span className="badge-minimal">
                  {pacing.target || '~28s / Q'} Target Pacing
                </span>
              </div>
              <p className="wizard-step-subtitle">
                Select from the five official UCAT examination sections. Each section activates a specialized
                psychometric rubric and prompt persona.
              </p>
            </div>

            <div className="wizard-sections-grid">
              {Object.values(SECTION_METADATA).map((sec) => {
                const Icon = sec.icon;
                const isSelected = selectedSection === sec.id;
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
                  const isSelected = selectedSubtopic === st;
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
                      onClick={() => setSelectedSubtopic(st)}
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
                  const isSelected = form.contentDomain === domain;
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
                      onClick={() => update('contentDomain', isSelected ? '' : domain)}
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
            STEP 3: DIFFICULTY, QUESTION VOLUME & STYLE MIX (FULL PARITY)
           ================================================================= */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div className="wizard-heading-group">
              <h2 className="wizard-step-title">Choose difficulty and question style mix</h2>
              <p className="wizard-step-subtitle">
                Calibrate the cognitive load, batch size, and single vs multi-choice question distribution.
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
                  const isSelected = difficulty.toLowerCase() === tier.id;
                  return (
                    <div
                      key={tier.id}
                      className={`wizard-tier-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setDifficulty(tier.id)}
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

            {/* Total Questions Stepper & Quick Pills */}
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Total Questions to Generate
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    Generate a single item or an official multi-question test set (1 to 5 questions).
                  </div>
                </div>
                <div style={{ width: '130px' }}>
                  <NumberStepper
                    value={totalQuestions}
                    min={1}
                    max={5}
                    onChange={handleTotalChange}
                    idPrefix="btn-wizard-qty"
                    label={(val) => `${val} Qs`}
                    titleMinus="Decrease questions"
                    titlePlus="Increase questions"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {[1, 2, 3, 5].map((cnt) => {
                  const isSelected = totalQuestions === cnt;
                  return (
                    <button
                      key={cnt}
                      type="button"
                      className="hero-preset-chip"
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.825rem',
                        background: isSelected ? 'var(--infynno-gradient)' : 'var(--bg-surface-subtle)',
                        color: isSelected ? '#ffffff' : 'var(--text-primary)',
                        borderColor: isSelected ? 'transparent' : 'var(--border-light)',
                        fontWeight: isSelected ? 700 : 500
                      }}
                      onClick={() => handleTotalChange(cnt)}
                    >
                      <span>{cnt} {cnt === 1 ? 'Question' : 'Questions'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* If 1 Question: Answer Style Single vs Multiple Answers */}
            {totalQuestions === 1 && (
              <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-light)' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
                  Question Answer Style:
                </label>
                <div className="pill-track" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  {[
                    { id: 'single_choice', label: 'Single Best Answer (A-D)' },
                    { id: 'multi_choice', label: 'Multiple Answers (True/False Evaluation)' }
                  ].map(opt => {
                    const isSel = interactionType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        id={`btn-wizard-mode-${opt.id}`}
                        onClick={() => {
                          setInteractionType(opt.id);
                          setSingleChoiceCount(opt.id === 'multi_choice' ? 0 : 1);
                          setMultiChoiceCount(opt.id === 'multi_choice' ? 1 : 0);
                        }}
                        className={`pill-track-btn ${isSel ? 'active' : ''}`}
                        style={{ width: '100%', padding: '8px' }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* If > 1 Question: Full Batch Allocation & Question Style Mix */}
            {totalQuestions > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '18px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-light)' }}>
                {/* Reading Material Mode: Single Passage Set vs Independent Questions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Reading Material Structure
                    </span>
                    <span className="badge badge-purple" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                      {passageMode === 'single_passage' ? '1 Passage • N Questions' : 'Separate Vignettes'}
                    </span>
                  </div>

                  <div className="pill-track" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    {[
                      { id: 'single_passage', label: 'Single Passage Set (Shared Material)' },
                      { id: 'independent', label: 'Independent Questions (Standalone)' }
                    ].map(opt => {
                      const isSel = passageMode === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          id={`btn-wizard-passage-mode-${opt.id}`}
                          onClick={() => handlePassageModeChange(opt.id)}
                          className={`pill-track-btn ${isSel ? 'active' : ''}`}
                          style={{ width: '100%', padding: '8px' }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {passageMode === 'single_passage' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          Questions linked to Shared Passage:
                        </span>
                        <div style={{ width: '140px' }}>
                          <NumberStepper
                            value={passageQuestionCount}
                            min={1}
                            max={totalQuestions}
                            onChange={handlePassageQuestionCountChange}
                            idPrefix="btn-wizard-passage-qty"
                            activeColor="var(--status-purple)"
                            label={(val) => `${val} of ${totalQuestions}`}
                            titleMinus="Decrease passage question count"
                            titlePlus="Increase passage question count"
                          />
                        </div>
                      </div>

                      <div
                        style={{
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--brand-light)',
                          border: '1px solid var(--border-brand)',
                          fontSize: '0.75rem',
                          color: 'var(--text-secondary)',
                          lineHeight: 1.4
                        }}
                      >
                        {passageQuestionCount === totalQuestions ? (
                          <>
                            <strong style={{ color: 'var(--brand-primary)' }}>Full Passage Set:</strong> All {totalQuestions} questions will reference 1 shared comprehensive passage (250–400 words).
                          </>
                        ) : (
                          <>
                            <strong style={{ color: 'var(--status-purple)' }}>Mixed Set:</strong> {passageQuestionCount} questions linked to 1 shared passage; remaining {totalQuestions - passageQuestionCount} questions are direct standalone items without passage.
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Precision Answer Style Breakdown */}
                <div style={{ borderTop: '1px dashed var(--border-light)', paddingTop: '12px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
                    Answer Style Mix:
                  </label>
                  <QuestionStyleMixSection
                    totalQuestions={totalQuestions}
                    passageMode={passageMode}
                    passageQuestionCount={passageQuestionCount}
                    passageSingleCount={passageSingleCount}
                    passageMultiCount={passageMultiCount}
                    independentSingleCount={independentSingleCount}
                    independentMultiCount={independentMultiCount}
                    singleChoiceCount={singleChoiceCount}
                    multiChoiceCount={multiChoiceCount}
                    passageCount={passageCount}
                    handlePassageSingleChange={handlePassageSingleChange}
                    handlePassageMultiChange={handlePassageMultiChange}
                    handleIndependentSingleChange={handleIndependentSingleChange}
                    handleIndependentMultiChange={handleIndependentMultiChange}
                    handleSingleCountChange={handleSingleCountChange}
                    handleMultiCountChange={handleMultiCountChange}
                    handlePassageCountChange={handlePassageCountChange}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================
            STEP 4: PASSAGE, DIAGRAMS & COGNITIVE TRAPS (FULL PARITY)
           ================================================================= */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div className="wizard-heading-group">
              <h2 className="wizard-step-title">Configure stimuli, diagrams and cognitive traps</h2>
              <p className="wizard-step-subtitle">
                Fine-tune passage attachments, question-level vector diagrams, and cognitive distractor strategies.
              </p>
            </div>

            {/* 1 Question Passage & Diagram Toggles */}
            {totalQuestions === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-light)' }}>
                {/* Reading Material */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Reading Material
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      Require a multi-paragraph clinical or academic reading passage.
                    </div>
                  </div>
                  <div className="pill-track" style={{ width: '220px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    {[
                      { id: 'No', label: 'Direct Item' },
                      { id: 'Yes', label: 'Passage' }
                    ].map(opt => {
                      const isSel = passageRequired === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          id={`btn-wizard-p-${opt.id.toLowerCase()}`}
                          onClick={() => {
                            setPassageRequired(opt.id);
                            setPassageCount(opt.id === 'Yes' ? 1 : 0);
                            setPassageMode(opt.id === 'Yes' ? 'single_passage' : 'independent');
                          }}
                          className={`pill-track-btn ${isSel ? 'active' : ''}`}
                          style={{ width: '100%', padding: '6px' }}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* If Passage Active: Passage Diagram Toggle */}
                {passageRequired === 'Yes' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed var(--border-light)', paddingTop: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Passage Diagram Stimulus
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Attach a diagram illustration to the reading passage ($0.0020).
                      </div>
                    </div>
                    <div className="pill-track" style={{ width: '220px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                      <button
                        type="button"
                        id="btn-wizard-single-p-diag-no"
                        onClick={() => setRequirePassageImage && setRequirePassageImage(false)}
                        className={`pill-track-btn ${!requirePassageImage ? 'active' : ''}`}
                        style={{ width: '100%', padding: '6px' }}
                      >
                        No Diagram
                      </button>
                      <button
                        type="button"
                        id="btn-wizard-single-p-diag-yes"
                        onClick={() => setRequirePassageImage && setRequirePassageImage(true)}
                        className={`pill-track-btn ${requirePassageImage ? 'active' : ''}`}
                        style={{ width: '100%', padding: '6px' }}
                      >
                        <ImageIcon size={12} />
                        <span>With Diagram</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* If Direct Question & Not Abstract Reasoning: Question Diagram Toggle */}
                {!isAbstractReasoning && passageRequired === 'No' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px dashed var(--border-light)', paddingTop: '10px' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Question Diagram
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Attach a visual pattern or diagram to the question stem ($0.0020).
                      </div>
                    </div>
                    <div className="pill-track" style={{ width: '220px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                      {[
                        { id: 'no', label: 'Text Only' },
                        { id: 'yes', label: 'With Diagram' }
                      ].map(opt => {
                        const hasImage = (imageQuestionIndices || []).includes(1) || imageMode === 'all';
                        const isSel = opt.id === 'yes' ? hasImage : !hasImage;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            id={`btn-wizard-single-diag-${opt.id}`}
                            onClick={() => {
                              if (opt.id === 'yes') {
                                if (setImageCount) setImageCount(1, [1]);
                              } else {
                                if (setImageCount) setImageCount(0, [1]);
                              }
                            }}
                            className={`pill-track-btn ${isSel ? 'active' : ''}`}
                            style={{ width: '100%', padding: '6px' }}
                          >
                            {opt.id === 'yes' && <ImageIcon size={12} />}
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* If > 1 Question: Passage Diagram & Independent Diagram Controls */}
            {totalQuestions > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-light)' }}>
                {passageMode === 'single_passage' && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Passage Diagram
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        Generate a dedicated diagram for the shared reading passage ($0.0020).
                      </div>
                    </div>
                    <div className="pill-track" style={{ width: '220px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                      <button
                        type="button"
                        id="btn-wizard-p-diag-no"
                        onClick={() => setRequirePassageImage && setRequirePassageImage(false)}
                        className={`pill-track-btn ${!requirePassageImage ? 'active' : ''}`}
                        style={{ width: '100%', padding: '6px' }}
                      >
                        No Diagram
                      </button>
                      <button
                        type="button"
                        id="btn-wizard-p-diag-yes"
                        onClick={() => setRequirePassageImage && setRequirePassageImage(true)}
                        className={`pill-track-btn ${requirePassageImage ? 'active' : ''}`}
                        style={{ width: '100%', padding: '6px' }}
                      >
                        <ImageIcon size={12} />
                        <span>With Diagram</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Independent Questions with Diagrams Controls */}
                <IndependentDiagramControls
                  isAbstractReasoning={isAbstractReasoning}
                  numIndependentQs={numIndependentQs}
                  passageMode={passageMode}
                  activeQuestionImagesCount={activeQuestionImagesCount}
                  indSingleTotal={indSingleTotal}
                  indMultiTotal={indMultiTotal}
                  indSingleIndices={indSingleIndices}
                  indMultiIndices={indMultiIndices}
                  activeSingleImageCount={activeSingleImageCount}
                  activeMultiImageCount={activeMultiImageCount}
                  setSingleImageCount={setSingleImageCount}
                  setMultiImageCount={setMultiImageCount}
                />
              </div>
            )}

            {/* Abstract Reasoning Always Has Visuals Notice */}
            {isAbstractReasoning && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--brand-light)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.8rem',
                  color: 'var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Shapes size={16} />
                <span>Abstract Reasoning questions strictly generate spatial geometric pattern diagrams for all {totalQuestions} items.</span>
              </div>
            )}

            {/* AI Image Model Engine (Strict FLUX-1-schnell) */}
            <div style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: 'var(--primary-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <ImageIcon size={20} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        AI Image Model Engine
                      </span>
                      <span className="badge-minimal" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)', fontWeight: 600, fontSize: '0.72rem' }}>
                        black-forest-labs/FLUX-1-schnell
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      All visual stimuli (patterns, geometry, charts & diagrams) are synthesized strictly by the FLUX.1 neural image model.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="badge-minimal" style={{ fontSize: '0.72rem' }}>1024×1024 High-Res</span>
                  <span className="badge-minimal" style={{ fontSize: '0.72rem' }}>4 Inference Steps</span>
                  <span className="badge-minimal" style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}>
                    $0.0020 / image
                  </span>
                </div>
              </div>
            </div>

            {/* Cognitive Trap Selector */}
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
                Primary Distractor Cognitive Trap:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px' }}>
                {COGNITIVE_TRAPS.map((trap) => {
                  const isSelected = primaryTrap === trap.id;
                  return (
                    <div
                      key={trap.id}
                      className={`wizard-tier-card ${isSelected ? 'selected' : ''}`}
                      style={{ padding: '12px 14px' }}
                      onClick={() => setPrimaryTrap(trap.id)}
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
                Custom Prompt Directives (Optional):
              </label>
              <textarea
                className="input-textarea"
                rows={2}
                placeholder="e.g. Focus on cardiology pharmacology ethics, ensure distractor D utilizes a subtle numerical trap..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
          </div>
        )}

        {/* =================================================================
            STEP 5: REVIEW & CONFIRMATION SUMMARY CARD (DETAILED AUDIT)
           ================================================================= */}
        {step === 5 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="wizard-heading-group">
              <h2 className="wizard-step-title">Review your examination parameters before generation</h2>
              <p className="wizard-step-subtitle">
                Complete psychometric specification audit. Click 'Edit' on any section to modify.
              </p>
            </div>

            <div className="wizard-summary-card">
              {/* Row 1: Section & Topic */}
              <div className="wizard-summary-row">
                <div>
                  <div className="wizard-summary-label">Target Subtest & Topic Focus</div>
                  <div className="wizard-summary-value" style={{ marginTop: '4px' }}>
                    <span style={{ color: sectionMeta.color, fontWeight: 700 }}>{sectionMeta.label}</span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span>{selectedSubtopic || 'General Practice'}</span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span className="badge-minimal">{pacing.target || '~28s / Q'} Target Pacing</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="wizard-summary-edit-btn"
                  onClick={() => setStep(1)}
                  title="Edit Section & Topic"
                >
                  <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Edit
                </button>
              </div>

              {/* Row 2: Difficulty & Quantity */}
              <div className="wizard-summary-row">
                <div>
                  <div className="wizard-summary-label">Difficulty & Question Mix</div>
                  <div className="wizard-summary-value" style={{ marginTop: '4px' }}>
                    <span style={{ textTransform: 'capitalize' }}>{difficulty} Difficulty</span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span>{totalQuestions} {totalQuestions === 1 ? 'Question' : 'Questions'} total</span>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span>({singleChoiceCount} Single Choice, {multiChoiceCount} Multi Choice)</span>
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

              {/* Row 3: Reading Material Structure */}
              <div className="wizard-summary-row">
                <div>
                  <div className="wizard-summary-label">Reading Material Structure</div>
                  <div className="wizard-summary-value" style={{ marginTop: '4px' }}>
                    {totalQuestions > 1 ? (
                      passageMode === 'single_passage' ? (
                        <span>
                          Single Passage Set ({passageQuestionCount} questions on 1 shared passage{totalQuestions > passageQuestionCount ? `, ${totalQuestions - passageQuestionCount} standalone items` : ''})
                        </span>
                      ) : (
                        <span>Independent Vignettes ({totalQuestions} standalone questions)</span>
                      )
                    ) : (
                      <span>{passageRequired === 'Yes' ? 'Reading Passage Attached (250–400 words)' : 'Direct Standalone Question (No Passage)'}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="wizard-summary-edit-btn"
                  onClick={() => setStep(totalQuestions > 1 ? 3 : 4)}
                  title="Edit Reading Material Structure"
                >
                  <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Edit
                </button>
              </div>

              {/* Row 4: Visual Stimuli & Diagram Budget */}
              <div className="wizard-summary-row">
                <div>
                  <div className="wizard-summary-label">Visual Stimuli & Diagrams</div>
                  <div className="wizard-summary-value" style={{ marginTop: '4px' }}>
                    <span>
                      {totalImagesCount > 0
                        ? `${totalImagesCount} ${totalImagesCount === 1 ? 'Diagram' : 'Diagrams'} ($${(totalImagesCount * 0.0020).toFixed(4)}) • AI FLUX.1 Schnell`
                        : 'No Visual Stimuli (Text Only)'}
                    </span>
                    {hasPassageImage && <span className="badge-minimal">Passage Diagram</span>}
                    {activeQuestionImagesCount > 0 && <span className="badge-minimal">{activeQuestionImagesCount} Q-Diagrams</span>}
                  </div>
                </div>
                <button
                  type="button"
                  className="wizard-summary-edit-btn"
                  onClick={() => setStep(4)}
                  title="Edit Visual Stimuli"
                >
                  <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Edit
                </button>
              </div>

              {/* Row 5: Cognitive Traps & Directives */}
              <div className="wizard-summary-row">
                <div>
                  <div className="wizard-summary-label">Cognitive Distractor Trap</div>
                  <div className="wizard-summary-value" style={{ marginTop: '4px' }}>
                    <span>{COGNITIVE_TRAPS.find(t => t.id === primaryTrap)?.label || primaryTrap}</span>
                    {customPrompt && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        • "{customPrompt.length > 40 ? `${customPrompt.slice(0, 40)}...` : customPrompt}"
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="wizard-summary-edit-btn"
                  onClick={() => setStep(4)}
                  title="Edit Traps & Directives"
                >
                  <Edit3 size={13} style={{ display: 'inline', marginRight: '4px' }} />
                  Edit
                </button>
              </div>
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
