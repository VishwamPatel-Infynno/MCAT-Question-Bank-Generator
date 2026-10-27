import React, { useMemo } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Atom,
  Layers,
  BookOpen,
  Check,
  Compass
} from 'lucide-react';
import {
  getSubjectsForSection
} from '../../../constants';

export default function WizardStep1SectionFocus({
  selectedSection = 'chem_phys',
  onSelectSection,
  SECTION_METADATA = {},
  sectionMeta: _sectionMeta = {},
  pacing = {},
  selectedSubject = '',
  onSelectSubject,
  selectedUnit: _selectedUnit = '',
  onSelectUnit,
  selectedTopic = '',
  onSelectTopic,
  selectedSubtopic: _selectedSubtopic = '',
  onSelectSubtopic,
  selectedSubtopics = [],
  onToggleSubtopic,
  presets = [],
  onApplyPreset,
  totalQuestions = 50
}) {

  // Available subjects for the section
  const subjects = useMemo(() => {
    return getSubjectsForSection(selectedSection);
  }, [selectedSection]);

  const isAllDisciplines = !selectedSubject || selectedSubject === 'all';

  const activeSubject = useMemo(() => {
    if (isAllDisciplines) return null;
    return subjects.find((s) => s.id === selectedSubject) || null;
  }, [subjects, selectedSubject, isAllDisciplines]);

  // Gather available topics
  const availableTopics = useMemo(() => {
    if (activeSubject) {
      const res = [];
      (activeSubject.units || []).forEach((u) => {
        (u.topics || []).forEach((t) => {
          res.push({
            ...t,
            unitId: u.id,
            unitName: u.name,
            subjectId: activeSubject.id,
            subjectName: activeSubject.name
          });
        });
      });
      return res;
    }

    // When All Disciplines is selected, gather the primary high-yield topics across the section
    const res = [];
    subjects.forEach((s) => {
      (s.units || []).forEach((u, uIdx) => {
        if (uIdx < 2) {
          (u.topics || []).forEach((t, tIdx) => {
            if (tIdx < 2) {
              res.push({
                ...t,
                unitId: u.id,
                unitName: u.name,
                subjectId: s.id,
                subjectName: s.name
              });
            }
          });
        }
      });
    });
    return res;
  }, [subjects, activeSubject]);

  const isAllTopics = !selectedTopic || selectedTopic === 'all';

  const activeTopic = useMemo(() => {
    if (isAllTopics) return null;
    return availableTopics.find((t) => t.id === selectedTopic) || null;
  }, [availableTopics, selectedTopic, isAllTopics]);

  // Handlers
  const handleSelectAllDisciplines = () => {
    onSelectSubject?.('');
    onSelectUnit?.('');
    onSelectTopic?.('');
    onSelectSubtopic?.('All Core Topics (Balanced Mix)');
  };

  const handleSelectDiscipline = (subj) => {
    onSelectSubject?.(subj.id);
    onSelectUnit?.('');
    onSelectTopic?.('');
    onSelectSubtopic?.('All High-Yield Topics (Balanced Mix)');
  };

  const handleSelectAllTopics = () => {
    onSelectTopic?.('');
    onSelectUnit?.('');
    onSelectSubtopic?.(
      isAllDisciplines
        ? 'All Core Topics (Balanced Mix)'
        : `${activeSubject?.name || 'Discipline'} (All Topics)`
    );
  };

  const handleSelectTopic = (top) => {
    onSelectSubject?.(top.subjectId);
    onSelectUnit?.(top.unitId);
    onSelectTopic?.(top.id);
    onSelectSubtopic?.(`${top.name} (All Concepts)`);
    if (onToggleSubtopic) {
      onToggleSubtopic('All Core Topics (Balanced Mix)');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Step Header */}
      <div className="wizard-heading-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h2 className="wizard-step-title">Choose MCAT Section &amp; Study Focus</h2>
          <span className="badge-minimal" style={{ fontSize: '0.72rem' }}>
            ⏱️ {pacing.target || '~96s / Q'} Target Pacing &bull; Step 1 of 3
          </span>
        </div>
        <p className="wizard-step-subtitle">
          Pick your exam section, scientific subject, and topic focus. Click any card to select, or keep the recommended balanced defaults.
        </p>
      </div>

      {/* Quick Presets Row */}
      {presets && presets.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-surface-subtle)',
            border: '1px solid var(--border-light)',
            fontSize: '0.75rem'
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={12} color="var(--brand-primary)" />
            <span>Quick Presets:</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
            {presets.map((preset) => {
              const isMatch = selectedSection === preset.section && totalQuestions === preset.total;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onApplyPreset?.(preset)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: isMatch ? 'var(--brand-light)' : 'var(--bg-surface)',
                    border: isMatch ? '1px solid var(--border-brand)' : '1px solid var(--border-light)',
                    color: isMatch ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    fontWeight: isMatch ? 600 : 500,
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title={preset.desc}
                >
                  <span>{preset.label}</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.75 }}>({preset.tag})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Decision 1: Exam Section */}
      <div className="wizard-stacked-decision">
        <div className="wizard-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="wizard-decision-num">1</span>
            <span className="wizard-decision-title">Official Exam Section</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            4 AAMC Pillars
          </span>
        </div>

        <div className="wizard-sections-grid">
          {Object.values(SECTION_METADATA).map((sec) => {
            const Icon = sec.icon;
            const isSelected = selectedSection === sec.id;
            return (
              <div
                key={sec.id}
                className={`wizard-section-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectSection(sec.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectSection(sec.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
              >
                <div className="wizard-section-top">
                  <div
                    className="wizard-section-icon-badge"
                    style={{
                      background: isSelected ? 'var(--brand-primary)' : 'var(--bg-surface-hover)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)'
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isSelected && (
                      <CheckCircle2 size={15} style={{ color: 'var(--brand-primary)' }} />
                    )}
                    <span className="badge-minimal" style={{ fontSize: '0.68rem' }}>{sec.tag}</span>
                  </div>
                </div>

                <div className="wizard-section-name">{sec.label}</div>
                <div className="wizard-section-desc">{sec.desc}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="wizard-decision-connector" />

      {/* Decision 2: Scientific Subject */}
      <div className="wizard-stacked-decision">
        <div className="wizard-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="wizard-decision-num">2</span>
            <span className="wizard-decision-title">Scientific Subject</span>
          </div>
          <span className="badge-minimal" style={{ fontSize: '0.7rem' }}>
            AAMC Blueprint
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
          {/* Card 1: All Subjects (Balanced Mix - Default) */}
          <div
            className={`wizard-tier-card ${isAllDisciplines ? 'selected' : ''}`}
            onClick={handleSelectAllDisciplines}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectAllDisciplines();
              }
            }}
            role="button"
            tabIndex={0}
            style={{ padding: '12px 14px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Compass size={15} style={{ color: 'var(--brand-primary)' }} />
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  All Subjects (Balanced Mix)
                </span>
              </div>
              {isAllDisciplines && (
                <CheckCircle2 size={14} style={{ color: 'var(--brand-primary)' }} />
              )}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', fontWeight: 600, marginBottom: '2px' }}>
              ✨ Recommended Default &bull; Full Syllabus
            </div>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Balances questions evenly across all subjects on the official AAMC exam blueprint.
            </p>
          </div>

          {/* Cards 2+: Specific Subjects */}
          {subjects.map((subj) => {
            const isSelected = activeSubject?.id === subj.id;
            return (
              <div
                key={subj.id}
                className={`wizard-tier-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectDiscipline(subj)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectDiscipline(subj);
                  }
                }}
                role="button"
                tabIndex={0}
                style={{ padding: '12px 14px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Atom size={15} style={{ color: 'var(--brand-primary)' }} />
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {subj.name}
                    </span>
                  </div>
                  {isSelected && (
                    <CheckCircle2 size={14} style={{ color: 'var(--brand-primary)' }} />
                  )}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  {subj.units?.length || 0} Syllabus Units
                </div>
                <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  Focus questions specifically on {subj.name}.
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="wizard-decision-connector" />

      {/* Decision 3: High-Yield Topic & Concept Focus */}
      <div className="wizard-stacked-decision">
        <div className="wizard-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="wizard-decision-num">3</span>
            <span className="wizard-decision-title">Topic Focus</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            High-Yield Concepts
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
          {/* Card 1: All Topics (Balanced Mix - Default) */}
          <div
            className={`wizard-tier-card ${isAllTopics ? 'selected' : ''}`}
            onClick={handleSelectAllTopics}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleSelectAllTopics();
              }
            }}
            role="button"
            tabIndex={0}
            style={{ padding: '12px 14px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={15} style={{ color: 'var(--brand-primary)' }} />
                <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  All Topics (Balanced Mix)
                </span>
              </div>
              {isAllTopics && (
                <CheckCircle2 size={14} style={{ color: 'var(--brand-primary)' }} />
              )}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', fontWeight: 600, marginBottom: '2px' }}>
              ✨ Recommended Default &bull; Well-Rounded Practice
            </div>
            <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Covers all foundational concepts across the subject for comprehensive, fatigue-free practice.
            </p>
          </div>

          {/* Cards 2+: High-Yield Topic Cards */}
          {availableTopics.slice(0, 5).map((top) => {
            const isSelected = activeTopic?.id === top.id;
            return (
              <div
                key={top.id}
                className={`wizard-tier-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectTopic(top)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectTopic(top);
                  }
                }}
                role="button"
                tabIndex={0}
                style={{ padding: '12px 14px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={14} style={{ color: 'var(--brand-primary)' }} />
                    <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {top.name}
                    </span>
                  </div>
                  {isSelected && (
                    <CheckCircle2 size={14} style={{ color: 'var(--brand-primary)' }} />
                  )}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px' }}>
                  {top.subjectName ? `${top.subjectName} • ` : ''}{top.subtopics?.length || 0} Key Concepts
                </div>
                <p style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  Focus questions specifically around {top.name}.
                </p>
              </div>
            );
          })}
        </div>

        {/* Optional Subtopic Concept Chips if a specific topic is selected */}
        {!isAllTopics && activeTopic && activeTopic.subtopics && activeTopic.subtopics.length > 0 && (
          <div
            className="wizard-step-fade-enter"
            style={{
              marginTop: '12px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface-subtle)',
              border: '1px solid var(--border-light)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Select specific concepts within <em>{activeTopic.name}</em> (Optional):
              </span>
              <span className="badge-minimal" style={{ fontSize: '0.68rem' }}>
                {selectedSubtopics.length > 0 ? `${selectedSubtopics.length} Selected` : 'All Concepts in Topic'}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {/* Chip 0: All Concepts (Default) */}
              <button
                type="button"
                onClick={() => {
                  onSelectSubtopic?.(`${activeTopic.name} (All Concepts)`);
                  if (onToggleSubtopic) {
                    onToggleSubtopic('All Core Topics (Balanced Mix)');
                  }
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  background: (!selectedSubtopics || selectedSubtopics.length === 0) ? 'var(--brand-primary)' : 'var(--bg-surface)',
                  border: (!selectedSubtopics || selectedSubtopics.length === 0) ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                  color: (!selectedSubtopics || selectedSubtopics.length === 0) ? '#ffffff' : 'var(--text-secondary)',
                  fontSize: '0.72rem',
                  fontWeight: (!selectedSubtopics || selectedSubtopics.length === 0) ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease'
                }}
              >
                {(!selectedSubtopics || selectedSubtopics.length === 0) && <Check size={11} />}
                <span>✨ All Concepts in this Topic</span>
              </button>

              {/* Specific Subtopic Chips */}
              {activeTopic.subtopics.map((st) => {
                const isSelected = Boolean(selectedSubtopics?.includes(st));
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      if (onToggleSubtopic) {
                        onToggleSubtopic(st);
                      } else {
                        onSelectSubtopic?.(st);
                      }
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: isSelected ? 'var(--brand-primary)' : 'var(--bg-surface)',
                      border: isSelected ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                      color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                      fontSize: '0.72rem',
                      fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.12s ease'
                    }}
                  >
                    {isSelected && <Check size={11} />}
                    <span>{st}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
