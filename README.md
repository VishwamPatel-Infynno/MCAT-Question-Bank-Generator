# UK UCAT Question Bank Generator

An autonomous multi-agent AI system and workflow for generating, reviewing, conditionally re-generating, and visually illustrating high-caliber multiple-choice questions for the official **UK UCAT** (University Clinical Aptitude Test).

Powered by **LangGraph**, **FastAPI**, **React 19**, and **PostgreSQL 16**, running inference on **Meta Llama 3.3 70B Instruct Turbo** via **DeepInfra** with precision per-request token usage and micro-dollar cost tracking.

---

## 📚 Comprehensive Documentation Suite

For deep-dive technical specifications, architecture diagrams, API schemas, and authoring guidelines, consult the dedicated guides in the [`docs/`](docs/) directory:

| Document | Description |
| :--- | :--- |
| **[Architecture & Multi-Agent Workflow](docs/ARCHITECTURE.md)** | Complete LangGraph StateGraph diagrams, 4-agent specifications, Strict Quality Gate, SSE pipeline, and PostgreSQL 16 ERD. |
| **[REST & SSE API Reference](docs/API.md)** | Complete FastAPI endpoint documentation, SSE event stream schemas, filter parameters, and cURL examples. |
| **[Token Usage & Cost Tracking](docs/TOKEN_TRACKING.md)** | DeepInfra rate card ($0.10 in / $0.32 out per 1M tokens), exact mathematical cost formulas, multi-agent accumulation, and UI observability. |
| **[Installation, Setup & Deployment](docs/SETUP_AND_CONFIG.md)** | Step-by-step setup, Docker PostgreSQL 16 guide, environment variables reference, production deployment, and troubleshooting. |
| **[UCAT Psychometric Rubric & Standards](docs/UCAT_RUBRIC.md)** | Official 5 subtests pacing, 100-point 4-pillar evaluation rubric, $> 90$ quality benchmark, and cognitive distractor trap engineering. |

---

## 🚀 Key System Capabilities

### 1. 4-Agent Autonomous Workflow with Strict Quality Gate
```mermaid
graph LR
    Generator[Question Generator] --> Reviewer[Question Reviewer]
    Reviewer -->|Score <= 90 & Cycles < 3| Regenerator[Question Re-Generator]
    Regenerator --> Reviewer
    Reviewer -->|Score <= 90 & Cycles = 3| Reject[Strict Quality Gate Reject]
    Reviewer -->|Score > 90| ImageGen[Image Generator]
    ImageGen --> Finalize[Finalize & Save to DB]
    Reviewer -->|Score > 90 & No Image| Finalize
```
- **Question Generator Agent**: Synthesizes authentic UK UCAT clinical passages and 4 distinct options (A, B, C, D) using subtest-specific cognitive constraints.
- **Question Reviewer Agent**: Impartially evaluates candidate items against a standardized **100-point psychometric rubric** across 4 equal 25-point pillars (Authenticity, Clarity, Distractor Traps, Explanation Rigor).
- **Question Re-Generator Agent**: Automatically triggered when score $\le 90$. Digests the Reviewer's exact weaknesses and recommendations to repair borderline distractors and expand step-by-step proofs.
- **Strict Quality Gate**: If a question fails to score $> 90$ after reaching maximum attempts (`MAX_REGENERATION_ATTEMPTS = 3`), the workflow halts immediately. Bypasses image generation and discards the draft to protect repository integrity.
- **Image Generator Agent**: Renders clean programmatic SVG vector diagrams for geometric patterns, Venn syllogisms, and charts, with fallback support for AI image models.

### 2. DeepInfra Meta Llama 3.3 70B Turbo & Precision Cost Accounting
- **Primary LLM**: `deepinfra/meta-llama/Llama-3.3-70B-Instruct-Turbo`
- **Official Pricing**:
  - **Input Tokens**: **$0.10** per 1,000,000 tokens
  - **Output Tokens**: **$0.32** per 1,000,000 tokens
- **Micro-Dollar Tracking**: Every LLM request computes exact USD costs:
  $$\text{Cost (USD)} = \left(\frac{\text{Prompt Tokens}}{1,000,000} \times 0.10\right) + \left(\frac{\text{Completion Tokens}}{1,000,000} \times 0.32\right)$$
- **Granular Observability**:
  - Live State Graph header counter (`🪙 2,850 tokens • $0.00053`) and per-agent step pills.
  - QuestionCard badge displaying total tokens and cost.
  - Psychometric Review Audit Modal itemized table showing prompt tokens, completion tokens, and cost per agent cycle.
  - Question Bank 3rd top stat box tracking accumulated repository-wide tokens and total expenditure.

### 3. Production PostgreSQL 16 Tier (SQLAlchemy Async + asyncpg)
- **Native JSONB Columns**: Stores options, review rubrics, evolution histories, and granular per-agent token tracking.
- **Docker Compose Setup**: Instant container initialization on port `5432` with pre-ping connection pooling.
- **Zero-Downtime Auto-Migration**: Automatically runs non-destructive schema migrations on startup.

### 4. Modern Accessible Light Theme UI
- High-contrast, clean visual design adhering to modern UI/UX design engineering principles.
- Interactive student practice mode with immediate feedback, confetti animations, and expandable rationales.
- Real-time Server-Sent Events (SSE) telemetry displaying live agent thoughts.
- One-click export to **JSON** or **CSV**.

---

## ⚡ Quickstart Guide

### 1. Start PostgreSQL (Docker)
```bash
docker compose up -d
```
*Spins up PostgreSQL 16 on `localhost:5432` with database `ucat_db`.*

