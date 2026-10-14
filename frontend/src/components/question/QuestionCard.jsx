import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  Eye, 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles
} from 'lucide-react';
import StageJsonInspector from './StageJsonInspector';


const SECTION_SECONDS_MAP = {
  verbal_reasoning: 28,
  decision_making: 64,
  quantitative_reasoning: 41,
  abstract_reasoning: 14,
  situational_judgement: 23
};

export default function QuestionCard({ question, onOpenAudit, onNextQuestion }) {
  const targetSeconds = SECTION_SECONDS_MAP[question?.section] || 30;
  const [prevQuestionId, setPrevQuestionId] = useState(question?.id);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Timer State
  const [secondsRemaining, setSecondsRemaining] = useState(targetSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const timerRef = useRef(null);

  // Reset state when question ID changes without cascading render effects
  if (question?.id !== prevQuestionId) {
    setPrevQuestionId(question?.id);
    setSelectedOption(null);
    setIsAnswerRevealed(false);
    setShowExplanation(false);
    setSecondsRemaining(targetSeconds);
    setIsTimerRunning(true);
  }

  // Timer countdown loop
  useEffect(() => {
    if (isTimerRunning && !isAnswerRevealed) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => prev - 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerRunning, isAnswerRevealed]);

  if (!question) return null;

  const handleSelect = (id) => {
    if (!isAnswerRevealed) {
      setSelectedOption(id);
    }
  };

  const handleCheckAnswer = () => {
    setIsAnswerRevealed(true);
    setShowExplanation(true);
    setIsTimerRunning(false);
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
    setSecondsRemaining(targetSeconds);
    setIsTimerRunning(true);
  };

  const isUserCorrect = selectedOption === question.correct_answer_id;

  // Timer visual style
  let timerStatusClass = 'normal';
  if (secondsRemaining < 0) {
    timerStatusClass = 'overtime';
  } else if (secondsRemaining <= 7) {
    timerStatusClass = 'warning';
  }

  const formatTimer = (sec) => {
    if (sec >= 0) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m > 0 ? `${m}m ` : ''}${s}s`;
    } else {
      return `+${Math.abs(sec)}s (Overtime)`;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header: Subtest Badges + Pacing Timer + Audit */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span className="badge badge-cyan">{question.section_label || question.section}</span>
          <span className="badge badge-purple">{question.subtopic}</span>
          <span className="badge badge-amber">{question.difficulty}</span>
          <span className="badge badge-emerald" style={{ fontSize: '0.75rem', padding: '3px 10px' }}>
            <Award size={13} /> {question.final_score}/100
          </span>
          {question.id && (
            <span
              className="badge badge-cyan"
              style={{ fontFamily: 'monospace', fontSize: '0.7rem', cursor: 'pointer' }}
              title={`Question UUID: ${question.id} (Click to copy)`}
              onClick={() => navigator.clipboard.writeText(question.id)}
            >
              ID: {question.id.slice(0, 8)}...
            </span>
          )}
          {question.batch_id && (
            <span
              className="badge badge-purple"
              style={{ fontFamily: 'monospace', fontSize: '0.7rem', cursor: 'pointer' }}
              title={`Batch UUID: ${question.batch_id} (Click to copy)`}
              onClick={() => navigator.clipboard.writeText(question.batch_id)}
            >
              Batch: {question.batch_id.slice(0, 8)}...
            </span>
          )}
          {question.combination_id && (
            <span
              className="badge badge-cyan"
              style={{ fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}
              title={`Combination ID: ${question.combination_id} (Click to copy)`}
              onClick={() => navigator.clipboard.writeText(question.combination_id)}
            >
              {question.combination_id.length > 12 ? `Comb: ${question.combination_id.slice(0, 8)}...` : question.combination_id}
            </span>
          )}
          {question.content_domain && (
            <span className="badge badge-purple" title="Content Domain">
              {question.content_domain}
            </span>
          )}
          {question.primary_trap && (
            <span className="badge badge-rose" title="Primary Trap">
              Trap: {question.primary_trap}
            </span>
          )}
          {question.question_type && (
            <span className="badge badge-cyan" title="Question Type">
              {question.question_type}
            </span>
          )}
        </div>

        {/* Live Practice Timer Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className={`timer-pill ${timerStatusClass}`}>
            <Timer size={15} />
            <span>{formatTimer(secondsRemaining)}</span>
            <button
              type="button"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px',
                color: 'inherit'
              }}
              title={isTimerRunning ? 'Pause Timer' : 'Resume Timer'}
            >
              {isTimerRunning ? <Pause size={13} /> : <Play size={13} />}
            </button>
            <button
              type="button"
              onClick={() => setSecondsRemaining(targetSeconds)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px',
                color: 'inherit'
              }}
              title="Reset Timer"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {onOpenAudit && (
            <button
              onClick={() => onOpenAudit(question)}
              className="btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              title="Inspect Reviewer Rubric and Score Breakdown"
            >
              <Eye size={13} /> Audit
            </button>
          )}
        </div>
      </div>

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
                width: '32px',
                height: '32px',
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

              <div style={{ flex: 1, fontSize: '0.925rem', fontWeight: 500, color: 'var(--text-primary)', paddingTop: '4px' }}>
                {opt.text}
              </div>

              {isAnswerRevealed && isCorrectKey && (
                <CheckCircle size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '4px' }} />
              )}
              {isAnswerRevealed && isSelected && !isCorrectKey && (
                <XCircle size={20} color="#f43f5e" style={{ flexShrink: 0, marginTop: '4px' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', paddingTop: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                color: isUserCorrect ? '#059669' : '#e11d48'
              }}>
                {isUserCorrect ? '🎉 Correct! Excellent clinical reasoning.' : `Option ${question.correct_answer_id} is correct.`}
              </span>
              <button className="btn-secondary" onClick={handleReset}>
                Try Again
              </button>
            </div>
          )}

          {onNextQuestion && (
            <button
              id="btn-practice-next"
              className="btn-primary"
              onClick={onNextQuestion}
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                borderColor: '#6366f1'
              }}
            >
              <Sparkles size={16} /> Practice Next Question
            </button>
          )}
        </div>

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

      {/* Multi-Stage Outcomes JSON Inspector (Drafting -> Quality Audit -> Polish -> Stimulus -> Final) */}
      <StageJsonInspector question={question} />
    </div>
  );
}
