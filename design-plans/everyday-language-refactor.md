# Everyday Human Language Refactor

Written against: 10169fbe85b905e9624c3a6c90df6cc729738377

## Evidence chain

- Surface: Entire user-facing application (`Navbar.jsx`, `WizardStep3ReviewAdvanced.jsx`, `MultiAgentPipelineVisualizer.jsx`, `AgentVisualizer.jsx`, `VisualStimulusViewer.jsx`, `SharedPassageCard.jsx`, `StagedBatchGrid.jsx`, `BatchProgressHeader.jsx`, `QuestionCard.jsx`, `ReviewAuditView.jsx`, `PassageVisualStimulusEditor.jsx`, `QuestionBankFilters.jsx`, `useAppState.js`)
- Problem: Residual technical and AI-native jargon ("multi-agent telemetry", "stimulus vignette", "Infynno Neural Diagram", "telemetry drawer", "visual stimulus", "cognitive distractor fallacies", "psychometric audit") remains visible in UI labels, tooltips, tab titles, and live notification toasts, giving the product an artificial, AI-generated impression rather than that of a polished human-authored educational studio.
- Design evidence: `DESIGN.md` Section 8 ("Everyday Human Language Standard") specifies natural classroom and editorial terminology, banning robotic self-references and technical jargon.
- Owner: `frontend/src/`
- Scope and affected surfaces:
  - `frontend/src/components/layout/Navbar.jsx`
  - `frontend/src/components/wizard/steps/WizardStep3ReviewAdvanced.jsx`
  - `frontend/src/components/pipeline/MultiAgentPipelineVisualizer.jsx`
  - `frontend/src/components/pipeline/AgentVisualizer.jsx`
  - `frontend/src/components/question/VisualStimulusViewer.jsx`
  - `frontend/src/components/question/SharedPassageCard.jsx`
  - `frontend/src/components/question/QuestionCard.jsx`
  - `frontend/src/components/question/ReviewAuditView.jsx`
  - `frontend/src/components/staged/StagedBatchGrid.jsx`
  - `frontend/src/components/staged/BatchProgressHeader.jsx`
  - `frontend/src/components/passage/PassageVisualStimulusEditor.jsx`
  - `frontend/src/components/bank/QuestionBankFilters.jsx`
  - `frontend/src/hooks/useAppState.js`
- Uncertainty: None. All replacement terminology has been explicitly verified and aligned with the user through step-by-step interview decisions.

## Design decision

Replace all AI and robotic terminology across navigation, wizard setup, live progress indicators, review desks, and notifications with authentic, everyday human classroom and editorial language. Specifically:

1. **Navigation Tabs**: Expand single-word tabs into clear human labels:
   - "Create" -> "Create Questions"
   - "Batches" -> "Batch Progress"
   - "Review" -> "Review Queue"
   - "Bank" -> "Question Bank"
   - "Passages" -> "Passage Bank"
2. **Editorial Terminology**:
   - "Stimulus vignette" / "stimulus text" -> "Reading Passage"
   - "Visual Stimulus" / "Infynno Neural Diagram" -> "Diagrams & Figures" / "Figure / Illustration"
   - "Cognitive distractor fallacies" / "cognitive traps" -> "Common Exam Traps" / "Why other choices are wrong"
   - "100-pt Psychometric Audit" -> "Question Quality Review" / "Quality Score"
   - "AI Compute Units" / "Telemetry" -> "Usage & Cost" / "Activity Log"
3. **Live Progress & Toasts**:
   - Replace "Drafting with real-time multi-agent telemetry..." with "Creating 5-question passage set..." and "Creating 5 independent practice questions...".
   - Replace "View event logs and processing telemetry" with "View editorial activity log".
4. **Action Controls**:
   - Ensure consistent, direct classroom verbs: "Save to Bank", "Discard", "Edit Question", and "Save All Ready".

## Reuse

- Existing theme tokens: `var(--brand-primary)`, `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`.
- Existing badge and pill styles: `.pill-track`, `.pill-track-btn`, `.badge-purple`, `.badge-emerald`.
- Exemplars:
  - `frontend/src/components/question/MentorExplanationView.jsx` (human teacher explanation model).
  - `DESIGN.md` Section 8 (canonical terminology mappings).

## Changes

