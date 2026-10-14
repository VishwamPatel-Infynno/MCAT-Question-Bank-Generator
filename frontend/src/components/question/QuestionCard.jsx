import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle, XCircle, HelpCircle, ChevronDown, ChevronUp, Award, Layers, ShieldCheck, Eye, Sparkles, Coins } from 'lucide-react';

export default function QuestionCard({ question, onOpenAudit }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  if (!question) return null;

  const handleSelect = (id) => {
    if (!isAnswerRevealed) {
      setSelectedOption(id);
    }
  };

  const handleCheckAnswer = () => {
    setIsAnswerRevealed(true);
    setShowExplanation(true);
    if (selectedOption === question.correct_answer_id) {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  const handleReset = () => {
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setShowExplanation(false);
  };

  const isUserCorrect = selectedOption === question.correct_answer_id;

  return (
    <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Metadata Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge badge-cyan">{question.section_label || question.section}</span>
          <span className="badge badge-purple">{question.subtopic}</span>
          <span className="badge badge-amber">{question.difficulty}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-emerald" style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
            <Award size={14} /> Quality Score: {question.final_score}/100
          </span>
          {question.total_tokens !== undefined && question.total_tokens > 0 && (
            <span className="badge badge-cyan" style={{ fontSize: '0.8rem', padding: '4px 12px' }} title="Accumulated Multi-Agent Tokens & Cost">
              <Coins size={14} /> {question.total_tokens.toLocaleString()} tokens &bull; ${question.cost_usd?.toFixed(5)}
            </span>
          )}
          {question.iteration_count > 1 && (
            <span className="badge badge-amber" style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
              <Layers size={14} /> Refined in Iteration {question.iteration_count}
            </span>
          )}
          {onOpenAudit && (
            <button
              onClick={() => onOpenAudit(question)}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              title="Inspect Reviewer Rubric and Evolution Diff"
            >
              <Eye size={14} /> Audit Log
            </button>
          )}
        </div>
      </div>

      {/* Stimulus / Reading Passage / Clinical Vignette */}
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
          {question.stimulus_text}
        </div>
      )}

      {/* Visual Stimulus Diagram / SVG / Image */}
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

      {/* 4 Options (A, B, C, D) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {question.options.map(opt => {
          const isSelected = selectedOption === opt.id;
          const isCorrectKey = opt.id === question.correct_answer_id;
          
          let cardClass = 'radio-card';
          if (isAnswerRevealed) {
            if (isCorrectKey) cardClass += ' correct-answer';
            else if (isSelected && !isCorrectKey) cardClass += ' wrong-answer';
          } else if (isSelected) {
            cardClass += ' selected';
          }

          return (
            <div
              key={opt.id}
              id={`option-choice-${opt.id}`}
              className={cardClass}
              onClick={() => handleSelect(opt.id)}
            >
              <div style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: isAnswerRevealed && isCorrectKey 
                  ? '#10b981'
                  : isAnswerRevealed && isSelected && !isCorrectKey
                  ? '#f43f5e'
                  : isSelected 
                  ? 'var(--brand-primary)' 
                  : 'var(--bg-canvas)',
                color: (isSelected || (isAnswerRevealed && isCorrectKey) || (isAnswerRevealed && isSelected && !isCorrectKey)) ? '#ffffff' : 'var(--text-secondary)',
                border: (!isSelected && !(isAnswerRevealed && (isCorrectKey || isSelected))) ? '1px solid var(--border-light)' : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
                flexShrink: 0
              }}>
                {opt.id}
              </div>

              <div style={{ flex: 1, fontSize: '0.925rem', fontWeight: 500, color: 'var(--text-primary)', paddingTop: '2px' }}>
                {opt.text}
              </div>

              {isAnswerRevealed && isCorrectKey && (
                <CheckCircle size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              )}
              {isAnswerRevealed && isSelected && !isCorrectKey && (
                <XCircle size={20} color="#f43f5e" style={{ flexShrink: 0, marginTop: '2px' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Action Controls for Testing */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px' }}>
        {!isAnswerRevealed ? (
          <button
            id="btn-check-answer"
            className="btn-primary"
            onClick={handleCheckAnswer}
            disabled={!selectedOption}
            style={{ padding: '10px 24px' }}
          >
            Check My Answer
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: isUserCorrect ? '#059669' : '#e11d48'
            }}>
              {isUserCorrect ? 'Correct! Excellent clinical reasoning.' : `Incorrect. The correct answer is Option ${question.correct_answer_id}.`}
            </span>
            <button className="btn-secondary" onClick={handleReset}>
              Try Again
            </button>
          </div>
        )}

        <button
          className="btn-secondary"
          onClick={() => setShowExplanation(!showExplanation)}
          style={{ gap: '6px' }}
        >
          {showExplanation ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
        </button>
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
            Step-by-Step Rationalization &amp; Distractor Breakdown
          </div>
          <div style={{ whiteSpace: 'pre-line', color: 'var(--text-primary)' }}>
            {question.explanation}
          </div>
        </div>
      )}
    </div>
  );
}
