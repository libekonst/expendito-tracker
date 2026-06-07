import type { Category, Entry, Settings, MonthSummary, RunwayResult } from "./types";
import { projectMonth } from "./projectMonth";

const MAX_MONTHS = 120;

function addMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return next;
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/** Threads closing balances forward from startingMonth until balance ≤ 0 or 120 months. */
export function calculateRunway(
  settings: Settings,
  categories: Category[],
  entries: Entry[],
): RunwayResult {
  const current = currentMonth();
  const months: MonthSummary[] = [];
  let month = settings.startingMonth;
  let openingBalance = settings.startingBalance;

  for (let i = 0; i < MAX_MONTHS; i++) {
    const monthEntries = entries.filter((e) => e.date.startsWith(month));
    const summary = projectMonth({
      month,
      categories,
      entries: monthEntries,
      openingBalance,
      isCurrentMonth: month === current,
    });

    months.push(summary);

    if (summary.closingBalance <= 0) break;

    openingBalance = summary.closingBalance;
    month = addMonth(month);
  }

  const runwayMonths = months.filter((m) => m.closingBalance >= 0).length;
  return { months, runwayMonths };
}
