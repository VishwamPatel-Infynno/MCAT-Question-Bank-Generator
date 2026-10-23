import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  BookmarkCheck,
  Tag
} from 'lucide-react';
import {
  getSubjectsForSection
} from '../../../constants';

export default function WizardStep3TopicSubtopic({
  selectedSection = 'chem_phys',
  selectedSubject,
  selectedUnit,
  selectedTopic,
  onSelectTopic,
  selectedSubtopic,
  onSelectSubtopic
}) {
  const [topicSearch, setTopicSearch] = useState('');

  // Retrieve current subject and unit objects for breadcrumb
  const subjects = useMemo(() => getSubjectsForSection(selectedSection), [selectedSection]);
  const activeSubject = useMemo(() => subjects.find(s => s.id === selectedSubject) || subjects[0] || null, [subjects, selectedSubject]);

  const units = useMemo(() => {
    if (!activeSubject) return [];
    return activeSubject.units || [];
  }, [activeSubject]);
  const activeUnit = useMemo(() => units.find(u => u.id === selectedUnit) || units[0] || null, [units, selectedUnit]);

  // Available topics for active unit
  const topics = useMemo(() => {
    if (!activeUnit) return [];
    return activeUnit.topics || [];
  }, [activeUnit]);

  // Filtered topics by search query
  const filteredTopics = useMemo(() => {
    if (!topicSearch.trim()) return topics;
    const q = topicSearch.toLowerCase().trim();
    return topics.filter(t => t.name.toLowerCase().includes(q));
  }, [topics, topicSearch]);

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

  const handleTopicClick = (topId) => {
    const t = topics.find(item => item.id === topId);
    const firstSubtopic = t?.subtopics?.[0] || '';
    onSelectTopic?.(topId);
    onSelectSubtopic?.(firstSubtopic);
  };

  const handleSubtopicClick = (st) => {
    onSelectSubtopic?.(st);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="wizard-heading-group">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h2 className="wizard-step-title">Specify Core Topic & High-Yield Concept</h2>
          <span className="badge-minimal">
            {activeSubject?.name || 'Discipline'} &bull; {activeUnit?.name || 'Unit'}
          </span>
        </div>
        <p className="wizard-step-subtitle">
          Filter and select your primary topic area, then pick the exact target subtopic concept to focus the question generation.
        </p>
      </div>

      {/* Decision 1: Core Topic with Search */}
      <div className="wizard-stacked-decision">
        <div className="wizard-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="wizard-decision-num">1</span>
            <span className="wizard-decision-title">Core Topic Area</span>
          </div>
          <div style={{ position: 'relative', width: '220px' }}>
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)'
              }}
            />
            <input
              type="text"
              placeholder="Filter topics..."
              value={topicSearch}
              onChange={(e) => setTopicSearch(e.target.value)}
              className="input-field"
              style={{
                height: '30px',
                paddingLeft: '30px',
                fontSize: '0.75rem',
                width: '100%'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', maxHeight: '240px', overflowY: 'auto', padding: '2px' }}>
          {filteredTopics.map((top) => {
            const isSelected = activeTopic?.id === top.id;
            return (
              <div
                key={top.id}
                className={`wizard-tier-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleTopicClick(top.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTopicClick(top.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookmarkCheck size={15} style={{ color: isSelected ? 'var(--brand-primary)' : 'var(--text-muted)', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {top.name}
                  </span>
                </div>
                {isSelected && (
                  <CheckCircle2 size={15} style={{ color: 'var(--brand-primary)', flexShrink: 0 }} />
                )}
              </div>
            );
          })}
          {filteredTopics.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              No topic matching "{topicSearch}". Try clearing the search.
            </div>
          )}
        </div>
      </div>

      {/* Subtle connector */}
      <div className="wizard-decision-connector" />

      {/* Decision 2: Specific Subtopic Concept */}
      <div className="wizard-stacked-decision">
        <div className="wizard-decision-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="wizard-decision-num">2</span>
            <span className="wizard-decision-title">Target Subtopic Concept</span>
          </div>
          <span className="badge-minimal" style={{ fontSize: '0.72rem' }}>
            {subtopics.length} concepts
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {subtopics.map((st) => {
            const isSelected = activeSubtopic === st;
            return (
              <button
                key={st}
                type="button"
                onClick={() => handleSubtopicClick(st)}
                className={`pill-chip ${isSelected ? 'selected' : ''}`}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: isSelected ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                  background: isSelected ? 'rgba(79, 48, 185, 0.12)' : 'var(--bg-surface-elevated)',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {isSelected ? (
                  <CheckCircle2 size={13} style={{ color: 'var(--brand-primary)' }} />
                ) : (
                  <Tag size={12} style={{ color: 'var(--text-dim)' }} />
                )}
                <span>{st}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
