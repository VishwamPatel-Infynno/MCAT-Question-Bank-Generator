import React from 'react';
import {
  Sparkles,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Compass,
  Image
} from 'lucide-react';
import { SECTION_ICONS, PACING_INFO } from '../../constants/ucat';
import CustomSelect from '../common/CustomSelect';
import NumberStepper from '../common/NumberStepper';
import IndependentDiagramControls from './IndependentDiagramControls';
import QuestionStyleMixSection from './QuestionStyleMixSection';
import ExamTrapsSection from './ExamTrapsSection';

export default function GeneratorPanel({
  generatorForm,
  sectionsData = [],
  onGenerate,
  onCancel,
  isGenerating,
  isCollapsed,
  onToggleCollapse
}) {
  const form = generatorForm?.formData || {};
  const update = generatorForm?.updateField || (() => {});

  const selectedSection = form.selectedSection || 'verbal_reasoning';
  const setSelectedSection = (v) => update('selectedSection', v);
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

  // Number of passage questions vs independent questions
  const numPassageQs = totalQuestions > 1
    ? (passageMode === 'single_passage' ? Math.min(passageQuestionCount, totalQuestions) : 0)
    : (passageRequired === 'Yes' ? 1 : 0);
  const numIndependentQs = Math.max(0, totalQuestions - numPassageQs);

  // 1-based question numbers that are independent (questions other than passage)
  // In single passage sets, questions 1..numPassageQs reference the passage.
  // Independent questions occupy (numPassageQs + 1)..totalQuestions.
  const independentIndices = Array.from({ length: totalQuestions }, (_, i) => i + 1).slice(numPassageQs);

  // Style breakdown for independent questions
  const indSingleTotal = totalQuestions > 1
    ? (passageMode === 'single_passage' ? Math.max(0, independentSingleCount) : singleChoiceCount)
    : (interactionType === 'single_choice' ? 1 : 0);
  const indMultiTotal = totalQuestions > 1
    ? (passageMode === 'single_passage' ? Math.max(0, independentMultiCount) : multiChoiceCount)
    : (interactionType === 'multi_choice' ? 1 : 0);

  // Partition independent question numbers: Single Choice first, then Multi Choice
  const indSingleIndices = independentIndices.slice(0, indSingleTotal);
  const indMultiIndices = independentIndices.slice(indSingleTotal, indSingleTotal + indMultiTotal);

  const activeSingleImageIndices = (imageQuestionIndices || []).filter(i => indSingleIndices.includes(i));
  const activeMultiImageIndices = (imageQuestionIndices || []).filter(i => indMultiIndices.includes(i));
  const activeSingleImageCount = activeSingleImageIndices.length;
  const activeMultiImageCount = activeMultiImageIndices.length;

  // Derived counts for visual summary: only independent questions can have question-level diagrams!
  const activeQuestionImagesCount = isAbstractReasoning
    ? totalQuestions
    : (imageMode === 'all'
      ? independentIndices.length
      : activeSingleImageCount + activeMultiImageCount);
  const hasPassageImage = !isAbstractReasoning && isPassageSet && Boolean(requirePassageImage);
  const totalImagesCount = isAbstractReasoning ? totalQuestions : (activeQuestionImagesCount + (hasPassageImage ? 1 : 0));

  const handleTotalChange = (newTotal) => {
    const clamped = Math.max(1, Math.min(5, newTotal));
    if (setTotalQuestions) setTotalQuestions(clamped);
    if (clamped === 1) {
      if (setSingleChoiceCount) setSingleChoiceCount(interactionType === 'multi_choice' ? 0 : 1);
      if (setMultiChoiceCount) setMultiChoiceCount(interactionType === 'multi_choice' ? 1 : 0);
      if (setPassageCount) setPassageCount(passageRequired === 'Yes' ? 1 : 0);
    } else {
      if (passageMode === 'single_passage') {
        const clampedPassage = Math.max(1, Math.min(clamped, passageQuestionCount));
        if (setPassageQuestionCount) setPassageQuestionCount(clampedPassage);
        const pMulti = Math.min(passageMultiCount, clampedPassage);
        const pSingle = clampedPassage - pMulti;
        if (setPassageMultiCount) setPassageMultiCount(pMulti);
        if (setPassageSingleCount) setPassageSingleCount(pSingle);
        const indTotal = clamped - clampedPassage;
        let indMulti = 0;
        let indSingle = 0;
        if (indTotal > 0) {
          indMulti = Math.min(independentMultiCount, indTotal);
          indSingle = indTotal - indMulti;
          if (setIndependentMultiCount) setIndependentMultiCount(indMulti);
          if (setIndependentSingleCount) setIndependentSingleCount(indSingle);
        }
        if (setSingleChoiceCount) setSingleChoiceCount(pSingle + indSingle);
        if (setMultiChoiceCount) setMultiChoiceCount(pMulti + indMulti);
        if (setPassageCount) setPassageCount(clampedPassage);
      } else {
        const curMulti = Math.min(multiChoiceCount, clamped);
        if (setMultiChoiceCount) setMultiChoiceCount(curMulti);
        if (setSingleChoiceCount) setSingleChoiceCount(clamped - curMulti);
        if (setPassageCount) setPassageCount(Math.min(passageCount, clamped));
      }
    }
  };

  const handlePassageModeChange = (mode) => {
    if (setPassageMode) setPassageMode(mode);
    if (mode === 'single_passage') {
      if (setPassageRequired) setPassageRequired('Yes');
      if (setPassageCount) setPassageCount(passageQuestionCount);
    } else {
      if (setPassageRequired) setPassageRequired('No');
      if (setPassageCount) setPassageCount(0);
    }
  };

  const handlePassageQuestionCountChange = (newVal) => {
    const val = Math.max(1, Math.min(totalQuestions, newVal));
    if (setPassageQuestionCount) setPassageQuestionCount(val);
    const pMulti = Math.min(passageMultiCount, val);
    const pSingle = val - pMulti;
    if (setPassageMultiCount) setPassageMultiCount(pMulti);
    if (setPassageSingleCount) setPassageSingleCount(pSingle);

    const indTotal = totalQuestions - val;
    let indMulti = 0;
    let indSingle = 0;
    if (indTotal > 0) {
      indMulti = Math.min(independentMultiCount, indTotal);
      indSingle = indTotal - indMulti;
      if (setIndependentMultiCount) setIndependentMultiCount(indMulti);
      if (setIndependentSingleCount) setIndependentSingleCount(indSingle);
    }
    if (setSingleChoiceCount) setSingleChoiceCount(pSingle + indSingle);
    if (setMultiChoiceCount) setMultiChoiceCount(pMulti + indMulti);
    if (setPassageCount) setPassageCount(val);
  };

  const handlePassageSingleChange = (newVal) => {
    const val = Math.max(0, Math.min(passageQuestionCount, newVal));
    const pMulti = passageQuestionCount - val;
    if (setPassageSingleCount) setPassageSingleCount(val);
    if (setPassageMultiCount) setPassageMultiCount(pMulti);
    const indTotal = totalQuestions - passageQuestionCount;
    const indSingle = indTotal > 0 ? independentSingleCount : 0;
    const indMulti = indTotal > 0 ? independentMultiCount : 0;
    if (setSingleChoiceCount) setSingleChoiceCount(val + indSingle);
    if (setMultiChoiceCount) setMultiChoiceCount(pMulti + indMulti);
  };

  const handlePassageMultiChange = (newVal) => {
    const val = Math.max(0, Math.min(passageQuestionCount, newVal));
    const pSingle = passageQuestionCount - val;
    if (setPassageMultiCount) setPassageMultiCount(val);
    if (setPassageSingleCount) setPassageSingleCount(pSingle);
    const indTotal = totalQuestions - passageQuestionCount;
    const indSingle = indTotal > 0 ? independentSingleCount : 0;
    const indMulti = indTotal > 0 ? independentMultiCount : 0;
    if (setSingleChoiceCount) setSingleChoiceCount(pSingle + indSingle);
    if (setMultiChoiceCount) setMultiChoiceCount(val + indMulti);
  };

  const handleIndependentSingleChange = (newVal) => {
    const indTotal = totalQuestions - passageQuestionCount;
    if (indTotal <= 0) return;
    const val = Math.max(0, Math.min(indTotal, newVal));
    const indMulti = indTotal - val;
    if (setIndependentSingleCount) setIndependentSingleCount(val);
    if (setIndependentMultiCount) setIndependentMultiCount(indMulti);
    if (setSingleChoiceCount) setSingleChoiceCount(passageSingleCount + val);
    if (setMultiChoiceCount) setMultiChoiceCount(passageMultiCount + indMulti);
  };

  const handleIndependentMultiChange = (newVal) => {
    const indTotal = totalQuestions - passageQuestionCount;
    if (indTotal <= 0) return;
    const val = Math.max(0, Math.min(indTotal, newVal));
    const indSingle = indTotal - val;
    if (setIndependentMultiCount) setIndependentMultiCount(val);
    if (setIndependentSingleCount) setIndependentSingleCount(indSingle);
    if (setSingleChoiceCount) setSingleChoiceCount(passageSingleCount + indSingle);
    if (setMultiChoiceCount) setMultiChoiceCount(passageMultiCount + val);
  };

  const handleSingleCountChange = (newVal) => {
    const val = Math.max(0, Math.min(totalQuestions, newVal));
    if (setSingleChoiceCount) setSingleChoiceCount(val);
    if (setMultiChoiceCount) setMultiChoiceCount(totalQuestions - val);
  };

  const handleMultiCountChange = (newVal) => {
    const val = Math.max(0, Math.min(totalQuestions, newVal));
    if (setMultiChoiceCount) setMultiChoiceCount(val);
    if (setSingleChoiceCount) setSingleChoiceCount(totalQuestions - val);
  };

  const handlePassageCountChange = (newVal) => {
    const val = Math.max(0, Math.min(totalQuestions, newVal));
    if (setPassageCount) setPassageCount(val);
  };

  const currentSectionObj = sectionsData.find(s => s.id === selectedSection) || sectionsData[0] || { label: 'Verbal Reasoning', subtopics: [] };
  const subtopics = currentSectionObj?.subtopics || [];
  const pacing = PACING_INFO[selectedSection] || PACING_INFO.verbal_reasoning;

  // Render Collapsed Sidebar Dock (Slim 64px Icon Rail)
  if (isCollapsed) {
    return (
      <div
        className="dock-panel dock-panel-collapsed"
        style={{
          padding: '14px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          width: '56px'
        }}
      >
        <button
          onClick={onToggleCollapse}
          className="btn-secondary"
          style={{ padding: '6px', border: 'none', background: 'transparent' }}
          title="Expand Question Setup Studio"
        >
          <PanelLeftOpen size={16} color="var(--brand-primary)" />
        </button>

        <div style={{ width: '100%', height: '1px', background: 'var(--border-light)' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {sectionsData.map(sec => {
            const Icon = SECTION_ICONS[sec.id] || FileText;
            const isSelected = selectedSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => {
                  setSelectedSection(sec.id);
                  if (sec.subtopics?.length > 0) setSelectedSubtopic(sec.subtopics[0]);
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isSelected ? 'var(--brand-primary)' : 'transparent',
                  border: isSelected ? '1px solid var(--brand-primary)' : '1px solid transparent',
                  color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
                title={sec.label}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>

        {/* Batch Quantity Pill if > 1 */}
        {totalQuestions > 1 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '24px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--status-purple-bg)',
              color: 'var(--status-purple)',
              fontSize: '0.65rem',
              fontWeight: 800,
              border: '1px solid var(--status-purple-border)'
            }}
            title={`Batch Size: ${totalQuestions} Questions`}
          >
            {totalQuestions}x
          </div>
        )}

        <div style={{ marginTop: 'auto' }}>
          {isGenerating ? (
            <button
              id="btn-cancel-generation-collapsed"
              onClick={onCancel}
              className="btn-danger"
              style={{ width: '36px', height: '36px', padding: 0, borderRadius: 'var(--radius-sm)' }}
              title="Cancel Generation"
            >
              <X size={16} />
            </button>
          ) : (
            <button
              id="btn-generate-collapsed"
              onClick={onGenerate}
              className="btn-primary"
              style={{ width: '36px', height: '36px', padding: 0, borderRadius: 'var(--radius-sm)' }}
              title="Generate Question (⌘↵)"
            >
              <Sparkles size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Render Full Unified Studio Dock
  return (
    <div className="dock-panel">
      {/* Studio Top Header */}
      <div
        style={{
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-light)',
          background: 'var(--bg-surface-subtle)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Compass size={14} color="var(--brand-primary)" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Question Setup
          </span>
        </div>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="btn-secondary"
            style={{ padding: '4px 6px', fontSize: '0.7rem', border: 'none', background: 'transparent' }}
            title="Collapse panel to maximize review space"
          >
            <PanelLeftClose size={14} />
          </button>
        )}
      </div>

      {/* SECTION 1: SECTION & TOPIC */}
      <div className="dock-section">
        <div className="section-header-minimal">
          <span className="section-header-title">Subtest &amp; Topic</span>
          <span className="badge-minimal">
            {pacing.target || '~28s / Q'}
          </span>
        </div>

        {/* Subtest & Topic Paired Dropdowns */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Subtest Dropdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor="select-subtest" style={{ fontSize: '0.675rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Subtest
            </label>
            <CustomSelect
              id="select-subtest"
              label="Select UCAT Subtest"
              value={selectedSection}
              onChange={(newSecId) => {
                setSelectedSection(newSecId);
                const sec = sectionsData.find(s => s.id === newSecId);
                if (sec?.subtopics && sec.subtopics.length > 0) {
                  setSelectedSubtopic(sec.subtopics[0]);
                }
                if (newSecId === 'abstract_reasoning') {
                  if (setImageMode) setImageMode('all');
                }
              }}
              options={sectionsData.map(sec => {
                const Icon = SECTION_ICONS[sec.id] || FileText;
                const secPacing = PACING_INFO[sec.id] || {};
                return {
                  value: sec.id,
                  label: sec.label,
                  icon: <Icon size={14} />,
                  badge: secPacing.target,
                  description: `${sec.subtopics?.length || 0} Topics available`
                };
              })}
            />
          </div>

          {/* Subtopic Focus Dropdown */}
          {subtopics.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="select-subtopic" style={{ fontSize: '0.675rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Topic Focus
              </label>
              <CustomSelect
                id="select-subtopic"
                label="Topic Focus"
                value={selectedSubtopic}
                onChange={(newTopic) => setSelectedSubtopic(newTopic)}
                options={subtopics.map(sub => ({
                  value: sub,
                  label: sub
                }))}
                searchable={subtopics.length > 5}
              />
            </div>
          )}
        </div>

        {/* Difficulty Segmented Chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.675rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Difficulty Level
          </label>
          <div className="pill-track" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {[
              { id: 'easy', label: 'Easy', color: 'var(--status-success)' },
              { id: 'medium', label: 'Medium', color: 'var(--status-warning)' },
              { id: 'hard', label: 'Hard', color: 'var(--status-danger)' }
            ].map(opt => {
              const isSel = difficulty === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  id={`btn-diff-${opt.id}`}
                  onClick={() => setDifficulty(opt.id)}
                  className={`pill-track-btn ${isSel ? 'active' : ''}`}
                  style={{ width: '100%', padding: '5px 4px' }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: opt.color }} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 2: FORMATS & QUANTITY */}
      <div className="dock-section">
        <div className="section-header-minimal">
          <span className="section-header-title">Question Volume</span>
          <span className="badge-minimal">
            {totalQuestions} {totalQuestions === 1 ? 'Question' : 'Questions'}
          </span>
        </div>

        {/* Stepper Only */}
        <NumberStepper
          value={totalQuestions}
          min={1}
          max={5}
          onChange={handleTotalChange}
          idPrefix="btn-qty"
          label={(val) => val}
          titleMinus="Decrease questions"
          titlePlus="Increase questions"
        />

        {/* Batch Allocation (when totalQuestions > 1) */}
        {totalQuestions > 1 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Reading Material Mode: Single Passage Set vs Independent Questions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Reading Material
                </span>
                <span className="badge badge-purple" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                  {passageMode === 'single_passage' ? '1 Passage • N Questions' : 'Separate Vignettes'}
                </span>
              </div>

              <div className="pill-track" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {[
                  { id: 'single_passage', label: 'Single Passage Set' },
                  { id: 'independent', label: 'Independent Questions' }
                ].map(opt => {
                  const isSel = passageMode === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      id={`btn-passage-mode-${opt.id}`}
                      onClick={() => handlePassageModeChange(opt.id)}
                      className={`pill-track-btn ${isSel ? 'active' : ''}`}
                      style={{ width: '100%', padding: '5px' }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {passageMode === 'single_passage' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Questions on Shared Passage
                    </span>
                    <span className="badge badge-purple" style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                      {passageQuestionCount} Passage • {totalQuestions - passageQuestionCount} Independent
                    </span>
                  </div>

                  <NumberStepper
                    value={passageQuestionCount}
                    min={1}
                    max={totalQuestions}
                    onChange={handlePassageQuestionCountChange}
                    idPrefix="btn-passage-qty"
                    activeColor="var(--status-purple)"
                    label={(val) => `${val} of ${totalQuestions}`}
                    titleMinus="Decrease passage question count"
                    titlePlus="Increase passage question count"
                  />

                  <div
                    style={{
                      padding: '6px 8px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--brand-light)',
                      border: '1px solid var(--border-brand)',
                      fontSize: '0.675rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.35
                    }}
                  >
                    {passageQuestionCount === totalQuestions ? (
                      <>
                        <strong style={{ color: 'var(--brand-primary)' }}>Full Passage Set:</strong> All {totalQuestions} questions reference 1 shared comprehensive passage (250–400 words).
                      </>
                    ) : (
                      <>
                        <strong style={{ color: 'var(--status-purple)' }}>Mixed Set:</strong> {passageQuestionCount} questions linked to 1 shared passage (250–400w); remaining {totalQuestions - passageQuestionCount} questions are direct standalone questions (no passage).
                      </>
                    )}
                  </div>

                  {/* Passage Stimulus Diagram Toggle */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Passage Diagram
                      </span>
                      <span className="badge-minimal" style={{ fontSize: '0.6rem' }}>
                        {requirePassageImage ? 'Attached to Passage ($0.0020)' : 'No Diagram'}
                      </span>
                    </div>
                    <div className="pill-track" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                      <button
                        type="button"
                        id="btn-passage-diag-no"
                        onClick={() => setRequirePassageImage && setRequirePassageImage(false)}
                        className={`pill-track-btn ${!requirePassageImage ? 'active' : ''}`}
                        style={{ width: '100%', padding: '4px' }}
                      >
                        No Diagram
                      </button>
                      <button
                        type="button"
                        id="btn-passage-diag-yes"
                        onClick={() => setRequirePassageImage && setRequirePassageImage(true)}
                        className={`pill-track-btn ${requirePassageImage ? 'active' : ''}`}
                        style={{ width: '100%', padding: '4px' }}
                      >
                        <Image size={11} />
                        <span>With Diagram</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Answer Style Breakdown */}
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

            {/* Independent Questions with Diagrams - Split by Answer Style */}
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
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Reading Material Switch for 1 question */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Reading Material
              </span>
              <div className="pill-track" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {[
                  { id: 'No', label: 'Direct Question' },
                  { id: 'Yes', label: 'Reading Passage' }
                ].map(opt => {
                  const isSel = passageRequired === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      id={`btn-passage-${opt.id.toLowerCase()}`}
                      onClick={() => {
                        if (setPassageRequired) setPassageRequired(opt.id);
                        if (setPassageCount) setPassageCount(opt.id === 'Yes' ? 1 : 0);
                        if (setPassageMode) setPassageMode(opt.id === 'Yes' ? 'single_passage' : 'independent');
                      }}
                      className={`pill-track-btn ${isSel ? 'active' : ''}`}
                      style={{ width: '100%', padding: '5px' }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Passage Diagram Toggle for 1 question (if reading passage active) */}
            {passageRequired === 'Yes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Passage Diagram
                  </span>
                  <span className="badge-minimal" style={{ fontSize: '0.6rem' }}>
                    {requirePassageImage ? 'Attached to Passage ($0.0020)' : 'No Diagram'}
                  </span>
                </div>
                <div className="pill-track" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  <button
                    type="button"
                    id="btn-single-p-diag-no"
                    onClick={() => setRequirePassageImage && setRequirePassageImage(false)}
                    className={`pill-track-btn ${!requirePassageImage ? 'active' : ''}`}
                    style={{ width: '100%', padding: '5px' }}
                  >
                    No Diagram
                  </button>
                  <button
                    type="button"
                    id="btn-single-p-diag-yes"
                    onClick={() => setRequirePassageImage && setRequirePassageImage(true)}
                    className={`pill-track-btn ${requirePassageImage ? 'active' : ''}`}
                    style={{ width: '100%', padding: '5px' }}
                  >
                    <Image size={11} />
                    <span>With Diagram</span>
                  </button>
                </div>
              </div>
            )}

            {/* Answer Type Switch for 1 question */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Answer Style
              </span>
              <div className="pill-track" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {[
                  { id: 'single_choice', label: 'Single Answer' },
                  { id: 'multi_choice', label: 'Multiple Answers' }
                ].map(opt => {
                  const isSel = interactionType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      id={`btn-mode-${opt.id}`}
                      onClick={() => {
                        if (setInteractionType) setInteractionType(opt.id);
                        if (setSingleChoiceCount && setMultiChoiceCount) {
                          setSingleChoiceCount(opt.id === 'multi_choice' ? 0 : 1);
                          setMultiChoiceCount(opt.id === 'multi_choice' ? 1 : 0);
                        }
                      }}
                      className={`pill-track-btn ${isSel ? 'active' : ''}`}
                      style={{ width: '100%', padding: '5px' }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Question Diagram Toggle for 1 question (Only for Direct Questions / Independent) */}
            {!isAbstractReasoning && passageRequired === 'No' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Question Diagram
                  </span>
                  <span className="badge-minimal" style={{ fontSize: '0.6rem' }}>
                    {(imageQuestionIndices || []).includes(1) || imageMode === 'all' ? 'With Diagram ($0.0020)' : 'Text Only'}
                  </span>
                </div>
                <div className="pill-track" style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  {[
                    { id: 'no', label: 'No Diagram' },
                    { id: 'yes', label: 'With Diagram' }
                  ].map(opt => {
                    const hasImage = (imageQuestionIndices || []).includes(1) || imageMode === 'all';
                    const isSel = opt.id === 'yes' ? hasImage : !hasImage;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        id={`btn-single-diag-${opt.id}`}
                        onClick={() => {
                          if (opt.id === 'yes') {
                            if (setImageCount) setImageCount(1, [1]);
                          } else {
                            if (setImageCount) setImageCount(0, [1]);
                          }
                        }}
                        className={`pill-track-btn ${isSel ? 'active' : ''}`}
                        style={{ width: '100%', padding: '5px' }}
                      >
                        {opt.id === 'yes' && <Image size={11} />}
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {isAbstractReasoning && (
              <div
                style={{
                  padding: '6px 8px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--brand-light)',
                  border: '1px solid var(--border-medium)',
                  fontSize: '0.675rem',
                  color: 'var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Image size={12} />
                <span>Abstract Reasoning always requires visual shape pattern diagrams.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 3: TRAPS & DIRECTIVES */}
      <ExamTrapsSection
        primaryTrap={primaryTrap}
        setPrimaryTrap={setPrimaryTrap}
        customPrompt={customPrompt}
        setCustomPrompt={setCustomPrompt}
      />

      {/* DOCK FOOTER: ACTION BAR */}
      <div
        style={{
          padding: '14px 18px',
          background: 'var(--bg-surface-subtle)',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Target:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {totalQuestions > 1 && passageMode === 'single_passage'
              ? `${totalQuestions} Questions Set (1 Shared Passage)${totalImagesCount > 0 ? ` • ${totalImagesCount} ${totalImagesCount === 1 ? 'diagram' : 'diagrams'}` : ''}`
              : `${totalQuestions} ${totalQuestions === 1 ? 'Question' : 'Questions'} • ${currentSectionObj.label}${totalImagesCount > 0 ? ` • ${totalImagesCount} ${totalImagesCount === 1 ? 'diagram' : 'diagrams'}` : ''}`}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            id="btn-generate-main"
            onClick={onGenerate}
            disabled={isGenerating}
            className="btn-primary-luminous"
            style={{
              flex: 1,
              padding: '10px 16px',
              fontWeight: 600,
              fontSize: '0.8rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <Sparkles size={14} />
            <span>
              {isGenerating
                ? (totalQuestions > 1
                    ? (passageMode === 'single_passage' ? `Creating ${totalQuestions}-Question Passage Set...` : `Creating ${totalQuestions} Questions...`)
                    : 'Creating Question...')
                : (totalQuestions > 1
                    ? (passageMode === 'single_passage' ? `Create Passage Set (${totalQuestions} Qs)` : `Create ${totalQuestions} Questions`)
                    : 'Create Question')}
            </span>
            {!isGenerating && (
              <span className="kbd-hint" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: 'none', padding: '1px 4px' }}>
                ⌘↵
              </span>
            )}
          </button>

          {isGenerating && onCancel && (
            <button
              id="btn-cancel-generation"
              type="button"
              onClick={onCancel}
              className="btn-danger"
              style={{ padding: '9px 12px', fontSize: '0.775rem', whiteSpace: 'nowrap', gap: '5px', borderRadius: 'var(--radius-xs)' }}
              title="Stop and abort question generation"
            >
              <X size={13} />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
