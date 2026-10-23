import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  FileDown, 
  Printer, 
  FileText, 
  Table, 
  Code, 
  Check, 
  Copy, 
  X, 
  Clock, 
  BookOpen, 
  GraduationCap
} from 'lucide-react';
import { fetchQuestions } from '../../services/api';

const EMPTY_ARRAY = [];

const PACING_SECONDS = {
  chem_phys: 96,
  cars: 101,
  bio_biochem: 96,
  psych_soc: 96
};

function formatExamTime(questions) {
  if (!questions || questions.length === 0) return '0 mins';
  const totalSeconds = questions.reduce((acc, q) => {
    const sec = PACING_SECONDS[q.section] || 96;
    return acc + sec;
  }, 0);
  const minutes = Math.ceil(totalSeconds / 60);
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

export default function ExportPrintModal({
  isOpen,
  onClose,
  allQuestions = EMPTY_ARRAY,
  selectedIds = EMPTY_ARRAY,
  filteredQuestions = EMPTY_ARRAY,
  hasActiveFilters = false,
  onShowToast
}) {
  // Determine initial scope: selected > filtered > all
  const initialScope = selectedIds.length > 0 
    ? 'selected' 
    : (hasActiveFilters && filteredQuestions.length > 0 ? 'filtered' : 'all');

  const [scope, setScope] = useState(initialScope);
  const [format, setFormat] = useState('paper'); // 'paper' | 'csv' | 'json'
  const [paperMode, setPaperMode] = useState('student'); // 'student' | 'studypack'
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedCsv, setCopiedCsv] = useState(false);
  const [fetchedAll, setFetchedAll] = useState(null);
  const previewRef = useRef(null);

  useEffect(() => {
    if (hasActiveFilters) {
      fetchQuestions().then(res => {
        if (res?.questions) setFetchedAll(res.questions);
      }).catch(() => {});
    }
  }, [hasActiveFilters]);

  // Compute active export dataset
  const bankPool = fetchedAll || allQuestions;

  const exportQuestions = useMemo(() => {
    if (scope === 'selected' && selectedIds.length > 0) {
      return bankPool.filter(q => selectedIds.includes(q.id));
    }
    if (scope === 'filtered' && hasActiveFilters) {
      return filteredQuestions;
    }
    return bankPool;
  }, [scope, selectedIds, bankPool, filteredQuestions, hasActiveFilters]);

  const timeAllowed = useMemo(() => formatExamTime(exportQuestions), [exportQuestions]);

  // Generate CSV String
  const csvContent = useMemo(() => {
    if (!exportQuestions || exportQuestions.length === 0) return '';
    const headers = [
      'Question Number',
      'ID',
      'Section',
      'Subtopic',
      'Difficulty',
      'Stimulus / Passage',
      'Question Stem',
      'Visual Type',
      'Image URL',
      'Image Description',
      'Option A',
      'Option B',
      'Option C',
      'Option D',
      'Option E',
      'Correct Answer',
      'Explanation',
      'Primary Trap',
      'Quality Score'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = exportQuestions.map((q, idx) => {
      const opts = {};
      (q.options || []).forEach(opt => {
        opts[opt.id?.toUpperCase()] = opt.text || '';
      });

      const imgUrl = q.image_url 
        ? (q.image_url.startsWith('data:') ? `/api/questions/${q.id}/image` : q.image_url)
        : (q.image_svg ? `/api/questions/${q.id}/image` : '');
      const imgDesc = q.image_description || q.stage_outcomes?.visual_stimulus?.description || '';
      const visualType = q.visual_type || (imgUrl || q.image_svg ? 'Visual' : 'None');

      return [
        idx + 1,
        escapeCsv(q.id),
        escapeCsv(q.section_label || q.section),
        escapeCsv(q.subtopic || ''),
        escapeCsv(q.difficulty || ''),
        escapeCsv(q.stimulus_text || ''),
        escapeCsv(q.question_stem || q.stem || ''),
        escapeCsv(visualType),
        escapeCsv(imgUrl),
        escapeCsv(imgDesc),
        escapeCsv(opts['A'] || ''),
        escapeCsv(opts['B'] || ''),
        escapeCsv(opts['C'] || ''),
        escapeCsv(opts['D'] || ''),
        escapeCsv(opts['E'] || ''),
        escapeCsv(q.correct_answer_ids ? q.correct_answer_ids.join(', ') : (q.correct_answer || '')),
        escapeCsv(q.explanation || ''),
        escapeCsv(q.primary_trap || ''),
        q.final_score || 0
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  }, [exportQuestions]);

  // Download CSV
  const handleDownloadCsv = () => {
    if (!csvContent) return;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcat_exam_${exportQuestions.length}_questions.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (onShowToast) {
      onShowToast({
        type: 'success',
        title: 'CSV Exported',
        message: `Successfully downloaded CSV for ${exportQuestions.length} questions.`
      });
    }
  };

  // Copy CSV
  const handleCopyCsv = async () => {
    if (!csvContent) return;
    try {
      await navigator.clipboard.writeText(csvContent);
      setCopiedCsv(true);
      setTimeout(() => setCopiedCsv(false), 2000);
      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Copied to Clipboard',
          message: 'CSV data copied.'
        });
      }
    } catch {
      // Fallback
    }
  };

  // Generate JSON String
  const jsonContent = useMemo(() => {
    return JSON.stringify(exportQuestions, null, 2);
  }, [exportQuestions]);

  // Download JSON
  const handleDownloadJson = () => {
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcat_exam_${exportQuestions.length}_questions.json`;
    a.click();
    URL.revokeObjectURL(url);
    if (onShowToast) {
      onShowToast({
        type: 'success',
        title: 'JSON Exported',
        message: `Successfully downloaded JSON for ${exportQuestions.length} questions.`
      });
    }
  };

  // Copy JSON
  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonContent);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
      if (onShowToast) {
        onShowToast({
          type: 'success',
          title: 'Copied to Clipboard',
          message: 'JSON data copied.'
        });
      }
    } catch {
      // Fallback
    }
  };

  // Trigger Native Print / Save as PDF
  const handleNativePrint = () => {
    if (!exportQuestions || exportQuestions.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Pop-up Blocked',
          message: 'Please allow pop-ups for this site to print or save as PDF.'
        });
      }
      return;
    }

    const isStudyPack = paperMode === 'studypack';
    const examDate = new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const questionsHtml = exportQuestions.map((q, idx) => {
      const qNum = idx + 1;
      const svgDiagram = q.image_svg || q.stage_outcomes?.visual_stimulus?.image_svg || '';
      const imgUrl = q.image_url || q.stage_outcomes?.visual_stimulus?.image_url || '';
      const imgDesc = q.image_description || q.stage_outcomes?.visual_stimulus?.description || '';

      const optionsHtml = (q.options || []).map(opt => `
        <div class="option-row">
          <span class="option-bubble">[ &nbsp; ]</span>
          <span class="option-letter"><strong>${opt.id}.</strong></span>
          <span class="option-text">${opt.text || ''}</span>
        </div>
      `).join('');

      return `
        <div class="question-block">
          <div class="question-header">
            <span class="question-number">Question ${qNum}</span>
            <span class="question-meta">${q.section_label || q.section} &bull; ${q.subtopic || ''}</span>
          </div>

          ${q.stimulus_text ? `
            <div class="stimulus-box">
              <div class="stimulus-title">Reading Passage</div>
              <p class="stimulus-content">${q.stimulus_text.replace(/\n\n/g, '</p><p class="stimulus-content">')}</p>
            </div>
          ` : ''}

          ${svgDiagram ? `
            <div class="diagram-box">
              ${svgDiagram}
              ${imgDesc ? `<div class="diagram-caption">${imgDesc}</div>` : ''}
            </div>
          ` : imgUrl ? `
            <div class="diagram-box">
              <img src="${imgUrl}" alt="Stimulus Diagram" />
              ${imgDesc ? `<div class="diagram-caption">${imgDesc}</div>` : ''}
            </div>
          ` : ''}

          <div class="question-stem">${q.question_stem || q.stem || ''}</div>
          <div class="options-grid">${optionsHtml}</div>
        </div>
      `;
    }).join('');

    const answerKeyHtml = isStudyPack ? `
      <div class="page-break"></div>
      <div class="answer-key-section">
        <div class="answer-key-header">
          <h2>Official Answer Key &amp; Diagnostic Rationales</h2>
          <p>AAMC MCAT Examination Standards &bull; Full Psychometric Breakdown</p>
        </div>

        <table class="key-table">
          <thead>
            <tr>
              <th style="width: 60px;">Q#</th>
              <th style="width: 100px;">Key</th>
              <th style="width: 130px;">Trap Defended</th>
              <th>Detailed Explanation</th>
            </tr>
          </thead>
          <tbody>
            ${exportQuestions.map((q, idx) => `
              <tr>
                <td style="text-align: center; font-weight: 700;">Q${idx + 1}</td>
                <td style="text-align: center;">
                  <span class="correct-badge">${q.correct_answer_ids ? q.correct_answer_ids.join(', ') : (q.correct_answer || 'A')}</span>
                </td>
                <td style="font-size: 11px; color: #475569;">${q.primary_trap || 'None'}</td>
                <td style="font-size: 11.5px; line-height: 1.5;">${q.explanation || 'No explanation recorded.'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '';

    const htmlDoc = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Infynno MCAT Practice Paper (${exportQuestions.length} Questions)</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 16mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 13px;
            line-height: 1.5;
          }
          .exam-header {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 12px;
            margin-bottom: 20px;
          }
          .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 12px;
          }
          .brand-title {
            font-size: 18px;
            font-weight: 800;
            letter-spacing: -0.01em;
            color: #0f172a;
            margin: 0 0 2px 0;
          }
          .brand-subtitle {
            font-size: 12px;
            color: #475569;
            font-weight: 500;
            margin: 0;
          }
          .marks-box {
            border: 1.5px solid #0f172a;
            border-radius: 4px;
            padding: 6px 14px;
            text-align: center;
          }
          .marks-label {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
          }
          .marks-value {
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
          }
          .candidate-fields {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr;
            gap: 16px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 10px 14px;
            font-size: 12px;
          }
          .field-item {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .field-label {
            font-weight: 700;
            color: #334155;
            white-space: nowrap;
          }
          .field-line {
            flex: 1;
            border-bottom: 1px dotted #94a3b8;
            height: 14px;
          }
          .instructions-bar {
            margin: 12px 0 20px 0;
            padding: 8px 12px;
            background: #eff6ff;
            border-left: 3px solid #3b82f6;
            font-size: 11px;
            color: #1e3a8a;
            border-radius: 0 4px 4px 0;
          }
          .question-block {
            margin-bottom: 24px;
            page-break-inside: avoid;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 18px;
          }
          .question-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }
          .question-number {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
          }
          .question-meta {
            font-size: 11px;
            color: #64748b;
            font-weight: 600;
          }
          .stimulus-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px 14px;
            margin-bottom: 12px;
          }
          .stimulus-title {
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #475569;
            margin-bottom: 6px;
          }
          .stimulus-content {
            font-family: Georgia, serif;
            font-size: 12.5px;
            line-height: 1.6;
            color: #1e293b;
            margin: 0 0 8px 0;
          }
          .diagram-box {
            margin: 12px auto;
            text-align: center;
            padding: 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            max-width: 500px;
            page-break-inside: avoid;
          }
          .diagram-box svg, .diagram-box img {
            max-height: 280px;
            max-width: 100%;
            height: auto;
            object-fit: contain;
            display: inline-block;
          }
          .diagram-caption {
            font-size: 11px;
            font-style: italic;
            color: #64748b;
            margin-top: 6px;
            line-height: 1.35;
          }
          .question-stem {
            font-size: 13.5px;
            font-weight: 600;
            color: #0f172a;
            margin: 8px 0 12px 0;
            line-height: 1.45;
          }
          .options-grid {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .option-row {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 4px 6px;
            border-radius: 4px;
            line-height: 1.45;
          }
          .option-bubble {
            font-family: monospace;
            font-weight: 700;
            color: #94a3b8;
            font-size: 12px;
            white-space: nowrap;
            flex-shrink: 0;
            line-height: 1.45;
          }
          .option-letter {
            font-size: 13px;
            color: #0f172a;
            white-space: nowrap;
            flex-shrink: 0;
            line-height: 1.45;
            min-width: 18px;
          }
          .option-text {
            font-size: 13px;
            color: #1e293b;
            flex: 1;
            line-height: 1.45;
          }
          .page-break {
            page-break-before: always;
            break-before: page;
          }
          .answer-key-section {
            padding-top: 20px;
          }
          .answer-key-header {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 8px;
            margin-bottom: 16px;
          }
          .answer-key-header h2 {
            margin: 0 0 4px 0;
            font-size: 18px;
            font-weight: 800;
          }
          .answer-key-header p {
            margin: 0;
            font-size: 11px;
            color: #64748b;
          }
          .key-table {
            width: 100%;
            border-collapse: collapse;
          }
          .key-table th {
            background: #f1f5f9;
            border: 1px solid #cbd5e1;
            padding: 8px 10px;
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            color: #334155;
            text-transform: uppercase;
          }
          .key-table td {
            border: 1px solid #e2e8f0;
            padding: 8px 10px;
            vertical-align: top;
          }
          .correct-badge {
            display: inline-block;
            background: #10b981;
            color: #ffffff;
            font-weight: 800;
            font-size: 12px;
            padding: 2px 8px;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="exam-header">
          <div class="header-top">
            <div>
              <h1 class="brand-title">Infynno MCAT Practice Examination</h1>
              <p class="brand-subtitle">${paperMode === 'student' ? 'Student Exam Paper (Practice Mode)' : 'Complete Study Pack with Diagnostic Rationales'}</p>
            </div>
            <div class="marks-box">
              <div class="marks-label">Total Marks</div>
              <div class="marks-value">___ / ${exportQuestions.length}</div>
            </div>
          </div>

          <div class="candidate-fields">
            <div class="field-item">
              <span class="field-label">Candidate Name:</span>
              <span class="field-line"></span>
            </div>
            <div class="field-item">
              <span class="field-label">Date:</span>
              <span>${examDate}</span>
            </div>
            <div class="field-item">
              <span class="field-label">Time Allowed:</span>
              <span><strong>${timeAllowed}</strong></span>
            </div>
          </div>

          <div class="instructions-bar">
            <strong>Instructions to Candidates:</strong> Answer all ${exportQuestions.length} questions under timed exam conditions. Mark your chosen answer choice [A&ndash;E] clearly. Calculators are permitted only for Quantitative Reasoning.
          </div>
        </div>

        <div class="questions-container">
          ${questionsHtml}
        </div>

        ${answerKeyHtml}

        <script>
          window.addEventListener('load', () => {
            const imgs = Array.from(document.images);
            Promise.all(imgs.map(img => {
              if (img.complete) return Promise.resolve();
              return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
              });
            })).then(() => {
              setTimeout(() => {
                window.focus();
                window.print();
              }, 250);
            });
          });
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlDoc);
    printWindow.document.close();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '960px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-icon-badge" style={{ color: 'var(--brand-primary)', background: 'var(--brand-light)' }}>
              <FileDown size={18} />
            </div>
            <div>
              <h2 className="modal-title">Export &amp; Print Studio</h2>
              <p className="modal-subtitle">Generate official AAMC MCAT test papers, printable PDF study packs, CSV tables, or JSON datasets</p>
            </div>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose}
            aria-label="Close Export Studio"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          
          {/* Top Scope & Format Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            {/* Scope Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Questions to Export ({exportQuestions.length})
              </span>
              <div className="pill-track" style={{ background: 'var(--bg-surface)' }}>
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    className={`pill-track-btn ${scope === 'selected' ? 'active' : ''}`}
                    onClick={() => setScope('selected')}
                  >
                    <span>Selected ({selectedIds.length})</span>
                  </button>
                )}
                {hasActiveFilters && (
                  <button
                    type="button"
                    className={`pill-track-btn ${scope === 'filtered' ? 'active' : ''}`}
                    onClick={() => setScope('filtered')}
                  >
                    <span>Filtered ({filteredQuestions.length})</span>
                  </button>
                )}
                <button
                  type="button"
                  className={`pill-track-btn ${scope === 'all' ? 'active' : ''}`}
                  onClick={() => setScope('all')}
                >
                  <span>All in Bank ({allQuestions.length})</span>
                </button>
              </div>
            </div>

            {/* Format Selection */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Export Format
              </span>
              <div className="pill-track" style={{ background: 'var(--bg-surface)' }}>
                <button
                  type="button"
                  className={`pill-track-btn ${format === 'paper' ? 'active' : ''}`}
                  onClick={() => setFormat('paper')}
                  style={{ gap: '6px' }}
                >
                  <FileText size={13} />
                  <span>Exam Paper (Print/PDF)</span>
                </button>
                <button
                  type="button"
                  className={`pill-track-btn ${format === 'csv' ? 'active' : ''}`}
                  onClick={() => setFormat('csv')}
                  style={{ gap: '6px' }}
                >
                  <Table size={13} />
                  <span>CSV Spreadsheet</span>
                </button>
                <button
                  type="button"
                  className={`pill-track-btn ${format === 'json' ? 'active' : ''}`}
                  onClick={() => setFormat('json')}
                  style={{ gap: '6px' }}
                >
                  <Code size={13} />
                  <span>JSON Dataset</span>
                </button>
              </div>
            </div>
          </div>

          {/* TAB 1: PRINTABLE EXAM PAPER */}
          {format === 'paper' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Paper Controls Strip */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '10px 14px', background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Paper Type:</span>
                  <div className="pill-track">
                    <button
                      type="button"
                      className={`pill-track-btn ${paperMode === 'student' ? 'active' : ''}`}
                      onClick={() => setPaperMode('student')}
                      style={{ gap: '6px', fontSize: '0.78rem' }}
                    >
                      <GraduationCap size={13} />
                      <span>Student Exam Paper</span>
                    </button>
                    <button
                      type="button"
                      className={`pill-track-btn ${paperMode === 'studypack' ? 'active' : ''}`}
                      onClick={() => setPaperMode('studypack')}
                      style={{ gap: '6px', fontSize: '0.78rem' }}
                    >
                      <BookOpen size={13} />
                      <span>Complete Study Pack (+ Answers)</span>
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} color="var(--brand-primary)" /> Target: <strong>{timeAllowed}</strong>
                  </span>
                  <span>&bull;</span>
                  <span><strong>{exportQuestions.length}</strong> Questions</span>
                </div>
              </div>

              {/* Live Document Preview Card */}
              <div 
                ref={previewRef}
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(0,0,0,0.12)',
                  padding: '24px 28px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                  maxHeight: '440px',
                  overflowY: 'auto',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                {/* Simulated Paper Header */}
                <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 2px 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                        Infynno MCAT Practice Examination
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                        {paperMode === 'student' ? 'Student Exam Paper (Practice Mode - Unsolved)' : 'Complete Study Pack with Diagnostic Rationales'}
                      </p>
                    </div>
                    <div style={{ border: '1.5px solid #0f172a', borderRadius: '4px', padding: '4px 10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.62rem', textTransform: 'uppercase', fontWeight: 700, color: '#64748b' }}>Total Marks</div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>___ / {exportQuestions.length}</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#334155' }}>Candidate:</span>
                      <span style={{ flex: 1, borderBottom: '1px dotted #94a3b8', height: '12px' }}></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#334155' }}>Date:</span>
                      <span style={{ color: '#475569' }}>Today</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#334155' }}>Time Allowed:</span>
                      <span style={{ color: '#0f172a', fontWeight: 700 }}>{timeAllowed}</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Question Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {exportQuestions.map((q, idx) => {
                    const qNum = idx + 1;
                    const svgDiagram = q.image_svg || q.stage_outcomes?.visual_stimulus?.image_svg || '';
                    const imgUrl = q.image_url || q.stage_outcomes?.visual_stimulus?.image_url || '';
                    const imgDesc = q.image_description || q.stage_outcomes?.visual_stimulus?.description || '';

                    return (
                      <div key={q.id || idx} style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                            Question {qNum}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                            {q.section_label || q.section} &bull; {q.subtopic || ''}
                          </span>
                        </div>

                        {q.stimulus_text && (
                          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', padding: '10px 12px', marginBottom: '10px', fontSize: '0.8rem', fontFamily: 'Georgia, serif', lineHeight: 1.5, color: '#1e293b' }}>
                            {q.stimulus_text}
                          </div>
                        )}

                        {svgDiagram ? (
                          <div 
                            style={{ margin: '8px auto', textAlign: 'center', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', maxWidth: '380px' }}
                          >
                            <div dangerouslySetInnerHTML={{ __html: svgDiagram }} />
                            {imgDesc && (
                              <div style={{ fontSize: '0.72rem', fontStyle: 'italic', color: '#64748b', marginTop: '6px' }}>
                                {imgDesc}
                              </div>
                            )}
                          </div>
                        ) : imgUrl ? (
                          <div 
                            style={{ margin: '8px auto', textAlign: 'center', padding: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', maxWidth: '380px' }}
                          >
                            <img 
                              src={imgUrl} 
                              alt="Stimulus Diagram" 
                              style={{ maxHeight: '220px', maxWidth: '100%', objectFit: 'contain', borderRadius: '2px', display: 'inline-block' }} 
                            />
                            {imgDesc && (
                              <div style={{ fontSize: '0.72rem', fontStyle: 'italic', color: '#64748b', marginTop: '6px' }}>
                                {imgDesc}
                              </div>
                            )}
                          </div>
                        ) : null}

                        <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#0f172a', marginBottom: '8px' }}>
                          {q.question_stem || q.stem || ''}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {(q.options || []).map(opt => (
                            <div key={opt.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.8rem', color: '#1e293b', lineHeight: 1.45 }}>
                              <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontWeight: 700, flexShrink: 0, lineHeight: 1.45, userSelect: 'none' }}>[ &nbsp; ]</span>
                              <strong style={{ minWidth: '18px', flexShrink: 0, lineHeight: 1.45, color: '#0f172a' }}>{opt.id}.</strong>
                              <span style={{ flex: 1, lineHeight: 1.45 }}>{opt.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {paperMode === 'studypack' && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #0f172a' }}>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                        Answer Key &amp; Diagnostic Rationales
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {exportQuestions.map((q, idx) => (
                          <div key={q.id || idx} style={{ padding: '8px 10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.78rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <strong style={{ color: '#0f172a' }}>Q{idx + 1}:</strong>
                              <span style={{ background: '#10b981', color: '#ffffff', fontWeight: 700, padding: '1px 6px', borderRadius: '3px', fontSize: '0.7rem' }}>
                                Correct: {q.correct_answer_ids ? q.correct_answer_ids.join(', ') : (q.correct_answer || 'A')}
                              </span>
                              {q.primary_trap && (
                                <span style={{ color: '#64748b', fontSize: '0.7rem' }}>Trap: {q.primary_trap}</span>
                              )}
                            </div>
                            <div style={{ color: '#334155', lineHeight: 1.4 }}>{q.explanation}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CSV SPREADSHEET */}
          {format === 'csv' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '10px 14px', background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Exports a structured CSV table containing all AAMC MCAT schema fields (stems, passages, research stimuli, options A-D, correct keys, trap defenses, SIRS skills, scaled scores, and quality audits) compatible with Excel, Google Sheets, and psychometric databases.
              </div>

              <div 
                style={{
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  maxHeight: '340px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5
                }}
              >
                {csvContent}
              </div>
            </div>
          )}

          {/* TAB 3: JSON DATASET */}
          {format === 'json' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '10px 14px', background: 'var(--bg-surface-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Exports a formatted JSON array containing the exact full question objects, telemetry logs, and agent evaluation rubrics.
              </div>

              <div 
                style={{
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 14px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  maxHeight: '340px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5
                }}
              >
                {jsonContent}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Ready to export <strong>{exportQuestions.length}</strong> question{exportQuestions.length === 1 ? '' : 's'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn-ghost"
              onClick={onClose}
              style={{ padding: '7px 14px', fontSize: '0.8rem' }}
            >
              Cancel
            </button>

            {format === 'paper' && (
              <button
                type="button"
                className="btn-primary"
                id="btn-trigger-print-paper"
                onClick={handleNativePrint}
                disabled={exportQuestions.length === 0}
                style={{ padding: '7px 16px', fontSize: '0.8rem', gap: '6px' }}
              >
                <Printer size={14} />
                <span>🖨️ Print / Save as PDF</span>
              </button>
            )}

            {format === 'csv' && (
              <>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCopyCsv}
                  style={{ padding: '7px 14px', fontSize: '0.8rem', gap: '6px' }}
                >
                  {copiedCsv ? <Check size={14} color="var(--status-success)" /> : <Copy size={14} />}
                  <span>{copiedCsv ? 'Copied' : 'Copy CSV'}</span>
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  id="btn-download-csv"
                  onClick={handleDownloadCsv}
                  disabled={exportQuestions.length === 0}
                  style={{ padding: '7px 16px', fontSize: '0.8rem', gap: '6px' }}
                >
                  <FileDown size={14} />
                  <span>Download CSV Table</span>
                </button>
              </>
            )}

            {format === 'json' && (
              <>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCopyJson}
                  style={{ padding: '7px 14px', fontSize: '0.8rem', gap: '6px' }}
                >
                  {copiedJson ? <Check size={14} color="var(--status-success)" /> : <Copy size={14} />}
                  <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  id="btn-download-json"
                  onClick={handleDownloadJson}
                  disabled={exportQuestions.length === 0}
                  style={{ padding: '7px 16px', fontSize: '0.8rem', gap: '6px' }}
                >
                  <FileDown size={14} />
                  <span>Download JSON File</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
