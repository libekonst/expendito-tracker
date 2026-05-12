# Current month runway calculation

The Runway Engine treats past months (actuals only) and future months (planned amounts only) differently from the current in-progress month. For the current month, expenses use `max(actual, planned)` per category — if you've already overspent a category the overage flows through; if you're under, the engine assumes you'll reach the plan. Income uses actuals only — planned income is not counted until logged.

This keeps the runway number conservative without requiring day-level proration. The asymmetry between expenses (pessimistic) and income (pessimistic) is intentional: both biases make the runway shorter rather than longer, which is the safer error for financial planning.
