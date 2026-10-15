# Contributing to UK UCAT Question Studio v2.0

Engineered by **[Infynno Solutions LLP](https://infynno.com/)** (*"Infinite Innovations"*).

Thank you for your interest in contributing to the **UK UCAT Question Studio** multi-agent AI system!

---

## 🛠️ Development Environment Setup

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 20+** & **npm**
- **Docker & Docker Compose** (for PostgreSQL 16)
- High-Throughput Inference Gateway credentials

### 2. Local Database
```bash
docker compose up -d
```
Verifies that PostgreSQL 16 is running on port `5432` with database `ucat_db`.

### 3. Backend Setup
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env
```
Run FastAPI dev server:
```bash
PYTHONPATH=backend uvicorn app.main:app --port 8000 --reload
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Testing & Verification Guidelines

Before submitting any code changes, ensure all verification suites pass with zero defects:

```bash
# 1. Backend pytest suite (15 unit & integration tests)
PYTHONPATH=backend pytest backend/tests/test_backend.py -v

# 2. Backend Python linter
ruff check backend

# 3. Frontend Oxlint linter (0 errors, 0 warnings policy)
cd frontend && npm run lint

# 4. Frontend production build
npm run build
```

---

## 📐 Multi-Agent Architectural Principles

1. **Strict Quality Threshold**: Questions scoring $\le 90$ must be regenerated up to 3 times by the Re-Generator agent. If still below 90, the workflow must halt and reject the question from the Question Bank.
2. **Deterministic Token & Cost Math**: All costs must be computed via official DeepInfra rates:
   - Text: $0.10 input / $0.32 output per 1M tokens.
   - Image: $0.0005 \times (\text{width}/1024) \times (\text{height}/1024) \times \text{iters}$ (USD).
3. **Modular Layer Separation**:
   - Routing: `backend/app/api/v1/`
   - Business/Agent Logic: `backend/app/agents/`
   - Data Access Layer: `backend/app/repositories/`
   - Database Entities: `backend/app/models/`
   - Frontend: Feature-based component directories with centralized hooks and constants.

---

## 📬 Pull Request Workflow

1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your commits using standard conventional commit messages:
   - `feat:` new feature or capability
   - `fix:` bug fix
   - `docs:` documentation improvements
   - `refactor:` code restructuring without changing behavior
   - `test:` adding or improving tests
3. Push to your fork and submit a Pull Request targeting `main`.
