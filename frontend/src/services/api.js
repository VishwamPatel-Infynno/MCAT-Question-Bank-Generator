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
    } catch { /* ignore parse failures - use status code only */ }
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

/**
 * Fetches the full manager MCAT dependent taxonomy directly from backend API.
 * Used for dynamic outline updates and synchronizing runtime taxonomy state.
 */
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
  if (params.status) query.append('status', params.status);
  if (params.batch_id) query.append('batch_id', params.batch_id);
  if (params.job_id) query.append('job_id', params.job_id);
  if (params.passage_id) query.append('passage_id', params.passage_id);

  const res = await fetch(`${API_BASE}/questions?${query.toString()}`, { signal });
  await assertOk(res, 'Fetch questions');
  return res.json();
}

export async function fetchQuestionCounts(signal = null) {
  const res = await fetch(`${API_BASE}/questions/counts`, { signal });
  await assertOk(res, 'Fetch question counts');
  return res.json();
}

export async function updateQuestionStatus(id, status) {
  const res = await fetch(`${API_BASE}/questions/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  await assertOk(res, `Update question ${id} status to ${status}`);
  return res.json();
}

export async function batchUpdateQuestionStatus(ids, status) {
  const res = await fetch(`${API_BASE}/questions/update-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, status })
  });
  await assertOk(res, `Bulk update questions status to ${status}`);
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

/**
 * Approves and saves a single question to the Question Bank.
 *
 * POSTs the full question object to `/api/questions`. On success the question
 * is persisted with status `in_bank` and a database-assigned ID is returned.
 *
 * @param {Object} question - Full Question schema object (must include all required fields).
 * @returns {Promise<Object>} The saved question record as returned by the API.
 * @throws {Error} If the HTTP response is not 2xx.
 */
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

/**
 * Manually overrides a duplicate warning on a question and approves it to Question Bank.
 * @param {string} id - Question ID.
 * @returns {Promise<Object>} The updated question record.
 */
export async function overrideQuestionDuplicate(id) {
  const res = await fetch(`${API_BASE}/questions/${id}/override-duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  await assertOk(res, `Override duplicate on question ${id}`);
  return res.json();
}

/**
 * Checks a candidate question for duplicates against the Question Bank on demand.
 * @param {Object} payload - Question payload with section, subtopic, question_stem, options.
 * @returns {Promise<Object>} Duplicate check result with similarity score and matched question.
 */
export async function checkQuestionDuplicate(payload) {
  const res = await fetch(`${API_BASE}/questions/check-duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  await assertOk(res, 'Check question duplicate');
  return res.json();
}

/**
 * Streams SSE events from the multi-agent generation API in real time.
 *
 * Opens an HTTP POST to `/api/generate`, reads the response body as a
 * Server-Sent Events stream, parses each `data:` line, and dispatches
 * events to the caller via callbacks.
 *
 * @param {Object} payload - GenerationRequest payload (section, difficulty, etc.)
 * @param {Function} onEvent - Called for each parsed SSE event object.
 * @param {Function} [onError] - Called on stream error or AbortError; receives
 *   `{ isAborted: true }` on manual cancellation.
 * @param {Function} onComplete - Called when a `workflow_complete` event is received.
 * @param {AbortSignal|null} signal - Optional AbortController signal for cancellation.
 * @returns {Promise<void>}
 */
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

export async function stopBatch(batchId) {
  const res = await fetch(`${API_BASE}/batches/${batchId}/stop`, { method: 'POST' });
  await assertOk(res, `Stop batch ${batchId}`);
  return res.json();
}

export async function retryBatchJobs(batchId, payload = null) {
  const res = await fetch(`${API_BASE}/batches/${batchId}/retry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload ? JSON.stringify(payload) : undefined
  });
  await assertOk(res, `Retry batch ${batchId}`);
  return res.json();
}

export async function cancelAllBatches() {
  const res = await fetch(`${API_BASE}/batches/cancel-all`, { method: 'POST' });
  await assertOk(res, 'Cancel all active batches');
  return res.json();
}

export async function fetchBatchDuplicateClusters(batchId, threshold = 0.75, signal = null) {
  const res = await fetch(`${API_BASE}/batches/${batchId}/duplicate-clusters?threshold=${threshold}`, { signal });
  await assertOk(res, `Fetch duplicate clusters for batch ${batchId}`);
  return res.json();
}

export async function resolveBatchDuplicates(batchId, payload = { action: 'archive' }) {
  const res = await fetch(`${API_BASE}/batches/${batchId}/resolve-duplicates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  await assertOk(res, `Resolve duplicates for batch ${batchId}`);
  return res.json();
}

export async function refillBatchQuestions(batchId) {
  const res = await fetch(`${API_BASE}/batches/${batchId}/refill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  await assertOk(res, `Refill batch ${batchId}`);
  return res.json();
}

// ── Passages API ─────────────────────────────────────────────────────────────

export async function fetchPassages(params = {}, signal = null) {
  const query = new URLSearchParams();
  if (params.section) query.append('section', params.section);
  if (params.subtopic) query.append('subtopic', params.subtopic);
  if (params.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE}/passages?${query.toString()}`, { signal });
  await assertOk(res, 'Fetch passages');
  return res.json();
}

export async function fetchSinglePassage(passageId, signal = null) {
  const res = await fetch(`${API_BASE}/passages/${passageId}`, { signal });
  await assertOk(res, `Fetch passage ${passageId}`);
  return res.json();
}

export async function savePassage(passageData) {
  const res = await fetch(`${API_BASE}/passages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(passageData)
  });
  await assertOk(res, 'Save passage');
  return res.json();
}

export async function deletePassage(passageId) {
  const res = await fetch(`${API_BASE}/passages/${passageId}`, { method: 'DELETE' });
  await assertOk(res, `Delete passage ${passageId}`);
  return res.json();
}
