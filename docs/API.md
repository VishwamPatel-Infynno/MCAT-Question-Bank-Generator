# Infynno MCAT Question Bank Generator - REST & SSE API Reference

Engineered by **[Infynno Solutions LLP](https://infynno.com/)** (*"Infinite Innovations"*).

This document provides a comprehensive reference for all REST endpoints and Server-Sent Events (SSE) streaming protocols exposed by the FastAPI backend on port `8000`.

---

## 1. Base URL & Protocol Information

- **Base URL**: `http://localhost:8000` (or configured deployment host)
- **Content Type**: `application/json` (REST endpoints), `text/event-stream` (Live generation)
- **CORS Policy & Security Headers**: Restricted to trusted origins (`http://localhost:5173`, etc.) with OWASP security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`).
- **Autonomous Inference Gateway**: Backed by high-throughput enterprise reasoning models (~85-125 tok/s) with deterministic token billing ($0.098 input / $0.294 output per 1M tokens).

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
| `GET` | `/api/config` | Retrieves active model configuration and runtime status |
| `GET` | `/api/sections` | Returns official AAMC MCAT sections and categorized syllabus topics |

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
  "section": "chem_phys",
  "subtopic": "Thermodynamics & Reaction Kinetics",
  "difficulty": "medium",
  "require_image": false,
  "custom_prompt": "Focus on Michaelis-Menten kinetics and competitive enzyme inhibition.",
  "questions_to_generate": 1,
  "single_choice_count": 1,
  "multi_choice_count": 0,
  "passage_count": 1,
  "interaction_type": "single_choice",
  "passage_required": "Yes",
  "passage_questions": 4,
  "primary_trap": "Calculation_Formula_Trap",
  "combination_id": "CMB00001",
  "run_id": "d81f668e-c768-45b7-9fb6-ba1ee2bdbba3",
  "batch_id": null,
  "auto_save": false
}
```

| Field | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `section` | `string` | **Yes** | - | `chem_phys`, `cars`, `bio_biochem`, `psych_soc` |
| `subtopic` | `string` | No | `null` | Categorized syllabus topic |
| `difficulty` | `string` | No | `"medium"` | `easy`, `medium`, `hard` |
| `require_image` | `boolean` | No | `false` | Force visual stimulus generation |
| `custom_prompt` | `string` | No | `null` | Contextual steer or clinical vignette guidance |
| `questions_to_generate` | `integer` | No | `1` | Number of questions to generate in batch (1-5) |
| `single_choice_count` | `integer` | No | `null` | Number of single-choice items in batch (0-5) |
| `multi_choice_count` | `integer` | No | `null` | Number of multi-choice items in batch (0-5) |
| `passage_count` | `integer` | No | `null` | Number of passage-linked items in batch (0-5) |
| `interaction_type` | `string` | No | `"single_choice"` | `single_choice`, `multi_choice`, `drag_drop` |
| `passage_required` | `string \| boolean` | No | `null` | `"Yes"`, `"No"`, or boolean flag |
| `passage_questions` | `integer` | No | `null` | Target question count per passage (e.g. 3, 4) |
| `primary_trap` | `string` | No | `"Automatic"` | Cognitive trap selection: `"Automatic"` (Smart AI choice) or explicit key (`Scope_Shift`, `Keyword_Trap`, `Extreme_Language`, `Correlation_vs_Causation`, `Partial_Match`, `Half_Truth`, `Unwarranted_Assumption`, `Calculation_Trap`, `Out_of_Scope`, `False_Dichotomy`, `Over_generalisation`) |
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
  "agent_name": "Question Writer & Reviewer",
  "message": "Question 1 authored and audited (Score: 96/100, 770 tokens, $0.00015)...",
  "data": {
    "draft": {
      "stimulus_text": "A clinical audit evaluating infection protocols across three acute NHS surgical wards demonstrated that universal catheter bundles reduced catheter-associated urinary tract infections from 8.4 to 2.1 per 1,000 catheter-days over twelve months.",
      "question_stem": "Which conclusion is most strongly supported by the evidence in the passage?",
      "options": [
        {"id": "A", "text": "Protocol adherence directly reduced catheter infections across all surgical wards."},
        {"id": "B", "text": "Secondary bacteremia rates remained static despite hand hygiene interventions."},
        {"id": "C", "text": "Postoperative fever frequency was uncorrelated with aseptic dressing protocols."},
        {"id": "D", "text": "Surveillance cultures were only obtained when clinical sepsis was documented."}
      ],
      "correct_answer_id": "A",
      "correct_answer_ids": ["A"],
      "primary_trap": "Keyword_Trap",
      "explanation": "Why Option A is Correct:\nProtocol adherence directly reduced catheter infections as evidenced in paragraph 2 where infection rates dropped from 8.4 to 2.1 per 1,000 catheter-days following universal bundle compliance.\n\nWhy Other Options are Incorrect:\n- Option B: Incorrect. Secondary bacteremia rates fell by 45%, contradicting the assertion that they remained static.\n- Option C: Incorrect. Postoperative fever was strongly correlated (p < 0.01) with dressing integrity.\n- Option D: Incorrect. Surveillance cultures were drawn routinely on day 3 for all patients regardless of sepsis symptoms.\n\nPrimary Cognitive Trap Spotlight:\n- Trap: Keyword Trap\n- Error Mechanism: Candidates recognise familiar vocabulary ('surveillance cultures', 'secondary bacteremia') lifted verbatim from the passage and overlook the contradictory quantifier or inverted clinical outcome.\n- Student Defense Strategy: Always verify whether the passage validates the directional relationship between keywords rather than selecting based on keyword familiarity alone."
    },
    "review": {
      "authenticity_score": 24,
      "clarity_score": 24,
      "distractor_score": 24,
      "explanation_score": 24,
      "total_score": 96,
      "strengths": ["Authentic clinical register", "Perfect option length symmetry (±15%)"],
      "weaknesses": [],
      "recommendations": [],
      "passed": true
    },
    "score": 96,
    "latest_usage": {
      "prompt_tokens": 450,
      "completion_tokens": 320,
      "total_tokens": 770,
      "cost_usd": 0.0001474
    },
    "cumulative_usage": {
      "total_tokens": 770,
      "total_prompt_tokens": 450,
      "total_completion_tokens": 320,
      "total_cost_usd": 0.0001474
    }
  },
  "timestamp": "2026-10-15T12:00:00.000000"
}
```

#### Event Types
- `workflow_start`: Workflow begins execution.
- `agent_start`: Specific pipeline agent initiates task (`Question Writer & Reviewer`, `Question Improver`, `Diagram & Chart Maker`, `Passage Writer`).
- `agent_complete`: Agent finished milestone; contains candidate draft, 100-point rubric self-critique (`review`), score, `latest_usage`, and `cumulative_usage`. On passing runs (> 90), the candidate proceeds directly without requiring redundant separate reviewer calls.
- `question_generated`: Emitted per question when certified and staged for review.
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
| `section` | `string` | No | Filter by section enum (e.g. `chem_phys`, `cars`, `bio_biochem`, `psych_soc`) |
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
      "section": "chem_phys",
      "section_label": "Chemical and Physical Foundations of Biological Systems",
      "subtopic": "Thermodynamics & Reaction Kinetics",
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
      "correct_answer_ids": ["C"],
      "primary_trap": "Calculation_Trap",
      "explanation": "Why Option C is Correct:\nEarly clinical intervention demonstrated a statistically significant (p = 0.004) 32% reduction in cognitive symptom progression over 18 months, confirming Option C.\n\nWhy Other Options are Incorrect:\n- Option A: Incorrect. The trial documented elevation 2 years prior to symptoms, not 5 years.\n- Option B: Incorrect (Extreme Language). Only 68% of amyloid-positive cohorts exhibited tau pathology, not all.\n- Option D: Incorrect. Fluid biomarker sensitivity was 94% compared to 81% for MRI volumetric assessments.\n\nPrimary Cognitive Trap Spotlight:\n- Trap: Calculation Trap\n- Error Mechanism: Students often confuse absolute risk reduction percentages with relative risk ratios or miscalculate timeframe windows.\n- Student Defense Strategy: Explicitly cross-tabulate baseline time horizons and percentage denominators before selecting.",
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
curl -X GET "http://localhost:8000/api/questions?section=chem_phys&difficulty=medium"
```

