import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Check
} from 'lucide-react';
import {
  PACING_INFO,
  getSubjectsForSection,
  getSkillsForSection,
  SECTION_METADATA,
  DIFFICULTY_TIERS,
  COGNITIVE_TRAPS
} from '../../constants';
import {
  WizardStep1Section,
  WizardStep2DisciplineUnit,
  WizardStep3TopicSubtopic,
  WizardStep4LevelFormat,
  WizardStep5TrapsSkills,
  WizardStep6VisualsPrompt,
  WizardStep7Review
} from './steps';

const STEP_CONFIG = [
  { num: 1, label: 'Section', short: 'Section', subtitle: 'Choose Exam Section', nextLabel: 'Continue to Unit' },
  { num: 2, label: 'Discipline', short: 'Unit', subtitle: 'Pick Discipline & Major Unit', nextLabel: 'Continue to Topic' },
  { num: 3, label: 'Topic', short: 'Topic', subtitle: 'Select Topic & Concept', nextLabel: 'Continue to Level' },
  { num: 4, label: 'Level', short: 'Level', subtitle: 'Calibrate Level & Format', nextLabel: 'Continue to Traps' },
  { num: 5, label: 'Traps', short: 'Traps', subtitle: 'Cognitive Traps & Reasoning Skills', nextLabel: 'Continue to Visuals' },
  { num: 6, label: 'Visuals', short: 'Visuals', subtitle: 'Figures & Vignette Guidance', nextLabel: 'Review Configuration' },
  { num: 7, label: 'Review', short: 'Review', subtitle: 'Review & Launch', nextLabel: 'Launch 50-Question Batch' }
];

