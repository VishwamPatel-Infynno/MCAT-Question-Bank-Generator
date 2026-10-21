# Actionable Question Bank Empty State and Zero-Result Recovery

Written against: 23b6e76d131cb6c201c454c9389ae613d384c1fc

## Evidence chain

- Surface: `frontend/src/components/bank/QuestionBank.jsx` (Question Bank tab view when filters yield 0 questions)
- Problem: When search queries or subtest/difficulty filters yield 0 results, the empty card renders static text ("No questions match your current filters. Clear filters or generate new questions in the Question Wizard.") without actionable buttons, forcing users to manually traverse up to filter chips or top navbar.
- Design evidence: `frontend/src/components/bank/QuestionBank.jsx:L458-477` and `frontend/src/index.css` button classes (`btn-secondary`, `btn-primary`)
- Owner: `frontend/src/components/bank/QuestionBank.jsx`
- Scope and affected surfaces: `frontend/src/components/bank/QuestionBank.jsx`
- Uncertainty: none

## Design decision

Add direct recovery action buttons inside the empty state card:
1. A secondary button to reset/clear active filters (`setSearchQuery('')`, `setSectionFilter('')`, `setDiffFilter('')`) when filters are active.
2. A primary button (`✨ Create Questions in Wizard`) to navigate directly to the Guided Wizard (`setActiveTab('generator')` / `setViewMode('wizard')`).

## Reuse

- `var(--bg-surface)`
- `var(--border-subtle)`
- `btn-secondary`, `btn-primary`
- `RotateCcw`, `Sparkles` from `lucide-react`
- Exemplar: `frontend/src/components/bank/QuestionBank.jsx:L406-444`

## Changes

1. `frontend/src/components/bank/QuestionBank.jsx`
   - Change: In the empty state render block (lines 459-476), conditionally render an action button group:
     - If `searchQuery || sectionFilter || diffFilter`, render `<button className="btn-secondary" onClick={handleClearFilters}><RotateCcw size={13} /><span>Clear Active Filters</span></button>`.
     - Render `<button className="btn-primary" onClick={onNavigateToWizard}><Sparkles size={13} /><span>Create Questions in Wizard</span></button>`.
   - Preserve: Existing empty state icon (`<Database size={36} />`), title, and descriptive subtitle.
   - Verify: When typing a non-existent search term, the empty card renders the "Clear Active Filters" button which resets the search input upon click.

## Scope

- Inherit: All users navigating Question Bank with active or empty filter states.
- Verify: Subtest filtering, search query input, and pagination state reset.
- Exclude: Database schema, backend API endpoints, QuestionCard preview.

## Validation

- Product: Filter Question Bank by an unmatched string; verify user can immediately reset filters with a single click or jump to creation.
- Interface: Test both dark theme and light theme viewports at 1920x1080 and laptop sizes.
- System: Confirm reuse of standard `btn-primary` and `btn-secondary` primitives without introducing custom ad-hoc inline button styles.
- Repository: `pnpm lint && pnpm build` → 0 warnings, 0 errors.

## Stop conditions

- Stop if changing QuestionBank props requires breaking any existing parent consumers.

## Design documentation

- After acceptance and validation: Record under `docs/ARCHITECTURE.md` Section 6 (UI Component Specifications).
