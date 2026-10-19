import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Target,
  Plus,
  Minus,
  SlidersHorizontal,
  Compass,
  Image,
  Check
} from 'lucide-react';
import { SECTION_ICONS, PACING_INFO } from '../../constants/ucat';
import CustomSelect from '../common/CustomSelect';

const TRAP_OPTIONS = [
  { value: 'Automatic', label: 'Automatic Trap Balancing', description: 'AI evaluates and injects realistic traps for this subtest' },
  { value: 'Keyword_Trap', label: 'Matching Words Trap', description: 'Similar words from passage with opposite or skewed meaning' },
  { value: 'Partial_Match', label: 'Incomplete Information', description: 'Missing a computation step or omitting key constraints' },
  { value: 'Extreme_Language', label: 'Extreme Words Trap', description: 'Absolute terms (always, never, only) not justified by facts' },
  { value: 'Correlation_vs_Causation', label: 'Correlation vs Causation', description: 'Falsely assuming causal relationship from a correlated finding' },
  { value: 'Scope_Shift', label: 'Out-of-Scope Conclusion', description: 'Extrapolating plausible assumptions beyond given evidence' },
  { value: 'Half_Truth', label: 'True Fact but Irrelevant', description: 'Factually true statement that does not answer the question' }
];

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
  const imageQuestionIndices = form.imageQuestionIndices || [];
  const toggleQuestionImage = generatorForm?.toggleQuestionImage;
  const requirePassageImage = form.requirePassageImage || false;
  const setRequirePassageImage = generatorForm?.setRequirePassageImage;
  const customPrompt = form.customPrompt || '';
  const setCustomPrompt = (v) => update('customPrompt', v);

  const isPassageSet = totalQuestions > 1 ? (passageMode === 'single_passage') : (passageRequired === 'Yes');
  const isAbstractReasoning = selectedSection === 'abstract_reasoning';

  // Derived counts for visual summary
  const activeQuestionImagesCount = isAbstractReasoning
    ? totalQuestions
    : (imageMode === 'all'
      ? totalQuestions
      : (imageQuestionIndices || []).filter(i => i <= totalQuestions).length);
  const hasPassageImage = !isAbstractReasoning && isPassageSet && Boolean(requirePassageImage);
  const totalImagesCount = isAbstractReasoning ? totalQuestions : (activeQuestionImagesCount + (hasPassageImage ? 1 : 0));

  const [showAdvancedDirectives, setShowAdvancedDirectives] = useState(false);

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

        {/* Stepper & Quick Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-xs)',
              padding: '2px',
              flex: 1
            }}
          >
            <button
              type="button"
              id="btn-qty-minus"
              onClick={() => handleTotalChange(totalQuestions - 1)}
              disabled={totalQuestions <= 1}
              style={{
                width: '26px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                color: totalQuestions <= 1 ? 'var(--text-disabled)' : 'var(--text-primary)',
                cursor: totalQuestions <= 1 ? 'not-allowed' : 'pointer'
              }}
              title="Decrease questions"
            >
              <Minus size={11} />
            </button>
            <div style={{ flex: 1, textAlign: 'center', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {totalQuestions}
            </div>
            <button
              type="button"
              id="btn-qty-plus"
              onClick={() => handleTotalChange(totalQuestions + 1)}
              disabled={totalQuestions >= 5}
              style={{
                width: '26px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                color: totalQuestions >= 5 ? 'var(--text-disabled)' : 'var(--text-primary)',
                cursor: totalQuestions >= 5 ? 'not-allowed' : 'pointer'
              }}
              title="Increase questions"
            >
              <Plus size={11} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '3px' }}>
            {[1, 2, 3, 4, 5].map(cnt => (
              <button
                key={cnt}
                type="button"
                id={`btn-chip-qty-${cnt}`}
                onClick={() => handleTotalChange(cnt)}
                style={{
                  padding: '4px 7px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.7rem',
                  fontWeight: totalQuestions === cnt ? 600 : 400,
                  background: totalQuestions === cnt ? 'var(--brand-primary)' : 'var(--bg-surface-subtle)',
                  color: totalQuestions === cnt ? '#ffffff' : 'var(--text-muted)',
                  border: totalQuestions === cnt ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                  cursor: 'pointer'
                }}
              >
                {cnt}
              </button>
            ))}
          </div>
        </div>

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

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: 'var(--bg-surface-subtle)',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-xs)',
                        padding: '2px',
                        flex: 1
                      }}
                    >
                      <button
                        type="button"
                        id="btn-passage-qty-minus"
                        onClick={() => handlePassageQuestionCountChange(passageQuestionCount - 1)}
                        disabled={passageQuestionCount <= 1}
                        style={{
                          width: '26px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          background: 'transparent',
                          color: passageQuestionCount <= 1 ? 'var(--text-disabled)' : 'var(--text-primary)',
                          cursor: passageQuestionCount <= 1 ? 'not-allowed' : 'pointer'
                        }}
                        title="Decrease passage question count"
                      >
                        <Minus size={11} />
                      </button>
                      <div style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {passageQuestionCount} of {totalQuestions}
                      </div>
                      <button
                        type="button"
                        id="btn-passage-qty-plus"
                        onClick={() => handlePassageQuestionCountChange(passageQuestionCount + 1)}
                        disabled={passageQuestionCount >= totalQuestions}
                        style={{
                          width: '26px',
                          height: '24px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          background: 'transparent',
                          color: passageQuestionCount >= totalQuestions ? 'var(--text-disabled)' : 'var(--text-primary)',
                          cursor: passageQuestionCount >= totalQuestions ? 'not-allowed' : 'pointer'
                        }}
                        title="Increase passage question count"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    {/* Quick Allocation Chips */}
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {Array.from({ length: totalQuestions }, (_, i) => i + 1).map(cnt => (
                        <button
                          key={cnt}
                          type="button"
                          id={`btn-chip-passage-qty-${cnt}`}
                          onClick={() => handlePassageQuestionCountChange(cnt)}
                          style={{
                            padding: '4px 7px',
                            borderRadius: 'var(--radius-xs)',
                            fontSize: '0.675rem',
                            fontWeight: passageQuestionCount === cnt ? 600 : 400,
                            background: passageQuestionCount === cnt ? 'var(--status-purple-bg)' : 'var(--bg-surface-subtle)',
                            color: passageQuestionCount === cnt ? 'var(--status-purple)' : 'var(--text-muted)',
                            border: passageQuestionCount === cnt ? '1px solid var(--status-purple-border)' : '1px solid var(--border-light)',
                            cursor: 'pointer'
                          }}
                        >
                          {cnt}P
                        </button>
                      ))}
                    </div>
                  </div>

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
            {passageMode === 'single_passage' && passageQuestionCount < totalQuestions ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Passage Group Formats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Passage Items ({passageQuestionCount} Qs) Style
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 8px',
                        background: 'var(--bg-surface-subtle)',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-light)'
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Single</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          id="btn-p-single-minus"
                          onClick={() => handlePassageSingleChange(passageSingleCount - 1)}
                          disabled={passageSingleCount <= 0}
                          style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                          <Minus size={9} />
                        </button>
                        <span style={{ fontSize: '0.725rem', fontWeight: 700, minWidth: '12px', textAlign: 'center' }}>
                          {passageSingleCount}
                        </span>
                        <button
                          type="button"
                          id="btn-p-single-plus"
                          onClick={() => handlePassageSingleChange(passageSingleCount + 1)}
                          disabled={passageSingleCount >= passageQuestionCount}
                          style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                          <Plus size={9} />
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 8px',
                        background: 'var(--bg-surface-subtle)',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-light)'
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Multi</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          id="btn-p-multi-minus"
                          onClick={() => handlePassageMultiChange(passageMultiCount - 1)}
                          disabled={passageMultiCount <= 0}
                          style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                          <Minus size={9} />
                        </button>
                        <span style={{ fontSize: '0.725rem', fontWeight: 700, minWidth: '12px', textAlign: 'center', color: passageMultiCount > 0 ? 'var(--brand-indigo)' : 'var(--text-primary)' }}>
                          {passageMultiCount}
                        </span>
                        <button
                          type="button"
                          id="btn-p-multi-plus"
                          onClick={() => handlePassageMultiChange(passageMultiCount + 1)}
                          disabled={passageMultiCount >= passageQuestionCount}
                          style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                          <Plus size={9} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Independent Group Formats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Independent Items ({totalQuestions - passageQuestionCount} Qs) Style
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 8px',
                        background: 'var(--bg-surface-subtle)',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-light)'
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Single</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          id="btn-ind-single-minus"
                          onClick={() => handleIndependentSingleChange(independentSingleCount - 1)}
                          disabled={independentSingleCount <= 0}
                          style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                          <Minus size={9} />
                        </button>
                        <span style={{ fontSize: '0.725rem', fontWeight: 700, minWidth: '12px', textAlign: 'center' }}>
                          {independentSingleCount}
                        </span>
                        <button
                          type="button"
                          id="btn-ind-single-plus"
                          onClick={() => handleIndependentSingleChange(independentSingleCount + 1)}
                          disabled={independentSingleCount >= (totalQuestions - passageQuestionCount)}
                          style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                          <Plus size={9} />
                        </button>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '5px 8px',
                        background: 'var(--bg-surface-subtle)',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-light)'
                      }}
                    >
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Multi</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          id="btn-ind-multi-minus"
                          onClick={() => handleIndependentMultiChange(independentMultiCount - 1)}
                          disabled={independentMultiCount <= 0}
                          style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                          <Minus size={9} />
                        </button>
                        <span style={{ fontSize: '0.725rem', fontWeight: 700, minWidth: '12px', textAlign: 'center', color: independentMultiCount > 0 ? 'var(--brand-indigo)' : 'var(--text-primary)' }}>
                          {independentMultiCount}
                        </span>
                        <button
                          type="button"
                          id="btn-ind-multi-plus"
                          onClick={() => handleIndependentMultiChange(independentMultiCount + 1)}
                          disabled={independentMultiCount >= (totalQuestions - passageQuestionCount)}
                          style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                        >
                          <Plus size={9} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Question Style Mix ({singleChoiceCount} Single, {multiChoiceCount} Multi)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {/* Single Choice Counter */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px',
                      background: 'var(--bg-surface-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Single Choice</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        id="btn-single-count-minus"
                        onClick={() => handleSingleCountChange(singleChoiceCount - 1)}
                        disabled={singleChoiceCount <= 0}
                        style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        <Minus size={9} />
                      </button>
                      <span style={{ fontSize: '0.725rem', fontWeight: 700, minWidth: '12px', textAlign: 'center' }}>
                        {singleChoiceCount}
                      </span>
                      <button
                        type="button"
                        id="btn-single-count-plus"
                        onClick={() => handleSingleCountChange(singleChoiceCount + 1)}
                        disabled={singleChoiceCount >= totalQuestions}
                        style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        <Plus size={9} />
                      </button>
                    </div>
                  </div>

                  {/* Multi Choice Counter */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px',
                      background: 'var(--bg-surface-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Multiple Choice</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        id="btn-multi-count-minus"
                        onClick={() => handleMultiCountChange(multiChoiceCount - 1)}
                        disabled={multiChoiceCount <= 0}
                        style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        <Minus size={9} />
                      </button>
                      <span style={{ fontSize: '0.725rem', fontWeight: 700, minWidth: '12px', textAlign: 'center', color: multiChoiceCount > 0 ? 'var(--brand-indigo)' : 'var(--text-primary)' }}>
                        {multiChoiceCount}
                      </span>
                      <button
                        type="button"
                        id="btn-multi-count-plus"
                        onClick={() => handleMultiCountChange(multiChoiceCount + 1)}
                        disabled={multiChoiceCount >= totalQuestions}
                        style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        <Plus size={9} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stimulus Length Breakdown (Only when passageMode === 'independent') */}
            {passageMode === 'independent' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Question Format Breakdown
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  {/* Passage Counter */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px',
                      background: 'var(--bg-surface-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Reading Passage</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button
                        type="button"
                        id="btn-passage-count-minus"
                        onClick={() => handlePassageCountChange(passageCount - 1)}
                        disabled={passageCount <= 0}
                        style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        <Minus size={9} />
                      </button>
                      <span style={{ fontSize: '0.725rem', fontWeight: 700, minWidth: '12px', textAlign: 'center', color: passageCount > 0 ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                        {passageCount}
                      </span>
                      <button
                        type="button"
                        id="btn-passage-count-plus"
                        onClick={() => handlePassageCountChange(passageCount + 1)}
                        disabled={passageCount >= totalQuestions}
                        style={{ width: '16px', height: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        <Plus size={9} />
                      </button>
                    </div>
                  </div>

                  {/* Direct Question (No Passage) (Derived) */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '5px 8px',
                      background: 'var(--bg-surface-subtle)',
                      borderRadius: 'var(--radius-xs)',
                      border: '1px solid var(--border-light)'
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Direct (No Passage)</span>
                    <span style={{ fontSize: '0.725rem', fontWeight: 700, paddingRight: '4px', color: 'var(--text-muted)' }}>
                      {totalQuestions - passageCount}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Question Diagram Selection (Matching Style Stepper) */}
            {!isAbstractReasoning && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Questions with Diagrams
                  </span>
                  <span className="badge-minimal" style={{ fontSize: '0.625rem' }}>
                    {activeQuestionImagesCount > 0
                      ? `${activeQuestionImagesCount} of ${totalQuestions} Qs ($${(activeQuestionImagesCount * 0.002).toFixed(4)})`
                      : 'No Diagrams'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'var(--bg-surface-subtle)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--radius-xs)',
                      padding: '2px',
                      flex: 1
                    }}
                  >
                    <button
                      type="button"
                      id="btn-img-count-minus"
                      onClick={() => setImageCount && setImageCount(activeQuestionImagesCount - 1)}
                      disabled={activeQuestionImagesCount <= 0}
                      style={{
                        width: '26px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        background: 'transparent',
                        color: activeQuestionImagesCount <= 0 ? 'var(--text-disabled)' : 'var(--text-primary)',
                        cursor: activeQuestionImagesCount <= 0 ? 'not-allowed' : 'pointer'
                      }}
                      title="Decrease questions with diagrams"
                    >
                      <Minus size={11} />
                    </button>
                    <div style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: activeQuestionImagesCount > 0 ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                      {activeQuestionImagesCount} of {totalQuestions}
                    </div>
                    <button
                      type="button"
                      id="btn-img-count-plus"
                      onClick={() => setImageCount && setImageCount(activeQuestionImagesCount + 1)}
                      disabled={activeQuestionImagesCount >= totalQuestions}
                      style={{
                        width: '26px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        background: 'transparent',
                        color: activeQuestionImagesCount >= totalQuestions ? 'var(--text-disabled)' : 'var(--text-primary)',
                        cursor: activeQuestionImagesCount >= totalQuestions ? 'not-allowed' : 'pointer'
                      }}
                      title="Increase questions with diagrams"
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  {/* Quick Chips for Diagram Count */}
                  <div style={{ display: 'flex', gap: '3px' }}>
                    {Array.from({ length: totalQuestions + 1 }, (_, i) => i).map(cnt => (
                      <button
                        key={cnt}
                        type="button"
                        id={`btn-chip-img-qty-${cnt}`}
                        onClick={() => setImageCount && setImageCount(cnt)}
                        style={{
                          padding: '4px 7px',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '0.675rem',
                          fontWeight: activeQuestionImagesCount === cnt ? 600 : 400,
                          background: activeQuestionImagesCount === cnt ? 'var(--brand-primary)' : 'var(--bg-surface-subtle)',
                          color: activeQuestionImagesCount === cnt ? '#ffffff' : 'var(--text-muted)',
                          border: activeQuestionImagesCount === cnt ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                          cursor: 'pointer'
                        }}
                      >
                        {cnt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Fine-Grained Slot Toggles */}
                {activeQuestionImagesCount > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>Assigned to:</span>
                    {Array.from({ length: totalQuestions }, (_, i) => i + 1).map(qNum => {
                      const isActive = (imageQuestionIndices || []).includes(qNum);
                      return (
                        <button
                          key={qNum}
                          type="button"
                          id={`btn-slot-img-${qNum}`}
                          onClick={() => toggleQuestionImage && toggleQuestionImage(qNum)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-xs)',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            background: isActive ? 'var(--brand-light)' : 'var(--bg-surface-subtle)',
                            color: isActive ? 'var(--brand-primary)' : 'var(--text-muted)',
                            border: `1px solid ${isActive ? 'var(--brand-primary)' : 'var(--border-light)'}`,
                            cursor: 'pointer'
                          }}
                          title={`Toggle diagram for Question ${qNum}`}
                        >
                          <span>Q{qNum}</span>
                          {isActive && <Check size={9} strokeWidth={3} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
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

            {/* Question Diagram Toggle for 1 question */}
            {!isAbstractReasoning ? (
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
                            if (setImageCount) setImageCount(1);
                          } else {
                            if (setImageCount) setImageCount(0);
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
            ) : (
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
      <div className="dock-section">
        <div className="section-header-minimal">
          <span className="section-header-title">Exam Traps &amp; Rules</span>
          <Target size={12} color="var(--text-muted)" />
        </div>

        {/* Question Trick Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label htmlFor="select-primary-trap" style={{ fontSize: '0.675rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Wrong Answer Traps
          </label>
          <CustomSelect
            id="select-primary-trap"
            label="Wrong Answer Traps"
            value={primaryTrap}
            onChange={(newTrap) => setPrimaryTrap && setPrimaryTrap(newTrap)}
            options={TRAP_OPTIONS}
          />
        </div>

        {/* Advanced Accordion (Custom Directives) */}
        <div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowAdvancedDirectives(!showAdvancedDirectives)}
            style={{ width: '100%', justifyContent: 'space-between', padding: '5px 8px', fontSize: '0.725rem', borderRadius: 'var(--radius-xs)' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <SlidersHorizontal size={11} color="var(--brand-primary)" />
              <span>Custom Instructions &amp; Directives</span>
            </span>
            {showAdvancedDirectives ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>

          {showAdvancedDirectives && (
            <div
              style={{
                marginTop: '8px',
                padding: '10px',
                background: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-xs)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {/* Custom Prompt Textarea */}
              <div>
                <label htmlFor="input-custom-prompt" style={{ display: 'block', fontSize: '0.675rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px' }}>
                  Custom Instructions &amp; Topics
                </label>
                <textarea
                  id="input-custom-prompt"
                  aria-label="Custom Instructions and Topics"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Focus on cardiology dosages or medical ethics..."
                  rows={2}
                  style={{ width: '100%', fontSize: '0.725rem', resize: 'vertical', borderRadius: 'var(--radius-xs)' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

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
