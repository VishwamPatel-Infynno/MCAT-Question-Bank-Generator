# Infynno MCAT Question Bank Generator - Frontend

Modern, high-performance web workstation for **Infynno MCAT Question Bank Generator**, engineered by **[Infynno Solutions LLP](https://infynno.com/)** (*"Infinite Innovations"*).

Built with **React 19**, **Vite 8**, **Oxlint**, and a custom dark-glass precision design system.

---

## 🎨 Architectural Overview

The frontend provides an intuitive, real-time command canvas for AAMC MCAT question generation, AI team tracking, and question bank management:

- **Progressive 7-Step Guided Wizard**: Step-by-step authoring workflow for selecting official AAMC sections (Chemical and Physical Foundations, Critical Analysis and Reasoning Skills [CARS], Biological and Biochemical Foundations, Psychological, Social, and Biological Foundations), syllabus disciplines, major units, topics, subtopics, difficulty calibration, reading material stimuli, and cognitive distractor traps.
- **2 Calibrated Generation Scopes**:
  - **Live Mini-Set (5 Qs)**: Parallel drafting on a shared passage or discrete set (~35-50s) staged in the interactive multi-slot desk with live telemetry and inline editing.
  - **Full Mock Section (50 Qs)**: Enterprise background multi-job batch (10 concurrent jobs x 5 questions) with automatic AI validation.
- **Live AI Team with Fused Draft-and-Critique**: Animated live tracker displaying the AI pipeline milestones (**Question Writer & Reviewer** with fused 100-pt self-critique for ~40% faster generation, **Question Improver** with smart status indicators, and **Diagram & Chart Maker**) with electric conduit telemetry.
- **Staged Batch Review & Approval**: Interactive batch staging deck allowing educators to inspect, edit, discard, or approve multiple generated items before saving to the database.
- **Question Quality & Cost Breakdown**: Comprehensive 100-point 4-pillar quality check with itemized token tracking and micro-dollar cost calculations.
- **Export & Print Studio**: Professional modal for exporting PDF Exam Papers (with candidate headers and page breaks), Study Packs, CSV, and JSON bundles.
- **Enterprise Question Bank**: High-speed searchable, filterable repository with multi-format export, lifecycle status management, and copy-to-clipboard actions.

---

## 📁 Component Directory Structure

```
frontend/src/
├── views/                        # Top-level application view screens (code-split)
│   ├── index.js                  # Views barrel export
│   ├── GeneratorWorkspaceView.jsx# Interactive exam generation & pipeline workspace
│   ├── QuestionBankView.jsx      # Verified Question Bank view & repository table
│   ├── AiValidatedQuestionsView.jsx # Dedicated AI-Validated (>90) quality bank
│   └── BatchActivityView.jsx     # Live & historical batch monitoring dashboard
├── components/
│   ├── index.js                  # Centralized barrel export for all components
│   ├── bank/
│   │   ├── QuestionBankFilters.jsx # Section, difficulty, and search filter controls
│   │   └── QuestionBankTable.jsx # Tabular question rows, batch selection, and actions
│   ├── common/
│   │   ├── CustomSelect.jsx      # Accessible custom dropdown select primitive
│   │   ├── FormattedText.jsx     # Inline markdown & cognitive trap chip highlighter
│   │   ├── InfynnoLogo.jsx       # Official corporate vector logo primitive
│   │   ├── LiveStopwatch.jsx     # High-precision live stopwatch timer
│   │   └── Toast.jsx             # Floating toast notification system
│   ├── layout/
│   │   ├── Footer.jsx            # Infynno Solutions LLP attribution & resource footer
│   │   └── Navbar.jsx            # Header with branding, navigation tabs, status, and theme toggle
│   ├── modals/
│   │   ├── ExportPrintModal.jsx  # Exam Paper (PDF), Study Pack, CSV and JSON export modal (Focus Trapped)
│   │   └── ExportPaperPreview.jsx# Live print layout previewer
│   ├── pipeline/
│   │   ├── AgentVisualizer.jsx   # Live generating telemetry & compact stepper
│   │   ├── MultiAgentPipelineVisualizer.jsx # 3-Milestone pipeline architecture & conduit visualizer
│   │   └── RejectionCard.jsx     # Diagnostic display when score fails threshold
│   ├── question/
│   │   ├── MentorExplanationView.jsx # 3-card mentor explanation view (Intuition, Distractors, Trap)
│   │   ├── QuestionCard.jsx      # Interactive student practice & review card
│   │   ├── QuestionDraftingSkeleton.jsx # Pulse skeleton for question creation
│   │   ├── QuestionInlineEditor.jsx # In-place authoring & remediation editor
│   │   ├── QuestionScorecardTab.jsx # 100-point rubric breakdown accordion
│   │   ├── ReviewAuditView.jsx   # 100-point rubric breakdown & token cost modal (Focus Trapped)
│   │   ├── SharedPassageCard.jsx # Shared reading passage stimulus display card (Split-Pane Sticky)
│   │   └── VisualStimulusViewer.jsx # SVG & neural visual diagram renderer
│   ├── staged/
│   │   ├── index.js              # Barrel export for batch review deck
│   │   ├── BatchProgressHeader.jsx # Staged batch progress telemetry header & Split/Stacked toggle
│   │   ├── StageJsonInspector.jsx# Deep stage outcome JSON inspector modal (Focus Trapped)
│   │   ├── StagedBatchGrid.jsx   # Grid of staged batch question slots
│   │   ├── StagedBatchReview.jsx # Multi-question batch confirmation deck (AAMC Split-Pane Layout)
│   │   ├── StagedDetailedView.jsx# Expanded single question review panel
│   │   ├── StagedQuestionSlotCard.jsx # Individual question slot reviewer card
│   │   └── StagedSlotSkeleton.jsx# Slot loading pulse skeleton
│   ├── batch/
│   │   ├── ActiveMultiBatchMonitor.jsx # Global concurrency metrics & live multi-batch controller
│   │   ├── BatchCard.jsx         # Summary status card for generation batches
│   │   ├── BatchFiltersBar.jsx   # Section, status, and search filters
│   │   ├── BatchJobCard.jsx      # Per-question job card with lifecycle status
│   │   ├── BatchQuestionItem.jsx # Staged question item with review modal
│   │   └── BatchStatsHeader.jsx  # High-level aggregate batch statistics
│   ├── validated/
│   │   ├── AiValidatedQuestionCard.jsx # Card with direct bank approval actions
│   │   ├── AiValidatedFiltersBar.jsx # Filters for AI-validated questions
│   │   └── AiValidatedStatsBar.jsx # Quick-action statistics header
│   └── wizard/
│       ├── GuidedWizard.jsx      # Progressive 7-step guided exam generation wizard dock
│       ├── HeroLanding.jsx       # Welcome landing hero header
│       └── steps/                # Progressive 7-step subcomponents (WizardStep1Section through WizardStep7Review)
├── constants/
│   ├── index.js                  # Constants barrel export
│   ├── config.js                 # Pricing models, image parameters, token rates
│   ├── mcat.js                   # MCAT sections, pacing specs, icons, and fallback topics
│   ├── mcat_dependent_taxonomy.json # AAMC-aligned foundational concepts and skills
│   └── mcatTraps.js              # AAMC cognitive trap definitions and defense strategies
├── hooks/
│   ├── index.js                  # Barrel export for custom hooks
│   ├── useAppState.js            # Centralized view routing & global event broker
│   ├── useGeneratorForm.js       # Form state & validation logic
│   ├── useKeyboardShortcuts.js   # Global hotkeys (⌘↵ to generate, A to approve, D to discard, T to toggle theme)
│   ├── useQuestionBank.js        # Debounced search, sorting, and bank fetching
│   ├── useQuestionGenerator.js   # SSE streaming, batch progress, and state management
│   └── useTheme.js               # Dark/light mode persistence
├── services/
│   └── api.js                    # FastAPI client & SSE stream reader
├── utils/
│   ├── index.js                  # Utilities barrel export
│   ├── explanationHelpers.js     # Pure JS distractor line & trap parser
│   ├── exportUtils.js            # CSV, JSON, and print-ready HTML doc generators
│   ├── formatters.js             # Currency, pacing, and token formatting
│   └── trapHelpers.js            # Cognitive trap detection & resolution
├── index.css                     # Design tokens, electric conduit animations, and typography
└── main.jsx                      # Application entry point
```

---

## 🚀 Available Scripts

In the repository root or `frontend` directory, you can run:

```bash
# Start local development server with Hot Module Replacement (HMR)
pnpm dev

# Run Oxlint high-speed linter (0 errors, 0 warnings policy)
pnpm lint

# Build production bundle with Vite
pnpm build

# Preview the production build locally
pnpm preview
```

---

## 💎 Design System & Infynno Brand Tokens

The frontend uses an enterprise precision design system. For exhaustive tokens, typography hierarchies, component contracts, and accessibility specifications, consult the authoritative guide:

👉 **[UI/UX Design System Specification (DESIGN.md)](file:///Users/infynnosolutions/Desktop/Code/Question%20Bank%20Generator/DESIGN.md)**

- **Brand Violet**: `#4F30B9`
- **Brand Blue**: `#335ACF`
- **Brand Cyan**: `#1E7ADF`
- **Gradient**: `linear-gradient(135deg, #4F30B9 0%, #335ACF 50%, #1E7ADF 100%)`
- **Typography**: Plus Jakarta Sans (Sans-serif), Newsreader (Serif for reading passages), JetBrains Mono (Monospace)
