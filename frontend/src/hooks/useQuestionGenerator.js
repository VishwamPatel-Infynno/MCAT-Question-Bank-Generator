import { useState, useCallback, useRef } from 'react';
import { generateQuestionStream } from '../services/api';

export function useQuestionGenerator({ onNeedsApiKey } = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeAgent, setActiveAgent] = useState('Idle');
  const [iterationCount, setIterationCount] = useState(1);
  const [events, setEvents] = useState([]);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [stagedQuestions, setStagedQuestions] = useState([]);
  const [batchProgress, setBatchProgress] = useState(null);
  const [rejectedData, setRejectedData] = useState(null);
  const [latestReview, setLatestReview] = useState(null);
  const abortControllerRef = useRef(null);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setActiveAgent('Idle');
  }, []);

  const startGeneration = useCallback((payload) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const reqTotal = payload?.questions_to_generate || 1;

    setIsGenerating(true);
    setActiveQuestion(null);
    setStagedQuestions([]);
    setBatchProgress(reqTotal > 1 ? { current: 0, total: reqTotal, message: 'Initiating batch pipeline...' } : null);
    setRejectedData(null);
    setEvents([]);
    setLatestReview(null);
    setIterationCount(1);
    setActiveAgent('Question Generator');

    generateQuestionStream(
      payload,
      (evt) => {
        setEvents((prev) => [...prev, evt]);
        if (evt.agent_name && evt.agent_name !== 'System') {
          setActiveAgent(evt.agent_name);
        }

        if (evt.event_type === 'batch_progress' && evt.data) {
          setBatchProgress({
            current: evt.data.current_index,
            total: evt.data.total_count,
            interactionType: evt.data.interaction_type,
            passageRequired: evt.data.passage_required,
            message: evt.message
          });
        }

        if (evt.event_type === 'question_generated' && evt.data?.question) {
          const newQ = evt.data.question;
          setStagedQuestions((prev) => {
            const exists = prev.some((q) => q.id === newQ.id);
            if (exists) return prev;
            return [...prev, newQ];
          });
          setActiveQuestion((prev) => prev || newQ);
        }

        if (evt.event_type === 'agent_complete' && evt.agent_name === 'Question Reviewer') {
          if (evt.data?.review) {
            setLatestReview(evt.data.review);
          }
          if (evt.data?.iteration) {
            setIterationCount(evt.data.iteration);
          }
        }
        if (evt.event_type === 'agent_start' && evt.agent_name === 'Question Re-Generator') {
          setIterationCount((prev) => prev + 1);
        }
        if (evt.event_type === 'workflow_rejected') {
          setIsGenerating(false);
          setActiveAgent('Quality Gate (Halted)');
          setRejectedData(evt.data);
          abortControllerRef.current = null;
        }
        if (evt.event_type === 'workflow_error') {
          setIsGenerating(false);
          setActiveAgent('Configuration Required');
          abortControllerRef.current = null;
          if (evt.message && evt.message.includes('DeepInfra API Key') && onNeedsApiKey) {
            onNeedsApiKey();
          }
        }
      },
      (err) => {
        abortControllerRef.current = null;
        if (err?.isAborted) {
          setIsGenerating(false);
          setActiveAgent('Idle');
          return;
        }
        console.error('Workflow error:', err);
        setIsGenerating(false);
        setActiveAgent('Error');
      },
      (finalData) => {
        abortControllerRef.current = null;
        setIsGenerating(false);
        setActiveAgent('Completed');
        const qList = finalData?.questions || (finalData?.question ? [finalData.question] : []);
        if (qList.length > 0) {
          setStagedQuestions(qList);
          setActiveQuestion(qList[0]);
        } else if (finalData?.question) {
          setActiveQuestion(finalData.question);
        }
      },
      controller.signal
    );
  }, [onNeedsApiKey]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setActiveAgent('Idle');
    setEvents([]);
    setActiveQuestion(null);
    setStagedQuestions([]);
    setBatchProgress(null);
    setRejectedData(null);
    setLatestReview(null);
    setIterationCount(1);
  }, []);

  return {
    isGenerating,
    activeAgent,
    iterationCount,
    events,
    activeQuestion,
    setActiveQuestion,
    stagedQuestions,
    setStagedQuestions,
    batchProgress,
    rejectedData,
    latestReview,
    startGeneration,
    cancelGeneration,
    reset
  };
}
