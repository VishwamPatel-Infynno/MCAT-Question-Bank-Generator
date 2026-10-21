import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { PACING_INFO } from '../../constants/ucat';
import {
  SECTION_METADATA,
  CONTENT_DOMAINS,
  DIFFICULTY_TIERS,
  SINGLE_ANSWER_FORMATS,
  COGNITIVE_TRAPS
} from './wizardConstants';
import WizardStep1Section from './steps/WizardStep1Section';
import WizardStep2Topic from './steps/WizardStep2Topic';
import WizardStep3Difficulty from './steps/WizardStep3Difficulty';
import WizardStep4Stimulus from './steps/WizardStep4Stimulus';
import WizardStep5Review from './steps/WizardStep5Review';

export default function GuidedWizard({
  generatorForm,
  sectionsData,
  onLaunchGeneration
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
              {step === 1 && 'Choose Exam Section'}
              {step === 2 && 'Pick Topic & Scenario'}
              {step === 3 && 'Difficulty & Questions'}
              {step === 4 && 'Passages, Diagrams & Traps'}
              {step === 5 && 'Review & Generate'}
            </span>
          </div>
        </div>

        {/* Progress Track */}
        <div className="wizard-progress-track">
          <div
            className="wizard-progress-fill"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Wizard Body: Render per-step subcomponents */}
      <div className="wizard-body">
        {step === 1 && (
          <WizardStep1Section
            selectedSection={selectedSection}
            onSelectSection={handleSelectSection}
            SECTION_METADATA={SECTION_METADATA}
            sectionMeta={sectionMeta}
            pacing={pacing}
          />
        )}

        {step === 2 && (
          <WizardStep2Topic
            sectionMeta={sectionMeta}
            availableSubtopics={availableSubtopics}
            selectedSubtopic={selectedSubtopic}
            setSelectedSubtopic={setSelectedSubtopic}
            CONTENT_DOMAINS={CONTENT_DOMAINS}
            contentDomain={form.contentDomain}
            onUpdateContentDomain={(val) => update('contentDomain', val)}
          />
        )}

        {step === 3 && (
          <WizardStep3Difficulty
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            DIFFICULTY_TIERS={DIFFICULTY_TIERS}
            totalQuestions={totalQuestions}
            handleTotalChange={handleTotalChange}
            SINGLE_ANSWER_FORMATS={SINGLE_ANSWER_FORMATS}
            interactionType={interactionType}
            setInteractionType={setInteractionType}
            setSingleChoiceCount={setSingleChoiceCount}
            setMultiChoiceCount={setMultiChoiceCount}
            passageMode={passageMode}
            handlePassageModeChange={handlePassageModeChange}
            passageQuestionCount={passageQuestionCount}
            handlePassageQuestionCountChange={handlePassageQuestionCountChange}
            passageSingleCount={passageSingleCount}
            handlePassageSingleChange={handlePassageSingleChange}
            passageMultiCount={passageMultiCount}
            handlePassageMultiChange={handlePassageMultiChange}
            independentSingleCount={independentSingleCount}
            handleIndependentSingleChange={handleIndependentSingleChange}
            independentMultiCount={independentMultiCount}
            handleIndependentMultiChange={handleIndependentMultiChange}
            singleChoiceCount={singleChoiceCount}
            handleSingleCountChange={handleSingleCountChange}
            multiChoiceCount={multiChoiceCount}
            handleMultiCountChange={handleMultiCountChange}
            passageCount={passageCount}
            handlePassageCountChange={handlePassageCountChange}
          />
        )}

        {step === 4 && (
          <WizardStep4Stimulus
            totalQuestions={totalQuestions}
            passageRequired={passageRequired}
            setPassageRequired={setPassageRequired}
            setPassageCount={setPassageCount}
            setPassageMode={setPassageMode}
            requirePassageImage={requirePassageImage}
            setRequirePassageImage={setRequirePassageImage}
            isAbstractReasoning={isAbstractReasoning}
            imageQuestionIndices={imageQuestionIndices}
            imageMode={imageMode}
            setImageCount={setImageCount}
            passageMode={passageMode}
            numIndependentQs={numIndependentQs}
            activeQuestionImagesCount={activeQuestionImagesCount}
            indSingleTotal={indSingleTotal}
            indMultiTotal={indMultiTotal}
            indSingleIndices={indSingleIndices}
            indMultiIndices={indMultiIndices}
            activeSingleImageCount={activeSingleImageCount}
            activeMultiImageCount={activeMultiImageCount}
            setSingleImageCount={setSingleImageCount}
            setMultiImageCount={setMultiImageCount}
            COGNITIVE_TRAPS={COGNITIVE_TRAPS}
            primaryTrap={primaryTrap}
            setPrimaryTrap={setPrimaryTrap}
            customPrompt={customPrompt}
            setCustomPrompt={setCustomPrompt}
          />
        )}

        {step === 5 && (
          <WizardStep5Review
            sectionMeta={sectionMeta}
            pacing={pacing}
            setStep={setStep}
            selectedSubtopic={selectedSubtopic}
            customPrompt={customPrompt}
            difficulty={difficulty}
            totalQuestions={totalQuestions}
            singleChoiceCount={singleChoiceCount}
            multiChoiceCount={multiChoiceCount}
            passageMode={passageMode}
            passageQuestionCount={passageQuestionCount}
            passageRequired={passageRequired}
            totalImagesCount={totalImagesCount}
            hasPassageImage={hasPassageImage}
            activeQuestionImagesCount={activeQuestionImagesCount}
            COGNITIVE_TRAPS={COGNITIVE_TRAPS}
            primaryTrap={primaryTrap}
          />
        )}
      </div>

      {/* Navigation Footer */}
      <div className="wizard-footer">
        <button
          type="button"
          className="btn-secondary"
          onClick={handleBack}
          disabled={step === 1}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            opacity: step === 1 ? 0.5 : 1,
            cursor: step === 1 ? 'not-allowed' : 'pointer'
          }}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
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
          className="workspace-action-btn-primary"
          id={step === totalSteps ? 'btn-wizard-launch-generation' : 'btn-wizard-next-step'}
          onClick={handleNext}
          style={{ padding: '10px 22px', fontSize: '0.95rem' }}
        >
          {step === totalSteps ? (
            <>
              <Sparkles size={16} />
              <span>🚀 Launch Generation</span>
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
