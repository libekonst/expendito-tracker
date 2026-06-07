export type Category = {
  id: string;
  name: string;
  type: "expense" | "income";
  plannedAmounts: Array<{ amount: number; from: string }>; // from = "YYYY-MM"
};

export type Entry = {
  id: string;
  categoryId: string;
  amount: number; // always positive; sign derived from category type
  date: string; // "YYYY-MM-DD"
  note?: string;
};

export type Settings = {
  startingBalance: number; // EUR
  startingMonth: string; // "YYYY-MM"
};

export type CategorySummary = {
  categoryId: string;
  planned: number;
  actual: number;
  variance: number; // actual - planned
};

export type MonthSummary = {
  month: string; // "YYYY-MM"
  openingBalance: number;
  closingBalance: number;
  categories: CategorySummary[];
  isProjected: boolean;
};

export type RunwayResult = {
  months: MonthSummary[];
  runwayMonths: number;
};