#### 3.2.1 Explanation Structure & Smart AI Trap Resolution
All questions generated or retrieved comply with the 3-part explanation and cognitive trap architecture:

1. **3-Part Structured Explanation**:
   - `Why Option [Key] is Correct`: Clear, evidence-backed proof citing specific data or clinical principles from the stimulus.
   - `Why Other Options are Incorrect`: Bulleted analysis for each incorrect option dissecting the exact cognitive flaw and tempting misconception.
   - `Primary Cognitive Trap Spotlight`: Dedicated breakdown of the primary trap with explicit `Trap`, `Error Mechanism`, and `Student Defense Strategy` attributes.
2. **Primary Trap Resolution**:
   - When requests specify `primary_trap: "Automatic"` (the recommended default), the generator agent intelligently identifies and populates `primary_trap` from the official MCAT trap types based on the drafted distractors.
   - When requests supply an explicit trap (e.g. `"Calculation_Formula_Trap"`), the generator specifically engineers that trap into the draft.
   - For legacy questions where `primary_trap` is `null`, the backend workflow nodes and frontend `MentorExplanationView.jsx` employ automatic regex matching against the explanation text to extract and badge the active trap without breaking legacy layouts.

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
    "section": "chem_phys",
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
  "default_text_model": "deepinfra/deepseek-ai/DeepSeek-V4.1-Flash-1017",
  "default_image_model": "deepinfra/black-forest-labs/FLUX-2-klein-4b",
  "has_deepinfra_key": true,
  "has_gemini_key": false,
  "has_openai_key": false,
  "max_regenerations": 3,
  "passing_threshold": 90,
  "cost_per_million_input": 0.098,
  "cost_per_million_output": 0.294,
  "image_width": 1024,
  "image_height": 1024,
  "image_iters": 0,
  "current_image_cost_usd": 0.014
}
```

#### cURL Example
```bash
curl -X GET http://localhost:8000/api/health
```

---

### 3.9 Configuration & Runtime Settings
`GET /api/config`

Enables reading active runtime engine settings, model choices, and pricing parameters for diagnostics and status inspection. Credentials are securely isolated in the server `.env` file and exposed only as boolean availability flags.

#### Response (`200 OK`)
```json
{
  "default_text_model": "deepinfra/deepseek-ai/DeepSeek-V4.1-Flash-1017",
  "default_image_model": "deepinfra/black-forest-labs/FLUX-2-klein-4b",
  "has_deepinfra_key": true,
  "has_gemini_key": false,
  "has_openai_key": false,
  "has_anthropic_key": false,
  "has_groq_key": false,
  "max_regenerations": 3,
  "passing_threshold": 90,
  "cost_per_million_input": 0.098,
  "cost_per_million_output": 0.294,
  "image_width": 1024,
  "image_height": 1024,
  "image_iters": 0,
  "image_cost_base_rate": 0.014,
  "current_image_cost_usd": 0.014
}
```

#### cURL Example
```bash
curl -X GET http://localhost:8000/api/config
```

---

### 3.10 List MCAT Sections & Subtopics
`GET /api/sections`

Returns the official 4 AAMC MCAT sections with their syllabus topics.

#### Response (`200 OK`)
```json
{
  "sections": [
    {
      "id": "chem_phys",
      "label": "Chemical and Physical Foundations of Biological Systems",
      "subtopics": [
        "Thermodynamics & Kinetics",
        "Enzyme Kinetics & Catalysis",
        "Fluids & Circulation Physics",
        "Electrochemistry & Circuits",
        "Optics & Sound Waves",
        "Atomic Structure & Periodic Trends",
        "Acid-Base Chemistry & Buffers"
      ]
    },
    {
      "id": "cars",
      "label": "Critical Analysis and Reasoning Skills",
      "subtopics": [
        "Foundations of Comprehension",
        "Reasoning Within the Text",
        "Reasoning Beyond the Text",
        "Author Tone & Rhetorical Devices",
        "Philosophical Argument Analysis"
      ]
    },
    {
      "id": "bio_biochem",
      "label": "Biological and Biochemical Foundations of Living Systems",
      "subtopics": [
        "Metabolic Pathways & Regulation",
        "Molecular Genetics & DNA Tech",
        "Cell Biology & Membrane Transport",
        "Organ Systems Physiology",
        "Microbiology & Immunology",
        "Amino Acids, Peptides & Proteins"
      ]
    },
    {
      "id": "psych_soc",
      "label": "Psychological, Social, and Biological Foundations of Behavior",
      "subtopics": [
        "Sensory Processing & Perception",
        "Cognitive Psychology & Memory",
        "Sociological Theories & Stratification",
        "Demographic Disparities & Healthcare",
        "Behavioral Neurobiology",
        "Social Interaction & Group Dynamics"
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

