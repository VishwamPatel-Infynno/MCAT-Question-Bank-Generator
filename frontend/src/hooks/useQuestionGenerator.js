import { useState, useCallback } from 'react';
import { generateQuestionStream } from '../services/api';

export function useQuestionGenerator({ onNeedsApiKey } = {}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeAgent, setActiveAgent] = useState('Idle');
  const [iterationCount, setIterationCount] = useState(1);
  const [events, setEvents] = useState([]);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [rejectedData, setRejectedData] = useState(null);
  const [latestReview, setLatestReview] = useState(null);

  const startGeneration = useCallback((payload) => {
    setIsGenerating(true);
    setActiveQuestion(null);
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
        }
        if (evt.event_type === 'workflow_error') {
          setIsGenerating(false);
          setActiveAgent('Configuration Required');
          if (evt.message && evt.message.includes('DeepInfra API Key') && onNeedsApiKey) {
            onNeedsApiKey();
          }
        }
      },
      (err) => {
        console.error('Workflow error:', err);
        setIsGenerating(false);
        setActiveAgent('Error');
      },
      (finalData) => {
        setIsGenerating(false);
        setActiveAgent('Completed');
        const q = finalData?.question || finalData;
        if (q) {
          setActiveQuestion(q);
        }
      }
    );
  }, [onNeedsApiKey]);

  const reset = useCallback(() => {
    setIsGenerating(false);
    setActiveAgent('Idle');
    setEvents([]);
    setActiveQuestion(null);
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
    rejectedData,
    latestReview,
    startGeneration,
    reset
  };
}
