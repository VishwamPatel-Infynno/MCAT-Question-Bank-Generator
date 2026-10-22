# Contributing to Infynno UCAT Question Bank Generator v2.0

Engineered by **[Infynno Solutions LLP](https://infynno.com/)** (*"Infinite Innovations"*).

Thank you for your interest in contributing to the **Infynno UCAT Question Bank Generator** multi-agent AI system!

---

## 🛠️ Development Environment Setup

### 1. Prerequisites
- **Python 3.11+**
- **Node.js 20+** & **pnpm (v9+)**
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
pnpm install
pnpm dev
```

---

## 🧪 Testing & Verification Guidelines

Before submitting any code changes, ensure all verification suites pass with zero defects:

```bash
# 1. Backend pytest suite (31 unit & integration tests)
PYTHONPATH=backend pytest backend/tests -v -k "not live_e2e"

# 2. Backend Python linter
ruff check backend

# 3. Frontend Oxlint linter (0 errors, 0 warnings policy)
pnpm lint

# 4. Frontend production build
pnpm build
```

---

## 📐 Multi-Agent Architectural Principles

1. **Strict Quality Threshold**: Questions scoring $\le 90$ must be regenerated up to 3 times by the Re-Generator agent. If still below 90, the workflow must halt and reject the question from the Question Bank.
2. **Deterministic Token & Cost Math**: All costs must be computed via official DeepInfra rates:
   - Text: $0.098 input / $0.294 output per 1M tokens.
   - Image: Flat baseline rate of $0.014 USD per image (scaled by $(\text{width}/1024) \times (\text{height}/1024)$).
3. **Modular Layer Separation**:
   - Routing: `backend/app/api/v1/`
   - Business/Agent Logic: `backend/app/agents/`
   - Data Access Layer: `backend/app/repositories/`
   - Database Entities: `backend/app/models/`
   - Frontend: Feature-based component directories (`wizard/`, `pipeline/`, `question/`, `bank/`, `layout/`, `modals/`, `common/`) with centralized hooks and constants.
4. **3-Step AI Pipeline & Cognitive Fusion**: Milestone 01 fuses item authoring and 100-point rubric self-critique (`Question Writer & Reviewer`) into a single pass (~40% faster). Only drafts scoring $\le 90$ trigger Milestone 02 remediation (`Question Improver`), while Milestone 03 renders visual stimuli (`Diagram & Chart Maker`).
5. **Option Symmetry & Anti-AI Standard**: Enforce $\pm 15\%$ option length parity and single hyphens (`-`) only; em dashes (`—`) and en dashes (`–`) are strictly forbidden across prompts and generation output.

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
