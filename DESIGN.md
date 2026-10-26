# Infynno Design System & UI Specification (DESIGN.md)

> **Infynno Solutions LLP • Infinite Innovations • [infynno.com](https://infynno.com/)**  
> **Product**: Infynno MCAT Question Bank Generator v2.0  
> **Aesthetic Philosophy**: Linear/Vercel-inspired high-precision minimalism, dark obsidian default with alabaster light mode, scientific research passages and CARS essays, and animated electric conduit telemetry.

---

## 1. Design Philosophy & Architectural Principles

The Infynno MCAT Question Studio is built for pre-med educators, test-prep authors, and aspiring medical candidates who require focused, fatigue-free reading environments combined with real-time multi-agent observability and official AAMC exam alignment.

1. **Precision Minimalism**: Quiet surfaces, hairline borders (`1px solid var(--border-light)`), subtle elevations, and zero card clutter.
2. **Editorial Typographic Hierarchy**: Clinical reading passages rendered in warm, high-legibility serif type (`Newsreader`, line-height `1.68`), while UI controls and telemetry use modern sans-serif (`Plus Jakarta Sans`) and monospace (`JetBrains Mono`).
3. **Reactive Observability**: Complex multi-agent workflow steps (Generator, Reviewer, Regenerator, Image Engine) are visualized through glowing electric conduit animations without distracting from the editorial workspace.
4. **Seamless Dual-Theme Ergonomics**: First-class dark obsidian (`#080c14`) and alabaster light (`#f8fafc`) palettes toggled instantly with zero flicker (`T` shortcut or navbar control).
5. **Print & Export Fidelity**: Built-in `@media print` CSS rules and clean paper layouts for professional PDF exam booklets and student study packs.

---

## 2. Color System & Design Tokens

Design tokens are defined as CSS custom properties in [`frontend/src/index.css`](file:///Users/infynnosolutions/Desktop/Code/Question%20Bank%20Generator/frontend/src/index.css) and automatically respond to the `[data-theme="dark"]` and `[data-theme="light"]` attributes on the root `<html>` element.

### 2.1 Infynno Corporate Brand Palette
These core gradient tokens anchor the brand identity across buttons, active tab indicators, and progress tracks:

| Token Name | Hex / Value | Role |
| :--- | :--- | :--- |
| `--infynno-violet` | `#4F30B9` | Primary deep violet anchor |
| `--infynno-blue` | `#335ACF` | Core Infynno royal blue |
| `--infynno-cyan` | `#1E7ADF` | Vibrant electric cyan accent |
| `--infynno-gradient` | `linear-gradient(135deg, #4F30B9 0%, #335ACF 50%, #1E7ADF 100%)` | Interactive primary actions, badges, progress bars |
| `--infynno-glow` | `0 0 16px rgba(51, 90, 207, 0.25)` | Focused element glow |

---

### 2.2 Theme Surface & Border Variables

```mermaid
graph LR
    subgraph "Dark Obsidian (Default)"
        D_Canvas[--bg-canvas: #080c14] --> D_Surface[--bg-surface: #0d121d]
        D_Surface --> D_Elevated[--bg-surface-elevated: #121826]
        D_Elevated --> D_Border[--border-light: rgba(255,255,255,0.06)]
    end
    subgraph "Alabaster Light"
        L_Canvas[--bg-canvas: #f8fafc] --> L_Surface[--bg-surface: #ffffff]
        L_Surface --> L_Elevated[--bg-surface-elevated: #ffffff]
        L_Elevated --> L_Border[--border-light: #e8ecf2]
    end
```

| Token | Dark Theme (`[data-theme="dark"]`) | Light Theme (`[data-theme="light"]`) | Usage |
| :--- | :--- | :--- | :--- |
| `--bg-app` / `--bg-canvas` | `#080c14` | `#f8fafc` | Viewport backdrop |
| `--bg-surface` | `#0d121d` | `#ffffff` | Standard card panels |
| `--bg-surface-elevated`| `#121826` | `#ffffff` | Modals, active states, dropdowns |
| `--bg-surface-subtle`  | `#0a0e18` | `#f8fafc` | Inactive steps, table headers |
| `--bg-surface-hover`   | `#151c2c` | `#f1f5f9` | Hover states |
| `--border-light`       | `rgba(255, 255, 255, 0.06)` | `#e8ecf2` | Primary panel hairline dividers |
| `--border-medium`      | `rgba(255, 255, 255, 0.10)` | `#cbd5e1` | Input focus, active borders |
| `--border-strong`      | `rgba(255, 255, 255, 0.16)` | `#94a3b8` | Elevated modal outlines |
| `--text-primary`       | `#f8fafc` | `#0f172a` | Headers, reading passages, keys |
| `--text-secondary`     | `#94a3b8` | `#475569` | Body copy, secondary options |
| `--text-muted`         | `#64748b` | `#64748b` | Metadata, micro-badges, hints |
| `--text-dim`           | `#475569` | `#94a3b8` | Placeholders, inactive labels |

---

### 2.3 Status & Psychometric Scoring Tokens

| Status Pillar | Foreground Token | Dark BG / Border | Light BG / Border | Semantic Role |
| :--- | :--- | :--- | :--- | :--- |
| **Pass / Success** | `--status-success` (`#10b981`) | `rgba(16,185,129,0.06)` / `0.22` | `#ecfdf5` / `#a7f3d0` | Psychometric Score > 90, Approved |
| **Warning / Caution** | `--status-warning` (`#f59e0b`) | `rgba(245,158,11,0.06)` / `0.22` | `#fffbeb` / `#fde68a` | Remediation in progress, Borderline draft |
| **Reject / Danger** | `--status-danger` (`#f43f5e`) | `rgba(244,63,94,0.06)` / `0.22` | `#fff1f2` / `#fecdd3` | Score <= 90 after 3 cycles, Discarded draft |
| **Cognitive Trap** | `--status-purple` (`#8b5cf6`) | `rgba(139,92,246,0.06)` / `0.22` | `#f5f3ff` / `#ddd6fe` | Distractor analysis, trap rationalization |

---

### 2.4 MCAT Section Accents

Each official AAMC MCAT section receives a dedicated signature accent for instant identification across wizards, cards, and filters:

```
Chemical and Physical Foundations (CP)   -> Sky Blue      (#38bdf8 / #0284c7)
Critical Analysis & Reasoning (CARS)    -> Rose Crimson  (#f43f5e / #e11d48)
Biological & Biochemical Foundations (BB)-> Emerald Green (#10b981 / #059669)
Psychological, Social & Biological (PS)  -> Royal Violet  (#a855f7 / #7c3aed)
```

---

## 3. Typography & Spatial Layout

### 3.1 Font Stacks
```css
--font-sans:  'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-serif: 'Newsreader', Georgia, serif;
--font-mono:  'JetBrains Mono', monospace;
```

- **Plus Jakarta Sans**: Primary application typography. Clean, modern geometric proportions ensure high legibility in buttons, tabs, wizards, and tables.
- **Newsreader Serif**: Used exclusively for clinical reading passages and stimulus articles. Set with `font-size: 1.05rem`, `line-height: 1.68`, and letter-spacing `-0.01em` to emulate high-end medical journal formatting and prevent cognitive fatigue.
- **JetBrains Mono**: Used for token metrics, stopwatch timers, cost calculations, JSON trees, and shortcut badges (`⌘↵`, `A`, `D`).

### 3.2 Spatial Scale & Border Radii
- **Workspace Canvas**: Constrained to `maxWidth: 1040px` centered with auto margins, ensuring consistent eye travel without overly wide reading lines.
- **Radius Hierarchy**:
  - `--radius-xs`: `4px` (micro tags, tooltips)
  - `--radius-sm`: `8px` (buttons, select menus, input fields)
  - `--radius-md`: `12px` (sub-cards, option containers)
  - `--radius-lg`: `16px` (main workspace cards, modal dialogs)
  - `--radius-full`: `9999px` (circular option badges A-D, theme switchers, status pills)

---

## 4. Component Design Specifications

### 4.1 Guided Question Wizard (`GuidedWizard.jsx`)
- **Step 1: Section & Exam Style**: Official AAMC section selection (CP, CARS, BB, PS) with authentic pacing badges (~96s to ~101s per question).
- **Step 2: Discipline & Major Unit**: Discipline breakdown and major unit selection based on the official AAMC syllabus.
- **Step 3: Topic & High-Yield Concept**: Targeted topic and granular subtopic concept selection.
- **Step 4: Level, Scope & Question Format**: Calibrated challenge level (Foundational, Standard MCAT, Top Percentile), question format (Passage-Based vs Independent Single-Choice), and 3 calibrated Generation Scopes:
  1. **Quick Single Item (1 Q)**: Real-time SSE streaming into the interactive Question Desk (~15-25s) with live telemetry and inline editing.
  2. **Live Mini-Set (5 Qs)**: Parallel drafting on a shared passage or discrete set (~35-50s) staged in the interactive multi-slot desk.
  3. **Full Mock Section (50 Qs)**: Enterprise background multi-job batch (10 concurrent jobs x 5 questions) with automatic AI validation.
- **Step 5: Cognitive Traps & Reasoning Skills**: Deliberate AAMC distractor trap calibration (e.g., Extreme Language, Correlation vs Causation, Formula Trap) paired with official AAMC SIRS and CARS skills.
- **Step 6: Visual Stimulus & Custom Guidance**: Programmatic SVG vector diagram generation, autonomous AI image generation toggle, and custom prompt directives.
- **Step 7: Review & Multi-Agent Launch**: End-to-end parameter audit with quick scope switcher pills and dynamic launch action.

### 4.2 Multi-Agent Conduit Telemetry (`MultiAgentPipelineVisualizer.jsx`)
- Three connected functional milestones (**Question Writer & Reviewer**, **Question Improver**, **Diagram & Chart Maker**).
- **Grid Layout**: Structured via `.pipeline-stepper` as a balanced 3-column grid (`grid-template-columns: repeat(3, 1fr); gap: 10px;`) with single-column responsive stacking on viewports $\le 768\text{px}$.
- **Fused Acceleration Badging**: Step 01 features the *"Fused Drafting & 100-pt Audit"* milestone with the *"~40% Faster"* efficiency tag, highlighting the single-pass authoring and instant audit breakthrough.
- **Smart Conditional State Indicators**: Step 02 displays *"Passed (90+ Standard)"* when drafts exceed the strict quality threshold on the first pass; Step 03 displays *"Text-Only (No Diagram Needed)"* for questions without visual figures.
- Conduits between nodes feature an animated electric gradient pulse (`conduit-flow-active`) during active streaming.
- Collapsible SSE telemetry drawer displaying raw event stream timestamps, event types, token metrics, and per-step costs.

### 4.3 Editorial Review Desk & AAMC Dual Split-Pane Mode (`QuestionCard.jsx`, `StagedBatchReview.jsx`)
- **Top Metadata Strip**: Displays section badge, difficulty chip, dual score pills (AAMC Scaled Score `118-132` + 100-pt Audit Score), AAMC Skill badge (SIRS 1-4 / CARS 1-3), cumulative token/cost telemetry, and a dedicated **Primary Cognitive Trap Badge Chip** (`rgba(139, 92, 246, 0.12)` background, purple border, `Tag` icon).
- **AAMC Dual Split-Pane Reading Mode Layout**:
  - Implemented in `StagedBatchReview.jsx` using the `.aamc-split-layout-grid` CSS class:
    ```css
    .aamc-split-layout-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
      gap: 20px;
      align-items: start;
    }
    ```
  - **Left Reading Pane (`SharedPassageCard.jsx`)**: Displays the shared experimental stimulus or CARS essay formatted in warm Newsreader serif type (`font-size: 1.05rem`, `line-height: 1.68`). Features sticky positioning (`position: sticky; top: 88px; max-height: calc(100vh - 120px); overflow-y: auto;`) allowing educators to consult passage evidence without losing their vertical reading position.
  - **Right Candidate Pane (`QuestionCard.jsx` / `StagedDetailedView.jsx`)**: Hosts the active question stem, option badges, inline editor, and distractor rationales with independent vertical scrolling.
  - **Layout Mode Toggle (`BatchProgressHeader.jsx`)**: An interactive switcher (`#btn-toggle-split-layout`) allows educators to seamlessly toggle between **Split View** (side-by-side reading desk) and **Stacked View** (vertical single-column layout).
  - **Responsive Collapse**: Automatically collapses to a clean single column on mobile and tablet screens ($\le 1024\text{px}$).
- **Option Badges**: Standard 4 circular `A`, `B`, `C`, `D` pills that highlight emerald on correct answers and crimson on incorrect distractors with clear checkmark/cross indicators.
- **Distractor Rationalization Drawers**: Collapsible cards detailing the exact psychometric reason why each wrong option constitutes a realistic cognitive trap.
- **Inline Editor (`QuestionInlineEditor.jsx`)**: Live editable fields allowing educators to adjust stem text, key letters, or explanation proofs before committing to the question bank.

### 4.4 Psychometric Audit Modal & Accessible Focus Trapping (`ReviewAuditView.jsx`)
- **Modal Architecture**: Accessible dialog overlay implementing strict WCAG AA focus trapping and escape dismissal:
  - Traps keyboard focus (`Tab` and `Shift+Tab`) within the dialog boundaries, preventing background tabbing.
  - Restores focus to the triggering element upon dismissal (`Escape` key or backdrop click).
  - ARIA attributes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="audit-modal-title"`.
- Displays the 4-pillar breakdown (Authenticity, Clarity, Distractor Traps, Explanation Rigor) scored out of 25 each.
- Itemized per-cycle token usage table detailing prompt tokens, completion tokens, execution time, and sub-micro-cent USD cost.

### 4.5 Export & Print Studio (`ExportPrintModal.jsx`, `ExportPaperPreview.jsx`)
- Accessible modal dialog providing live print preview and multi-format export:
  1. **Exam Paper (PDF / Print)**: Formatted with title blocks, candidate name lines, timing guidelines, and `.page-break` rules preventing awkward page splits.
  2. **Comprehensive Study Pack**: Includes full passages, question stems, answers, and in-depth step-by-step rationales.
  3. **CSV Export**: Standardized comma-delimited export ready for LMS and spreadsheet ingestion.
  4. **JSON Bundle**: Full relational representation including evolution histories and token metrics.

### 4.6 Conversational Mentor Explanation View (`MentorExplanationView.jsx`)
Renders pedagogical rationales across three distinct, beautifully styled visual cards:
- **Card 1: Why Option [Key] is Correct (Emerald / Success)**:
  - Tokens: Background `rgba(16, 185, 129, 0.06)` (dark) / `#ecfdf5` (light), border `rgba(16, 185, 129, 0.22)` (dark) / `#a7f3d0` (light), text `--status-success` (`#10b981`), `CheckCircle2` icon.
  - Purpose: Sets the core intuition and step-by-step mathematical or deductive proof demonstrating why the correct key is incontrovertible.
- **Card 2: Why Other Options are Incorrect (Amber / Warning)**:
  - Tokens: Background `rgba(245, 158, 11, 0.06)` (dark) / `#fffbeb` (light), border `rgba(245, 158, 11, 0.22)` (dark) / `#fde68a` (light), text `--status-warning` (`#f59e0b`), `AlertTriangle` icon.
  - Structure: Contains individual itemized sub-cards for each distractor choice (`[A]`, `[C]`, `[D]`) detailing the specific fallacy, miscalculation, or deceptive wording that disqualifies it.
- **Card 3: Primary Cognitive Trap Spotlight (Purple / Tactical Defense)**:
  - Tokens: Background `rgba(139, 92, 246, 0.06)` (dark) / `#f5f3ff` (light), border `rgba(139, 92, 246, 0.25)` (dark) / `#ddd6fe` (light), text `--status-purple` (`#8b5cf6`), `Zap` & `ShieldCheck` icons.
  - Content: Spotlights the dominant MCAT trap from the 11-trap taxonomy (`MCAT_TRAP_DEFINITIONS`), detailing the precise psychological **Error Mechanism** and providing an actionable **Student Defense Strategy** for test day.
- **Top Metadata Trap Badging**:
  - `QuestionCard.jsx` and `QuestionBankTable.jsx` render a persistent purple badge chip in the card header: background `rgba(139, 92, 246, 0.12)`, text `#a78bfa` (dark) / `#6d28d9` (light), border `rgba(139, 92, 246, 0.3)`.
- **Responsive Modes**: Supports `isCompact=true` for staged review decks and full expanded mode for in-depth editorial analysis.

### 4.7 Active Multi-Batch Concurrency Monitor (`ActiveMultiBatchMonitor.jsx`)
- **Real-Time Telemetry Strip**: Displays live worker pool occupancy against configured limits (`Global Jobs: X / 4`, `Active Inference Calls: Y / 10`).
- **Interactive Batch Lifecycle Actions**:
  - **1-Click Batch Stop**: Immediately halts running sub-tasks without deleting saved items.
  - **1-Click Batch Retry**: Relaunches failed or cancelled jobs into the global worker pool.
  - **Cancel All Batches**: Global administrative emergency stop.

### 4.8 Live Stopwatch & Precision Telemetry (`LiveStopwatch.jsx`)
- Renders an active runtime duration stopwatch using `font-family: var(--font-mono)` with glowing amber pulse animation during active generation runs.

### 4.9 Top-Level Application Views (`views/`)
1. **Generator Workspace View (`GeneratorWorkspaceView.jsx`)**: Coordinates the 7-step guided wizard dock alongside the single-canvas live generation desk, telemetry pipelines, and staged review decks.
2. **AI Validated Questions View (`AiValidatedQuestionsView.jsx`)**: Dedicated review deck for items generated in background batches that passed the >90 quality threshold, supporting one-click individual or bulk publishing into the primary Question Bank.
3. **Question Bank View (`QuestionBankView.jsx`)**: Full-featured searchable, filterable repository table featuring multi-format CSV/JSON exports, bulk deletion, lifecycle status updates, and repository-wide token analytics.
4. **Batch Activity View (`BatchActivityView.jsx`)**: Live and historical monitor displaying running batch jobs, per-job question counts, status indicators, and background worker progress.

---

## 5. Micro-Animations & Dynamic Feedback

1. **Electric Conduit Pulse**:
```css
@keyframes conduitFlow {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
```
2. **Skeleton Shimmer**:
```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```
3. **Card Lift**: Subtle `-1px` vertical translation on button and interactive card hover paired with `--shadow-md`.
4. **Theme Transition**: Smooth `0.18s ease-out` transition applied to background colors and borders to eliminate abrupt flashes when switching between dark and light themes.

---

## 6. Keyboard Shortcuts & Accessibility Standards

- **WCAG AA Compliance**: All text tokens in both Dark and Light themes maintain a minimum contrast ratio of 4.5:1 for body copy and 3:1 for large text and UI components.
- **Visible Focus Rings**: Custom focus outlines (`outline: 2px solid var(--brand-primary); outline-offset: 2px;`) across all accessible inputs and buttons.
- **Global Keyboard Accelerators**:
  - `⌘ + Enter` / `Ctrl + Enter`: Trigger question or batch generation.
  - `T`: Instant toggle between Dark and Light themes.
  - `/`: Immediately focus the Question Bank search input.
  - `A`: Approve active staged question.
  - `D`: Discard active staged question.
  - `Escape`: Close any open dialog modal (Audit View, Stage JSON, Export Studio).

---

## 7. Anti-AI Dash Standard

To ensure human editorial authenticity and eliminate unstyled typographical artifacts:
- Never use unspaced em-dashes (`—`) or en-dashes (`–`) in UI copy, prompts, or generated questions.
- Use clean single hyphens (`-`) flanked by standard spacing when connecting clauses (e.g., `Question Bank - Filter by Section`).
