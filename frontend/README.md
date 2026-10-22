# Infynno UCAT Question Bank Generator - Frontend

Modern, high-performance web workstation for **Infynno UCAT Question Bank Generator**, engineered by **[Infynno Solutions LLP](https://infynno.com/)** (*"Infinite Innovations"*).

Built with **React 19**, **Vite 8**, **Oxlint**, and a custom dark-glass precision design system.

---

## 🎨 Architectural Overview

The frontend provides an intuitive, real-time command canvas for UK UCAT question generation, AI team tracking, and question bank management:

- **Question Setup Panel**: 5-step guided workflow for selecting sections (Verbal Reasoning, Decision Making, Quantitative Reasoning, Abstract Reasoning, Situational Judgement), syllabus subtopics, difficulty calibration, reading material stimuli, and cognitive distractor traps.
- **Live AI Team with Fused Draft-and-Critique**: Animated live tracker displaying the AI team milestones (**Question Writer** with fused 100-pt self-critique for ~40% faster generation, **Quality Reviewer**, **Question Improver**, and **Diagram & Chart Maker**) with electric conduit telemetry.
- **Staged Batch Review & Approval**: Interactive batch staging deck allowing educators to inspect, edit, discard, or approve multiple generated items before saving to the database.
- **Question Quality & Cost Breakdown**: Comprehensive 100-point 4-pillar quality check with itemized token tracking and micro-dollar cost calculations.
- **Export & Print Studio**: Professional modal for exporting PDF Exam Papers (with candidate headers and page breaks), Study Packs, CSV, and JSON bundles.
- **Enterprise Question Bank**: High-speed searchable, filterable repository with multi-format export and copy-to-clipboard actions.

---

## 📁 Component Directory Structure

```
frontend/src/
├── components/
│   ├── index.js                  # Centralized barrel export for all components
│   ├── bank/
│   │   └── QuestionBank.jsx      # Repository table, filters, sorting, bulk actions, and export
│   ├── common/
│   │   ├── CustomSelect.jsx      # Accessible custom dropdown select primitive
│   │   ├── InfynnoLogo.jsx       # Official corporate vector logo primitive
│   │   ├── NumberStepper.jsx     # Accessible numerical stepper primitive
│   │   └── Toast.jsx             # Floating toast notification system
│   ├── layout/
│   │   ├── Footer.jsx            # Infynno Solutions LLP attribution & resource footer
│   │   └── Navbar.jsx            # Header with branding, navigation tabs, status, and theme toggle
│   ├── modals/
│   │   └── ExportPrintModal.jsx  # Exam Paper (PDF), Study Pack, CSV and JSON export modal
│   ├── pipeline/
│   │   ├── AgentVisualizer.jsx   # Live generating telemetry & compact stepper
│   │   ├── MultiAgentPipelineVisualizer.jsx # 4-Agent architecture & conduit visualizer
│   │   └── RejectionCard.jsx     # Diagnostic display when score fails threshold
│   ├── question/
│   │   ├── MentorExplanationView.jsx # Warm conversational tutor explanation with trap breakdowns
│   │   ├── QuestionCard.jsx      # Interactive student practice & review card
│   │   ├── QuestionDraftingSkeleton.jsx # Pulse skeleton for question creation
│   │   ├── ReviewAuditView.jsx   # 100-point rubric breakdown & token cost modal
│   │   ├── SharedPassageCard.jsx # Shared reading passage stimulus display card
│   │   ├── StageJsonInspector.jsx# Deep stage outcome JSON inspector modal
│   │   ├── StagedBatchReview.jsx # Multi-question batch confirmation deck
│   │   ├── StagedQuestionSlotCard.jsx # Individual question slot reviewer card
│   │   └── VisualStimulusViewer.jsx # SVG & neural visual diagram renderer
│   └── wizard/
│       ├── GuidedWizard.jsx      # 5-step guided exam generation wizard dock
│       ├── HeroLanding.jsx       # Welcome landing hero header
│       ├── IndependentDiagramControls.jsx # Standalone diagram requirements selector
│       ├── QuestionStyleMixSection.jsx # Single vs multi-choice allocation controls
│       └── steps/                # Subcomponents for wizard steps 1 through 5
├── constants/
│   ├── config.js                 # Pricing models, image parameters, token rates
│   └── ucat.js                   # UCAT subtests, pacing specs, icons, and fallback topics
├── hooks/
│   ├── index.js                  # Barrel export for custom hooks
│   ├── useGeneratorForm.js       # Form state & validation logic
│   ├── useKeyboardShortcuts.js   # Global hotkeys (⌘↵ to generate, A to approve, D to discard, T to toggle theme)
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

👉 **[UI/UX Design System Specification (DESIGN.md)](../DESIGN.md)**

- **Brand Violet**: `#4F30B9`
- **Brand Blue**: `#335ACF`
- **Brand Cyan**: `#1E7ADF`
- **Gradient**: `linear-gradient(135deg, #4F30B9 0%, #335ACF 50%, #1E7ADF 100%)`
- **Typography**: Plus Jakarta Sans (Sans-serif), Newsreader (Serif for reading passages), JetBrains Mono (Monospace)
