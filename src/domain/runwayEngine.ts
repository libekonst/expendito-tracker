import type {
  Expense,
  Income,
  Settings,
  MonthSummary,
  RunwayResult,
} from "./types";

const MAX_MONTHS = 120;

function addMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/** Effective Balance = Starting Balance + one-time incomes − one-time expenses. */
export function computeEffectiveBalance(
  startingBalance: number,
  incomes: Income[],
  expenses: Expense[],
): number {
  const oneTimeIncome = incomes
    .filter((i) => i.type === "oneTimeIncome")
    .reduce((sum, i) => sum + i.amount, 0);
  const oneTimeExpense = expenses
    .filter((e) => e.type === "oneTimeExpense")
    .reduce((sum, e) => sum + e.amount, 0);
  return startingBalance + oneTimeIncome - oneTimeExpense;
}

/** Monthly net cost = sum of recurring expenses − sum of recurring incomes. */
export function computeMonthlyNetCost(
  expenses: Expense[],
  incomes: Income[],
): number {
  const recurringExpense = expenses
    .filter((e) => e.type === "recurringExpense")
    .reduce((sum, e) => sum + e.amount, 0);
  const recurringIncome = incomes
    .filter((i) => i.type === "recurringIncome")
    .reduce((sum, i) => sum + i.amount, 0);
  return recurringExpense - recurringIncome;
}

/**
 * Simulates the runway forward from Starting Month using recurring amounts only.
 * One-time items adjust the Effective Balance (the pool), not any single month.
 */
export function calculateRunway(
  settings: Settings,
  expenses: Expense[],
  incomes: Income[],
): RunwayResult {
  const effectiveBalance = computeEffectiveBalance(
    settings.startingBalance,
    incomes,
    expenses,
  );
  const monthlyNetCost = computeMonthlyNetCost(expenses, incomes);

  // No burn: balance never decreases, so there is no finite runway.
  if (monthlyNetCost <= 0) {
    return {
      effectiveBalance,
      totalMonths: 0,
      remainingMonths: 0,
      startMonth: settings.startingMonth,
      endMonth: "",
      months: [],
    };
  }

  const months: MonthSummary[] = [];
  let month = settings.startingMonth;
  let openingBalance = effectiveBalance;
  let overhang: RunwayResult["overhang"];

  for (let i = 0; i < MAX_MONTHS; i++) {
    const closingBalance = openingBalance - monthlyNetCost;

    if (closingBalance < 0) {
      overhang = {
        remainingBalance: openingBalance,
        shortfall: monthlyNetCost - openingBalance,
      };
      break;
    }

    months.push({ month, openingBalance, closingBalance });

    if (closingBalance === 0) break;

    openingBalance = closingBalance;
    month = addMonth(month);
  }

  const totalMonths = months.length;
  const endMonth = totalMonths > 0 ? months[totalMonths - 1].month : "";

  // Runway months strictly after the current (already-elapsed) month still
  // remain. During the Waiting Period (future Starting Month) none have
  // elapsed, so remainingMonths equals totalMonths.
  const current = currentMonth();
  const remainingMonths = months.filter((m) => m.month > current).length;

  return {
    effectiveBalance,
    totalMonths,
    remainingMonths,
    startMonth: settings.startingMonth,
    endMonth,
    months,
    ...(overhang ? { overhang } : {}),
  };
}