### 2. Backend Setup
```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Start FastAPI server
PYTHONPATH=backend uvicorn app.main:app --port 8000 --reload
```
*Backend runs on **[http://localhost:8000](http://localhost:8000)** (OpenAPI docs at `/docs`).*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on **[http://localhost:5173](http://localhost:5173)**.*

---

## 🧪 Automated Testing

Run the full backend test suite covering schemas, routing logic, strict quality gates, SVG synthesis, PostgreSQL operations, and token calculations:

```bash
source .venv/bin/activate
PYTHONPATH=backend pytest backend/tests/test_backend.py -v
```

Verify frontend production build:
```bash
cd frontend
npm run build
```

---

## 📁 Repository Structure

```
Question Bank Generator/
├── README.md                    # Project overview & documentation index
├── docker-compose.yml           # PostgreSQL 16 container definition
├── .env.example                 # Environment variables template
├── docs/                        # Comprehensive Documentation Suite
│   ├── ARCHITECTURE.md          # Multi-agent architecture & LangGraph StateGraph
│   ├── API.md                   # Complete REST & SSE API specification
│   ├── TOKEN_TRACKING.md        # DeepInfra pricing & mathematical cost engine
│   ├── SETUP_AND_CONFIG.md      # Installation, deployment & troubleshooting
│   └── UCAT_RUBRIC.md           # 100-point psychometric rubric & authoring standards
├── backend/
│   ├── requirements.txt         # Python dependencies
│   ├── tests/
│   │   └── test_backend.py      # Automated pytest suite (10 unit & integration tests)
│   └── app/
│       ├── main.py              # FastAPI app with modern lifespan context
│       ├── config.py            # Backward-compatible facade -> core/config.py
│       ├── database.py          # Backward-compatible facade -> db/ & repositories/
│       ├── core/                # Core configurations & Pydantic V2 settings
│       │   ├── config.py        # DeepInfra model configuration & token pricing constants
│       │   └── __init__.py
│       ├── db/                  # Database connectivity & session lifecycle
│       │   ├── base.py          # SQLAlchemy declarative base
│       │   ├── session.py       # Async engine, connection pool & auto-migrations
│       │   └── __init__.py
│       ├── models/              # SQLAlchemy ORM models
│       │   ├── question.py      # QuestionModel with JSONB columns & B-tree indexes
│       │   └── __init__.py
│       ├── repositories/        # Data Access Layer (DAL)
│       │   ├── question_repo.py # Clean CRUD & aggregate token usage queries
│       │   └── __init__.py
│       ├── schemas/             # Domain Pydantic V2 schemas
│       │   ├── ucat.py          # UCAT sections & subtopic taxonomy
│       │   ├── token.py         # TokenUsage & TokenCostAccumulator schemas
│       │   ├── question.py      # QuestionOption, QuestionDraft, Question
│       │   ├── workflow.py      # GenerationRequest, ReviewScore, WorkflowEvent
│       │   └── __init__.py
│       ├── agents/              # Multi-agent decision logic & prompts
│       │   ├── base.py          # LiteLLM client & calculate_token_cost()
│       │   ├── prompts.py       # Centralized system prompts & rubrics
│       │   ├── mock_fixtures.py # Mock fallback questions & heuristic rubrics
│       │   ├── generator.py     # Question Generator Agent
│       │   ├── reviewer.py      # Question Reviewer Agent (100-pt rubric)
│       │   ├── regenerator.py   # Question Re-Generator Agent (<= 90 trigger)
│       │   ├── image_generator.py # Programmatic SVG & AI visual generator
│       │   └── __init__.py
│       ├── workflow/            # LangGraph multi-agent state graph
│       │   ├── state.py         # AgentWorkflowState typed dictionary
│       │   ├── graph.py         # StateGraph with strict quality gate routing
│       │   └── __init__.py
│       └── api/                 # Modular API Routers
│           ├── router.py        # Central API v1 router aggregator
│           └── v1/
│               ├── generation.py # SSE streaming question generator endpoint
│               ├── questions.py  # Question Bank CRUD & JSON/CSV exports
│               ├── config.py     # DeepInfra configuration & model settings
│               ├── health.py     # DB connectivity & system health checks
│               └── __init__.py
└── frontend/
    ├── package.json             # React 19 dependencies & scripts
    ├── vite.config.js           # Vite build configuration
    └── src/
        ├── App.jsx              # Main application shell with useQuestionGenerator
        ├── index.css            # Light theme glassmorphism design system
        ├── constants/           # Centralized application constants
        │   ├── ucat.js          # Subtest icons, pacing targets & fallback taxonomy
        │   └── config.js        # Model options & pricing constants
        ├── hooks/               # Custom stateful React hooks
        │   ├── useQuestionGenerator.js # SSE streaming multi-agent orchestrator hook
        │   └── useQuestionBank.js      # CRUD, filtering, clipboard & repository stats hook
        ├── components/          # Domain-organized UI components
        │   ├── index.js         # Barrel exports for clean component imports
        │   ├── layout/          # Layout components (Navbar)
        │   ├── generator/       # Question generation studio (Panel, Visualizer, RejectionCard)
        │   ├── question/        # Candidate question display & review (QuestionCard, ReviewAuditView)
        │   ├── bank/            # Question repository (QuestionBank)
        │   └── modals/          # Dialog modals (SettingsModal, UCATGuide)
        └── services/
            └── api.js           # SSE event reader & REST API client
```

---

## 📄 License

Proprietary — UK UCAT Question Bank Generator Multi-Agent AI System.
