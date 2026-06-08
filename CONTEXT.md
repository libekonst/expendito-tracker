# Expendito Tracker

A single-user, browser-based runway planner. Tracks planned and actual expenses and income by month, projects a running balance forward from a starting amount, and answers one question: how many months of savings are left?

## Language

**Expense**:
A record of money going out. Linked to an expense Category. The primary thing being tracked.
_Avoid_: transaction, debit, outflow, entry

**Income**:
A record of money coming in — one-off or occasional (e.g. freelance gig, severance instalment). Linked to an income Category.
_Avoid_: transaction, credit, inflow, entry

**Category**:
A named grouping of Expenses or Incomes with a planned monthly amount. Has a type: `expense` or `income`. May carry an optional Activity Window.
_Avoid_: budget line, bucket

**Planned Amount**:
The fixed monthly amount expected for a Category. A single value — not a history. Changes take effect immediately.
_Avoid_: budget, target

**Activity Window**:
The optional date range during which a Category contributes to the runway. Defined by an optional `from` month (inclusive) and an optional `until` month (inclusive). A Category without an Activity Window contributes for the full runway duration. Outside the window, the planned amount is treated as zero.

**Starting Balance**:
The total savings amount at the moment the user quits their job. The anchor for all runway calculations.
_Avoid_: initial balance, opening amount

**Starting Month**:
The calendar month (`YYYY-MM`) from which the runway calculation begins.

**Opening Balance**:
The closing balance of the previous month. For the Starting Month, equals the Starting Balance.

**Closing Balance**:
The balance at the end of a month: opening balance + actual income − actual expense.

**Runway**:
The number of months remaining before the running balance reaches zero, given current spending patterns and planned amounts for future months. The hero metric of the app. Displayed as "N months · runs out Mon YYYY".
_Avoid_: lifespan, burn rate (burn rate is the rate; runway is the result)

**Month**:
A calendar month identified by `YYYY-MM`. The unit of planning and reporting. Not a fiscal period or custom range.

## Relationships

- A **Category** has one `type` (`expense` | `income`), one **Planned Amount**, and an optional **Activity Window**
- An **Expense** belongs to exactly one expense **Category**
- An **Income** belongs to exactly one income **Category**
- A **Month** has zero or more **Expenses** and **Incomes** recorded against it
- Each **Month** has an **Opening Balance** (the previous month's Closing Balance) and a **Closing Balance**
- **Runway** is derived from **Starting Balance**, **Starting Month**, all **Categories**, and all **Expenses** and **Incomes**

## Example dialogue

> **Dev:** "When the user edits the Planned Amount for Rent, does that change the current month's projection?"
> **Domain expert:** "Yes — the Planned Amount is a single value, so any edit takes effect immediately."
>
> **Dev:** "If the user deletes the Food category, what happens to the Expenses logged under it?"
> **Domain expert:** "They're deleted too. The confirmation tells you how many Expenses will go."

## Flagged ambiguities

- "Entry" — the shared code-level type for both Expenses and Incomes (`type Entry`). Domain language says "expense" or "income" explicitly; "entry" is reserved for implementation only.
- "Budget" — avoided. The app has no single monthly budget. Planning is per-category via Planned Amounts.
