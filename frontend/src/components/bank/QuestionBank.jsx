import React from 'react';
import { Database, Search, Download, Trash2, Eye, Award, ExternalLink, Copy, Check, Coins } from 'lucide-react';
import { getExportUrl } from '../../services/api';
import { useQuestionBank } from '../../hooks/useQuestionBank';

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
            UK UCAT Question Bank Repository
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Curated questions reviewed, scored, and stored in persistent PostgreSQL 16 database.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div style={{
            background: 'var(--bg-canvas)',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>TOTAL QUESTIONS</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-primary)' }}>{questions.length}</div>
          </div>

          <div style={{
            background: 'var(--bg-canvas)',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>AVG QUALITY SCORE</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>{avgScore}/100</div>
          </div>

          {/* 3rd Stat Card: Total Repository Tokens & Cost */}
          <div style={{
            background: 'var(--bg-canvas)',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>REPO TOKENS &amp; COST</div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#4f46e5' }}>
              {repoStats.total_tokens.toLocaleString()} <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#166534' }}>(${repoStats.total_cost_usd.toFixed(4)})</span>
            </div>
          </div>

          {/* Export Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href={getExportUrl('json')}
              download="ucat_questions.json"
              className="btn-secondary"
              style={{ textDecoration: 'none', padding: '10px 14px' }}
            >
              <Download size={16} /> JSON
            </a>
            <a
              href={getExportUrl('csv')}
              download="ucat_questions.csv"
              className="btn-secondary"
              style={{ textDecoration: 'none', padding: '10px 14px' }}
            >
              <Download size={16} /> CSV
            </a>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', gap: '10px', background: '#ffffff', padding: '0 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <Search size={18} color="var(--text-secondary)" />
          <input
            id="input-bank-search"
            type="text"
            placeholder="Search questions by stem, topic, or stimulus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', padding: '10px 0', width: '100%', color: 'var(--text-primary)' }}
          />
        </div>

        <select
          id="select-bank-section"
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          style={{ minWidth: '180px' }}
        >
          <option value="">All UCAT Subtests</option>
          <option value="verbal_reasoning">Verbal Reasoning</option>
          <option value="decision_making">Decision Making</option>
          <option value="quantitative_reasoning">Quantitative Reasoning</option>
          <option value="abstract_reasoning">Abstract Reasoning</option>
          <option value="situational_judgement">Situational Judgement</option>
        </select>

        <select
          id="select-bank-difficulty"
          value={diffFilter}
          onChange={(e) => setDiffFilter(e.target.value)}
          style={{ minWidth: '140px' }}
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Questions List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Loading Question Bank...
        </div>
      ) : questions.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)' }}>
          <Database size={48} color="#cbd5e1" style={{ marginBottom: '14px' }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '6px' }}>No Questions Found</h3>
          <p style={{ fontSize: '0.85rem' }}>
            Generate questions using the Generator Studio to build your UK UCAT library.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {questions.map((q) => (
            <div
              key={q.id}
              onClick={() => onSelectQuestion(q)}
              className="glass-panel"
              style={{
                padding: '18px 24px',
                cursor: 'pointer',
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
                  {q.total_tokens !== undefined && q.total_tokens > 0 && (
                    <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                      <Coins size={11} /> {q.total_tokens.toLocaleString()} tok &bull; ${q.cost_usd?.toFixed(5)}
                    </span>
                  )}
                  {q.image_svg && (
                    <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                      SVG Stimulus
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

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={(e) => handleCopy(q, e)}
                  className="btn-secondary"
                  style={{ padding: '8px' }}
                  title="Copy formatted question"
                >
                  {copiedId === q.id ? <Check size={16} color="#059669" /> : <Copy size={16} />}
                </button>

                <button
                  onClick={(e) => handleDelete(q.id, e)}
                  className="btn-secondary"
                  style={{ padding: '8px', color: '#e11d48' }}
                  title="Delete question"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