1. `frontend/src/components/layout/Navbar.jsx`
   - Change: Expand navigation tab labels from abbreviated strings to descriptive titles:
     - `nav-tab-generator`: `Create` -> `Create Questions`
     - `nav-tab-batches`: `Batches` -> `Batch Progress`
     - `nav-tab-validated`: `Review` -> `Review Queue`
     - `nav-tab-bank`: `Bank` -> `Question Bank`
     - `nav-tab-passages`: `Passages` -> `Passage Bank`
   - Preserve: Pill track layout, badge counts, icons, and click handlers.
   - Verify: Nav bar displays clear, informative tab names with no layout overflow.

2. `frontend/src/components/wizard/steps/WizardStep3ReviewAdvanced.jsx`
   - Change:
     - Line 262: Replace `"Generate Visual Stimuli & Images"` with `"Include Diagrams & Figures"`.
     - Line 325: Replace `"(Cognitive Traps, Reasoning Skills, Misconceptions)"` with `"(Common Traps, Reasoning Skills, Student Mistakes)"`.
     - Line 336: Replace `"Cognitive Trap Focus"` with `"Common Traps to Test"`.
     - Line 446: Replace `"Student Misconception Pattern"` with `"Common Student Mistake to Target"`.
   - Preserve: Form data bindings, toggle state, and accordion expansion.
   - Verify: Wizard step 3 presents approachable educational concepts without cognitive psychology jargon.

3. `frontend/src/components/pipeline/MultiAgentPipelineVisualizer.jsx` & `AgentVisualizer.jsx`
   - Change:
     - MultiAgentPipelineVisualizer line 91: Replace `'Generating visual stimulus / image...'` with `'Creating diagrams & figures...'`.
     - MultiAgentPipelineVisualizer line 102: Replace `'Parallel Drafting & Review'` with `'Drafting & Initial Review'`.
     - MultiAgentPipelineVisualizer line 173: Replace `'Editorial Process'` with `'Editorial Review'`.
     - AgentVisualizer line 130: Replace `title="View event logs and processing telemetry"` with `title="View editorial activity log"`.
   - Preserve: Real-time progress updates, stopwatch timer, and cancellation action.
   - Verify: Pipeline reads like a human editorial workflow, free of "telemetry", "swarm", and "stimulus".

4. `frontend/src/components/question/VisualStimulusViewer.jsx`
   - Change:
     - Line 69: Replace `const visualType = isSvg ? 'SVG Vector Diagram' : 'Infynno Neural Diagram';` with `const visualType = isSvg ? 'SVG Vector Diagram' : 'Scientific Figure';`.
     - Line 130: Replace `alt={rawDescription || 'Stimulus'}` with `alt={rawDescription || 'Figure diagram'}`.
     - Line 178: Ensure header reads `"Figure / Diagram"` or `"Scientific Figure"`.
   - Preserve: SVG rendering, zoom/pan lightbox controls, and SVG clipboard copy.
   - Verify: No visual component labels itself as "Neural Diagram" or "AI FLUX".

5. `frontend/src/components/question/SharedPassageCard.jsx`
   - Change:
     - Line 70: Replace `"Questions 1 to ${questionCount} evaluate comprehension directly from this stimulus."` with `"Questions 1 to ${questionCount} reference this reading passage directly."`.
     - Line 71: Replace passage set description to refer to `"reading passage"` rather than `"stimulus"`.
   - Preserve: Sticky positioning, Newsreader serif typography, and question count indicators.
   - Verify: Reading pane text refers exclusively to "reading passage".

6. `frontend/src/components/staged/StagedBatchGrid.jsx`
   - Change:
     - Line 41: Replace `"Questions 1-{effectivePassageCount} reference the shared stimulus above"` with `"Questions 1-{effectivePassageCount} reference the reading passage above"`.
     - Line 71: Replace `"Questions {effectivePassageCount + 1}-{effectiveTotal} are independent with individual vignettes"` with `"Questions {effectivePassageCount + 1}-{effectiveTotal} are independent questions"`.
   - Preserve: Responsive grid, slot card rendering, and passage linkage tracking.
   - Verify: Grid banner avoids "vignettes" and "stimulus".

7. `frontend/src/components/staged/BatchProgressHeader.jsx`
   - Change:
     - Ensure format chip reads: `"1 Shared Reading Passage"` instead of `"1 Shared Passage Set"`.
     - Ensure bulk save button reads: `"Save All Ready"` or `"Save Selected"`.
   - Preserve: Split/Stacked view toggle, selection checkboxes, and progress counters.
   - Verify: Clear, confident editorial actions.

