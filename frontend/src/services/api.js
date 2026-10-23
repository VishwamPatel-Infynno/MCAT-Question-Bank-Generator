// API Service for communicating with backend API
const API_BASE = '/api';

/**
 * Asserts that a fetch Response is successful (2xx).
 * Extracts the server error detail from JSON body when available.
 * @param {Response} res - The fetch Response object.
 * @param {string} context - Human-readable description of the call for error messages.
 * @returns {Promise<Response>} The same response if OK.
 * @throws {Error} A descriptive error if the response is not OK.
 */
async function assertOk(res, context = 'API call') {
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.clone().json();
      detail = body?.detail || body?.message || '';
    } catch { /* ignore parse failures — use status code only */ }
    throw new Error(
      `${context} failed (HTTP ${res.status})${detail ? ': ' + detail : ''}`
    );
  }
  return res;
}

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`);
  await assertOk(res, 'Health check');
  return res.json();
}

export async function fetchSections() {
  const res = await fetch(`${API_BASE}/sections`);
  await assertOk(res, 'Fetch sections');
  return res.json();
}

export async function fetchTaxonomy() {
  const res = await fetch(`${API_BASE}/taxonomy`);
  await assertOk(res, 'Fetch taxonomy');
  return res.json();
}

export async function fetchQuestions(params = {}, signal = null) {
  const query = new URLSearchParams();
  if (params.section) query.append('section', params.section);
  if (params.difficulty) query.append('difficulty', params.difficulty);
  if (params.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE}/questions?${query.toString()}`, { signal });
  await assertOk(res, 'Fetch questions');
  return res.json();
}

export async function fetchQuestionById(id) {
  const res = await fetch(`${API_BASE}/questions/${id}`);
  await assertOk(res, `Fetch question ${id}`);
  return res.json();
}

export async function deleteQuestion(id) {
  const res = await fetch(`${API_BASE}/questions/${id}`, { method: 'DELETE' });
  await assertOk(res, `Delete question ${id}`);
  return res.json();
}

export async function batchDeleteQuestions(ids) {
  const res = await fetch(`${API_BASE}/questions/delete-batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  });
  await assertOk(res, 'Bulk delete questions');
  return res.json();
}

export async function approveQuestion(question) {
  const res = await fetch(`${API_BASE}/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(question)
  });
  await assertOk(res, 'Save approved question');
  return res.json();
}

export async function batchApproveQuestions(questions) {
  const res = await fetch(`${API_BASE}/questions/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(questions)
  });
  await assertOk(res, 'Bulk-save approved questions');
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
      // eslint-disable-next-line no-await-in-loop
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
              onComplete(eventData.data);
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

export async function startBackgroundBatch(payload) {
  const res = await fetch(`${API_BASE}/batches/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  await assertOk(res, 'Start background batch');
  return res.json();
}

export async function fetchBatches(params = {}, signal = null) {
  const query = new URLSearchParams();
  if (params.section) query.append('section', params.section);
  if (params.status) query.append('status', params.status);

  const res = await fetch(`${API_BASE}/batches?${query.toString()}`, { signal });
  await assertOk(res, 'Fetch batches');
  return res.json();
}

export async function fetchBatchDetail(batchId, signal = null) {
  const res = await fetch(`${API_BASE}/batches/${batchId}`, { signal });
  await assertOk(res, `Fetch batch ${batchId}`);
  return res.json();
}

export async function deleteBatch(batchId) {
  const res = await fetch(`${API_BASE}/batches/${batchId}`, { method: 'DELETE' });
  await assertOk(res, `Delete batch ${batchId}`);
  return res.json();
}
