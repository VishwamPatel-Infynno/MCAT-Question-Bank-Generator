import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import {
  PACING_INFO,
  getSubjectsForSection,
  getSkillsForSection
} from '../../constants/mcat';
import {
  SECTION_METADATA,
  DIFFICULTY_TIERS,
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
  onGenerateQuestions,
  onLaunchGeneration
}) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;

  const form = generatorForm?.formData || {};
  const update = generatorForm?.updateField;
  const updateFields = generatorForm?.updateFields;
  const toggleContentDomain = generatorForm?.toggleContentDomain;

  const selectedSection = form.selectedSection || 'chem_phys';
  const selectedSubject = form.selectedSubject || '';
  const selectedUnit = form.selectedUnit || '';
  const selectedTopic = form.selectedTopic || '';
  const selectedSubtopic = form.selectedSubtopic || '';
  const selectedSkill = form.selectedSkill || '';
  const selectedSubskill = form.selectedSubskill || '';
  const questionType = form.questionType || 'DISCRETE_MCQ';
  const difficulty = form.difficulty || 'medium';
  const totalQuestions = form.totalQuestions || 5;
  const contentDomains = form.contentDomains || [];
  const primaryTrap = form.primaryTrap || 'Automatic';
  const likelyMistakePattern = form.likelyMistakePattern || '';
  const customMistakePattern = form.customMistakePattern || '';

  const setSelectedSubtopic = useCallback((v) => update('selectedSubtopic', v), [update]);
  const setDifficulty = (v) => update('difficulty', v);
  const setTotalQuestions = (v) => update('totalQuestions', v);
  const setQuestionType = (v) => update('questionType', v);
  const setPassageCount = (v) => update('passageCount', v);
  const passageMode = form.passageMode || 'single_passage';
  const setPassageMode = (v) => update('passageMode', v);
  const passageRequired = form.passageRequired || (passageMode === 'independent' ? 'No' : 'Yes');
  const setPassageRequired = (v) => update('passageRequired', v);
  const setPrimaryTrap = (v) => update('primaryTrap', v);
  const imageMode = form.imageMode || 'none';
  const setImageCount = generatorForm?.setImageCount;
  const setSingleImageCount = generatorForm?.setSingleImageCount;
  const setMultiImageCount = generatorForm?.setMultiImageCount;
  const imageQuestionIndices = form.imageQuestionIndices || [];
  const requirePassageImage = form.requirePassageImage || false;
  const setRequirePassageImage = generatorForm?.setRequirePassageImage;
  const customPrompt = form.customPrompt || '';
  const setCustomPrompt = (v) => update('customPrompt', v);

  const isPassageSet = passageMode === 'single_passage';
  const isAbstractReasoning = false;
  const sectionMeta = SECTION_METADATA[selectedSection] || SECTION_METADATA.chem_phys;
  const pacing = PACING_INFO[selectedSection] || PACING_INFO.chem_phys;

  // Number of passage questions vs independent questions
  const numPassageQs = passageMode === 'single_passage' ? totalQuestions : 0;
  const numIndependentQs = passageMode === 'single_passage' ? 0 : totalQuestions;

  const independentIndices = Array.from({ length: totalQuestions }, (_, i) => i + 1).slice(numPassageQs);

  const indSingleTotal = passageMode === 'independent' ? totalQuestions : 0;
  const indMultiTotal = 0;

  const indSingleIndices = independentIndices.slice(0, indSingleTotal);
  const indMultiIndices = [];

  const activeSingleImageIndices = (imageQuestionIndices || []).filter(i => indSingleIndices.includes(i));
  const activeSingleImageCount = activeSingleImageIndices.length;
  const activeMultiImageCount = 0;

  const activeQuestionImagesCount = imageMode === 'all'
    ? independentIndices.length
    : activeSingleImageCount;
  const hasPassageImage = isPassageSet && Boolean(requirePassageImage);
  const totalImagesCount = activeQuestionImagesCount + (hasPassageImage ? 1 : 0);

  // Subtopics for current section
  const availableSubtopics = useMemo(() => {
    const secObj = sectionsData?.find(s => s.id === selectedSection);
    return secObj?.subtopics && secObj.subtopics.length > 0
      ? secObj.subtopics
      : [
          'Thermodynamics & Kinetics',
          'Enzymatic Catalysis & Inhibition',
          'Circuits & Electromagnetism',
          'Fluids & Gas Laws',
          'Genetics & Molecular Biology',
          'Cognitive & Behavioral Foundations',
          'Foundations of Comprehension'
        ];
  }, [sectionsData, selectedSection]);

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
        passageQuestionCount: totalQuestions,
        passageCount: totalQuestions,
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

  return (
    <div className="wizard-card" id="guided-wizard-container">
      {/* Top Navigation & Progress Bar */}
      <div className="wizard-topbar">
        <div className="wizard-topbar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="wizard-step-pill">Step {step} of {totalSteps}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {step === 1 && 'Choose Exam Section'}
              {step === 2 && 'Pick Syllabus Hierarchy & Topic'}
              {step === 3 && 'Difficulty, Format & Batch Quantity'}
              {step === 4 && 'Skills, Cognitive Traps & Stimulus'}
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
            selectedSection={selectedSection}
            sectionMeta={sectionMeta}
            selectedSubject={selectedSubject}
            onSelectSubject={(v) => update('selectedSubject', v)}
            selectedUnit={selectedUnit}
            onSelectUnit={(v) => update('selectedUnit', v)}
            selectedTopic={selectedTopic}
            onSelectTopic={(v) => update('selectedTopic', v)}
            selectedSubtopic={selectedSubtopic}
            onSelectSubtopic={(v) => update('selectedSubtopic', v)}
            availableSubtopics={availableSubtopics}
            setSelectedSubtopic={setSelectedSubtopic}
          />
        )}

        {step === 3 && (
          <WizardStep3Difficulty
            selectedSection={selectedSection}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            DIFFICULTY_TIERS={DIFFICULTY_TIERS}
            passageMode={passageMode}
            handlePassageModeChange={handlePassageModeChange}
            totalQuestions={totalQuestions}
            setTotalQuestions={setTotalQuestions}
            questionType={questionType}
            setQuestionType={setQuestionType}
          />
        )}

        {step === 4 && (
          <WizardStep4Stimulus
            selectedSection={selectedSection}
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
            selectedSkill={selectedSkill}
            setSelectedSkill={(v) => update('selectedSkill', v)}
            selectedSubskill={selectedSubskill}
            setSelectedSubskill={(v) => update('selectedSubskill', v)}
            contentDomains={contentDomains}
            onToggleContentDomain={toggleContentDomain}
            likelyMistakePattern={likelyMistakePattern}
            setLikelyMistakePattern={(v) => update('likelyMistakePattern', v)}
            customMistakePattern={customMistakePattern}
            setCustomMistakePattern={(v) => update('customMistakePattern', v)}
          />
        )}

        {step === 5 && (
          <WizardStep5Review
            sectionMeta={sectionMeta}
            pacing={pacing}
            setStep={setStep}
            selectedSubject={selectedSubject}
            selectedUnit={selectedUnit}
            selectedTopic={selectedTopic}
            selectedSubtopic={selectedSubtopic}
            customPrompt={customPrompt}
            difficulty={difficulty}
            passageMode={passageMode}
            totalQuestions={totalQuestions}
            questionType={questionType}
            totalImagesCount={totalImagesCount}
            hasPassageImage={hasPassageImage}
            activeQuestionImagesCount={activeQuestionImagesCount}
            COGNITIVE_TRAPS={COGNITIVE_TRAPS}
            primaryTrap={primaryTrap}
            selectedSkill={selectedSkill}
            selectedSubskill={selectedSubskill}
            likelyMistakePattern={likelyMistakePattern}
            customMistakePattern={customMistakePattern}
            contentDomains={contentDomains}
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
          id={step === totalSteps ? 'btn-wizard-generate-questions' : 'btn-wizard-next-step'}
          onClick={handleNext}
          style={{ padding: '10px 22px', fontSize: '0.95rem' }}
        >
          {step === totalSteps ? (
            <>
              <Sparkles size={16} />
              <span>Generate Questions</span>
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
