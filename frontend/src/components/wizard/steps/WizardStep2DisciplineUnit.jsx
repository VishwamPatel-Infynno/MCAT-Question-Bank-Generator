import React, { useMemo } from 'react';
import {
  BookOpen,
  Layers,
  CheckCircle2,
  ChevronRight,
  Atom
} from 'lucide-react';
import {
  getSubjectsForSection,
  SECTION_ID_TO_CODE
} from '../../../constants/mcat';

export default function WizardStep2DisciplineUnit({
  selectedSection = 'chem_phys',
  sectionMeta,
  selectedSubject,
  onSelectSubject,
  selectedUnit,
  onSelectUnit,
  onSelectTopic,
  onSelectSubtopic
}) {
  const secCode = SECTION_ID_TO_CODE[selectedSection] || 'CP';

  // Available subjects for the section
  const subjects = useMemo(() => {
    return getSubjectsForSection(selectedSection);
  }, [selectedSection]);

  const activeSubjectId = selectedSubject || subjects[0]?.id || '';
  const activeSubject = useMemo(() => {
    return subjects.find((s) => s.id === activeSubjectId) || subjects[0] || null;
  }, [subjects, activeSubjectId]);

  // Available units for active subject
  const units = useMemo(() => {
    if (!activeSubject) return [];
    return activeSubject.units || [];
  }, [activeSubject]);

  const activeUnitId = selectedUnit || units[0]?.id || '';

  const handleSubjectClick = (subjId) => {
    const subj = subjects.find((s) => s.id === subjId);
    const firstUnit = subj?.units?.[0];
    const firstTopic = firstUnit?.topics?.[0];
    const firstSubtopic = firstTopic?.subtopics?.[0] || '';

    onSelectSubject?.(subjId);
    onSelectUnit?.(firstUnit?.id || '');
    onSelectTopic?.(firstTopic?.id || '');
    onSelectSubtopic?.(firstSubtopic);
  };

  const handleUnitClick = (unitId) => {
    const u = units.find((un) => un.id === unitId);
    const firstTopic = u?.topics?.[0];
    const firstSubtopic = firstTopic?.subtopics?.[0] || '';

    onSelectUnit?.(unitId);
    onSelectTopic?.(firstTopic?.id || '');
    onSelectSubtopic?.(firstSubtopic);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="wizard-heading-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h2 className="wizard-step-title">Select Discipline & Major Syllabus Unit</h2>
          <span className="badge-minimal" style={{ borderColor: sectionMeta?.color }}>
            {secCode} - {sectionMeta?.label}
          </span>
        </div>
        <p className="wizard-step-subtitle">
          Choose the primary scientific discipline and foundational unit. Specific topics and concepts will be selected in the next step.
        </p>
      </div>

      {/* Decision 1: Scientific Discipline / Subject */}
      <div className="wizard-stacked-decision">
        <div className="wizard-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="wizard-decision-num">1</span>
            <span className="wizard-decision-title">Scientific Discipline</span>
          </div>
          <span className="wizard-decision-tag">Step 2A</span>
        </div>

        <div className="wizard-subject-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {subjects.map((subj) => {
            const isSelected = activeSubject?.id === subj.id;
            return (
              <div
                key={subj.id}
                className={`wizard-tier-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSubjectClick(subj.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSubjectClick(subj.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: isSelected ? 'var(--infynno-gradient)' : 'rgba(79, 48, 185, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isSelected ? '#ffffff' : 'var(--brand-primary)',
                      flexShrink: 0
                    }}
                  >
                    <Atom size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {subj.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {subj.units?.length || 0} Syllabus Units
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle2 size={16} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Subtle connector */}
      <div className="wizard-decision-connector" />

      {/* Decision 2: Major Syllabus Unit */}
      <div className="wizard-stacked-decision">
        <div className="wizard-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="wizard-decision-num">2</span>
            <span className="wizard-decision-title">Major Syllabus Unit</span>
          </div>
          <span className="wizard-decision-tag">Step 2B</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          {units.map((unit) => {
            const isSelected = activeUnitId === unit.id;
            const topicCount = unit.topics?.length || 0;
            return (
              <div
                key={unit.id}
                className={`wizard-tier-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleUnitClick(unit.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleUnitClick(unit.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                style={{ padding: '14px 16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: isSelected ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    {unit.name}
                  </div>
                  {isSelected ? (
                    <CheckCircle2 size={15} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                  ) : (
                    <ChevronRight size={14} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                  )}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  {topicCount} {topicCount === 1 ? 'Topic Area' : 'Topic Areas'} available for testing
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
