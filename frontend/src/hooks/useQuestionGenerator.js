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
  const [targetBatchTotal, setTargetBatchTotal] = useState(1);
  const [rejectedData, setRejectedData] = useState(null);
  const [latestReview, setLatestReview] = useState(null);
  const [perQuestionState, setPerQuestionState] = useState({});
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
    setTargetBatchTotal(reqTotal);

    setIsGenerating(true);
    setActiveQuestion(null);
    setStagedQuestions([]);
    setBatchProgress(reqTotal > 1 ? { current: 1, total: reqTotal, message: 'Drafting Question 1...' } : null);
    setRejectedData(null);
    setEvents([]);
    setLatestReview(null);
    setIterationCount(1);
    setActiveAgent('Question Writer');

    // Pre-populate per-question swarm state for all target questions
    const multiCount = payload?.interaction_type_split?.multi || 0;
    const passageCount = payload?.passage_length_split?.passage || 0;
    const initialMap = {};
    for (let i = 1; i <= reqTotal; i++) {
      const isMulti = i <= multiCount;
      const isPassage = i <= passageCount;
      initialMap[i] = {
        index: i,
        stage: 'drafting',
        agentName: 'Question Writer',
        message: `Drafting ${isMulti ? 'Multi-Choice' : 'Single Choice'} question (${isPassage ? 'Reading Passage' : 'Short Scenario'})...`,
        iteration: 1,
        score: null,
        interactionType: isMulti ? 'multi_choice' : 'single_choice',
        passageRequired: isPassage ? 'Yes' : 'No',
        isComplete: false,
        question: null,
        startTime: Date.now()
      };
    }
    setPerQuestionState(initialMap);

    generateQuestionStream(
      payload,
      (evt) => {
        setEvents((prev) => [...prev, evt]);
        if (evt.agent_name && evt.agent_name !== 'System') {
          setActiveAgent(evt.agent_name);
        }

        // Determine target question index for per-question state tracking
        let targetIdx = evt.data?.index || evt.data?.current_index || null;
        if (!targetIdx && evt.message) {
          const match = evt.message.match(/(?:Q|Question|draft\s+)(\d+)/i);
          if (match) targetIdx = parseInt(match[1], 10);
        }

        if (targetIdx && targetIdx >= 1 && targetIdx <= reqTotal) {
          setPerQuestionState((prev) => {
            const current = prev[targetIdx] || {
              index: targetIdx,
              stage: 'drafting',
              iteration: 1,
              agentName: 'Question Writer',
              message: evt.message
            };

            let nextStage = current.stage;
            if (evt.data?.stage) {
              nextStage = evt.data.stage;
            } else if (evt.agent_name === 'Question Writer' || evt.agent_name === 'Question Generator') {
              nextStage = 'drafting';
            } else if (evt.agent_name === 'Quality Reviewer' || evt.agent_name === 'Question Reviewer') {
              nextStage = 'reviewing';
            } else if (evt.agent_name === 'Question Improver' || evt.agent_name === 'Question Re-Generator') {
              nextStage = 'remediating';
            } else if (evt.agent_name === 'Diagram & Chart Maker' || evt.agent_name === 'Image Generator') {
              nextStage = 'image';
            }

            let nextScore = current.score;
            if (evt.data?.score != null) {
              nextScore = evt.data.score;
            } else if (evt.data?.review?.total_score != null) {
              nextScore = evt.data.review.total_score;
            }

            let nextIter = evt.data?.iteration || current.iteration;
            let isDone = current.isComplete;
            let qObj = current.question;

            if (evt.event_type === 'question_generated' && evt.data?.question) {
              nextStage = 'completed';
              isDone = true;
              qObj = evt.data.question;
              nextScore = evt.data.question.final_score || nextScore || 95;
            }

            return {
              ...prev,
              [targetIdx]: {
                ...current,
                stage: nextStage,
                agentName: (evt.agent_name && evt.agent_name !== 'System') ? evt.agent_name : current.agentName,
                message: evt.message || current.message,
                iteration: nextIter,
                score: nextScore,
                isComplete: isDone,
                question: qObj,
                interactionType: evt.data?.interaction_type || current.interactionType,
                passageRequired: evt.data?.passage_required || current.passageRequired
              }
            };
          });
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

        if (evt.event_type === 'agent_complete' && (evt.agent_name === 'Quality Reviewer' || evt.agent_name === 'Question Reviewer')) {
          if (evt.data?.review) {
            setLatestReview(evt.data.review);
          }
          if (evt.data?.iteration) {
            setIterationCount(evt.data.iteration);
          }
        }
        if (evt.event_type === 'agent_start' && (evt.agent_name === 'Question Improver' || evt.agent_name === 'Question Re-Generator')) {
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
    setPerQuestionState({});
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
    targetBatchTotal,
    perQuestionState,
    rejectedData,
    latestReview,
    startGeneration,
    cancelGeneration,
    reset
  };
}
