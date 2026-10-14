# Installation, Setup & Configuration Guide

This guide provides complete instructions for provisioning, configuring, and operating the **UK UCAT Question Bank Generator** in both local development and production environments.

---

## 1. System Prerequisites

Before starting, ensure your system meets the following requirements:

| Tool | Minimum Version | Purpose |
| :--- | :--- | :--- |
| **Python** | `3.11+` | Backend runtime & FastAPI application |
| **Node.js** | `18.0+` (LTS) | Frontend runtime & Vite build engine |
| **npm** | `9.0+` | Node package manager |
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
| `DEFAULT_IMAGE_MODEL` | `string` | `deepinfra/black-forest-labs/FLUX-1-schnell` | Image model for visual stimuli |
| `DEEPINFRA_API_KEY` | `string` | `""` | DeepInfra API authorization key |
| `GEMINI_API_KEY` | `string` | `""` | Optional Google Gemini API key |
| `OPENAI_API_KEY` | `string` | `""` | Optional OpenAI API key |
| `MAX_REGENERATION_ATTEMPTS`| `integer`| `3` | Maximum remediation loops before Quality Gate reject |
| `PASSING_SCORE_THRESHOLD` | `integer`| `90` | Minimum score required to pass psychometric gate |
| `COST_PER_MILLION_INPUT_TOKENS` | `float` | `0.10` | Input token price ($0.10 / 1M tokens) |
| `COST_PER_MILLION_OUTPUT_TOKENS`| `float` | `0.32` | Output token price ($0.32 / 1M tokens) |

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
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start Vite development server
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 4. DeepInfra API Key Configuration

To enable live AI inference using Meta Llama 3.3 70B Instruct Turbo:

1. Sign up and obtain an API key from [deepinfra.com/dash/api_keys](https://deepinfra.com/dash/api_keys).
2. You can set the key in either of two ways:
   - **Method A (Persistent `.env`)**: Set `DEEPINFRA_API_KEY=your_key_here` in `.env` and restart the backend.
   - **Method B (In-App UI)**: Open the web application, click **Settings** (gear icon in the top header), enter your API key, and click **Save Settings**. This updates the runtime configuration instantly without requiring a server restart.

### Graceful Mock Fallback Mode
If no API key is provided, the backend automatically engages the **Authentic Mock Heuristic Engine**. This allows complete offline testing, local frontend development, and automated test execution without incurring token costs or requiring an internet connection.

---

## 5. Running Automated Tests

Execute the automated test suite using `pytest`:

```bash
source .venv/bin/activate
PYTHONPATH=backend pytest backend/tests/test_backend.py -v
```

This verifies:
- Pydantic schema validation for all 5 UCAT subtests.
- Reviewer 100-point rubric evaluation and remediation routing.
- Strict Quality Gate halt and rejection payload generation when score $\le 90$.
- Programmatic SVG diagram synthesis.
- PostgreSQL CRUD operations and native JSONB columns.
- DeepInfra model naming and token pricing constants ($0.10 in / $0.32 out).
- Exact mathematical token cost calculation and multi-agent state accumulation.

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
Compile static production assets with Vite:

```bash
cd frontend
npm run build
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
- The system strictly validates API keys when sending live requests to `deepinfra/*` models. Either supply a valid key in `.env` or in the in-app **Settings** modal.

### CORS Errors in Browser Console
- If hosting the backend and frontend on separate domains, ensure the FastAPI `CORSMiddleware` in [`backend/app/main.py`](file:///Users/infynnosolutions/Desktop/Code/Question%20Bank%20Generator/backend/app/main.py#L20-L28) includes your frontend domain in `allow_origins`.
