import React, { useState } from 'react';
import { Layers, Play, Upload, Sparkles, FileSpreadsheet, Plus, Trash2, CheckCircle } from 'lucide-react';
import QuestionCard from '../question/QuestionCard';
import AgentVisualizer from '../generator/AgentVisualizer';
import { useQuestionGenerator } from '../../hooks/useQuestionGenerator';
import { approveQuestion, batchApproveQuestions } from '../../services/api';

const DEFAULT_SAMPLE_COMBINATIONS = [
  {
    Combination_ID: 'CMB00001',
    Section: 'VR',
    Subcategory: 'Inference',
    Difficulty: 'Easy',
    Content_Domain: 'Science',
    Question_Type: 'Passage_MCQ',
    Interaction_Type: 'single_choice',
    Primary_Trap: 'Keyword_Trap',
    Passage_Required: 'Yes',
    Passage_Questions: 3,
    Image_Required: 'No',
    Visual_Type: 'None',
    Questions_To_Generate: 4
  },
  {
    Combination_ID: 'CMB00002',
    Section: 'VR',
    Subcategory: 'Inference',
    Difficulty: 'Easy',
    Content_Domain: 'Science',
    Question_Type: 'True_False_Cant_Tell',
    Interaction_Type: 'single_choice',
    Primary_Trap: 'Partial_Match',
    Passage_Required: 'Yes',
    Passage_Questions: 4,
    Image_Required: 'No',
    Visual_Type: 'None',
    Questions_To_Generate: 5
  },
  {
    Combination_ID: 'CMB00003',
    Section: 'VR',
    Subcategory: 'Inference',
    Difficulty: 'Easy',
    Content_Domain: 'Healthcare',
    Question_Type: 'Passage_MCQ',
    Interaction_Type: 'single_choice',
    Primary_Trap: 'Keyword_Trap',
    Passage_Required: 'Yes',
    Passage_Questions: 4,
    Image_Required: 'No',
    Visual_Type: 'None',
    Questions_To_Generate: 5
  }
];

