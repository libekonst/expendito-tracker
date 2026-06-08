export type RecurringExpense = {
  id: string;
  name: string;
  type: "recurringExpense";
  amount: number;
};

export type OneTimeExpense = {
  id: string;
  name: string;
  type: "oneTimeExpense";
  amount: number;
};

export type Expense = RecurringExpense | OneTimeExpense;

export type RecurringIncome = {
  id: string;
  name: string;
  type: "recurringIncome";
  amount: number;
};

export type OneTimeIncome = {
  id: string;
  name: string;
  type: "oneTimeIncome";
  amount: number;
};

export type Income = RecurringIncome | OneTimeIncome;

export type Settings = {
  startingBalance: number; // EUR — total savings when the user quits
  startingMonth: string; // "YYYY-MM" — first month the runway begins burning savings
};

export type MonthSummary = {
  month: string; // "YYYY-MM"
  openingBalance: number;
  closingBalance: number;
};

export type RunwayResult = {
  effectiveBalance: number;
  totalMonths: number; // full runway length from Starting Month
  remainingMonths: number; // months from today to end; equals totalMonths during Waiting Period
  startMonth: string; // Starting Month (YYYY-MM)
  endMonth: string; // last fully-covered month (YYYY-MM)
  months: MonthSummary[]; // one entry per fully-covered simulated month
  overhang?: {
    remainingBalance: number; // balance left after last full month
    shortfall: number; // amount needed to complete the extra month
  };
};
