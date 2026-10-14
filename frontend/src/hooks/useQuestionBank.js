import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchQuestions, deleteQuestion } from '../services/api';

export function useQuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [repoStats, setRepoStats] = useState({ total_tokens: 0, total_cost_usd: 0 });
  const [loading, setLoading] = useState(true);
  const [sectionFilter, setSectionFilter] = useState('');
  const [diffFilter, setDiffFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    fetchQuestions({
      section: sectionFilter || undefined,
      difficulty: diffFilter || undefined,
      search: searchQuery || undefined
    }).then(data => {
      if (isMounted) {
        setQuestions(data.questions || []);
        setRepoStats({
          total_tokens: data.total_tokens || 0,
          total_cost_usd: data.total_cost_usd || 0
        });
        setLoading(false);
      }
    }).catch(err => {
      console.error('Failed to load question bank:', err);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [sectionFilter, diffFilter, searchQuery, refreshTrigger]);

  const loadQuestions = useCallback(() => {
    setLoading(true);
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const handleDelete = useCallback(async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Delete this question from your Question Bank?')) {
      await deleteQuestion(id);
      await loadQuestions();
    }
  }, [loadQuestions]);

  const handleCopy = useCallback((q, e) => {
    if (e) e.stopPropagation();
    const formatted = `[UK UCAT - ${q.section_label || q.section}] (${q.difficulty})\n` +
      `${q.stimulus_text ? q.stimulus_text + '\n\n' : ''}` +
      `Question: ${q.question_stem}\n\n` +
      q.options.map(o => `${o.id}: ${o.text}`).join('\n') +
      `\n\nCorrect Answer: ${q.correct_answer_id}\n\nExplanation: ${q.explanation}`;
    navigator.clipboard.writeText(formatted);
    setCopiedId(q.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const avgScore = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.round(questions.reduce((acc, q) => acc + (q.final_score || 0), 0) / questions.length);
  }, [questions]);

  return {
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
    loadQuestions,
    handleDelete,
    handleCopy,
    avgScore
  };
}
