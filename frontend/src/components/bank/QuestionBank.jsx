import React from 'react';
import { Database, Search, Download, Trash2, Award, Copy, Check, Coins, Play } from 'lucide-react';
import { getExportUrl } from '../../services/api';
import { useQuestionBank } from '../../hooks/useQuestionBank';

const SUBTEST_FILTER_OPTIONS = [
  { id: '', label: 'All Subtests' },
  { id: 'verbal_reasoning', label: 'Verbal' },
  { id: 'decision_making', label: 'Decision' },
  { id: 'quantitative_reasoning', label: 'Quantitative' },
  { id: 'abstract_reasoning', label: 'Abstract' },
  { id: 'situational_judgement', label: 'SJT' }
];

const DIFFICULTY_FILTER_OPTIONS = [
  { id: '', label: 'All Levels' },
  { id: 'easy', label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard', label: 'Hard' }
];

export default function QuestionBank({ onSelectQuestion }) {
  const {
    questions,
    repoStats,
    loading,
    sectionFilter,
    setSectionFilter,
    diffFilter,
    setDiffFilter,
    searchQuery,
    setSearchQuery,
    copiedId,
    handleDelete,
    handleCopy,
    avgScore
  } = useQuestionBank();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner & Stats */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            UK UCAT Question Bank Library
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Practice and review psychometrically validated questions stored in PostgreSQL 16.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            background: 'var(--bg-canvas)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>QUESTIONS</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-primary)' }}>{questions.length}</div>
          </div>

          <div style={{
            background: 'var(--bg-canvas)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>AVG SCORE</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669' }}>{avgScore}/100</div>
          </div>

          <div style={{
            background: 'var(--bg-canvas)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)' }}>REPO COST</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#4f46e5' }}>
              ${repoStats.total_cost_usd.toFixed(4)}
            </div>
          </div>

          {/* Export Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href={getExportUrl('json')}
              download="ucat_questions.json"
              className="btn-secondary"
              style={{ textDecoration: 'none', padding: '8px 12px', fontSize: '0.8rem' }}
            >
              <Download size={14} /> JSON
            </a>
            <a
              href={getExportUrl('csv')}
              download="ucat_questions.csv"
              className="btn-secondary"
              style={{ textDecoration: 'none', padding: '8px 12px', fontSize: '0.8rem' }}
            >
              <Download size={14} /> CSV
            </a>
          </div>
        </div>
      </div>

      {/* Filter Bar with Horizontal Pills */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Search Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{
            flex: 1,
            minWidth: '240px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#ffffff',
            padding: '0 12px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)'
          }}>
            <Search size={16} color="var(--text-secondary)" />
            <input
              id="input-bank-search"
              type="text"
              placeholder="Search by question stem, topic, or stimulus..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', padding: '8px 0', width: '100%', fontSize: '0.85rem' }}
            />
          </div>

          {/* Difficulty Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {DIFFICULTY_FILTER_OPTIONS.map(d => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDiffFilter(d.id)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--radius-full)',
                  border: diffFilter === d.id ? '1px solid var(--brand-primary)' : '1px solid var(--border-light)',
                  background: diffFilter === d.id ? 'var(--brand-primary-light)' : '#ffffff',
                  color: diffFilter === d.id ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Subtest Filter Pills */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '2px'
        }}>
          {SUBTEST_FILTER_OPTIONS.map(sec => {
            const isActive = sectionFilter === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                className={`filter-pill ${isActive ? 'active' : ''}`}
                onClick={() => setSectionFilter(sec.id)}
              >
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Loading Question Bank...
        </div>
      ) : questions.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <Database size={44} color="#cbd5e1" style={{ marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '6px' }}>No Questions Found</h3>
          <p style={{ fontSize: '0.825rem' }}>
            No questions match your current filters. Clear filters or generate new questions in the Studio.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {questions.map((q) => (
            <div
              key={q.id}
              className="glass-panel"
              style={{
                padding: '18px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                background: '#ffffff',
                border: '1px solid var(--border-light)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span className="badge badge-cyan">{q.section_label || q.section}</span>
                  <span className="badge badge-purple">{q.subtopic}</span>
                  <span className="badge badge-amber">{q.difficulty}</span>
                  <span className="badge badge-emerald">
                    <Award size={12} /> {q.final_score}/100
                  </span>
                  {q.id && (
                    <span
                      className="badge badge-cyan"
                      style={{ fontFamily: 'monospace', fontSize: '0.7rem', cursor: 'pointer' }}
                      title={`Question UUID: ${q.id} (Click to copy)`}
                      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(q.id); }}
                    >
                      ID: {q.id.slice(0, 8)}...
                    </span>
                  )}
                  {q.batch_id && (
                    <span
                      className="badge badge-purple"
                      style={{ fontFamily: 'monospace', fontSize: '0.7rem', cursor: 'pointer' }}
                      title={`Batch UUID: ${q.batch_id} (Click to copy)`}
                      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(q.batch_id); }}
                    >
                      Batch: {q.batch_id.slice(0, 8)}...
                    </span>
                  )}
                  {q.combination_id && (
                    <span
                      className="badge badge-cyan"
                      style={{ fontFamily: 'monospace', fontWeight: 700, cursor: 'pointer' }}
                      title={`Combination ID: ${q.combination_id} (Click to copy)`}
                      onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(q.combination_id); }}
                    >
                      {q.combination_id.length > 12 ? `Comb: ${q.combination_id.slice(0, 8)}...` : q.combination_id}
                    </span>
                  )}
                  {q.content_domain && (
                    <span className="badge badge-purple" title="Content Domain">
                      {q.content_domain}
                    </span>
                  )}
                  {q.primary_trap && (
                    <span className="badge badge-rose" title="Primary Trap">
                      Trap: {q.primary_trap}
                    </span>
                  )}
                  {q.total_tokens !== undefined && q.total_tokens > 0 && (
                    <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                      <Coins size={11} /> {q.total_tokens.toLocaleString()} tok &bull; ${q.cost_usd?.toFixed(5)}
                    </span>
                  )}
                  {q.image_svg && (
                    <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                      Visual Stimulus
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {q.question_stem}
                </div>

                {q.stimulus_text && (
                  <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '750px' }}>
                    {q.stimulus_text}
                  </div>
                )}
              </div>

              {/* Action Buttons: Practice in Studio, Copy, Delete */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => onSelectQuestion(q)}
                  className="btn-primary"
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.8rem',
                    gap: '6px',
                    whiteSpace: 'nowrap'
                  }}
                  title="Load into Interactive Practice Studio"
                >
                  <Play size={14} /> Practice in Studio
                </button>

                <button
                  onClick={(e) => handleCopy(q, e)}
                  className="btn-secondary"
                  style={{ padding: '8px' }}
                  title="Copy question text"
                >
                  {copiedId === q.id ? <Check size={15} color="#059669" /> : <Copy size={15} />}
                </button>

                <button
                  onClick={(e) => handleDelete(q.id, e)}
                  className="btn-secondary"
                  style={{ padding: '8px', color: '#e11d48' }}
                  title="Delete question"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
