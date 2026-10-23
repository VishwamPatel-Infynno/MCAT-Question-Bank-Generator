import { useState, useEffect, useCallback, useMemo } from 'react';
import { fetchQuestions, deleteQuestion } from '../services/api';

export function useQuestionBank() {
  const [rawQuestions, setRawQuestions] = useState([]);
  const [repoStats, setRepoStats] = useState({ total_tokens: 0, total_cost_usd: 0 });
  const [loading, setLoading] = useState(true);
  const [sectionFilter, setSectionFilter] = useState('');
  const [diffFilter, setDiffFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'score_desc' | 'score_asc' | 'difficulty'
  const [copiedId, setCopiedId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Debounce search query by 250ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch questions with inflight cancellation via AbortController
  useEffect(() => {
    void refreshTrigger;
    const controller = new AbortController();

    fetchQuestions(
      {
        section: sectionFilter || undefined,
        difficulty: diffFilter || undefined,
        search: debouncedSearch || undefined
      },
      controller.signal
    )
      .then((data) => {
        setRawQuestions(data.questions || []);
        setRepoStats({
          total_tokens: data.total_tokens || 0,
          total_cost_usd: data.total_cost_usd || 0
        });
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.error('Failed to load question bank:', err);
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [sectionFilter, diffFilter, debouncedSearch, refreshTrigger]);

  const loadQuestions = useCallback(() => {
    setLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleDelete = useCallback(
    async (id, e) => {
      if (e) e.stopPropagation();
      if (window.confirm('Delete this question from your Question Bank?')) {
        await deleteQuestion(id);
        await loadQuestions();
      }
    },
    [loadQuestions]
  );

  const handleCopy = useCallback((q, e) => {
    if (e) e.stopPropagation();
    const formatted =
      `[AAMC MCAT - ${q.section_label || q.section}] (${q.difficulty})\n` +
      `${q.stimulus_text ? q.stimulus_text + '\n\n' : ''}` +
      `Question: ${q.question_stem}\n\n` +
      q.options.map((o) => `${o.id}: ${o.text}`).join('\n') +
      `\n\nCorrect Answer: ${q.correct_answer_id}\n\nExplanation: ${q.explanation}`;
    navigator.clipboard.writeText(formatted);
    setCopiedId(q.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  // Multi-criteria sorting executed in-memory with useMemo
  const questions = useMemo(() => {
    const list = [...rawQuestions];
    if (sortBy === 'score_desc') {
      return list.sort((a, b) => (b.final_score || 0) - (a.final_score || 0));
    }
    if (sortBy === 'score_asc') {
      return list.sort((a, b) => (a.final_score || 0) - (b.final_score || 0));
    }
    if (sortBy === 'difficulty') {
      const order = { easy: 1, medium: 2, hard: 3 };
      return list.sort(
        (a, b) => (order[(a.difficulty || '').toLowerCase()] || 0) - (order[(b.difficulty || '').toLowerCase()] || 0)
      );
    }
    // Default 'newest'
    return list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [rawQuestions, sortBy]);

  const avgScore = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.round(questions.reduce((acc, q) => acc + (q.final_score || 0), 0) / questions.length);
  }, [questions]);

  return {
    questions,
    rawQuestionsCount: rawQuestions.length,
    repoStats,
    loading,
    sectionFilter,
    setSectionFilter,
    diffFilter,
    setDiffFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    copiedId,
    loadQuestions,
    handleDelete,
    handleCopy,
    avgScore
  };
}
