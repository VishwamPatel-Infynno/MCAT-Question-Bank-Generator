import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  ListChecks,
  BookOpen,
  Target,
  Layers,
  Plus,
  Minus
} from 'lucide-react';
import { SECTION_ICONS, PACING_INFO } from '../../constants/ucat';

export default function GeneratorPanel({
  sectionsData,
  selectedSection,
  setSelectedSection,
  selectedSubtopic,
  setSelectedSubtopic,
  difficulty,
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
  const [showAdvanced, setShowAdvanced] = useState(false);

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

  const currentSectionObj = sectionsData.find(s => s.id === selectedSection) || sectionsData[0];
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
          title="Expand Generator Panel"
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

        <div style={{ width: '100%', height: '1px', background: 'var(--border-light)' }} />

        {/* Difficulty Dot Indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface-elevated)',
            color: difficulty === 'easy' ? '#10b981' : difficulty === 'medium' ? '#f59e0b' : '#f43f5e',
            fontSize: '0.7rem',
            fontWeight: 700
          }}
          title={`Difficulty: ${difficulty}`}
        >
          {difficulty[0].toUpperCase()}
        </div>

        {/* Multi-choice indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '24px',
            borderRadius: 'var(--radius-sm)',
            background: interactionType === 'multi_choice' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface-elevated)',
            color: interactionType === 'multi_choice' ? '#818cf8' : 'var(--text-muted)',
            fontSize: '0.65rem',
            fontWeight: 700,
            border: interactionType === 'multi_choice' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent'
          }}
          title={interactionType === 'multi_choice' ? 'Mode: Multi-Choice' : 'Mode: Single Choice'}
        >
          {interactionType === 'multi_choice' ? 'MC' : '1x'}
        </div>

        {passageRequired === 'Yes' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '24px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              fontSize: '0.65rem',
              fontWeight: 700,
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}
            title="Passage Format: Long Reading Passage"
          >
            DOC
          </div>
        )}

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
              background: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
              fontSize: '0.65rem',
              fontWeight: 800,
              border: '1px solid rgba(168, 85, 247, 0.3)'
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

  // Render Expanded Studio Parameter Panel
  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      {/* Dock Title & Collapse Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Question Setup
          </h2>
          <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
            Choose subtest, quantity, and question formats
          </p>
        </div>

        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            title="Collapse dock to maximize review space"
          >
            <PanelLeftClose size={14} />
          </button>
        )}
      </div>

      {/* Subtests Segmented List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          UCAT Subtest
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: isSelected ? 'var(--bg-surface-hover)' : 'transparent',
                  border: isSelected ? '1px solid var(--border-medium)' : '1px solid transparent',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div
                  style={{
                    color: isSelected ? 'var(--brand-primary)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Icon size={15} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: isSelected ? 600 : 500, flex: 1 }}>
                  {sec.label}
                </span>
                {isSelected && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--brand-primary)'
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pacing Advice Hint */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          background: 'var(--bg-surface-subtle)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.725rem',
          color: 'var(--text-muted)'
        }}
      >
        <span>Pacing: <strong style={{ color: 'var(--text-secondary)' }}>{pacing.target}</strong></span>
        <span>{pacing.desc}</span>
      </div>

      {/* Difficulty Level 3-Way Segmented Control */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Difficulty
          </label>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
            {difficulty} Level
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '3px',
            background: 'var(--bg-surface-subtle)',
            padding: '3px',
            borderRadius: 'var(--radius-md)',
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
                  gap: '6px',
                  padding: '7px 4px',
                  borderRadius: 'var(--radius-sm)',
                  background: isSel ? 'var(--bg-surface-elevated)' : 'transparent',
                  border: isSel ? '1px solid var(--border-medium)' : '1px solid transparent',
                  color: isSel ? 'var(--text-primary)' : 'var(--text-muted)',
                  fontSize: '0.775rem',
                  fontWeight: isSel ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: opt.color
                  }}
                />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Question Batch Quantity Stepper & Quick Chips */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Layers size={13} color="var(--brand-primary)" />
            <span>Number of Questions to Generate</span>
          </label>
          <span
            style={{
              fontSize: '0.675rem',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              background: totalQuestions > 1 ? 'rgba(168, 85, 247, 0.15)' : 'var(--bg-surface-elevated)',
              color: totalQuestions > 1 ? '#c084fc' : 'var(--text-muted)'
            }}
          >
            {totalQuestions > 1 ? `${totalQuestions} Questions` : '1 Question'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Stepper */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
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
                width: '30px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                color: totalQuestions <= 1 ? 'var(--text-disabled)' : 'var(--text-primary)',
                cursor: totalQuestions <= 1 ? 'not-allowed' : 'pointer',
                borderRadius: 'var(--radius-sm)'
              }}
              title="Decrease questions"
            >
              <Minus size={13} />
            </button>
            <div
              style={{
                flex: 1,
                textAlign: 'center',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-primary)'
              }}
            >
              {totalQuestions}
            </div>
            <button
              type="button"
              id="btn-qty-plus"
              onClick={() => handleTotalChange(totalQuestions + 1)}
              disabled={totalQuestions >= 10}
              style={{
                width: '30px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                color: totalQuestions >= 10 ? 'var(--text-disabled)' : 'var(--text-primary)',
                cursor: totalQuestions >= 10 ? 'not-allowed' : 'pointer',
                borderRadius: 'var(--radius-sm)'
              }}
              title="Increase questions"
            >
              <Plus size={13} />
            </button>
          </div>

          {/* Quick Selection Chips */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 3, 5, 10].map(cnt => (
              <button
                key={cnt}
                type="button"
                id={`btn-chip-qty-${cnt}`}
                onClick={() => handleTotalChange(cnt)}
                style={{
                  padding: '5px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.725rem',
                  fontWeight: totalQuestions === cnt ? 700 : 500,
                  background: totalQuestions === cnt ? 'var(--brand-primary)' : 'var(--bg-surface-subtle)',
                  color: totalQuestions === cnt ? '#ffffff' : 'var(--text-muted)',
                  border: totalQuestions === cnt ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                {cnt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Batch Format Allocation Matrix (When totalQuestions > 1) */}
      {totalQuestions > 1 ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            padding: '12px',
            background: 'var(--bg-surface-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Question Types in this Batch
            </span>
            <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
              Total: {totalQuestions} Questions
            </span>
          </div>

          {/* Answer Mode Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ListChecks size={12} color="var(--brand-primary)" />
              <span>Answer Type</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {/* Single Choice Sub-counter */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>Single Answer</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    id="btn-single-count-minus"
                    onClick={() => handleSingleCountChange(singleChoiceCount - 1)}
                    disabled={singleChoiceCount <= 0}
                    style={{ width: '18px', height: '18px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <Minus size={10} />
                  </button>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '14px', textAlign: 'center' }}>
                    {singleChoiceCount}
                  </span>
                  <button
                    type="button"
                    id="btn-single-count-plus"
                    onClick={() => handleSingleCountChange(singleChoiceCount + 1)}
                    disabled={singleChoiceCount >= totalQuestions}
                    style={{ width: '18px', height: '18px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>

              {/* Multi Choice Sub-counter */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>Multiple Answers</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    id="btn-multi-count-minus"
                    onClick={() => handleMultiCountChange(multiChoiceCount - 1)}
                    disabled={multiChoiceCount <= 0}
                    style={{ width: '18px', height: '18px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <Minus size={10} />
                  </button>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '14px', textAlign: 'center', color: multiChoiceCount > 0 ? '#818cf8' : 'var(--text-primary)' }}>
                    {multiChoiceCount}
                  </span>
                  <button
                    type="button"
                    id="btn-multi-count-plus"
                    onClick={() => handleMultiCountChange(multiChoiceCount + 1)}
                    disabled={multiChoiceCount >= totalQuestions}
                    style={{ width: '18px', height: '18px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Passage Stimulus Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BookOpen size={12} color="var(--brand-primary)" />
              <span>Passage Length</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {/* Passage Sub-counter */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>Reading Passage (~350w)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    id="btn-passage-count-minus"
                    onClick={() => handlePassageCountChange(passageCount - 1)}
                    disabled={passageCount <= 0}
                    style={{ width: '18px', height: '18px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <Minus size={10} />
                  </button>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, minWidth: '14px', textAlign: 'center', color: passageCount > 0 ? '#38bdf8' : 'var(--text-primary)' }}>
                    {passageCount}
                  </span>
                  <button
                    type="button"
                    id="btn-passage-count-plus"
                    onClick={() => handlePassageCountChange(passageCount + 1)}
                    disabled={passageCount >= totalQuestions}
                    style={{ width: '18px', height: '18px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    <Plus size={10} />
                  </button>
                </div>
              </div>

              {/* Standard Vignette (Derived) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '5px 8px',
                  background: 'var(--bg-surface-elevated)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-light)'
                }}
              >
                <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>Short Scenario</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, paddingRight: '6px', color: 'var(--text-muted)' }}>
                  {totalQuestions - passageCount}
                </span>
              </div>
            </div>
          </div>

          {/* Allocation Summary Tag */}
          <div
            style={{
              padding: '6px 8px',
              background: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.675rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>Questions To Create:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {singleChoiceCount} Single • {multiChoiceCount} Multi • {passageCount} With Passage
            </span>
          </div>
        </div>
      ) : (
        <>
          {/* Answer Mode (Single Choice vs Multi-Choice) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ListChecks size={13} color="var(--brand-primary)" />
                <span>Answer Type</span>
              </label>
              <span
                style={{
                  fontSize: '0.675rem',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  background: interactionType === 'multi_choice' ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface-elevated)',
                  color: interactionType === 'multi_choice' ? '#818cf8' : 'var(--text-muted)'
                }}
              >
                {interactionType === 'multi_choice' ? 'Multiple Answers' : 'Single Answer'}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '3px',
                background: 'var(--bg-surface-subtle)',
                padding: '3px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)'
              }}
            >
              {[
                { id: 'single_choice', label: 'Single Answer', desc: '1 choice' },
                { id: 'multi_choice', label: 'Multiple Answers', desc: 'Select all that apply' }
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
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '7px 6px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSel ? 'var(--bg-surface-elevated)' : 'transparent',
                      border: isSel ? '1px solid var(--border-medium)' : '1px solid transparent',
                      color: isSel ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: isSel ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Passage Format (Short Scenario vs Long Reading Passage) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <BookOpen size={13} color="var(--brand-primary)" />
                <span>Passage Length</span>
              </label>
              <span
                style={{
                  fontSize: '0.675rem',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: 'var(--radius-sm)',
                  background: passageRequired === 'Yes' ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-surface-elevated)',
                  color: passageRequired === 'Yes' ? '#38bdf8' : 'var(--text-muted)'
                }}
              >
                {passageRequired === 'Yes' ? 'Reading Passage (~350w)' : 'Short Scenario'}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '3px',
                background: 'var(--bg-surface-subtle)',
                padding: '3px',
                borderRadius: 'var(--radius-md)',
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
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '7px 6px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSel ? 'var(--bg-surface-elevated)' : 'transparent',
                      border: isSel ? '1px solid var(--border-medium)' : '1px solid transparent',
                      color: isSel ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: isSel ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Question Trick / Common Trap Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Target size={13} color="var(--brand-primary)" />
            <span>Question Trick / Common Trap</span>
          </label>
        </div>

        <select
          id="select-primary-trap"
          value={primaryTrap}
          onChange={(e) => setPrimaryTrap && setPrimaryTrap(e.target.value)}
          style={{
            width: '100%',
            fontSize: '0.775rem',
            padding: '7px 10px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-light)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          <option value="Automatic">Automatic (AI selects best realistic traps)</option>
          <option value="Keyword_Trap">Matching Words Trap (similar words with opposite meaning)</option>
          <option value="Partial_Match">Incomplete Information (partial answer or missing step)</option>
          <option value="Extreme_Language">Extreme Words (always, never, only, definitely)</option>
          <option value="Correlation_vs_Causation">Assuming Cause from Link (correlation vs causation)</option>
          <option value="Scope_Shift">Out-of-Scope Conclusion (drawing conclusions beyond facts)</option>
          <option value="Half_Truth">True Fact but Irrelevant (distractor doesn't answer question)</option>
        </select>
      </div>

      {/* Optional Directives & Diagrams Accordion */}
      <div>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{ width: '100%', justifyContent: 'space-between', padding: '8px 12px' }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={13} color="var(--brand-primary)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Optional Directives &amp; Diagrams</span>
          </span>
          {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showAdvanced && (
          <div
            style={{
              marginTop: '8px',
              padding: '12px',
              background: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {/* Subtopic */}
            <div>
              <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Subcategory Focus
              </label>
              <select
                id="select-subtopic"
                value={selectedSubtopic}
                onChange={(e) => setSelectedSubtopic(e.target.value)}
                style={{ width: '100%', fontSize: '0.8rem' }}
              >
                {subtopics.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Visual Stimulus Toggle */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)'
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Include Diagram / Chart
                </div>
                <div style={{ fontSize: '0.675rem', color: 'var(--text-muted)' }}>
                  Add visual illustration with question
                </div>
              </div>

              <label style={{ position: 'relative', display: 'inline-block', width: '34px', height: '18px', cursor: 'pointer' }}>
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
                      height: '12px',
                      width: '12px',
                      left: (requireImage || selectedSection === 'abstract_reasoning') ? '17px' : '3px',
                      bottom: '2px',
                      backgroundColor: '#ffffff',
                      borderRadius: '50%',
                      transition: '0.2s'
                    }}
                  />
                </span>
              </label>
            </div>

            {/* Custom Instructions Textarea */}
            <div>
              <label style={{ display: 'block', fontSize: '0.725rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Custom Instructions / Topic Focus
              </label>
              <textarea
                id="input-custom-prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Focus on medical ethics, data interpretation, or emergency situations..."
                rows={2}
                style={{ width: '100%', fontSize: '0.775rem', resize: 'vertical' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Primary Generate Action / Cancel Action */}
      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
        <button
          id="btn-generate-main"
          onClick={onGenerate}
          disabled={isGenerating}
          className="btn-primary"
          style={{ flex: 1, padding: '10px 16px' }}
        >
          <Sparkles size={15} />
          <span>
            {isGenerating
              ? (totalQuestions > 1 ? `Creating ${totalQuestions} Questions...` : 'Creating Question...')
              : (totalQuestions > 1 ? `Generate ${totalQuestions} Questions` : 'Generate Question')}
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
  );
}
