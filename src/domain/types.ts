export type Category = {
  id: string;
  name: string;
  type: "expense" | "income";
  plannedAmount: number;
  from?: string;  // active from this month (inclusive); absent = from the beginning
  until?: string; // active until this month (inclusive); absent = forever
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