export default function GuidedWizard({
  generatorForm,
  onGenerateQuestions,
  onLaunchGeneration
}) {
  const [step, setStep] = useState(1);
  const totalSteps = 7;

  const form = generatorForm?.formData || {};
  const update = generatorForm?.updateField;
  const updateFields = generatorForm?.updateFields;

  const selectedSection = form.selectedSection || 'chem_phys';
  const selectedSubject = form.selectedSubject || '';
  const selectedUnit = form.selectedUnit || '';
  const selectedTopic = form.selectedTopic || '';
  const selectedSubtopic = form.selectedSubtopic || '';
  const selectedSkill = form.selectedSkill || '';
  const selectedSubskill = form.selectedSubskill || '';
  const questionType = form.questionType || 'PASSAGE_BASED_MCQ';
  const difficulty = form.difficulty || 'medium';
  const totalQuestions = form.totalQuestions || 50;
  const setGenerationTotal = generatorForm?.setGenerationTotal || ((t) => update('totalQuestions', t));
  const primaryTrap = form.primaryTrap || 'Automatic';
  const likelyMistakePattern = form.likelyMistakePattern || '';
  const customMistakePattern = form.customMistakePattern || '';

  const setDifficulty = (v) => update('difficulty', v);
  const setQuestionType = (v) => update('questionType', v);
  const passageMode = form.passageMode || 'single_passage';
  const setPrimaryTrap = (v) => update('primaryTrap', v);
  const imageMode = form.imageMode || 'none';
  const setSingleImageCount = generatorForm?.setSingleImageCount;
  const imageQuestionIndices = form.imageQuestionIndices || [];
  const requirePassageImage = form.requirePassageImage || false;
  const setRequirePassageImage = generatorForm?.setRequirePassageImage;
  const allowAiImages = Boolean(form.allowAiImages ?? form.requireImage);
  const setAllowAiImages = generatorForm?.setAllowAiImages || ((v) => update('allowAiImages', v));
  const customPrompt = form.customPrompt || '';
  const setCustomPrompt = (v) => update('customPrompt', v);

  const isPassageSet = passageMode === 'single_passage';
  const sectionMeta = SECTION_METADATA[selectedSection] || SECTION_METADATA.chem_phys;
  const pacing = PACING_INFO[selectedSection] || PACING_INFO.chem_phys;

  // Number of passage questions vs independent questions
  const numPassageQs = passageMode === 'single_passage' ? totalQuestions : 0;
  const numIndependentQs = passageMode === 'single_passage' ? 0 : totalQuestions;

  const independentIndices = Array.from({ length: totalQuestions }, (_, i) => i + 1).slice(numPassageQs);

  const indSingleTotal = passageMode === 'independent' ? totalQuestions : 0;
  const indSingleIndices = independentIndices.slice(0, indSingleTotal);

  const activeSingleImageIndices = (imageQuestionIndices || []).filter(i => indSingleIndices.includes(i));
  const activeSingleImageCount = activeSingleImageIndices.length;

  const activeQuestionImagesCount = imageMode === 'all'
    ? independentIndices.length
    : activeSingleImageCount;
  const hasPassageImage = isPassageSet && Boolean(requirePassageImage);
  const totalImagesCount = activeQuestionImagesCount + (hasPassageImage ? 1 : 0);

  // Section Selection handler
  const handleSelectSection = (sectionId) => {
    const isCars = sectionId === 'cars';
    const subjs = getSubjectsForSection(sectionId);
    const firstSubj = subjs[0];
    const firstUnit = firstSubj?.units?.[0];
    const firstTopic = firstUnit?.topics?.[0];
    const firstSubtopic = firstTopic?.subtopics?.[0] || '';
    const skills = getSkillsForSection(sectionId);
    const firstSkill = skills[0];

    if (isCars) {
      updateFields({
        selectedSection: sectionId,
        selectedSubject: firstSubj?.id || '',
        selectedUnit: firstUnit?.id || '',
        selectedTopic: firstTopic?.id || '',
        selectedSubtopic: firstSubtopic,
        selectedSkill: firstSkill?.id || 'CARS1',
        selectedSubskill: firstSkill?.subskills?.[0] || '',
        passageMode: 'single_passage',
        passageRequired: 'Yes',
        questionType: 'PASSAGE_BASED_MCQ',
        passageQuestionCount: totalQuestions,
        passageCount: totalQuestions,
        passageSingleCount: totalQuestions,
        passageMultiCount: 0,
        singleChoiceCount: totalQuestions,
        multiChoiceCount: 0,
        independentSingleCount: 0,
        independentMultiCount: 0,
        requireImage: false,
        visual_type: 'None'
      });
    } else {
      updateFields({
        selectedSection: sectionId,
        selectedSubject: firstSubj?.id || '',
        selectedUnit: firstUnit?.id || '',
        selectedTopic: firstTopic?.id || '',
        selectedSubtopic: firstSubtopic,
        selectedSkill: firstSkill?.id || 'S1',
        selectedSubskill: firstSkill?.subskills?.[0] || '',
        singleChoiceCount: totalQuestions,
        multiChoiceCount: 0
      });
    }
  };

  const handlePassageModeChange = (mode) => {
    if (mode === 'single_passage') {
      updateFields({
        passageMode: 'single_passage',
        passageRequired: 'Yes',
        questionType: 'PASSAGE_BASED_MCQ',
        passageQuestionCount: totalQuestions,
        passageCount: totalQuestions === 50 ? 10 : 1,
        passageSingleCount: totalQuestions,
        passageMultiCount: 0,
        singleChoiceCount: totalQuestions,
        multiChoiceCount: 0,
        independentSingleCount: 0,
        independentMultiCount: 0
      });
    } else {
      updateFields({
        passageMode: 'independent',
        passageRequired: 'No',
        questionType: 'DISCRETE_MCQ',
        passageQuestionCount: 0,
        passageCount: 0,
        passageSingleCount: 0,
        passageMultiCount: 0,
        singleChoiceCount: totalQuestions,
        multiChoiceCount: 0,
        independentSingleCount: totalQuestions,
        independentMultiCount: 0
      });
    }
  };

  const handleNext = useCallback(() => {
    if (step < totalSteps) {
      setStep(prev => prev + 1);
    } else {
      (onGenerateQuestions || onLaunchGeneration)?.();
    }
  }, [step, totalSteps, onGenerateQuestions, onLaunchGeneration]);

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
  }, [handleNext]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const currentStepConfig = STEP_CONFIG[step - 1] || STEP_CONFIG[0];

  return (
    <div className="wizard-card" id="guided-wizard-container">
      {/* Top Navigation & Interactive Progress Tracker */}
      <div className="wizard-topbar">
        <div className="wizard-topbar-header" style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="wizard-step-pill">Step {step} of {totalSteps}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {currentStepConfig.subtitle}
              </span>
            </div>
            <span className="badge-minimal" style={{ fontSize: '0.72rem' }}>
              {totalQuestions === 1
                ? 'Quick Single (1 Question)'
                : totalQuestions === 5
                ? 'Live Mini-Set (5 Questions)'
                : `Standard Batch: ${totalQuestions} Questions`}
            </span>
          </div>
        </div>

        {/* Interactive Step Pills Tracker */}
        <div className="wizard-stepper-7" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
          {STEP_CONFIG.map((cfg) => {
            const isCurrent = step === cfg.num;
            const isCompleted = step > cfg.num;
            const isClickable = isCompleted || isCurrent;

            return (
              <button
                key={cfg.num}
                type="button"
                onClick={() => isCompleted && setStep(cfg.num)}
                disabled={!isClickable}
                title={isCompleted ? `Jump back to ${cfg.label}` : cfg.label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: isCurrent ? 700 : 500,
                  cursor: isCompleted ? 'pointer' : 'default',
                  background: isCurrent
                    ? 'var(--infynno-gradient)'
                    : isCompleted
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'var(--bg-surface-elevated)',
                  border: isCurrent
                    ? '1px solid transparent'
                    : isCompleted
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid var(--border-light)',
                  color: isCurrent
                    ? '#ffffff'
                    : isCompleted
                    ? 'var(--status-success)'
                    : 'var(--text-muted)',
                  transition: 'all 0.18s ease',
                  flexShrink: 0
                }}
              >
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.68rem',
                    background: isCurrent ? 'rgba(255, 255, 255, 0.25)' : 'transparent',
                    fontWeight: 700
                  }}
                >
                  {isCompleted ? <Check size={11} /> : cfg.num}
                </span>
                <span>{cfg.short}</span>
              </button>
            );
          })}
        </div>

        {/* Continuous Progress Track */}
        <div className="wizard-progress-track">
          <div
            className="wizard-progress-fill"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Wizard Body: Render Focused Progressive Steps */}
      <div className="wizard-body wizard-step-fade-enter" key={step}>
        {/* Step 1: Exam Section (1 Decision) */}
        {step === 1 && (
          <WizardStep1Section
            selectedSection={selectedSection}
            onSelectSection={handleSelectSection}
            SECTION_METADATA={SECTION_METADATA}
            sectionMeta={sectionMeta}
            pacing={pacing}
            onAutoAdvance={() => setStep(2)}
          />
        )}

        {/* Step 2: Discipline & Major Unit (2 Decisions) */}
        {step === 2 && (
          <WizardStep2DisciplineUnit
            selectedSection={selectedSection}
            sectionMeta={sectionMeta}
            selectedSubject={selectedSubject}
            onSelectSubject={(v) => update('selectedSubject', v)}
            selectedUnit={selectedUnit}
            onSelectUnit={(v) => update('selectedUnit', v)}
            onSelectTopic={(v) => update('selectedTopic', v)}
            onSelectSubtopic={(v) => update('selectedSubtopic', v)}
          />
        )}

        {/* Step 3: Specific Topic & Subtopic Concept (2 Decisions) */}
        {step === 3 && (
          <WizardStep3TopicSubtopic
            selectedSection={selectedSection}
            selectedSubject={selectedSubject}
            selectedUnit={selectedUnit}
            selectedTopic={selectedTopic}
            onSelectTopic={(v) => update('selectedTopic', v)}
            selectedSubtopic={selectedSubtopic}
            onSelectSubtopic={(v) => update('selectedSubtopic', v)}
          />
        )}

        {/* Step 4: Challenge Level & Question Format (3 Decisions) */}
        {step === 4 && (
          <WizardStep4LevelFormat
            selectedSection={selectedSection}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            DIFFICULTY_TIERS={DIFFICULTY_TIERS}
            passageMode={passageMode}
            handlePassageModeChange={handlePassageModeChange}
            questionType={questionType}
            setQuestionType={setQuestionType}
            totalQuestions={totalQuestions}
            setTotalQuestions={setGenerationTotal}
          />
        )}

        {/* Step 5: Cognitive Traps & Reasoning Skills (2 Decisions) */}
        {step === 5 && (
          <WizardStep5TrapsSkills
            selectedSection={selectedSection}
            primaryTrap={primaryTrap}
            setPrimaryTrap={setPrimaryTrap}
            selectedSkill={selectedSkill}
            setSelectedSkill={(v) => update('selectedSkill', v)}
            selectedSubskill={selectedSubskill}
            setSelectedSubskill={(v) => update('selectedSubskill', v)}
          />
        )}

        {/* Step 6: Visual Stimulus & Custom Guidance (2 Decisions) */}
        {step === 6 && (
          <WizardStep6VisualsPrompt
            selectedSection={selectedSection}
            passageMode={passageMode}
            allowAiImages={allowAiImages}
            setAllowAiImages={setAllowAiImages}
            likelyMistakePattern={likelyMistakePattern}
            setLikelyMistakePattern={(v) => update('likelyMistakePattern', v)}
            customMistakePattern={customMistakePattern}
            setCustomMistakePattern={(v) => update('customMistakePattern', v)}
            customPrompt={customPrompt}
            setCustomPrompt={setCustomPrompt}
          />
        )}

        {/* Step 7: Review & Multi-Agent Launch */}
        {step === 7 && (
          <WizardStep7Review
            selectedSection={selectedSection}
            sectionMeta={sectionMeta}
            pacing={pacing}
            setStep={setStep}
            selectedSubject={selectedSubject}
            selectedUnit={selectedUnit}
            selectedTopic={selectedTopic}
            selectedSubtopic={selectedSubtopic}
            customPrompt={customPrompt}
            difficulty={difficulty}
            totalQuestions={totalQuestions}
            setTotalQuestions={setGenerationTotal}
            questionType={questionType}
            allowAiImages={allowAiImages}
            totalImagesCount={totalImagesCount}
            hasPassageImage={hasPassageImage}
            activeQuestionImagesCount={activeQuestionImagesCount}
            COGNITIVE_TRAPS={COGNITIVE_TRAPS}
            primaryTrap={primaryTrap}
            selectedSkill={selectedSkill}
            selectedSubskill={selectedSubskill}
            likelyMistakePattern={likelyMistakePattern}
            customMistakePattern={customMistakePattern}
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

        {/* Step dots for compact view */}
        <div className="wizard-step-indicators">
          {STEP_CONFIG.map((cfg) => (
            <div
              key={cfg.num}
              onClick={() => step > cfg.num && setStep(cfg.num)}
              style={{ cursor: step > cfg.num ? 'pointer' : 'default' }}
              className={`wizard-dot ${step === cfg.num ? 'active' : step > cfg.num ? 'completed' : ''}`}
              title={`Step ${cfg.num}: ${cfg.label}`}
            />
          ))}
        </div>

        <button
          type="button"
          className="workspace-action-btn-primary"
          id={step === totalSteps ? 'btn-wizard-generate-questions' : 'btn-wizard-next-step'}
          onClick={handleNext}
          style={{ padding: '10px 22px', fontSize: '0.92rem' }}
        >
          {step === totalSteps ? (
            <>
              <Sparkles size={16} />
              <span>
                {totalQuestions === 1
                  ? 'Generate Single Question (Live)'
                  : totalQuestions === 5
                  ? 'Generate 5-Question Set (Live)'
                  : 'Launch 50-Question Batch'}
              </span>
            </>
          ) : (
            <>
              <span>{currentStepConfig.nextLabel}</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