8. `frontend/src/components/question/QuestionCard.jsx`
   - Change:
     - Tab selector: Change third tab label from `"Telemetry"` to `"Usage & Cost"`.
     - Ensure tooltips reference `"Details & Usage"` rather than raw telemetry.
   - Preserve: Preview and Scorecard tabs, inline editor, and approval workflows.
   - Verify: Card tabs display `Preview`, `Scorecard`, and `Usage & Cost`.

9. `frontend/src/components/question/ReviewAuditView.jsx`
   - Change:
     - Line 72: Replace `"Quality Breakdown • Usage & Cost • Exam Standards"` with `"Quality Breakdown • Usage & Cost • Exam Standards"`.
     - Line 121: Replace comment/header `"AI Compute Units & Workload Audit Section"` with `"Usage & Cost Breakdown"`.
     - Line 188: Replace `"Cognitive & Pedagogical Calibration"` with `"Exam Accuracy & Question Design"`.
     - Line 215: Replace `"Common Trap Tested"` / `"Trap Breakdown"`.
     - Line 243: Replace `"Common Student Mistake"`.
   - Preserve: Focus trap, ESC dismissal, 100-pt progress bars, and score calculations.
   - Verify: Audit modal reads like a professional pedagogical review sheet.

10. `frontend/src/components/passage/PassageVisualStimulusEditor.jsx`
    - Change:
      - Line 50: Replace `"Passage Visual Stimulus"` with `"Passage Figure / Diagram"`.
    - Preserve: Attached indicator and Discard Image action.
    - Verify: Consistent "Figure / Diagram" terminology.

11. `frontend/src/components/bank/QuestionBankFilters.jsx`
    - Change:
      - Line 95: Replace `aria-label="Search questions by stem, stimulus, topic, or trap"` with `aria-label="Search questions by question, passage, topic, or trap"`.
    - Preserve: Search shortcut `/` and filter dropdowns.
    - Verify: Screen reader accessible labels use natural language.

12. `frontend/src/hooks/useAppState.js`
    - Change:
      - Lines 296-297: Replace:
        `'Drafting 5-question passage set with real-time multi-agent telemetry...'` -> `'Creating 5-question passage set...'`
        `'Drafting 5 independent discrete questions with real-time multi-agent telemetry...'` -> `'Creating 5 independent practice questions...'`
    - Preserve: Toast dispatch logic, error handling, and state triggers.
    - Verify: Toasts display plain-spoken, friendly progress messages.

## Scope

- Inherit: All views utilizing common navigation, pipeline visualizers, question cards, and passage desks.
- Verify:
  - `GeneratorWorkspaceView.jsx`
  - `AiValidatedQuestionsView.jsx` (Review Queue)
  - `BatchActivityView.jsx` (Batch Progress)
  - `QuestionBankView.jsx` (Question Bank)
  - `PassageBankView.jsx` (Passage Bank)
- Exclude:
  - Backend API schemas and database column names (`stimulus_text`, `image_svg`, `total_tokens`, `prompt_tokens`). Internal data structure identifiers must remain unchanged to preserve backend/database contract integrity.

## Validation

- Product: Complete end-to-end question creation, batch review, and bank inspection workflows.
- Interface:
  - Inspect top navbar for expanded tab names: `Create Questions`, `Batch Progress`, `Review Queue`, `Question Bank`, `Passage Bank`.
  - Open Step 3 of the creation wizard and confirm `Include Diagrams & Figures`, `Common Traps to Test`, and `Common Student Mistakes`.
  - Trigger generation and verify pipeline displays `Drafting & Initial Review`, `Answer Check`, `Question Polish`, `Figures & Diagrams`, and friendly status messages.
  - Review generated questions and verify reading passages are labeled `Reading Passage` and figures are labeled `Figure / Diagram`.
  - Verify QuestionCard tabs show `Preview`, `Scorecard`, and `Usage & Cost`.
- System: Confirm no robotic self-references ("AI team", "autonomous pipeline", "fused audit", "telemetry", "neural diagram") appear in any visible user string.
- Repository: `pnpm build` (or `npm run build` in `frontend/`) → build completes with 0 errors.

## Stop conditions

- Stop if changing a user-facing label breaks an internal API payload key or query parameter expected by the backend.
- Stop if navigation tab expansion causes horizontal scroll or wrapping on desktop viewports (> 1024px).

## Design documentation

- After acceptance and validation: Record updated tab names, terminology mappings, and verified user-facing strings in `DESIGN.md` Section 8 ("Everyday Human Language Standard") and Section 4 ("Component Design Specifications").
