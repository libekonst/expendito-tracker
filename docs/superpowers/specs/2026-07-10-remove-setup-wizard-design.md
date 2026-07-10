# Remove SetupWizard, land users directly on the runway

## Problem

The app currently gates every session behind `SetupWizard` until `wizardCompleted` is true. The wizard asks for Starting Balance, Starting Month, and Recurring Expenses — a form that duplicates the "Monthly Expenses" card already on the merged Overview page (see [Overview.tsx](../../../src/routes/Overview.tsx)), and stands between the user and the runway number/chart, which is the app's actual payoff. Settings.tsx separately duplicates Starting Balance and Starting Month a second time.

We want new users to land directly on the Overview page and fill in their numbers there, in the same cards a returning user edits. Starting Balance and Starting Month move onto Overview as a new always-visible card; Settings stops carrying them.

## Non-goals

- No change to the runway calculation engine (`runwayEngine.ts`) or its return shape.
- No change to existing users' persisted data or the `expendito-v2` storage key/schema beyond dropping the `wizardCompleted` field.
- No projected chart for the "no burn" state — the engine only produces `months[]` when `monthlyNetCost > 0`; extending it to project a flat/growing balance is out of scope.

## Changes

### 1. Remove the wizard gate

- Delete `src/components/SetupWizard.tsx`.
- In `src/store/index.ts`: remove `wizardCompleted` from `State`, remove `completeWizard` from `Actions`, remove it from `PersistedSlice`/`loadPersistedState`/`saveState`, remove the action implementation.
- In `src/App.tsx`: remove the `wizardCompleted` check and the `<SetupWizard />` branch. `Routes` renders unconditionally.
- Existing persisted state in `localStorage` still has a `wizardCompleted` key; it's simply no longer read. No migration needed.

### 2. Settings loses Starting Balance / Starting Month

- In `src/routes/Settings.tsx`: remove the "Starting balance (EUR)" and "Starting month" form fields and their `updateSettings` calls. Settings keeps only the storage-unavailable banner and Export/Import backup.

### 3. New "Starting point" card on Overview

Add a new card component in `src/routes/Overview.tsx`, placed at the top of the right-hand (input) column, above "Monthly Expenses":

- Card chrome matches the existing list cards: `rounded-xl border border-hairline bg-white`, title styled like the other card headings (`font-display text-base font-semibold text-ink`), title text "Starting point".
- Two fields side by side (`grid grid-cols-2 gap-3`, matching the AddForm layout already used elsewhere):
  - **Starting balance** — `type="number"`, writes directly to `updateSettings({ startingBalance })` on change (immediate, no separate Save button — same immediate-commit pattern the old Settings.tsx used for these fields). When `settings.startingBalance === 0`, render the input's displayed value as empty with placeholder `e.g. 20000`, so a first-time user sees an invitation rather than a filled-looking zero. Once the user types a value (including typing `0` explicitly), the input shows what they typed.
  - **Starting month** — `type="month"`, writes directly to `updateSettings({ startingMonth })` on change. Always shows the current stored value (defaults to the current calendar month, as today) — no blank/placeholder treatment needed since "this month" is already a sensible default.
- No add/edit/delete affordances — unlike the list cards, this is always exactly two fields, always visible, always editable in place.

### 4. Hero states

`calculateRunway` currently returns `totalMonths: 0, remainingMonths: 0, endMonth: ""` whenever `monthlyNetCost <= 0`, whether that's because nothing has been entered yet or because income covers expenses. The UI layer (not the engine) distinguishes these:

```ts
const emptyOnboarding = expenses.length === 0 && incomes.length === 0;
const noBurn = !emptyOnboarding && netMonthlyBurn <= 0;
```

(`netMonthlyBurn` already computed via `computeMonthlyNetCost(expenses, incomes)` in Overview.)

- **`emptyOnboarding`** — hero numeral is replaced with a muted em-dash (`—`) in the same `font-display text-7xl` slot. Below it, instead of the "N months total · lasts through" line: *"Add a monthly expense to see your runway."* in `text-sm text-muted`. The balance chart section is not rendered (existing `allChartData.length > 0` guard already handles this, since `runway.months` is empty). The `.runway-strip` element renders but in a static, unlit gray (`var(--color-hairline)` or similar muted tone) instead of amber, and the `runway-march` animation is skipped for this state — reusing the existing CSS class isn't enough; render a variant class (e.g. `runway-strip runway-strip--unlit`) that overrides `background-image` color and drops `animation`.
- **`noBurn`** — hero numeral is replaced with *"No burn"* in `font-display text-7xl font-semibold` (sized down appropriately since it's text, not a numeral — verify against `text-7xl` fitting three-column desktop width; drop to `text-5xl` if needed for visual balance). Below it: *"Your income covers your expenses — savings hold steady."* in `text-sm text-muted`. No chart (same `allChartData.length > 0` guard). The runway-strip renders in its normal lit/amber state (there is a runway — it just doesn't end).
- **Normal** (`netMonthlyBurn > 0`) — unchanged from current behavior: numeral, "N months total · lasts through", chart, overhang line, waiting-period badge all render exactly as today.
- The "Gross monthly expenses" / "Net monthly burn" stats block and the Starting-balance/Effective-balance breakdown below the chart area remain visible in all three states (they already degrade gracefully to €0 values).

### 5. Copy touch-up

- The empty-list message in `RecurringSection`/`OneTimeSection` ("No items yet.") is unchanged — out of scope for this pass. (Noted as a possible future follow-up, not part of this spec.)

## Testing

- `src/store/index.test.ts`: remove the `describe("completeWizard", ...)` block and the `wizardCompleted` field from any `store.setState(...)` fixtures used elsewhere in the file.
- `src/routes/Overview.test.tsx`: remove `wizardCompleted: true` from the `store.setState` fixture in `beforeEach` (no longer a field on `State`). Add coverage for the three hero states:
  - `emptyOnboarding`: empty `expenses`/`incomes` → dash placeholder text renders, "Add a monthly expense" copy renders, no `line-chart` testid.
  - `noBurn`: a recurring income with no expenses (or income ≥ expense) → "No burn" text renders, no `line-chart` testid.
  - `normal`: existing fixture (Rent €500, balance €10000) continues to assert the numeral and chart as it does today.
- New test coverage for the Starting-point card: typing into the balance field calls `updateSettings` with the parsed number; typing into the month field calls `updateSettings` with the new month string; balance field shows empty/placeholder when `startingBalance === 0`.
- Delete any wizard-specific test file if one exists (none found under `src/components/` at time of writing — `SetupWizard.tsx` has no colocated test file).

## Open questions

None — all resolved during brainstorming.
