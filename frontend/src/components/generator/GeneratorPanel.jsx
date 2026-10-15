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
  Compass
} from 'lucide-react';
import { SECTION_ICONS, PACING_INFO } from '../../constants/ucat';

export default function GeneratorPanel({
  sectionsData = [],
  selectedSection = 'verbal_reasoning',
  setSelectedSection,
  selectedSubtopic = '',
  setSelectedSubtopic,
  difficulty = 'medium',
  setDifficulty,
  totalQuestions = 1,
  setTotalQuestions,
  singleChoiceCount = 1,
  setSingleChoiceCount,
  multiChoiceCount = 0,
  setMultiChoiceCount,
  passageCount = 0,
  setPassageCount,
  interactionType = 'single_choice',
  setInteractionType,
  passageRequired = 'No',
  setPassageRequired,
  primaryTrap = 'Automatic',
  setPrimaryTrap,
  requireImage,
  setRequireImage,
  customPrompt,
  setCustomPrompt,
  onGenerate,
  onCancel,
  isGenerating,
  isCollapsed,
  onToggleCollapse
}) {
  const [showAdvancedDirectives, setShowAdvancedDirectives] = useState(false);

  const handleTotalChange = (newTotal) => {
    const clamped = Math.max(1, Math.min(10, newTotal));
    if (setTotalQuestions) setTotalQuestions(clamped);
    if (setSingleChoiceCount && setMultiChoiceCount) {
      if (clamped === 1) {
        setSingleChoiceCount(interactionType === 'multi_choice' ? 0 : 1);
        setMultiChoiceCount(interactionType === 'multi_choice' ? 1 : 0);
        if (setPassageCount) setPassageCount(passageRequired === 'Yes' ? 1 : 0);
      } else {
        const curMulti = Math.min(multiChoiceCount, clamped);
        setMultiChoiceCount(curMulti);
        setSingleChoiceCount(clamped - curMulti);
        if (setPassageCount && passageCount > clamped) {
          setPassageCount(clamped);
        }
      }
    }
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
        className="glass-panel"
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

  // Render Full 3-Stage Progressive Studio Dock
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Studio Top Header */}
      <div
        className="glass-panel"
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderRadius: 'var(--radius-md)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--brand-light)',
              color: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Compass size={15} />
          </div>
          <div>
            <h2 style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Question Setup Studio
            </h2>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
              3-Stage Guided Workflow
            </p>
          </div>
        </div>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="btn-secondary"
            style={{ padding: '5px 8px', fontSize: '0.75rem', border: 'none' }}
            title="Collapse dock to maximize review space"
          >
            <PanelLeftClose size={15} />
          </button>
        )}
      </div>

      {/* STAGE 1: SUBTEST & TOPIC FOCUS */}
      <div className="stage-card stage-card-active">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="stage-badge">1</span>
            <div>
              <h3 style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Subtest &amp; Topic Focus
              </h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                Select UCAT section and subcategory
              </p>
            </div>
          </div>
          <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
            {pacing.target || '~28s / Q'}
          </span>
        </div>

        {/* Subtest Selection Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {sectionsData.map(sec => {
            const Icon = SECTION_ICONS[sec.id] || FileText;
            const isSelected = selectedSection === sec.id;
            return (
              <button
                key={sec.id}
                id={`section-btn-${sec.id}`}
                onClick={() => {
                  setSelectedSection(sec.id);
                  if (sec.subtopics && sec.subtopics.length > 0) {
                    setSelectedSubtopic(sec.subtopics[0]);
                  }
                  if (sec.id === 'abstract_reasoning') {
                    setRequireImage(true);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'var(--brand-light)' : 'var(--bg-surface-subtle)',
                  border: isSelected ? '1px solid var(--border-brand)' : '1px solid var(--border-light)',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div style={{ color: isSelected ? 'var(--brand-primary)' : 'var(--text-muted)', display: 'flex' }}>
                  <Icon size={14} />
                </div>
                <span style={{ fontSize: '0.775rem', fontWeight: isSelected ? 700 : 500, flex: 1 }}>
                  {sec.label}
                </span>
                {isSelected && (
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand-primary)' }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Subtopic Focus Dropdown */}
        {subtopics.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Subtopic Focus
            </label>
            <select
              id="select-subtopic"
              value={selectedSubtopic}
              onChange={(e) => setSelectedSubtopic(e.target.value)}
              style={{
                width: '100%',
                fontSize: '0.775rem',
                padding: '6px 8px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--bg-surface-subtle)',
                border: '1px solid var(--border-light)',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              {subtopics.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        )}

        {/* Difficulty Segmented Chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Exam Rigor / Difficulty
          </label>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '4px',
              background: 'var(--bg-surface-subtle)',
              padding: '3px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)'
            }}
          >
            {[
              { id: 'easy', label: 'Easy', color: '#10b981' },
              { id: 'medium', label: 'Medium', color: '#f59e0b' },
              { id: 'hard', label: 'Hard', color: '#f43f5e' }
            ].map(opt => {
              const isSel = difficulty === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  id={`btn-diff-${opt.id}`}
                  onClick={() => setDifficulty(opt.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    padding: '5px 4px',
                    borderRadius: 'var(--radius-xs)',
                    border: 'none',
                    background: isSel ? 'var(--bg-surface-elevated)' : 'transparent',
                    color: isSel ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: '0.725rem',
                    fontWeight: isSel ? 700 : 500,
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: opt.color }} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* STAGE 2: FORMATS & QUANTITY */}
      <div className="stage-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="stage-badge">2</span>
            <div>
              <h3 style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Formats &amp; Quantity
              </h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                Set questions count and mix
              </p>
            </div>
          </div>
          <span
            className={`badge ${totalQuestions > 1 ? 'badge-purple' : 'badge-neutral'}`}
            style={{ fontSize: '0.65rem' }}
          >
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
              borderRadius: 'var(--radius-sm)',
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
                width: '28px',
                height: '26px',
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
              <Minus size={12} />
            </button>
            <div style={{ flex: 1, textAlign: 'center', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {totalQuestions}
            </div>
            <button
              type="button"
              id="btn-qty-plus"
              onClick={() => handleTotalChange(totalQuestions + 1)}
              disabled={totalQuestions >= 10}
              style={{
                width: '28px',
                height: '26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                color: totalQuestions >= 10 ? 'var(--text-disabled)' : 'var(--text-primary)',
                cursor: totalQuestions >= 10 ? 'not-allowed' : 'pointer'
              }}
              title="Increase questions"
            >
              <Plus size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 3, 5, 10].map(cnt => (
              <button
                key={cnt}
                type="button"
                id={`btn-chip-qty-${cnt}`}
                onClick={() => handleTotalChange(cnt)}
                style={{
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-xs)',
                  fontSize: '0.725rem',
                  fontWeight: totalQuestions === cnt ? 700 : 500,
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Answer Mode Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.675rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Answer Type Split
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
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Single</span>
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
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Multiple</span>
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

            {/* Stimulus Length Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.675rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Passage Length Split
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

                {/* Short Scenario (Derived) */}
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
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Short Scenario</span>
                  <span style={{ fontSize: '0.725rem', fontWeight: 700, paddingRight: '4px', color: 'var(--text-muted)' }}>
                    {totalQuestions - passageCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Target Breakdown Summary Tag */}
            <div
              style={{
                padding: '6px 8px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.675rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <span>Mix:</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {singleChoiceCount} Single • {multiChoiceCount} Multi • {passageCount} Reading Passage
              </span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Answer Type Switch for 1 question */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.675rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Answer Type
              </span>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '3px',
                  background: 'var(--bg-surface-subtle)',
                  padding: '3px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-light)'
                }}
              >
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
                      style={{
                        padding: '6px',
                        borderRadius: 'var(--radius-xs)',
                        border: 'none',
                        background: isSel ? 'var(--bg-surface-elevated)' : 'transparent',
                        color: isSel ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: '0.725rem',
                        fontWeight: isSel ? 700 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Passage Length Switch for 1 question */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.675rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Passage Length
              </span>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '3px',
                  background: 'var(--bg-surface-subtle)',
                  padding: '3px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-light)'
                }}
              >
                {[
                  { id: 'No', label: 'Short Scenario' },
                  { id: 'Yes', label: 'Reading Passage (~350w)' }
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
                      }}
                      style={{
                        padding: '6px',
                        borderRadius: 'var(--radius-xs)',
                        border: 'none',
                        background: isSel ? 'var(--bg-surface-elevated)' : 'transparent',
                        color: isSel ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: '0.725rem',
                        fontWeight: isSel ? 700 : 500,
                        cursor: 'pointer'
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STAGE 3: TRAPS & CUSTOM FOCUS */}
      <div className="stage-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="stage-badge">3</span>
            <div>
              <h3 style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Traps &amp; Directives
              </h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>
                Common traps and custom prompt
              </p>
            </div>
          </div>
          <Target size={14} color="var(--brand-primary)" />
        </div>

        {/* Question Trick Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Question Trick / Common Trap
          </label>
          <select
            id="select-primary-trap"
            value={primaryTrap}
            onChange={(e) => setPrimaryTrap && setPrimaryTrap(e.target.value)}
            style={{
              width: '100%',
              fontSize: '0.75rem',
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            <option value="Automatic">Automatic (AI selects best realistic traps)</option>
            <option value="Keyword_Trap">Matching Words Trap (similar words with opposite meaning)</option>
            <option value="Partial_Match">Incomplete Information (missing computation or step)</option>
            <option value="Extreme_Language">Extreme Words (always, never, only, definitely)</option>
            <option value="Correlation_vs_Causation">Assuming Cause from Link (correlation vs causation)</option>
            <option value="Scope_Shift">Out-of-Scope Conclusion (drawing conclusions beyond facts)</option>
            <option value="Half_Truth">True Fact but Irrelevant (distractor doesn't answer question)</option>
          </select>
        </div>

        {/* Advanced Accordion (Diagram & Custom Directives) */}
        <div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowAdvancedDirectives(!showAdvancedDirectives)}
            style={{ width: '100%', justifyContent: 'space-between', padding: '6px 10px', fontSize: '0.725rem' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <SlidersHorizontal size={12} color="var(--brand-primary)" />
              <span>Optional Diagram &amp; Custom Directives</span>
            </span>
            {showAdvancedDirectives ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showAdvancedDirectives && (
            <div
              style={{
                marginTop: '8px',
                padding: '10px',
                background: 'var(--bg-surface-subtle)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {/* Visual Diagram Switch */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Include Diagram / Chart
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    Add visual chart or illustration
                  </div>
                </div>

                <label style={{ position: 'relative', display: 'inline-block', width: '30px', height: '16px', cursor: 'pointer' }}>
                  <input
                    id="toggle-require-image"
                    type="checkbox"
                    checked={requireImage || selectedSection === 'abstract_reasoning'}
                    onChange={(e) => setRequireImage(e.target.checked)}
                    disabled={selectedSection === 'abstract_reasoning'}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: (requireImage || selectedSection === 'abstract_reasoning') ? 'var(--brand-primary)' : 'var(--bg-surface-hover)',
                      borderRadius: '34px',
                      transition: '0.2s',
                      border: '1px solid var(--border-medium)'
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        height: '10px',
                        width: '10px',
                        left: (requireImage || selectedSection === 'abstract_reasoning') ? '15px' : '3px',
                        bottom: '2px',
                        backgroundColor: '#ffffff',
                        borderRadius: '50%',
                        transition: '0.2s'
                      }}
                    />
                  </span>
                </label>
              </div>

              {/* Custom Prompt Textarea */}
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                  Custom Topic Focus / Instructions
                </label>
                <textarea
                  id="input-custom-prompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Focus on cardiology dosages, medical ethics, or pediatric emergencies..."
                  rows={2}
                  style={{ width: '100%', fontSize: '0.75rem', resize: 'vertical' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STICKY BOTTOM GENERATE BAR */}
      <div
        className="glass-panel"
        style={{
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Configured:</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            {totalQuestions} {totalQuestions === 1 ? 'Question' : 'Questions'} • {currentSectionObj.label}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            id="btn-generate-main"
            onClick={onGenerate}
            disabled={isGenerating}
            className="btn-primary"
            style={{
              flex: 1,
              padding: '10px 16px',
              fontWeight: 700,
              fontSize: '0.825rem',
              boxShadow: '0 0 20px rgba(2, 132, 199, 0.35)'
            }}
          >
            <Sparkles size={15} />
            <span>
              {isGenerating
                ? (totalQuestions > 1 ? `Creating ${totalQuestions} Questions...` : 'Creating Question...')
                : (totalQuestions > 1 ? `Create ${totalQuestions} Questions` : 'Create Question')}
            </span>
            {!isGenerating && (
              <span className="kbd-hint" style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.2)', color: '#ffffff', border: 'none' }}>
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
              style={{ padding: '10px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap', gap: '6px' }}
              title="Stop and abort question generation"
            >
              <X size={14} />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
