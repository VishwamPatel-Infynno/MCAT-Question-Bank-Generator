import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  FolderTree,
  Search,
  BookMarked,
  Sparkles,
  ChevronRight,
  Layers,
  GraduationCap
} from 'lucide-react';
import {
  getSubjectsForSection,
  SECTION_ID_TO_CODE
} from '../../../constants/mcat';

export default function WizardStep2Topic({
  selectedSection = 'chem_phys',
  sectionMeta,
  selectedSubject,
  onSelectSubject,
  selectedUnit,
  onSelectUnit,
  selectedTopic,
  onSelectTopic,
  selectedSubtopic,
  onSelectSubtopic,
  // Fallbacks for compatibility
  _availableSubtopics,
  setSelectedSubtopic
}) {
  const [searchQuery, setSearchQuery] = useState('');

  const secCode = SECTION_ID_TO_CODE[selectedSection] || 'CP';

  // Available subjects for the section
  const subjects = useMemo(() => {
    return getSubjectsForSection(selectedSection);
  }, [selectedSection]);

  const activeSubjectId = selectedSubject || subjects[0]?.id || '';
  const activeSubject = useMemo(() => {
    return subjects.find(s => s.id === activeSubjectId) || subjects[0] || null;
  }, [subjects, activeSubjectId]);

  // Available units for active subject
  const units = useMemo(() => {
    if (!activeSubject) return [];
    return activeSubject.units || [];
  }, [activeSubject]);

  const activeUnitId = selectedUnit || units[0]?.id || '';
  const activeUnit = useMemo(() => {
    return units.find(u => u.id === activeUnitId) || units[0] || null;
  }, [units, activeUnitId]);

  // Available topics for active unit
  const topics = useMemo(() => {
    if (!activeUnit) return [];
    return activeUnit.topics || [];
  }, [activeUnit]);

  const activeTopicId = selectedTopic || topics[0]?.id || '';
  const activeTopic = useMemo(() => {
    return topics.find(t => t.id === activeTopicId) || topics[0] || null;
  }, [topics, activeTopicId]);

  // Available subtopics for active topic
  const subtopics = useMemo(() => {
    if (!activeTopic) return [];
    return activeTopic.subtopics || [];
  }, [activeTopic]);

  const activeSubtopic = selectedSubtopic || subtopics[0] || '';

  // Synchronize initial cascading defaults
  useEffect(() => {
    if (subjects.length > 0 && (!selectedSubject || !subjects.some(s => s.id === selectedSubject))) {
      const defaultSubj = subjects[0];
      const defaultUnit = defaultSubj.units?.[0];
      const defaultTopic = defaultUnit?.topics?.[0];
      const defaultSubtopic = defaultTopic?.subtopics?.[0] || '';

      onSelectSubject?.(defaultSubj.id);
      onSelectUnit?.(defaultUnit?.id || '');
      onSelectTopic?.(defaultTopic?.id || '');
      (onSelectSubtopic || setSelectedSubtopic)?.(defaultSubtopic);
    }
  }, [subjects, selectedSubject, onSelectSubject, onSelectUnit, onSelectTopic, onSelectSubtopic, setSelectedSubtopic]);

  const handleSubjectChange = (subjId) => {
    const subj = subjects.find(s => s.id === subjId);
    const unit = subj?.units?.[0];
    const top = unit?.topics?.[0];
    const st = top?.subtopics?.[0] || '';

    onSelectSubject?.(subjId);
    onSelectUnit?.(unit?.id || '');
    onSelectTopic?.(top?.id || '');
    (onSelectSubtopic || setSelectedSubtopic)?.(st);
  };

  const handleUnitChange = (unitId) => {
    const unit = units.find(u => u.id === unitId);
    const top = unit?.topics?.[0];
    const st = top?.subtopics?.[0] || '';

    onSelectUnit?.(unitId);
    onSelectTopic?.(top?.id || '');
    (onSelectSubtopic || setSelectedSubtopic)?.(st);
  };

  const handleTopicChange = (topicId) => {
    const top = topics.find(t => t.id === topicId);
    const st = top?.subtopics?.[0] || '';

    onSelectTopic?.(topicId);
    (onSelectSubtopic || setSelectedSubtopic)?.(st);
  };

  const handleSubtopicChange = (subtopicName) => {
    (onSelectSubtopic || setSelectedSubtopic)?.(subtopicName);
  };

  // Global search across all subjects/units/topics/subtopics in current section
  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results = [];

    subjects.forEach(subj => {
      (subj.units || []).forEach(unit => {
        (unit.topics || []).forEach(top => {
          (top.subtopics || []).forEach(st => {
            if (
              st.toLowerCase().includes(q) ||
              top.name.toLowerCase().includes(q) ||
              unit.name.toLowerCase().includes(q) ||
              subj.name.toLowerCase().includes(q)
            ) {
              results.push({
                subject: subj,
                unit,
                topic: top,
                subtopic: st
              });
            }
          });
        });
      });
    });

    return results.slice(0, 15);
  }, [subjects, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Step Heading */}
      <div className="wizard-heading-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h2 className="wizard-step-title">Specify Curriculum & Learning Objective</h2>
          <span className="badge-minimal" style={{ borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)' }}>
            <FolderTree size={14} style={{ marginRight: '4px' }} />
            Official AAMC Content Outline
          </span>
        </div>
        <p className="wizard-step-subtitle">
          Explore the complete 7-tier MCAT syllabus hierarchy for <strong>{sectionMeta?.label || secCode}</strong>.
          Drill down by Subject, Unit, Topic, and specific Subtopic.
        </p>
      </div>

      {/* Interactive Breadcrumb Lineage Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px',
          padding: '10px 14px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-light)',
          fontSize: '0.8rem'
        }}
      >
        <span style={{ fontWeight: 700, color: 'var(--brand-primary)' }}>
          {sectionMeta?.shortCode || secCode}
        </span>
        <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
          {activeSubject?.name || 'Subject'}
        </span>
        <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>
          {activeUnit?.name || 'Unit'}
        </span>
        <ChevronRight size={13} style={{ color: 'var(--text-muted)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>
          {activeTopic?.name || 'Topic'}
        </span>
        <ChevronRight size={13} style={{ color: 'var(--brand-primary)' }} />
        <span style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>
          {activeSubtopic || 'Subtopic'}
        </span>
      </div>

      {/* Quick Search Autocomplete Filter */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-textarea"
            placeholder={`Search across all ${sectionMeta?.label || secCode} topics (e.g., Enzyme Kinetics, Equilibrium, Kinematics, Philosophy)...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: '34px',
              paddingTop: '8px',
              paddingBottom: '8px',
              height: '38px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem'
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.8rem'
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Search Results Dropdown */}
        {searchQuery && (
          <div
            style={{
              position: 'absolute',
              top: '44px',
              left: 0,
              right: 0,
              zIndex: 30,
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              maxHeight: '260px',
              overflowY: 'auto',
              padding: '6px'
            }}
          >
            {searchMatches.length === 0 ? (
              <div style={{ padding: '12px', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                No matching topics found for "{searchQuery}".
              </div>
            ) : (
              searchMatches.map((m, idx) => (
                <div
                  key={`${m.subject.id}-${m.unit.id}-${m.topic.id}-${m.subtopic || idx}`}
                  onClick={() => {
                    onSelectSubject?.(m.subject.id);
                    onSelectUnit?.(m.unit.id);
                    onSelectTopic?.(m.topic.id);
                    (onSelectSubtopic || setSelectedSubtopic)?.(m.subtopic);
                    setSearchQuery('');
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    borderBottom: '1px solid var(--border-subtle)',
                    transition: 'var(--transition-fast)'
                  }}
                  className="hover-bg-surface"
                >
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {m.subtopic}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {m.subject.name} &bull; {m.unit.name} &bull; {m.topic.name}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Tier 1: Subject Selection */}
      <div>
        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <GraduationCap size={15} style={{ color: 'var(--brand-primary)' }} />
          <span>1. Select Academic Subject:</span>
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {subjects.map((subj) => {
            const isSelected = activeSubject?.id === subj.id;
            return (
              <button
                key={subj.id}
                type="button"
                className={`hero-preset-chip ${isSelected ? 'active' : ''}`}
                style={{
                  background: isSelected ? 'var(--infynno-gradient)' : 'var(--bg-surface-elevated)',
                  color: isSelected ? '#ffffff' : 'var(--text-primary)',
                  borderColor: isSelected ? 'transparent' : 'var(--border-light)',
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: '0.82rem',
                  padding: '7px 14px'
                }}
                onClick={() => handleSubjectChange(subj.id)}
              >
                {isSelected && <CheckCircle2 size={13} style={{ marginRight: '4px' }} />}
                <span>{subj.name}</span>
                <span style={{
                  fontSize: '0.7rem',
                  opacity: 0.8,
                  marginLeft: '6px',
                  background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--bg-card)',
                  padding: '2px 6px',
                  borderRadius: '10px'
                }}>
                  {subj.units?.length || 0} units
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tier 2: Unit Selection */}
      {units.length > 0 && (
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={15} style={{ color: 'var(--brand-primary)' }} />
            <span>2. Select Unit within {activeSubject?.name}:</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
            {units.map((unit) => {
              const isSelected = activeUnit?.id === unit.id;
              return (
                <div
                  key={unit.id}
                  onClick={() => handleUnitChange(unit.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'rgba(56, 189, 248, 0.08)' : 'var(--bg-surface-elevated)',
                    border: isSelected ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookMarked size={14} style={{ color: isSelected ? 'var(--brand-primary)' : 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: isSelected ? 600 : 500, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                      {unit.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {unit.topics?.length || 0} topics
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tier 3: Topic Selection */}
      {topics.length > 0 && (
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
            3. Select Specific Topic:
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {topics.map((top) => {
              const isSelected = activeTopic?.id === top.id;
              return (
                <button
                  key={top.id}
                  type="button"
                  className="badge-minimal"
                  style={{
                    padding: '6px 12px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-surface-elevated)',
                    borderColor: isSelected ? 'var(--brand-primary)' : 'var(--border-light)',
                    color: isSelected ? 'var(--brand-primary)' : 'var(--text-secondary)',
                    fontWeight: isSelected ? 600 : 500
                  }}
                  onClick={() => handleTopicChange(top.id)}
                >
                  <span>{top.name}</span>
                  <span style={{ marginLeft: '4px', opacity: 0.7, fontSize: '0.72rem' }}>
                    ({top.subtopics?.length || 0})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tier 4: Granular Subtopic Objective */}
      {subtopics.length > 0 && (
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', display: 'block' }}>
            4. Targeted Learning Objective / Subtopic:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
            {subtopics.map((st) => {
              const isSelected = activeSubtopic === st;
              return (
                <div
                  key={st}
                  onClick={() => handleSubtopicChange(st)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'var(--infynno-gradient)' : 'var(--bg-surface-elevated)',
                    color: isSelected ? '#ffffff' : 'var(--text-primary)',
                    border: isSelected ? '1px solid transparent' : '1px solid var(--border-light)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.83rem',
                    fontWeight: isSelected ? 600 : 500,
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <CheckCircle2 size={15} style={{ opacity: isSelected ? 1 : 0.3, flexShrink: 0 }} />
                  <span>{st}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Objective Confirmation Card */}
      {activeSubtopic && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.85rem'
          }}
        >
          <Sparkles size={16} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Active Syllabus Target:</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{activeSubtopic}</strong>
            <span style={{ color: 'var(--text-secondary)', marginLeft: '6px' }}>
              ({activeSubject?.name} &bull; {activeTopic?.name})
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
