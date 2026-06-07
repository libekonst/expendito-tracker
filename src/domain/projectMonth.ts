import type { Category, Entry, MonthSummary, CategorySummary } from "./types";
import { resolveAmount } from "./resolveAmount";

type Params = {
  month: string;
  categories: Category[];
  entries: Entry[];
  openingBalance: number;
  isCurrentMonth: boolean;
  // When true, use only logged actuals — suppresses planned minimums and projection.
  // Used for waiting-period months (current calendar month before startingMonth).
  actualsOnly?: boolean;
};

/** Projects a MonthSummary for any month — past, current, or future. */
export function projectMonth({
  month,
  categories,
  entries,
  openingBalance,
  isCurrentMonth,
  actualsOnly = false,
}: Params): MonthSummary {
  const hasEntries = entries.length > 0;
  const isProjected = !actualsOnly && !isCurrentMonth && !hasEntries;

  const summarize = (cat: Category): CategorySummary => {
    const planned = resolveAmount(cat, month);
    const actualLogged = entries
      .filter((e) => e.categoryId === cat.id)
      .reduce((sum, e) => sum + e.amount, 0);

    let actual: number;
    if (isProjected) {
      actual = planned;
    } else if (isCurrentMonth && !actualsOnly) {
      actual = cat.type === "expense" ? Math.max(actualLogged, planned) : actualLogged;
    } else {
      actual = actualLogged;
    }

    return { categoryId: cat.id, planned, actual, variance: actual - planned };
  };

  const categorySummaries = categories.map(summarize);

  const totalIncome = categorySummaries
    .filter((_, i) => categories[i].type === "income")
    .reduce((s, c) => s + c.actual, 0);

  const totalExpense = categorySummaries
    .filter((_, i) => categories[i].type === "expense")
    .reduce((s, c) => s + c.actual, 0);

  return {
    month,
    openingBalance,
    closingBalance: openingBalance + totalIncome - totalExpense,
    categories: categorySummaries,
    isProjected,
  };
}