export default function MatrixRunner({ onOpenSettings }) {
  const [combinations, setCombinations] = useState(DEFAULT_SAMPLE_COMBINATIONS);
  const [selectedCombIndex, setSelectedCombIndex] = useState(0);
  const [tsvInput, setTsvInput] = useState('');
  const [showImporter, setShowImporter] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState(null);
  const [stagedCandidates, setStagedCandidates] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [isBulkApproving, setIsBulkApproving] = useState(false);
  const [prevActiveQuestionId, setPrevActiveQuestionId] = useState(null);

  const {
    isGenerating,
    activeAgent,
    iterationCount,
    events,
    activeQuestion,
    startGeneration
  } = useQuestionGenerator({
    onNeedsApiKey: onOpenSettings
  });

  // Collect generated candidate questions into the Staged Batch Review Queue without cascading renders
  if (activeQuestion && activeQuestion.id !== prevActiveQuestionId) {
    setPrevActiveQuestionId(activeQuestion.id);
    if (!stagedCandidates.some(q => q.id === activeQuestion.id)) {
      setStagedCandidates([activeQuestion, ...stagedCandidates]);
    }
  }

  const handleApproveCandidate = async (candidate) => {
    try {
      await approveQuestion(candidate);
      setSavedIds(prev => new Set([...prev, candidate.id]));
    } catch (err) {
      console.error('Failed to approve question:', err);
      alert('Failed to save question to database.');
    }
  };

  const handleApproveAll = async () => {
    const unapproved = stagedCandidates.filter(c => !savedIds.has(c.id));
    if (unapproved.length === 0 || isBulkApproving) return;
    setIsBulkApproving(true);
    try {
      await batchApproveQuestions(unapproved);
      setSavedIds(prev => new Set([...prev, ...unapproved.map(c => c.id)]));
    } catch (err) {
      console.error('Failed to batch approve questions:', err);
      alert('Failed to batch approve questions.');
    } finally {
      setIsBulkApproving(false);
    }
  };

  const handleDiscardCandidate = (candidateId) => {
    setStagedCandidates(prev => prev.filter(c => c.id !== candidateId));
  };

  const selectedCombination = combinations[selectedCombIndex] || combinations[0];

  const handleRunCombination = (comb) => {
    const batchId = currentBatchId || crypto.randomUUID();
    setCurrentBatchId(batchId);

    const payload = {
      section: comb.Section,
      subtopic: comb.Subcategory,
      difficulty: (comb.Difficulty || 'Medium').toLowerCase(),
      combination_id: comb.Combination_ID || crypto.randomUUID(),
      batch_id: batchId,
      subcategory: comb.Subcategory,
      content_domain: comb.Content_Domain,
      question_type: comb.Question_Type,
      interaction_type: comb.Interaction_Type,
      primary_trap: comb.Primary_Trap,
      passage_required: comb.Passage_Required,
      passage_questions: Number(comb.Passage_Questions) || 3,
      require_image: comb.Image_Required === 'Yes' || comb.Visual_Type !== 'None',
      visual_type: comb.Visual_Type || 'None',
      custom_prompt: `Focus on ${comb.Content_Domain} domain. Structure question strictly as ${comb.Question_Type} with primary engineered trap: ${comb.Primary_Trap}.`
    };

    startGeneration(payload);
  };

  const handleAddRow = () => {
    const newId = crypto.randomUUID();
    const newRow = {
      Combination_ID: newId,
      Section: 'VR',
      Subcategory: 'Inference',
      Difficulty: 'Medium',
      Content_Domain: 'Science',
      Question_Type: 'Passage_MCQ',
      Interaction_Type: 'single_choice',
      Primary_Trap: 'Keyword_Trap',
      Passage_Required: 'Yes',
      Passage_Questions: 3,
      Image_Required: 'No',
      Visual_Type: 'None',
      Questions_To_Generate: 1
    };
    setCombinations([...combinations, newRow]);
    setSelectedCombIndex(combinations.length);
  };

  const handleDeleteRow = (idx, e) => {
    e.stopPropagation();
    if (combinations.length <= 1) return;
    const updated = combinations.filter((_, i) => i !== idx);
    setCombinations(updated);
    if (selectedCombIndex >= updated.length) {
      setSelectedCombIndex(updated.length - 1);
    }
  };

  const handleImportTSV = () => {
    if (!tsvInput.trim()) return;
    try {
      const lines = tsvInput.trim().split('\n');
      if (lines.length < 2) return;
      const headers = lines[0].split('\t').map(h => h.trim());
      const parsed = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split('\t').map(p => p.trim());
        if (parts.length >= 2) {
          const rowObj = {};
          headers.forEach((h, idx) => {
            rowObj[h] = parts[idx] || '';
          });
          // Ensure every imported row has a valid Combination UUID if blank
          if (!rowObj.Combination_ID || !rowObj.Combination_ID.trim()) {
            rowObj.Combination_ID = crypto.randomUUID();
          }
          parsed.push(rowObj);
        }
      }

      if (parsed.length > 0) {
        setCombinations(parsed);
        setSelectedCombIndex(0);
        setShowImporter(false);
        setTsvInput('');
      }
    } catch (err) {
      console.error('Failed to parse TSV:', err);
      alert('Could not parse TSV data. Please check column format.');
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--brand-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff'
            }}>
              <Layers size={18} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Batch Combination Matrix Runner
            </h2>
            <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
              Manager Matrix Mode
            </span>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Execute multi-agent generation against strict syllabus matrices (Combination ID, Content Domain, Question Type &amp; Trap engineering).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowImporter(!showImporter)}
            style={{ padding: '8px 14px', fontSize: '0.8rem', gap: '6px' }}
          >
            <Upload size={14} />
            <span>{showImporter ? 'Hide Importer' : 'Import TSV / Spreadsheet'}</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={() => handleRunCombination(selectedCombination)}
            disabled={isGenerating}
            style={{ padding: '10px 18px', fontSize: '0.85rem', gap: '6px' }}
          >
            <Play size={15} />
            <span>{isGenerating ? 'Running Matrix Agent...' : `Run ${selectedCombination?.Combination_ID || 'Selected'}`}</span>
          </button>
        </div>
      </div>

      {/* TSV / Spreadsheet Paste Importer */}
      {showImporter && (
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={16} color="var(--brand-primary)" />
              Paste TSV Data (from Excel or Google Sheets)
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Requires header row with Combination_ID, Section, Subcategory...
            </span>
          </div>

          <textarea
            value={tsvInput}
            onChange={(e) => setTsvInput(e.target.value)}
            placeholder={"Combination_ID\tSection\tSubcategory\tDifficulty\tContent_Domain\tQuestion_Type\tInteraction_Type\tPrimary_Trap\tPassage_Required\tPassage_Questions\tImage_Required\tVisual_Type\tQuestions_To_Generate\nCMB00001\tVR\tInference\tEasy\tScience\tPassage_MCQ\tsingle_choice\tKeyword_Trap\tYes\t3\tNo\tNone\t4"}
            rows={5}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', width: '100%', resize: 'vertical' }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowImporter(false)}
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleImportTSV}
              style={{ padding: '6px 16px', fontSize: '0.8rem' }}
            >
              Load Combinations
            </button>
          </div>
        </div>
      )}

      {/* Matrix Table */}
      <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Configured Combinations ({combinations.length})
            </span>
            {currentBatchId && (
              <span className="badge badge-purple" style={{ fontFamily: 'monospace', fontSize: '0.7rem' }} title={`Active Batch UUID: ${currentBatchId}`}>
                Batch: {currentBatchId.slice(0, 8)}...
              </span>
            )}
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleAddRow}
            style={{ padding: '6px 12px', fontSize: '0.775rem', gap: '5px' }}
            title="Add new combination row with auto-generated UUID4"
          >
            <Plus size={14} /> Add Row
          </button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border-light)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '8px 10px' }}>Select</th>
              <th style={{ padding: '8px 10px' }}>Combination_ID</th>
              <th style={{ padding: '8px 10px' }}>Section</th>
              <th style={{ padding: '8px 10px' }}>Subcategory</th>
              <th style={{ padding: '8px 10px' }}>Difficulty</th>
              <th style={{ padding: '8px 10px' }}>Content_Domain</th>
              <th style={{ padding: '8px 10px' }}>Question_Type</th>
              <th style={{ padding: '8px 10px' }}>Primary_Trap</th>
              <th style={{ padding: '8px 10px' }}>Passage</th>
              <th style={{ padding: '8px 10px' }}>Visual</th>
              <th style={{ padding: '8px 10px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {combinations.map((comb, idx) => {
              const isSelected = selectedCombIndex === idx;
              return (
                <tr
                  key={comb.Combination_ID || idx}
                  onClick={() => setSelectedCombIndex(idx)}
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                    background: isSelected ? 'var(--brand-primary-light)' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <td style={{ padding: '10px' }}>
                    <input
                      type="radio"
                      checked={isSelected}
                      onChange={() => setSelectedCombIndex(idx)}
                    />
                  </td>
                  <td style={{ padding: '10px', fontWeight: 700, color: 'var(--brand-indigo)' }}>
                    {comb.Combination_ID}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span className="badge badge-cyan">{comb.Section}</span>
                  </td>
                  <td style={{ padding: '10px', fontWeight: 600 }}>{comb.Subcategory}</td>
                  <td style={{ padding: '10px' }}>
                    <span className={`badge ${comb.Difficulty?.toLowerCase() === 'easy' ? 'badge-emerald' : 'badge-amber'}`}>
                      {comb.Difficulty}
                    </span>
                  </td>
                  <td style={{ padding: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {comb.Content_Domain}
                  </td>
                  <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>
                    {comb.Question_Type}
                  </td>
                  <td style={{ padding: '10px', color: '#b45309', fontWeight: 600 }}>
                    {comb.Primary_Trap}
                  </td>
                  <td style={{ padding: '10px' }}>{comb.Passage_Required} ({comb.Passage_Questions}q)</td>
                  <td style={{ padding: '10px' }}>{comb.Visual_Type || 'None'}</td>
                  <td style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCombIndex(idx);
                          handleRunCombination(comb);
                        }}
                        disabled={isGenerating}
                        style={{ padding: '4px 10px', fontSize: '0.725rem' }}
                      >
                        <Play size={12} /> Run
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteRow(idx, e)}
                        title="Delete combination row"
                        disabled={combinations.length <= 1}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: combinations.length <= 1 ? 'var(--text-muted)' : 'var(--brand-danger)',
                          cursor: combinations.length <= 1 ? 'not-allowed' : 'pointer',
                          padding: '4px 6px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          opacity: combinations.length <= 1 ? 0.4 : 1
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Live Generation Stepper & Question Output */}
      {isGenerating && (
        <AgentVisualizer
          activeAgent={activeAgent}
          iterationCount={iterationCount}
          events={events}
          isGenerating={isGenerating}
        />
      )}

      {/* Staged Batch Review Queue */}
      {stagedCandidates.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-panel" style={{
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            background: 'linear-gradient(135deg, rgba(236, 253, 245, 0.95) 0%, rgba(240, 253, 250, 0.95) 100%)',
            border: '1px solid #a7f3d0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sparkles size={20} color="#059669" />
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#065f46', margin: 0 }}>
                  Staged Batch Review Queue ({stagedCandidates.length})
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#047857' }}>
                  {stagedCandidates.filter(c => savedIds.has(c.id)).length} Approved &amp; Saved &bull; {stagedCandidates.filter(c => !savedIds.has(c.id)).length} Pending Review
                </span>
              </div>
            </div>

            {stagedCandidates.some(c => !savedIds.has(c.id)) && (
              <button
                type="button"
                id="btn-approve-all-candidates"
                className="btn-primary"
                onClick={handleApproveAll}
                disabled={isBulkApproving}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  borderColor: '#059669',
                  padding: '9px 20px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  gap: '8px'
                }}
              >
                <CheckCircle size={16} /> {isBulkApproving ? 'Saving...' : `Approve All Candidates (${stagedCandidates.filter(c => !savedIds.has(c.id)).length})`}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {stagedCandidates.map((candidate) => (
              <QuestionCard
                key={candidate.id}
                question={candidate}
                isSaved={savedIds.has(candidate.id)}
                onApprove={() => handleApproveCandidate(candidate)}
                onDiscard={() => handleDiscardCandidate(candidate.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
