# UK UCAT Question Studio — REST & SSE API Reference

Engineered by **[Infynno Solutions LLP](https://infynno.com/)** (*"Infinite Innovations"*).

This document provides a comprehensive reference for all REST endpoints and Server-Sent Events (SSE) streaming protocols exposed by the FastAPI backend on port `8000`.

---

## 1. Base URL & Protocol Information

- **Base URL**: `http://localhost:8000` (or configured deployment host)
- **Content Type**: `application/json` (REST endpoints), `text/event-stream` (Live generation)
- **CORS Policy & Security Headers**: Restricted to trusted origins (`http://localhost:5173`, etc.) with OWASP security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`).
- **Autonomous Inference Gateway**: Backed by high-throughput enterprise reasoning models (~110–140 tok/s) with deterministic token billing ($0.10 input / $0.32 output per 1M tokens).

---

## 2. API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/generate` | Triggers multi-agent workflow and streams real-time SSE events (Candidate Staged) |
| `POST` | `/api/questions` | **Admin Review Gate**: Persists an approved candidate question into the Question Bank |
| `POST` | `/api/questions/batch` | **Admin Review Gate**: Bulk-persists an array of approved candidates into the Question Bank |
| `GET` | `/api/questions` | Lists saved questions with filtering, search, and repository token metrics |
| `GET` | `/api/questions/{id}` | Retrieves a single question by UUID4 primary key |
| `DELETE` | `/api/questions/{id}` | Deletes a question by UUID4 primary key |
| `GET` | `/api/passages` | Lists shared reading passages with question counts |
| `GET` | `/api/passages/{id}` | Retrieves a single reading passage by UUID4 |
| `GET` | `/api/passages/{id}/questions` | Retrieves all questions linked to a shared passage |
| `GET` | `/api/batches` | Lists generation batches with question count aggregations |
| `GET` | `/api/batches/{id}` | Retrieves a single generation batch by UUID4 |
| `GET` | `/api/batches/{id}/questions` | Retrieves all questions generated in a batch |
| `GET` | `/api/export` | Exports repository in JSON or CSV format |
| `GET` | `/api/health` | Service health, database connectivity, active models, and pricing |
| `GET` | `/api/config` | Retrieves active model configuration and provider credentials |
| `POST` | `/api/config` | Dynamically updates runtime model and provider settings |
| `GET` | `/api/sections` | Returns official UK UCAT subtests and categorized syllabus topics |

---

## 3. Endpoints Specification

### 3.1 Start Multi-Agent Generation (SSE Stream)
`POST /api/generate`

Initiates the multi-agent generation and psychometric evaluation workflow. Returns a live Server-Sent Events stream delivering step-by-step agent telemetry, intermediate drafts, review rubrics, token usage, and candidate question payloads. Supports single-item and batch generation.

#### Request Headers
```http
Content-Type: application/json
Accept: text/event-stream
```

#### Request Body
```json
{
  "section": "verbal_reasoning",
  "subtopic": "Critical Reading & Inferences",
  "difficulty": "medium",
  "require_image": false,
  "custom_prompt": "Focus on NHS junior doctor triage ethics in a busy A&E department.",
  "questions_to_generate": 1,
  "single_choice_count": 1,
  "multi_choice_count": 0,
  "passage_count": 1,
  "interaction_type": "single_choice",
  "passage_required": "Yes",
  "passage_questions": 4,
  "primary_trap": "Keyword_Trap",
  "combination_id": "CMB00001",
  "run_id": "d81f668e-c768-45b7-9fb6-ba1ee2bdbba3",
  "batch_id": null,
  "auto_save": false
}
```

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `section` | `string` | **Yes** | — | `verbal_reasoning`, `decision_making`, `quantitative_reasoning`, `abstract_reasoning`, `situational_judgement` |
| `subtopic` | `string` | No | `null` | Categorized syllabus topic |
| `difficulty` | `string` | No | `"medium"` | `easy`, `medium`, `hard` |
| `require_image` | `boolean` | No | `false` | Force visual stimulus generation |
| `custom_prompt` | `string` | No | `null` | Contextual steer or clinical vignette guidance |
| `questions_to_generate` | `integer` | No | `1` | Number of questions to generate in batch (1–5) |
| `single_choice_count` | `integer` | No | `null` | Number of single-choice items in batch (0–5) |
| `multi_choice_count` | `integer` | No | `null` | Number of multi-choice items in batch (0–5) |
| `passage_count` | `integer` | No | `null` | Number of passage-linked items in batch (0–5) |
| `interaction_type` | `string` | No | `"single_choice"` | `single_choice`, `multi_choice`, `drag_drop` |
| `passage_required` | `string \| boolean` | No | `null` | `"Yes"`, `"No"`, or boolean flag |
| `passage_questions` | `integer` | No | `null` | Target question count per passage (e.g. 3, 4) |
| `primary_trap` | `string` | No | `null` | Primary cognitive distractor trap (e.g. `Keyword_Trap`, `Partial_Match`) |
| `combination_id` | `string` | No | Auto UUID4 | Unique matrix combination code (e.g. `CMB00001`) |
| `run_id` | `string` | No | Auto UUID4 | Execution run UUID4 |
| `batch_id` | `string` | No | `null` | Optional batch identifier grouping questions |
| `auto_save` | `boolean` | No | `false` | Auto-persist to DB (`false` retains Admin Review Gate) |
| `model_name` | `string` | No | Gateway Default | Model identifier override |
| `api_key` | `string` | No | `null` | Ephemeral API key override |

#### SSE Event Format
Events are formatted as Server-Sent Events lines: `data: {JSON_PAYLOAD}\n\n`

```json
{
  "event_type": "agent_complete",
  "agent_name": "Question Reviewer",
  "message": "Review completed. Score: 94/100 (1,340 tokens, $0.00031)...",
  "data": {
    "review": {
      "authenticity_score": 24,
      "clarity_score": 23,
      "distractor_score": 23,
      "explanation_score": 24,
      "total_score": 94,
      "strengths": ["Clear syllogistic structure"],
      "weaknesses": [],
      "recommendations": [],
      "passed": true
    },
    "latest_usage": {
      "prompt_tokens": 820,
      "completion_tokens": 520,
      "total_tokens": 1340,
      "cost_usd": 0.0002484
    },
    "cumulative_usage": {
      "total_tokens": 2850,
      "total_prompt_tokens": 1720,
      "total_completion_tokens": 1130,
      "total_cost_usd": 0.0005336
    }
  },
  "timestamp": "2026-10-15T12:00:00.000000"
}
```

#### Event Types
- `workflow_start`: Workflow begins execution.
- `agent_start`: Specific agent initiates task (`Question Generator`, `Question Reviewer`, `Question Re-Generator`, `Image Generator`).
- `agent_complete`: Agent finished step; contains draft/review data and `latest_usage` & `cumulative_usage`.
- `workflow_complete`: Workflow verified score $> 90$ and staged or saved question.
- `workflow_rejected`: Strict Quality Gate tripped (score $\le 90$ after 3 attempts). Question discarded from DB.
- `workflow_error`: System error during workflow.

#### cURL Example
```bash
curl -N -X POST http://localhost:8000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "section": "quantitative_reasoning",
    "subtopic": "Rates, Work & Concentration",
    "difficulty": "medium",
    "require_image": false,
    "questions_to_generate": 1
  }'
```

---

### 3.2 List Questions with Repository Token Metrics
`GET /api/questions`

Retrieves saved questions from PostgreSQL with optional filtering, full-text search, and aggregated repository-wide token consumption and expenditure statistics.

#### Query Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `section` | `string` | No | Filter by subtest enum (e.g. `verbal_reasoning`) |
| `difficulty` | `string` | No | Filter by difficulty (`easy`, `medium`, `hard`) |
| `search` | `string` | No | Substring match in question stem, stimulus, or subtopic |
| `combination_id` | `string` | No | Filter by combination UUID or custom code |
| `run_id` | `string` | No | Filter by execution run UUID4 |
| `batch_id` | `string` | No | Filter by batch run UUID4 |

#### Response (`200 OK`)
```json
{
  "questions": [
    {
      "id": "e3b0c442-98fc-1c14-9afb-4c8996fb9242",
      "section": "verbal_reasoning",
      "section_label": "Verbal Reasoning",
      "subtopic": "Critical Reading & Inferences",
      "difficulty": "medium",
      "stimulus_text": "Recent clinical trials investigating neurodegenerative markers...",
      "question_stem": "Which of the following statements must be true according to the passage?",
      "options": [
        {"id": "A", "text": "Biomarker X elevation precedes cognitive decline by at least 5 years."},
        {"id": "B", "text": "All patients with elevated amyloid exhibit tau phosphorylation."},
        {"id": "C", "text": "Early interventions showed a statistically significant reduction in symptom progression."},
        {"id": "D", "text": "MRI volumetric changes are superior to fluid biomarkers in early detection."}
      ],
      "correct_answer_id": "C",
      "explanation": "Option C is directly supported by paragraph 3...",
      "image_url": null,
      "image_svg": null,
      "image_description": null,
      "final_score": 94,
      "review_rubric": {
        "authenticity_score": 24,
        "clarity_score": 24,
        "distractor_score": 23,
        "explanation_score": 23,
        "total_score": 94,
        "strengths": ["Authentic medical journal tone"],
        "weaknesses": [],
        "recommendations": [],
        "passed": true
      },
      "iteration_count": 2,
      "iterations_history": [...],
      "total_tokens": 2850,
      "prompt_tokens": 1720,
      "completion_tokens": 1130,
      "cost_usd": 0.0005336,
      "token_usage_details": [
        {
          "agent": "Question Generator",
          "iteration": 1,
          "prompt_tokens": 450,
          "completion_tokens": 320,
          "total_tokens": 770,
          "cost_usd": 0.0001474
        },
        {
          "agent": "Question Reviewer",
          "iteration": 1,
          "prompt_tokens": 380,
          "completion_tokens": 210,
          "total_tokens": 590,
          "cost_usd": 0.0001052
        }
      ],
      "created_at": "2026-10-14T09:30:15.123456"
    }
  ],
  "total_tokens": 14250,
  "total_cost_usd": 0.00267
}
```

#### cURL Example
```bash
curl -X GET "http://localhost:8000/api/questions?section=verbal_reasoning&difficulty=medium"
```

---

### 3.3 Approve and Persist Candidate Question (Admin Review Gate)
`POST /api/questions`

Persists an approved candidate question into the PostgreSQL 16 Question Bank.

#### Request Body
Accepts a full candidate `Question` schema object.

#### Response (`200 OK`)
```json
{
  "success": true,
  "message": "Question successfully approved and saved to Question Bank",
  "question": {
    "id": "e3b0c442-98fc-1c14-9afb-4c8996fb9242",
    "section": "verbal_reasoning",
    "final_score": 95,
    "saved_at": "2026-10-14T12:00:00"
  }
}
```

---

### 3.4 Batch Approve and Persist Candidate Questions (Admin Review Gate)
`POST /api/questions/batch`

Bulk-persists an array of approved candidate questions into PostgreSQL 16 in a single atomic transaction.

#### Request Body
Array of candidate `Question` schema objects (`[ { ... }, { ... } ]`).

#### Response (`200 OK`)
```json
{
  "success": true,
  "saved_count": 5,
  "message": "Successfully approved and saved 5 questions to Question Bank",
  "question_ids": [
    "e3b0c442-98fc-1c14-9afb-4c8996fb9242",
    "3f92b96e-57b1-419b-a0ee-65ea7424619b"
  ]
}
```

---

### 3.5 Get Single Question
`GET /api/questions/{question_id}`

Retrieves full details, 100-point rubric, evolution diffs, and itemized token tracking for a specific question.

#### Response (`200 OK`)
Returns the complete `Question` schema shown above.

#### Response (`404 Not Found`)
```json
{
  "detail": "Question not found"
}
```

#### cURL Example
```bash
curl -X GET http://localhost:8000/api/questions/e3b0c442-98fc-1c14-9afb-4c8996fb9242
```

---

### 3.6 Delete Question
`DELETE /api/questions/{question_id}`

Deletes a question from PostgreSQL.

#### Response (`200 OK`)
```json
{
  "success": true
}
```

#### cURL Example
```bash
curl -X DELETE http://localhost:8000/api/questions/e3b0c442-98fc-1c14-9afb-4c8996fb9242
```

---

### 3.7 Export Question Bank
`GET /api/export`

Downloads the entire Question Bank as an attachment in JSON or CSV format.

#### Query Parameters
| Parameter | Type | Required | Values | Default |
| :--- | :--- | :--- | :--- | :--- |
| `format` | `string` | No | `json`, `csv` | `json` |

#### cURL Example
```bash
# Export as JSON
curl -O -J http://localhost:8000/api/export?format=json

# Export as CSV
curl -O -J http://localhost:8000/api/export?format=csv
```

---

### 3.8 Service Health Check
`GET /api/health`

Reports backend status, PostgreSQL database connection, database version, active models, and official pricing rate constants.

#### Response (`200 OK`)
```json
{
  "status": "healthy",
  "database": "connected",
  "database_connected": true,
  "database_status": "ready",
  "default_text_model": "deepinfra/meta-llama/Llama-3.3-70B-Instruct-Turbo",
  "default_image_model": "deepinfra/black-forest-labs/FLUX-1-schnell",
  "has_deepinfra_key": true,
  "has_gemini_key": false,
  "has_openai_key": false,
  "max_regenerations": 3,
  "passing_threshold": 90,
  "cost_per_million_input": 0.1,
  "cost_per_million_output": 0.32,
  "image_width": 1024,
  "image_height": 1024,
  "image_iters": 4,
  "current_image_cost_usd": 0.002
}
```

#### cURL Example
```bash
curl -X GET http://localhost:8000/api/health
```

---

### 3.9 Configuration & Runtime Settings
`GET /api/config` | `POST /api/config`

Enables reading and dynamically updating API keys and model choices without restarting the backend process.

#### Read Configuration (`GET /api/config`)
```bash
curl -X GET http://localhost:8000/api/config
```

#### Update Configuration (`POST /api/config`)
```bash
curl -X POST http://localhost:8000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "default_text_model": "deepinfra/meta-llama/Llama-3.3-70B-Instruct-Turbo",
    "default_image_model": "black-forest-labs/FLUX-1-schnell",
    "deepinfra_api_key": "your_api_key_here",
    "image_width": 1024,
    "image_height": 1024,
    "image_iters": 4,
    "max_regenerations": 3
  }'
```

---

### 3.10 List UCAT Sections & Subtopics
`GET /api/sections`

Returns the official 5 UK UCAT subtests with their syllabus topics.

#### Response (`200 OK`)
```json
{
  "sections": [
    {
      "id": "verbal_reasoning",
      "label": "Verbal Reasoning",
      "subtopics": [
        "Critical Reading & Inferences",
        "Direct Fact Retrieval",
        "Author Tone & Argumentation",
        "Comparative Evaluation"
      ]
    },
    {
      "id": "decision_making",
      "label": "Decision Making",
      "subtopics": [
        "Logical Syllogisms",
        "Venn Diagrams & Set Logic",
        "Probabilistic Reasoning",
        "Argument Evaluation",
        "Recognising Assumptions"
      ]
    }
  ]
}
```

---

### 3.11 Passages Management Endpoints
`GET /api/passages` | `GET /api/passages/{id}` | `GET /api/passages/{id}/questions`

Enables listing shared reading passage stimuli and retrieving all questions grouped under a single shared passage.

#### List Passages (`GET /api/passages`)
```bash
curl -X GET http://localhost:8000/api/passages
```

#### Get Single Passage (`GET /api/passages/{id}`)
```bash
curl -X GET http://localhost:8000/api/passages/550e8400-e29b-41d4-a716-446655440000
```

#### Get All Questions for a Passage (`GET /api/passages/{id}/questions`)
```bash
curl -X GET http://localhost:8000/api/passages/550e8400-e29b-41d4-a716-446655440000/questions
```

---

### 3.12 Generation Batches Endpoints
`GET /api/batches` | `GET /api/batches/{id}` | `GET /api/batches/{id}/questions`

Enables tracking multi-question batch execution runs, monitoring staged candidate counts, and retrieving all items generated within a specific run.

#### List Batches (`GET /api/batches`)
```bash
curl -X GET http://localhost:8000/api/batches
```

#### Get Single Batch (`GET /api/batches/{id}`)
```bash
curl -X GET http://localhost:8000/api/batches/6ba7b810-9dad-11d1-80b4-00c04fd430c8
```

#### Get All Questions in a Batch (`GET /api/batches/{id}/questions`)
```bash
curl -X GET http://localhost:8000/api/batches/6ba7b810-9dad-11d1-80b4-00c04fd430c8/questions
```

