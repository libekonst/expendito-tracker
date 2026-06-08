# Expendito Tracker

A single-user, browser-based runway simulator. Plans expenses and income by category, projects a running balance forward from a starting amount, and answers one question: how many months of savings are left?

There is no logging of individual transactions. All simulation runs purely from planned amounts and the Effective Balance.

## Language

**Recurring Expense**:
A named monthly cost that runs flat for the entire runway. Has a planned amount. Always active — no start/end date.
_Avoid_: budget line, bucket

**Recurring Income**:
A named steady monthly income source (e.g. rental income, side hustle). Has a planned amount. Always active — no start/end date.
_Avoid_: budget line, bucket

**Planned Amount**:
The fixed monthly amount expected for a Recurring Expense or Recurring Income. A single value — not a history. Changes take effect immediately and recalculate the runway instantly.
_Avoid_: budget, target

**One-time Expense**:
A named lump-sum cost that reduces the Effective Balance (e.g. "Japan Trip — €1800"). Not tied to a specific month. Does not recur.

**One-time Income**:
A named lump-sum income that increases the Effective Balance (e.g. "Sold car — €5000", "Severance — €4500"). Not tied to a specific month. Does not recur.
_Note_: Finite income streams like severance are modelled as One-time Income, not Recurring Income.

**Effective Balance**:
The total funds available for the runway simulation: Starting Balance + all One-time Incomes − all One-time Expenses. This is the anchor for all runway calculations, replacing Starting Balance as the simulation input.
_Avoid_: adjusted balance, net balance

**Starting Balance**:
The total savings amount at the moment the user quits their job. The anchor for all runway calculations.
_Avoid_: initial balance, opening amount

**Starting Month**:
The calendar month (`YYYY-MM`) from which the runway begins — the first month the user is burning savings.

**Opening Balance**:
The closing balance of the previous month. For the Starting Month, equals the Starting Balance.

**Closing Balance**:
The balance at the end of a month: opening balance + planned income − planned expense.

**Runway**:
The number of months the Effective Balance covers, counting from the Starting Month until the balance reaches zero. The hero metric of the app. Displayed as: remaining months (hero) + total months (secondary) + end month.
_Avoid_: lifespan, burn rate (burn rate is the rate; runway is the result)

**Runway Overhang**:
The partial month beyond the last fully-covered runway month. Shown when the balance after the final full month is greater than zero but less than that month's net planned cost. Displays the remaining balance and the shortfall needed to complete that extra month. Appears in the Dashboard headline alongside the Runway number.

**Waiting Period**:
The months between today and the Starting Month (when the Starting Month is in the future). During the waiting period, the balance is flat — savings are not yet being spent.

**Month**:
A calendar month identified by `YYYY-MM`. The unit of simulation. Not a fiscal period or custom range.

## Relationships

- A **Recurring Expense** has a name and a **Planned Amount** — runs for the full runway
- A **Recurring Income** has a name and a **Planned Amount** — runs for the full runway
- A **One-time Expense** has a name and an amount
- A **One-time Income** has a name and an amount
- **Effective Balance** = Starting Balance + all One-time Incomes − all One-time Expenses
- Each simulated **Month** has an **Opening Balance** and a **Closing Balance** derived purely from recurring planned amounts
- **Runway** is derived from **Effective Balance**, **Starting Month**, all **Recurring Expenses**, and all **Recurring Incomes**
- The **Waiting Period** precedes the Runway and does not count toward it

## Example dialogue

> **Dev:** "When the user edits the Planned Amount for Rent, does that change the runway instantly?"
> **Domain expert:** "Yes — the Planned Amount is a single value, so any edit recalculates the runway immediately."
>
> **Dev:** "The user gets €4500 severance. Is that a Recurring Income or a One-time Income?"
> **Domain expert:** "One-time Income. Severance is finite — it hits the balance in a specific month and done."
>
> **Dev:** "If the user has a rental property earning €300/month, is that a One-off?"
> **Domain expert:** "No — that's Recurring Income. It's steady and ongoing for the full runway."

## Flagged ambiguities

- "Budget" — avoided. The app has no single monthly budget. Planning is per-category via Planned Amounts.
- "Category" — replaced by Recurring Expense and Recurring Income in domain language. "Category" may still appear in implementation code.
- "One-off" — avoid. The domain term is One-time Expense or One-time Income.
