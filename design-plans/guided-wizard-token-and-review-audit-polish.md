# Guided Wizard Token Sanitization and Precision Review Deep-Linking

Written against: 23b6e76d131cb6c201c454c9389ae613d384c1fc

## Evidence chain

- Surface: `frontend/src/components/wizard/GuidedWizard.jsx` (Step 4 Neural Visual Studio badge & Step 5 Review Confirmation Card)
- Problem:
  1. In Step 4 line 1035, the "Multi-Layer Verified" badge uses hardcoded light hex colors (`background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0'`), causing high-contrast visual glare in dark theme.
  2. In Step 5 lines 1105-1125, Row 1 displays both "Target Section & Topic Focus", but its "Edit" button unconditionally links to `setStep(1)`. When users only want to tweak their topic or custom prompt, they must land on Step 1 and click Next to reach Step 2.
- Design evidence:
  - `frontend/src/index.css:L45-48` (`--status-success`, `--status-success-bg`, `--status-success-border`)
  - `frontend/src/components/wizard/GuidedWizard.jsx:L1035` and `L1105-1125`
- Owner: `frontend/src/components/wizard/GuidedWizard.jsx`
- Scope and affected surfaces: `frontend/src/components/wizard/GuidedWizard.jsx`
- Uncertainty: none

## Design decision

1. Sanitize the Step 4 badge styling to use semantic CSS variables: `background: 'var(--status-success-bg)', color: 'var(--status-success)', borderColor: 'var(--status-success-border)'`. This ensures consistent visual tone in both dark and light themes.
2. Provide precise deep-linking in Step 5 Review Summary by offering direct edit triggers for both Section (`setStep(1)`) and Topic Focus (`setStep(2)`).

## Reuse

- `var(--status-success-bg)`
- `var(--status-success)`
- `var(--status-success-border)`
- `wizard-summary-edit-btn`
- `Edit3` from `lucide-react`
- Exemplar: `frontend/src/components/wizard/GuidedWizard.jsx:L1140-1147`

## Changes

1. `frontend/src/components/wizard/GuidedWizard.jsx`
   - Change: Line 1035: Replace inline `#ecfdf5`, `#059669`, `#a7f3d0` with `var(--status-success-bg)`, `var(--status-success)`, and `var(--status-success-border)`.
   - Change: Lines 1105-1125: Update Row 1 in the summary card to separate "Target Section" and "Topic Focus" with distinct Edit buttons (`setStep(1)` and `setStep(2)`).
   - Preserve: Existing pacing badge, section metadata color accents, and wizard state persistence.
   - Verify: In dark mode, the badge renders with dark translucent green background. In Step 5, clicking "Edit Topic" navigates directly to Step 2.

## Scope

- Inherit: All users navigating Step 4 and Step 5 of the Guided Wizard in both Dark and Light themes.
- Verify: Section selection, topic selection, custom prompt input.
- Exclude: Wizard data schema, backend generation API.

## Validation

- Product: Navigate to Step 4 in Dark Theme; verify verified badge matches dark theme tokens. Navigate to Step 5, click "Edit Topic", verify it jumps directly to Step 2.
- Interface: Test both dark and light modes across desktop and laptop viewports.
- System: Confirm full alignment with `index.css` token conventions.
- Repository: `pnpm lint && pnpm build` → 0 warnings, 0 errors.

## Stop conditions

- Stop if changing summary card triggers alters generator form state unexpectedly.

## Design documentation

- After acceptance and validation: Record in `docs/ARCHITECTURE.md` Section 6.
