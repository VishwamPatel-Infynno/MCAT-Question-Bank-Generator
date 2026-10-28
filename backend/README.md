# Infynno MCAT Question Bank Generator - Backend

> **An Infynno Solutions LLP Product • [Infinite Innovations](https://infynno.com/)**  
> High-throughput asynchronous backend service powering the AAMC MCAT Question Studio v2.0.

Built with **Python 3.11+**, **FastAPI**, **LangGraph**, **LiteLLM**, **SQLAlchemy 2.0 (Async)**, and **PostgreSQL 16**.

---

## 1. Architecture & Modular Layer Separation

The backend is engineered with clear separation of concerns across presentation, orchestration, domain logic, persistence, and background worker services:

```
backend/
├── app/
│   ├── api/                 # Presentation Layer (HTTP & SSE Routers)
│   │   ├── router.py        # Central API v1 router aggregator
│   │   └── v1/
│   │       ├── generation.py # SSE streaming multi-agent orchestrator endpoint
│   │       ├── questions.py  # Question Bank CRUD, review approval, status updates, CSV/JSON exports
│   │       ├── passages.py   # Shared clinical stimulus passages endpoints
│   │       ├── batches.py    # Multi-question batch execution run endpoints & background launcher
│   │       ├── taxonomy.py   # AAMC syllabus hierarchy & dependent taxonomy tree endpoints
│   │       ├── config.py     # Read-only runtime engine configuration & pricing
│   │       └── health.py     # Database connectivity & system health checks
│   ├── workflow/            # Orchestration Layer (LangGraph Engine)
│   │   ├── engine.py        # Core streaming execution engine & event emitters
│   │   ├── engine_helpers.py # Review loop, passage preparation & live persistence helpers
│   │   ├── nodes.py         # Discrete agent worker nodes (Generator, Reviewer, etc.)
│   │   ├── routes.py        # Deterministic conditional routing logic (Quality Gate)
│   │   ├── graph.py         # StateGraph builder and compilation pipeline
│   │   └── state.py         # AgentWorkflowState typed dictionary
│   ├── agents/              # Cognitive Reasoning & Synthesis Layer
│   │   ├── generator.py     # Fused clinical question synthesis & self-critique agent
│   │   ├── blind_solver.py  # Blind-solver dual-validation candidate verification agent
│   │   ├── reviewer.py      # 100-point 4-pillar psychometric auditor agent
│   │   ├── regenerator.py   # Autonomous remediation agent (<= 90 score trigger)
│   │   ├── option_balancer.py # Mathematical option length balancing (±15%) & anti-guessability
│   │   ├── image_generator.py # FLUX-2-klein-4b neural visual & SVG vector generator
│   │   ├── prompt_builder.py # User prompt assembly & cross-item diversity calibration
│   │   ├── prompts.py       # Centralized system prompts, pacing rules & rubrics
│   │   ├── mock_fixtures.py # Deterministic fallback fixtures for offline resilience
│   │   └── base.py          # LiteLLM execution wrapper & sub-micro-cent token cost engine
│   ├── services/            # Background Worker & Asynchronous Services
│   │   └── batch_runner.py  # Background pool managing 1-job mini-batches (5 Qs) and 10-job mock runs (50 Qs)
│   ├── repositories/        # Data Access Layer (DAL)
│   │   ├── question_repository.py # Clean CRUD, idempotent batch counter updates, hybrid FTS & token analytics
│   │   ├── batch_repository.py    # Staged batch run queries & persistence
│   │   ├── job_repository.py      # Background worker job state tracking
│   │   └── passage_repository.py  # Shared stimulus reading passage queries
│   ├── models/              # Persistence Layer (SQLAlchemy 2.0 ORM Entities)
│   │   ├── question.py      # QuestionModel with JSONB columns & B-Tree indexes
│   │   ├── passage.py       # PassageModel for multi-item shared reading stimuli
│   │   ├── batch.py         # BatchModel for multi-question generation runs
│   │   └── job.py           # JobModel for tracking individual background batch jobs
│   ├── schemas/             # Domain Transfer Layer (Pydantic V2)
│   │   ├── mcat.py          # MCAT sections, difficulty tiers (low/medium/high) & subtopic taxonomy
│   │   ├── token.py         # TokenUsage & TokenCostAccumulator schemas
│   │   ├── question.py      # QuestionOption, QuestionDraft, Question, determine_question_status helper
│   │   └── workflow.py      # GenerationRequest, ReviewScore, WorkflowEvent
│   ├── core/                # Configuration & Settings
│   │   ├── config.py        # Pydantic SettingsConfigDict, gateway defaults & pricing
│   │   └── logging.py       # Centralized console logging handler & formatter
│   ├── db/                  # Database Lifecycle
│   │   ├── base.py          # Declarative Base
│   │   ├── init_db.py       # Schema verification, column backfills, FTS & FK constraints
│   │   └── session.py       # Async engine, connection pool & startup migrations
│   └── data/                # Static Taxonomy & Curricula
│       └── mcat_dependent_taxonomy.json # AAMC official syllabus foundational concepts & skills
├── scripts/                 # Maintenance & Seeding Utilities
│   └── seed_questions.py    # Sample question bank seeder
└── tests/                   # Deterministic Automated Test Suite (11 test modules)
    ├── conftest.py          # Pytest fixtures, mock LLM setups & test DB engine
    ├── test_agents.py       # Cognitive agent unit tests
    ├── test_api.py          # REST & SSE endpoint integration tests
    ├── test_batch_jobs_flow.py # Background batch runner & job concurrency tests
    ├── test_database_structure.py # SQLAlchemy models & constraint tests
    ├── test_e2e_live.py     # Live end-to-end integration tests
    ├── test_multi_batch_concurrency.py # Multi-batch semaphore stress tests
    ├── test_pedagogy.py     # Pedagogical format & 3-card explanation tests
    ├── test_schemas.py      # Pydantic schema validation tests
    ├── test_tokens.py       # Mathematical token cost accumulation tests
    ├── test_visuals.py      # SVG & neural image generation tests
    └── test_workflow.py     # LangGraph StateGraph execution tests
```

---

## 2. Multi-Agent Workflow Engine

The multi-agent workflow coordinates a 3-step autonomous pipeline through a strict psychometric contract:

```mermaid
graph TD
    Start([Generation Request]) --> NodeFused[Fused Draft & Self-Critique Node]
    
    NodeFused --> FusedScoreCheck{Self-Score > 90?}
    FusedScoreCheck -->|Yes & Needs Diagram| NodeImg[FLUX-2-klein-4b / SVG Node]
    FusedScoreCheck -->|Yes & Text Only| NodeFin[Finalize & Persist Node]
    NodeImg --> NodeFin
    
    FusedScoreCheck -->|No| NodeRegen[Remediation Node]
    NodeRegen --> NodeRev[Independent Reviewer Node]
    
    NodeRev --> ScoreCheck{Score > 90?}
    ScoreCheck -->|Yes & Needs Diagram| NodeImg
    ScoreCheck -->|Yes & Text Only| NodeFin
    ScoreCheck -->|No & Cycles < 3| NodeRegen
    ScoreCheck -->|No & Cycles >= 3| NodeReject[Strict Quality Gate Reject]
    
    NodeReject --> Discard([Discard Candidate & Halt])
    NodeFin --> Success([Stream to Review Desk / Persist])
```

- **Fused Draft-and-Critique Entry Point**: Drafts question and generates immediate 100-point self-critique in a single pass (`fused_generator_node`), cutting round-trip latency by 35-45% and bypassing the separate reviewer when score $> 90$.
- **Passing Threshold**: A question candidate must score **$> 90$** out of 100 on the standardized rubric to be approved for publication.
- **Option Symmetry & Anti-Guessability**: Generator and Reviewer enforce $\pm 15\%$ word count parity across all 4 options ($A, B, C, D$), parallel grammar, and balanced qualifiers to eliminate test-wiseness guessing cues.
- **Anti-AI Formatting Standard**: Strictly forbids em dashes, en dashes, or double hyphens; standard single hyphens (`-`) only.
- **3-Part Structured Mentor Explanations**: Renders pedagogical explanations across three specialized visual cards: Core Intuition & Proof, Itemized Distractor Analysis, and Primary Cognitive Trap Spotlight.
- **Autonomous Remediation**: If score $\le 90$, the Remediation node (`regenerator.py`) digests the exact weaknesses and distractor recommendations, attempting repairs for up to 3 cycles.
- **Strict Quality Gate**: If score remains $\le 90$ after 3 attempts, the candidate is discarded immediately, preserving question bank integrity.

---

## 3. High-Throughput Pricing & Micro-Cost Engine

Token costs are calculated per request at the lowest execution layer ([`backend/app/agents/base.py`](file:///Users/infynnosolutions/Desktop/Code/Question%20Bank%20Generator/backend/app/agents/base.py)) and accumulated across all agent cycles:

- **Input Tokens**: $0.098 per 1,000,000 tokens
- **Output Tokens**: $0.294 per 1,000,000 tokens
- **FLUX-2-klein-4b Image Generation**: Flat unit rate of $0.014 per image, scaled dynamically by resolution.

Calculations are rounded to **7 decimal places** to prevent IEEE 754 floating-point drift:
$$\text{Cost (USD)} = \left(\frac{\text{Prompt Tokens}}{1,000,000} \times 0.098\right) + \left(\frac{\text{Completion Tokens}}{1,000,000} \times 0.294\right)$$

---

## 4. Local Setup & Execution

### Prerequisites
- Python 3.11+
- PostgreSQL 16 (running via Docker Compose or native)

### Step 1: Environment Setup
```bash
# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Upgrade pip and install requirements
pip install --upgrade pip
pip install -r backend/requirements.txt
```

### Step 2: Database Initialization
Ensure PostgreSQL 16 is running on port `5432`:
```bash
docker compose up -d
```
The database connection string in `.env` defaults to:
`DATABASE_URL=postgresql+asyncpg://mcat_user:mcat_password@localhost:5432/mcat_db`

### Step 3: Run FastAPI Application
```bash
PYTHONPATH=backend uvicorn app.main:app --port 8000 --reload
```
- **Service Root**: [http://localhost:8000](http://localhost:8000)
- **Interactive OpenAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

---

## 5. Automated Testing & Code Quality

### Running Tests
Run the deterministic backend test suite covering endpoints, schemas, database operations, workflow routing, and token cost formulas (see [`docs/TESTING_AND_QA.md`](file:///Users/infynnosolutions/Desktop/Code/Question%20Bank%20Generator/docs/TESTING_AND_QA.md) for full specs):

```bash
# Run all unit and integration tests (48 passed)
source .venv/bin/activate
pytest backend/tests -v -k "not live_e2e"

# Run database relational structure tests
pytest backend/tests/test_database_structure.py -v
```

### Code Formatting & Linting
Enforce Python code hygiene using **Ruff**:

```bash
# Check code style and rules (0 errors policy)
ruff check backend

# Automatically fix linting issues
ruff check --fix backend
```

---

## 6. Database Seeding Script

To populate the Question Bank with realistic AAMC MCAT practice questions across all 4 sections:

```bash
source .venv/bin/activate
python backend/scripts/seed_questions.py
```
This generates authentic questions with complete psychometric rubrics, evolution histories, distractors, and token telemetry.
