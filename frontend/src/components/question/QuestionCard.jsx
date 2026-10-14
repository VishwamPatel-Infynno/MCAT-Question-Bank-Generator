import React, { useState } from 'react';
import { 
  CheckCircle, 
  Award, 
  Eye, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Clock, 
  Trash2,
  Check
} from 'lucide-react';
import StageJsonInspector from './StageJsonInspector';

export default function QuestionCard({ 
  question, 
  isSaved = false, 
  onApprove, 
  onDiscard, 
  onOpenAudit, 
  onNextQuestion 
}) {
  const [showExplanation, setShowExplanation] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  if (!question) return null;

  const handleApproveClick = async () => {
    if (!onApprove || isApproving) return;
    setIsApproving(true);
    try {
      await onApprove(question);
    } finally {
      setIsApproving(false);
    }
  };

  const handleCopyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Admin Review Header Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-light)'
      }}>
        {/* Status Pill & Metadata Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {isSaved ? (
            <span
              className="badge badge-emerald"
              style={{ padding: '6px 14px', fontWeight: 800, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckCircle size={14} /> Saved in Question Bank
            </span>
          ) : (
            <span
              className="badge badge-amber"
              style={{ padding: '6px 14px', fontWeight: 800, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <Clock size={14} /> Candidate Staged for Review
            </span>
          )}

          <span className="badge badge-cyan">{question.section_label || question.section}</span>
          <span
            className={`badge ${(question.difficulty || '').toLowerCase() === 'easy' ? 'badge-emerald' : (question.difficulty || '').toLowerCase() === 'hard' ? 'badge-rose' : 'badge-amber'}`}
            style={{ textTransform: 'capitalize' }}
          >
            {question.difficulty}
          </span>

          <span className="badge badge-emerald" style={{ fontSize: '0.78rem', padding: '4px 10px', fontWeight: 700 }}>
            <Award size={13} /> {question.final_score}/100 Quality
          </span>

          {question.id && (
            <span
              className="badge badge-cyan"
              style={{ fontFamily: 'monospace', fontSize: '0.7rem', cursor: 'pointer' }}
              title={`Question UUID: ${question.id} (Click to copy)`}
              onClick={() => handleCopyText(question.id, 'id')}
            >
              {copiedId === 'id' ? <Check size={11} color="#059669" /> : null} ID: {question.id.slice(0, 8)}...
            </span>
          )}

          {question.batch_id && (
            <span
              className="badge badge-purple"
              style={{ fontFamily: 'monospace', fontSize: '0.7rem', cursor: 'pointer' }}
              title={`Batch UUID: ${question.batch_id} (Click to copy)`}
              onClick={() => handleCopyText(question.batch_id, 'batch')}
            >
              {copiedId === 'batch' ? <Check size={11} color="#059669" /> : null} Batch: {question.batch_id.slice(0, 8)}...
            </span>
          )}

          {question.combination_id && (
            <span
              className="badge badge-cyan"
              style={{ fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}
              title={`Combination ID: ${question.combination_id} (Click to copy)`}
              onClick={() => handleCopyText(question.combination_id, 'comb')}
            >
              {copiedId === 'comb' ? <Check size={11} color="#059669" /> : null} {question.combination_id.length > 12 ? `Comb: ${question.combination_id.slice(0, 8)}...` : `Comb: ${question.combination_id}`}
            </span>
          )}

          {question.content_domain && (
            <span className="badge badge-purple" title="Content Domain">
              Domain: {question.content_domain}
            </span>
          )}

          {question.primary_trap && (
            <span className="badge badge-rose" title="Primary Trap">
              Trap: {question.primary_trap}
            </span>
          )}

          {question.question_type && (
            <span className="badge badge-cyan" title="Question Type">
              Type: {question.question_type}
            </span>
          )}
        </div>

        {/* Audit Inspector Button */}
        {onOpenAudit && (
          <button
            onClick={() => onOpenAudit(question)}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.75rem', gap: '6px' }}
            title="Inspect Reviewer Rubric and 100-pt Score Breakdown"
          >
            <Eye size={14} /> Audit Breakdown
          </button>
        )}
      </div>

      {/* Admin Action Notice (When Staged & Unsaved) */}
      {!isSaved && onApprove && (
        <div style={{
          background: 'rgba(236, 253, 245, 0.8)',
          border: '1px solid #a7f3d0',
          borderRadius: 'var(--radius-md)',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#065f46', lineHeight: 1.5 }}>
            <strong>Admin Review Gate:</strong> This question scored <strong>{question.final_score}/100</strong> across Authenticity, Clarity, Distractor traps, and Rigor. Please review the answer key below and approve to persist into the Question Bank.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              id="btn-admin-approve-top"
              className="btn-primary"
              onClick={handleApproveClick}
              disabled={isApproving}
              style={{
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                borderColor: '#059669',
                padding: '8px 18px',
                fontSize: '0.825rem',
                gap: '6px'
              }}
            >
              <CheckCircle size={15} /> {isApproving ? 'Saving...' : 'Approve & Save to Question Bank'}
            </button>
            {onDiscard && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onDiscard(question)}
                style={{ padding: '8px 14px', fontSize: '0.825rem', color: '#e11d48', gap: '6px' }}
              >
                <Trash2 size={14} /> Discard
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reading Passage / Clinical Vignette */}
      {question.stimulus_text && (
        <div style={{
          background: 'var(--bg-canvas)',
          borderLeft: '4px solid var(--brand-primary)',
          borderTop: '1px solid var(--border-light)',
          borderRight: '1px solid var(--border-light)',
          borderBottom: '1px solid var(--border-light)',
          padding: '18px 22px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.925rem',
          lineHeight: '1.7',
          color: 'var(--text-primary)',
          whiteSpace: 'pre-line'
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            Stimulus Vignette
          </div>
          {question.stimulus_text}
        </div>
      )}

      {/* Visual Stimulus Diagram / Image */}
      {(question.image_svg || question.image_url) && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-canvas)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          border: '1px solid var(--border-light)',
          overflow: 'hidden'
        }}>
          {question.image_svg ? (
            <div
              dangerouslySetInnerHTML={{ __html: question.image_svg }}
              style={{ width: '100%', maxWidth: '640px', display: 'flex', justifyContent: 'center' }}
            />
          ) : (
            <img
              src={question.image_url}
              alt="UCAT Visual Stimulus"
              style={{ maxWidth: '100%', maxHeight: '360px', borderRadius: '8px', objectFit: 'contain' }}
            />
          )}
          {question.image_description && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Stimulus: {question.image_description}
            </span>
          )}
        </div>
      )}

      {/* Question Stem */}
      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: '1.5' }}>
        {question.question_stem}
      </div>

      {/* 4 Options (A, B, C, D) with Correct Key Highlighted */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {question.options.map(opt => {
          const isCorrectKey = opt.id === question.correct_answer_id;

          return (
            <div
              key={opt.id}
              id={`option-choice-${opt.id}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                background: isCorrectKey ? '#ecfdf5' : '#ffffff',
                border: isCorrectKey ? '2px solid #10b981' : '1px solid var(--border-light)',
                boxShadow: isCorrectKey ? '0 2px 8px rgba(16, 185, 129, 0.12)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {/* Option Letter Circle */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: isCorrectKey ? '#059669' : '#f1f5f9',
                color: isCorrectKey ? '#ffffff' : '#334155',
                border: isCorrectKey ? 'none' : '1px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.9rem',
                flexShrink: 0
              }}>
                {opt.id}
              </div>

              {/* Option Text */}
              <div style={{
                flex: 1,
                fontSize: '0.925rem',
                fontWeight: isCorrectKey ? 700 : 500,
                color: isCorrectKey ? '#065f46' : 'var(--text-primary)',
                paddingTop: '5px',
                lineHeight: 1.5
              }}>
                {opt.text}
              </div>

              {/* Answer Key Badge */}
              {isCorrectKey ? (
                <span
                  className="badge badge-emerald"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: '4px'
                  }}
                >
                  <CheckCircle size={14} color="#059669" /> Correct Answer
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                    flexShrink: 0,
                    marginTop: '6px'
                  }}
                >
                  Distractor
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Explanation Header Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px' }}>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setShowExplanation(!showExplanation)}
          style={{ gap: '6px', fontSize: '0.825rem' }}
        >
          {showExplanation ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {showExplanation ? 'Hide Step-by-Step Rationalization' : 'Show Step-by-Step Rationalization'}
        </button>

        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Correct Answer: <strong>Option {question.correct_answer_id}</strong>
        </span>
      </div>

      {/* Explanation Box */}
      {showExplanation && (
        <div style={{
          background: 'var(--bg-canvas)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          border: '1px solid var(--border-light)',
          fontSize: '0.875rem',
          lineHeight: '1.7',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--brand-primary)', fontWeight: 700 }}>
            <HelpCircle size={18} />
            Psychometric Rationalization &amp; Distractor Trap Analysis
          </div>
          <div style={{ whiteSpace: 'pre-line', color: 'var(--text-primary)' }}>
            {question.explanation}
          </div>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-light)'
      }}>
        {/* Left Side: Approve or Saved status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!isSaved && onApprove ? (
            <>
              <button
                type="button"
                id="btn-admin-approve-bottom"
                className="btn-primary"
                onClick={handleApproveClick}
                disabled={isApproving}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  borderColor: '#059669',
                  padding: '10px 22px',
                  fontWeight: 700,
                  gap: '8px'
                }}
              >
                <CheckCircle size={16} /> {isApproving ? 'Saving...' : 'Approve & Save to Question Bank'}
              </button>
              {onDiscard && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onDiscard(question)}
                  style={{ color: '#e11d48', padding: '10px 16px', gap: '6px' }}
                >
                  <Trash2 size={15} /> Discard Candidate
                </button>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: 700, fontSize: '0.9rem' }}>
              <CheckCircle size={18} /> Verified &amp; Saved in PostgreSQL Database
            </div>
          )}
        </div>

        {/* Right Side: Generate Another */}
        {onNextQuestion && (
          <button
            type="button"
            id="btn-generate-another"
            className="btn-primary"
            onClick={onNextQuestion}
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              borderColor: '#6366f1',
              padding: '10px 20px',
              gap: '8px'
            }}
          >
            <Sparkles size={16} /> Generate Another Question
          </button>
        )}
      </div>

      {/* Multi-Stage Outcomes JSON Inspector */}
      <StageJsonInspector question={question} />
    </div>
  );
}
