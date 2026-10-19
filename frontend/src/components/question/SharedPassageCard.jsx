import React, { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon
} from 'lucide-react';
import VisualStimulusViewer from './VisualStimulusViewer';

/**
 * SharedPassageCard:
 * Unified, reusable reading passage container for both StagedBatchReview and QuestionBank.
 * Encapsulates:
 * - Header with BookOpen icon, title, word count badge, linked questions badge, and diagram badge.
 * - Collapsible toggle with expand/collapse states.
 * - High-legibility editorial serif passage typography.
 * - Embedded VisualStimulusViewer with fullscreen preview support.
 */
export default function SharedPassageCard({
  title,
  passageText = '',
  questionCount = 1,
  totalCount,
  isMixedBatch = false,
  diagramQuestion = null,
  collapsible = true,
  defaultCollapsed = false,
  style = {}
}) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  if (!passageText || !passageText.trim()) {
    return null;
  }

  const wordCount = passageText.trim().split(/\s+/).filter(Boolean).length;
  const effectiveTotal = totalCount || questionCount;

  // Determine if a diagram/image is present
  const hasDiagram = Boolean(
    diagramQuestion &&
    (diagramQuestion.image_url ||
     diagramQuestion.image_svg ||
     diagramQuestion.stage_outcomes?.visual_stimulus?.image_svg ||
     diagramQuestion.stage_outcomes?.passage_visual_stimulus?.image_svg)
  );

  const defaultTitle = isMixedBatch
    ? `Shared Reading Passage (Questions 1 to ${questionCount})`
    : 'Single Shared Reading Passage';

  const subtitle = isMixedBatch
    ? `Questions 1 to ${questionCount} evaluate comprehension directly from this stimulus. Questions ${questionCount + 1} to ${effectiveTotal} are independent direct questions (no passage).`
    : `All ${effectiveTotal} questions in this set evaluate comprehension, logic, or inference directly from this stimulus.`;

  return (
    <div
      className="glass-panel"
      style={{
        padding: '16px 20px',
        borderLeft: '4px solid var(--brand-primary)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: 'var(--bg-surface)',
        boxShadow: 'var(--shadow-sm)',
        ...style
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--brand-light)',
              color: 'var(--brand-primary)',
              flexShrink: 0
            }}
          >
            <BookOpen size={18} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '0.925rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {title || defaultTitle}
              </h3>
              <span className="badge badge-cyan" style={{ fontSize: '0.675rem', fontWeight: 600 }}>
                {wordCount} Words
              </span>
              {questionCount > 1 && (
                <span className="badge badge-indigo" style={{ fontSize: '0.675rem', fontWeight: 600 }}>
                  {questionCount} Linked Questions
                </span>
              )}
              {hasDiagram && (
                <span
                  className="badge badge-purple"
                  style={{
                    fontSize: '0.675rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px'
                  }}
                >
                  <ImageIcon size={10} /> Passage Diagram
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.725rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
              {subtitle}
            </p>
          </div>
        </div>

        {collapsible && (
          <button
            type="button"
            onClick={() => setIsCollapsed(prev => !prev)}
            className="btn-secondary"
            style={{ padding: '5px 12px', fontSize: '0.725rem', gap: '6px' }}
            title={isCollapsed ? 'Expand Passage' : 'Collapse Passage'}
          >
            {isCollapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            <span>{isCollapsed ? 'Show Full Passage' : 'Collapse Passage'}</span>
          </button>
        )}
      </div>

      {/* Collapsible Body */}
      {(!collapsible || !isCollapsed) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              padding: '14px 18px',
              background: 'var(--bg-surface-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-light)',
              maxHeight: '280px',
              overflowY: 'auto',
              fontFamily: 'var(--font-serif)',
              fontSize: '0.925rem',
              lineHeight: '1.7',
              color: 'var(--text-primary)',
              whiteSpace: 'pre-line'
            }}
          >
            {passageText}
          </div>

          {/* Embedded Visual Stimulus Diagram */}
          {hasDiagram && (
            <div
              style={{
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                border: '1px solid var(--border-light)'
              }}
            >
              <VisualStimulusViewer
                question={diagramQuestion}
                compact={false}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
