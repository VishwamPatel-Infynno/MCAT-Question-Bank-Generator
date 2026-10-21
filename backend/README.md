# Infynno UCAT Question Bank Generator - Backend

> **An Infynno Solutions LLP Product • [Infinite Innovations](https://infynno.com/)**  
> High-throughput asynchronous backend service powering the UK UCAT Question Studio v2.0.

Built with **Python 3.11+**, **FastAPI**, **LangGraph**, **LiteLLM**, **SQLAlchemy 2.0 (Async)**, and **PostgreSQL 16**.

---

## 1. Architecture & Modular Layer Separation

The backend is engineered with clear separation of concerns across presentation, orchestration, domain logic, and persistence:

```
backend/app/
├── api/                 # Presentation Layer (HTTP & SSE Routers)
│   ├── router.py        # Central API v1 router aggregator
│   └── v1/
│       ├── generation.py # SSE streaming multi-agent orchestrator endpoint
│       ├── questions.py  # Question Bank CRUD, review approval, CSV/JSON exports
│       ├── passages.py   # Shared clinical stimulus passages endpoints
│       ├── batches.py    # Multi-question batch execution run endpoints
│       ├── config.py     # Read-only runtime engine configuration & pricing
│       └── health.py     # Database connectivity & system health checks
├── workflow/            # Orchestration Layer (LangGraph Engine)
│   ├── engine.py        # Core streaming execution engine & event emitters
│   ├── nodes.py         # Discrete agent worker nodes (Generator, Reviewer, etc.)
│   ├── routes.py        # Deterministic conditional routing logic (Quality Gate)
│   ├── graph.py         # StateGraph builder and compilation pipeline
│   └── state.py         # AgentWorkflowState typed dictionary
├── agents/              # Cognitive Reasoning & Synthesis Layer
│   ├── generator.py     # Initial clinical question synthesis agent
│   ├── reviewer.py      # 100-point 4-pillar psychometric auditor agent
│   ├── regenerator.py   # Autonomous remediation agent (<= 90 score trigger)
│   ├── image_generator.py # FLUX-2-klein-4b neural visual & SVG generator
│   ├── prompts.py       # Centralized system prompts, pacing rules & rubrics
│   ├── mock_fixtures.py # Deterministic fallback fixtures for offline resilience
│   └── base.py          # LiteLLM execution wrapper & sub-micro-cent token cost engine
├── repositories/        # Data Access Layer (DAL)
│   ├── question_repo.py # Clean CRUD, hybrid full-text search & token analytics
│   ├── batch_repo.py    # Staged batch run queries & persistence
│   └── passage_repo.py  # Shared stimulus reading passage queries
├── models/              # Persistence Layer (SQLAlchemy 2.0 ORM Entities)
│   ├── question.py      # QuestionModel with JSONB columns & B-Tree indexes
│   ├── passage.py       # PassageModel for multi-item shared reading stimuli
│   └── batch.py         # BatchModel for multi-question generation runs
├── schemas/             # Domain Transfer Layer (Pydantic V2)
│   ├── ucat.py          # UCAT sections & subtopic taxonomy
│   ├── token.py         # TokenUsage & TokenCostAccumulator schemas
│   ├── question.py      # QuestionOption, QuestionDraft, Question
│   └── workflow.py      # GenerationRequest, ReviewScore, WorkflowEvent
├── core/                # Configuration & Settings
│   └── config.py        # Pydantic SettingsConfigDict, gateway defaults & pricing
└── db/                  # Database Lifecycle
    ├── base.py          # Declarative Base
    └── session.py       # Async engine, connection pool & zero-downtime migrations
```

---

## 2. Multi-Agent Workflow Engine

The multi-agent workflow coordinates 4 autonomous agents through a strict psychometric contract:

```mermaid
graph TD
    Start([Generation Request]) --> NodeGen[Question Generator Node]
    NodeGen --> NodeRev[Psychometric Reviewer Node]
    
    NodeRev --> ScoreCheck{Score > 90?}
    ScoreCheck -->|Yes & Needs Diagram| NodeImg[FLUX-2-klein-4b / SVG Node]
    ScoreCheck -->|Yes & Text Only| NodeFin[Finalize & Persist Node]
    NodeImg --> NodeFin
    
    ScoreCheck -->|No & Cycles < 3| NodeRegen[Remediation Node]
    NodeRegen --> NodeRev
    
    ScoreCheck -->|No & Cycles >= 3| NodeReject[Strict Quality Gate Reject]
    NodeReject --> Discard([Discard Candidate & Halt])
    NodeFin --> Success([Stream to Review Desk / Persist])
```

- **Passing Threshold**: A question candidate must score **$> 90$** out of 100 on the standardized rubric to be approved for publication.
- **Autonomous Remediation**: If score $\le 90$, the Remediation node (`regenerator.py`) digests the Reviewer's exact weaknesses and distractor recommendations, attempting repairs for up to 3 cycles.
- **Strict Quality Gate**: If score remains $\le 90$ after 3 attempts, the candidate is discarded immediately, preserving question bank integrity.

---

## 3. High-Throughput Pricing & Micro-Cost Engine

Token costs are calculated per request at the lowest execution layer ([`backend/app/agents/base.py`](file:///Users/infynnosolutions/Desktop/Code/Question%20Bank%20Generator/backend/app/agents/base.py)) and accumulated across all agent cycles:

- **Input Tokens**: $0.10 per 1,000,000 tokens
- **Output Tokens**: $0.32 per 1,000,000 tokens
- **FLUX-2-klein-4b Image Generation**: Flat unit rate of $0.014 per image, scaled dynamically by resolution.

Calculations are rounded to **7 decimal places** to prevent IEEE 754 floating-point drift:
$$\text{Cost (USD)} = \left(\frac{\text{Prompt Tokens}}{1,000,000} \times 0.10\right) + \left(\frac{\text{Completion Tokens}}{1,000,000} \times 0.32\right)$$

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
`DATABASE_URL=postgresql+asyncpg://ucat_user:ucat_password@localhost:5432/ucat_db`

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
Run the deterministic backend test suite covering endpoints, schemas, database operations, workflow routing, and token cost formulas:

```bash
# Run all unit and integration tests (31 passed)
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

To populate the Question Bank with realistic UK UCAT practice questions across all 5 subtests:

```bash
source .venv/bin/activate
python backend/scripts/seed_questions.py
```
This generates authentic questions with complete psychometric rubrics, evolution histories, distractors, and token telemetry.
