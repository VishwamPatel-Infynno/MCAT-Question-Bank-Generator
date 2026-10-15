# UK UCAT Question Studio — Frontend

Modern, high-performance web workstation for **UK UCAT Question Studio**, engineered by **[Infynno Solutions LLP](https://infynno.com/)** (*"Infinite Innovations"*).

Built with **React 19**, **Vite 8**, **Oxlint**, and a custom dark-glass precision design system.

---

## 🎨 Architectural Overview

The frontend provides an intuitive, real-time command canvas for UK UCAT question generation, multi-agent observability, and psychometric bank curation:

- **Question Setup Studio**: 3-stage guided workflow for selecting subtests (Verbal Reasoning, Decision Making, Quantitative Reasoning, Abstract Reasoning, Situational Judgement), exam rigor, answer formats, passage length, and distractor traps.
- **Live 4-Agent Workflow Architecture**: Animated electric conduit hub displaying the autonomous background swarm (**Infynno Cognitive Reasoning Core**, **Infynno Psychometric Scoring Engine**, **Autonomous Remediation Engine**, and **Infynno Visual & Vector Engine**).
- **Staged Batch Review & Approval**: Interactive batch staging deck allowing educators to inspect, edit, discard, or approve multiple generated items before saving to the database.
- **Psychometric Review Audit Modal**: Comprehensive 100-point 4-pillar quality audit with itemized token tracking and micro-dollar cost calculations.
- **Enterprise Question Bank**: High-speed searchable, filterable repository with multi-format export (JSON/CSV) and copy-to-clipboard actions.

---

## 📁 Component Directory Structure

```
frontend/src/
├── components/
│   ├── index.js                  # Centralized barrel export for all components
│   ├── bank/
│   │   └── QuestionBank.jsx      # Repository table, filters, sorting, bulk actions, and export
│   ├── common/
│   │   ├── InfynnoLogo.jsx       # Official corporate vector logo primitive
│   │   └── Toast.jsx             # Floating toast notification system
│   ├── generator/
│   │   ├── AgentVisualizer.jsx   # Live generating telemetry & compact stepper
│   │   ├── GeneratorPanel.jsx    # Left-hand 3-stage guided setup dock
│   │   ├── MultiAgentPipelineVisualizer.jsx # 4-Agent architecture & electric wiring hub
│   │   ├── RejectionCard.jsx     # Diagnostic display when score fails threshold
│   │   └── StudioBlueprint.jsx   # Canvas blueprint summary & quick presets
│   ├── layout/
│   │   ├── Footer.jsx            # Infynno Solutions LLP attribution & resource footer
│   │   └── Navbar.jsx            # Header with branding, navigation tabs, status, and theme toggle
│   ├── modals/
│   │   └── SettingsModal.jsx     # Model configuration & Infynno corporate profile
│   └── question/
│       ├── QuestionCard.jsx      # Interactive student practice & review card
│       ├── ReviewAuditView.jsx   # 100-point rubric breakdown & token cost modal
│       ├── StageJsonInspector.jsx# Deep stage outcome JSON inspector modal
│       └── StagedBatchReview.jsx # Multi-question batch confirmation deck
├── constants/
│   ├── config.js                 # Pricing models, image parameters, resolution presets
│   └── ucat.js                   # UCAT subtests, pacing specs, icons, and fallback topics
├── hooks/
│   ├── useKeyboardShortcuts.js   # Global hotkeys (⌘↵ to generate, A to approve, D to discard)
│   ├── useQuestionBank.js        # Debounced search, sorting, and bank fetching
│   ├── useQuestionGenerator.js   # SSE streaming, batch progress, and state management
│   └── useTheme.js               # Dark/light mode persistence
├── services/
│   └── api.js                    # FastAPI client & SSE stream reader
├── index.css                     # Design tokens, electric conduit animations, and typography
└── main.jsx                      # Application entry point
```

---

## 🚀 Available Scripts

In the `frontend` directory, you can run:

```bash
# Start local development server with Hot Module Replacement (HMR)
npm run dev

# Run Oxlint high-speed linter (0 errors, 0 warnings policy)
npm run lint

# Build production bundle with Vite
npm run build

# Preview the production build locally
npm run preview
```

---

## 💎 Design System & Infynno Brand Tokens

- **Brand Violet**: `#4F30B9`
- **Brand Blue**: `#335ACF`
- **Brand Cyan**: `#1E7ADF`
- **Gradient**: `linear-gradient(135deg, #4F30B9 0%, #335ACF 50%, #1E7ADF 100%)`
- **Typography**: Plus Jakarta Sans (Sans-serif), Newsreader (Serif for reading passages), JetBrains Mono (Monospace)
