import { describe, it, expect } from "vitest";
import { projectMonth } from "./projectMonth";
import type { Category, Entry } from "./types";

const rent: Category = {
  id: "rent",
  name: "Rent",
  type: "expense",
  plannedAmounts: [{ amount: 900, from: "2026-01" }],
};

const freelance: Category = {
  id: "fl",
  name: "Freelance",
  type: "income",
  plannedAmounts: [{ amount: 1000, from: "2026-01" }],
};

const entry = (categoryId: string, amount: number, date: string): Entry => ({
  id: `${categoryId}-${date}`,
  categoryId,
  amount,
  date,
  note: undefined,
});

describe("projectMonth — past month with entries", () => {
  it("calculates actuals and closing balance correctly", () => {
    const entries = [entry("rent", 950, "2026-03-05")];
    const result = projectMonth({
      month: "2026-03",
      categories: [rent],
      entries,
      openingBalance: 10000,
      isCurrentMonth: false,
    });

    const rentRow = result.categories.find((c) => c.categoryId === "rent")!;
    expect(rentRow.planned).toBe(900);
    expect(rentRow.actual).toBe(950);
    expect(rentRow.variance).toBe(50); // overspent
    expect(result.closingBalance).toBe(10000 - 950);
    expect(result.isProjected).toBe(false);
  });
});

describe("projectMonth — future month with no entries", () => {
  it("uses planned amounts and marks isProjected", () => {
    const result = projectMonth({
      month: "2027-01",
      categories: [rent],
      entries: [],
      openingBalance: 5000,
      isCurrentMonth: false,
    });

    const rentRow = result.categories.find((c) => c.categoryId === "rent")!;
    expect(rentRow.actual).toBe(900);
    expect(result.closingBalance).toBe(5000 - 900);
    expect(result.isProjected).toBe(true);
  });
});

describe("projectMonth — current month", () => {
  it("uses max(actual, planned) for expenses", () => {
    const entries = [entry("rent", 700, "2026-05-05")]; // underspent so far
    const result = projectMonth({
      month: "2026-05",
      categories: [rent],
      entries,
      openingBalance: 10000,
      isCurrentMonth: true,
    });

    const rentRow = result.categories.find((c) => c.categoryId === "rent")!;
    expect(rentRow.actual).toBe(900); // plan wins over 700
    expect(result.closingBalance).toBe(10000 - 900);
  });

  it("uses actuals only for income — does not assume planned income", () => {
    const entries: Entry[] = []; // no income logged yet
    const result = projectMonth({
      month: "2026-05",
      categories: [freelance],
      entries,
      openingBalance: 10000,
      isCurrentMonth: true,
    });

    const flRow = result.categories.find((c) => c.categoryId === "fl")!;
    expect(flRow.actual).toBe(0); // planned 1000 but not logged
    expect(result.closingBalance).toBe(10000);
  });

  it("lets expense overspend flow through immediately", () => {
    const entries = [entry("rent", 1200, "2026-05-05")]; // overspent
    const result = projectMonth({
      month: "2026-05",
      categories: [rent],
      entries,
      openingBalance: 10000,
      isCurrentMonth: true,
    });

    const rentRow = result.categories.find((c) => c.categoryId === "rent")!;
    expect(rentRow.actual).toBe(1200); // actual wins over plan of 900
    expect(result.closingBalance).toBe(10000 - 1200);
  });
});
