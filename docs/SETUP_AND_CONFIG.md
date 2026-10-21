# Installation, Setup & Configuration Guide

Engineered by **[Infynno Solutions LLP](https://infynno.com/)** (*"Infinite Innovations"*).

This guide provides complete instructions for provisioning, configuring, and operating the **UK UCAT Question Studio v2.0** in both local development and production environments.

---

## 1. System Prerequisites

Before starting, ensure your system meets the following requirements:

| Tool | Minimum Version | Purpose |
| :--- | :--- | :--- |
| **Python** | `3.11+` | Backend runtime & FastAPI application |
| **Node.js** | `18.0+` (LTS) | Frontend runtime & Vite build engine |
| **pnpm** | `9.0+` | Fast, disk space efficient package manager |
| **Docker & Docker Compose** | `20.10+` / `v2+` | Containerized PostgreSQL 16 database |
| **Git** | `2.30+` | Version control |

---

## 2. Environment Variables Configuration

Create a `.env` file in the project root directory by copying `.env.example`:

```bash
cp .env.example .env
```

### Configuration Variables Reference

| Variable | Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | `string` | `postgresql+asyncpg://ucat_user:ucat_password@localhost:5432/ucat_db` | Async SQLAlchemy PostgreSQL connection string |
| `DEFAULT_TEXT_MODEL` | `string` | `deepinfra/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Primary LiteLLM model identifier |
| `DEFAULT_IMAGE_MODEL` | `string` | `deepinfra/black-forest-labs/FLUX-2-klein-4b` | Image model for visual stimuli |
| `DEEPINFRA_API_KEY` | `string` | `""` | DeepInfra API authorization key |
| `GEMINI_API_KEY` | `string` | `""` | Optional Google Gemini API key |
| `OPENAI_API_KEY` | `string` | `""` | Optional OpenAI API key |
| `MAX_REGENERATION_ATTEMPTS`| `integer`| `3` | Maximum remediation loops before Quality Gate reject |
| `PASSING_SCORE_THRESHOLD` | `integer`| `90` | Minimum score required to pass psychometric gate |
| `COST_PER_MILLION_INPUT_TOKENS` | `float` | `0.10` | Input token price ($0.10 / 1M tokens) |
| `COST_PER_MILLION_OUTPUT_TOKENS`| `float` | `0.32` | Output token price ($0.32 / 1M tokens) |
| `IMAGE_WIDTH` | `integer` | `1024` | Default width for FLUX diagrams |
| `IMAGE_HEIGHT` | `integer` | `1024` | Default height for FLUX diagrams |
| `IMAGE_ITERS` | `integer` | `0` | Inference step iterations (0 for flat-rate models) |
| `IMAGE_COST_PER_BASE_UNIT` | `float` | `0.014` | Flat unit rate in USD ($0.014/img) |

---

## 3. Step-by-Step Installation

### Step 1: Start PostgreSQL Database (Docker)

Spin up the official PostgreSQL 16 container using the included `docker-compose.yml`:

```bash
docker compose up -d
```

Verify that the database container is healthy:
```bash
docker ps --filter "name=ucat_postgres"
```

*Expected output: Container `ucat_postgres` running on `0.0.0.0:5432->5432/tcp`.*

### Step 2: Backend Setup & Launch

```bash
# 1. Create a Python 3.11 virtual environment
python3 -m venv .venv

# 2. Activate the virtual environment
# macOS / Linux:
source .venv/bin/activate
# Windows:
# .venv\Scripts\activate

# 3. Upgrade pip and install backend dependencies
pip install --upgrade pip
pip install -r backend/requirements.txt

# 4. Launch the FastAPI server with hot-reload
PYTHONPATH=backend uvicorn app.main:app --port 8000 --reload
```

The backend will initialize the database tables automatically on startup (`init_db()`). Verify by opening:
- Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- Interactive OpenAPI docs: [http://localhost:8000/docs](http://localhost:8000/docs)

### Step 3: Frontend Setup & Launch

In a new terminal window:

```bash
# 1. Install dependencies using pnpm
pnpm install

# 2. Start Vite development server
pnpm dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 4. DeepInfra API Key Configuration

To enable live AI inference using Meta Llama 3.3 70B Instruct Turbo:

1. Sign up and obtain an API key from [deepinfra.com/dash/api_keys](https://deepinfra.com/dash/api_keys).
2. Set `DEEPINFRA_API_KEY=your_key_here` in your server `.env` file and restart the backend. API credentials are encrypted/isolated exclusively on the backend server for zero client-side credential exposure.

### Graceful Mock Fallback Mode
If no API key is provided, the backend automatically engages the **Authentic Mock Heuristic Engine**. This allows complete offline testing, local frontend development, and automated test execution without incurring token costs or requiring an internet connection.

---

## 5. Running Quality Verification & Automated Tests

The repository maintains an uncompromising **Zero-Defect Quality Policy** enforced across both backend and frontend layers.

### 5.1 Backend Verification Suite

Run the complete 31-test unit & integration suite using `pytest`:

```bash
source .venv/bin/activate

# 1. Run all 31 backend unit and contract tests (100% pass guarantee)
PYTHONPATH=backend pytest backend/tests -v -k "not live_e2e"

# 2. Run Python linting and code quality checks
ruff check backend
```

This verifies:
- Pydantic schema validation across all 5 official UK UCAT subtests.
- Reviewer 100-point rubric evaluation and remediation routing logic.
- Strict Quality Gate halt and rejection payload generation when score $\le 90$.
- Programmatic SVG vector diagram rendering and XML validation.
- PostgreSQL 16 CRUD persistence, native JSONB columns, and B-Tree indexes.
- Batch generation schema parsing and manager combination matrix propagation.
- Deterministic token cost calculation and multi-agent state accumulation.

#### Live Multi-Agent E2E Verification
To verify live inference, streaming SSE events, and manager matrix combinations with active LLM gateways:
```bash
PYTHONPATH=backend pytest backend/tests/test_e2e_live.py -v
```

### 5.2 Frontend Quality & Production Verification

```bash
# 1. High-speed Oxlint check (Zero warnings, zero errors required)
pnpm lint

# 2. Compile optimized production bundle with Vite
pnpm build
```

---

## 6. Production Deployment Guidelines

### 6.1 Production Backend (Gunicorn + Uvicorn)
In production, use `gunicorn` with multiple `uvicorn.workers.UvicornWorker` workers:

```bash
pip install gunicorn
PYTHONPATH=backend gunicorn app.main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

### 5.3 Database Seeding & Mock Practice Questions

To instantly populate the database with authentic, high-quality UCAT practice questions across all 5 subtests (complete with rubrics and evolution histories):

```bash
source .venv/bin/activate
python backend/scripts/seed_questions.py
```

---

## 6. Production Deployment Guidelines

### 6.1 Production Backend (Gunicorn + Uvicorn)
In production, use `gunicorn` with multiple `uvicorn.workers.UvicornWorker` workers:

```bash
pip install gunicorn
PYTHONPATH=backend gunicorn app.main:app \
  -w 4 \
  -k uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

### 6.2 Production Frontend Build
Compile static production assets with Vite using pnpm:

```bash
pnpm build
```
This outputs optimized static bundles into `frontend/dist/`, which can be served via Nginx, Cloudflare Pages, AWS S3 / CloudFront, or Vercel.

### 6.3 Managed Cloud PostgreSQL
To connect to a managed cloud database (Neon, Supabase, AWS RDS, GCP Cloud SQL):
Update `DATABASE_URL` in `.env` to use the `postgresql+asyncpg://` protocol:

```env
DATABASE_URL=postgresql+asyncpg://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>?ssl=require
```

---

## 7. Troubleshooting & FAQ

### Database connection error (`connection refused` on port 5432)
- **Check Docker status**: Run `docker ps` to verify container `ucat_postgres` is running.
- **Port Conflict**: If local PostgreSQL is already running on port 5432, stop local postgres (`brew services stop postgresql` or `sudo systemctl stop postgresql`) or edit `docker-compose.yml` to bind to port `5433:5432` and update `DATABASE_URL` accordingly.

### `ValueError: DeepInfra API Key is required`
- The system strictly validates API keys when sending live requests to `deepinfra/*` models. All credentials must be securely supplied in the server `.env` file (`DEEPINFRA_API_KEY="..."`). For security isolation, client-side runtime key entry has been deprecated.

### CORS Errors in Browser Console
- If hosting the backend and frontend on separate domains, ensure the FastAPI `CORSMiddleware` in [`backend/app/main.py`](file:///Users/infynnosolutions/Desktop/Code/Question%20Bank%20Generator/backend/app/main.py#L20-L28) includes your frontend domain in `allow_origins`.
