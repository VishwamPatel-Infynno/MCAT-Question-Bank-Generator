// API Service for communicating with FastAPI backend
const API_BASE = '/api';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  return res.json();
}

export async function fetchSections() {
  const res = await fetch(`${API_BASE}/sections`);
  return res.json();
}

export async function fetchQuestions(params = {}, signal = null) {
  const query = new URLSearchParams();
  if (params.section) query.append('section', params.section);
  if (params.difficulty) query.append('difficulty', params.difficulty);
  if (params.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE}/questions?${query.toString()}`, { signal });
  return res.json();
}

export async function fetchQuestionById(id) {
  const res = await fetch(`${API_BASE}/questions/${id}`);
  if (!res.ok) throw new Error('Question not found');
  return res.json();
}

export async function deleteQuestion(id) {
  const res = await fetch(`${API_BASE}/questions/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function approveQuestion(question) {
  const res = await fetch(`${API_BASE}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(question)
  });
  if (!res.ok) throw new Error('Failed to save approved question');
  return res.json();
}

export async function batchApproveQuestions(questions) {
  const res = await fetch(`${API_BASE}/questions/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(questions)
  });
  if (!res.ok) throw new Error('Failed to bulk-save approved questions');
  return res.json();
}

export async function fetchSettings() {
  const res = await fetch(`${API_BASE}/config`);
  return res.json();
}

export async function updateSettings(settings) {
  const res = await fetch(`${API_BASE}/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  return res.json();
}

export function getExportUrl(format = 'json') {
  return `${API_BASE}/export?format=${format}`;
}

export async function generateQuestionStream(payload, onEvent, onError, onComplete, signal = null) {
  try {
    const response = await fetch(`${API_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop(); // keep last incomplete chunk

      for (const block of lines) {
        const trimmed = block.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const eventData = JSON.parse(jsonStr);
            onEvent(eventData);
            if (eventData.event_type === 'workflow_complete') {
              onComplete(eventData.data?.question);
            }
          } catch (err) {
            console.error('Failed to parse SSE JSON block:', err, jsonStr);
          }
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      if (onError) onError({ isAborted: true, message: 'Generation cancelled' });
      return;
    }
    console.error('SSE Stream error:', err);
    if (onError) onError(err);
  }
}
