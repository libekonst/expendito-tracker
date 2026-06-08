import { describe, it, expect, beforeEach, vi } from "vitest";
import { createStore, selectRunwayProjection } from "./index";

beforeEach(() => {
  localStorage.clear();
});

describe("expense CRUD", () => {
  it("adds a RecurringExpense", () => {
    const store = createStore();
    store.getState().addExpense({ name: "Rent", type: "recurringExpense", amount: 900 });
    expect(store.getState().expenses).toHaveLength(1);
    expect(store.getState().expenses[0].name).toBe("Rent");
    expect(store.getState().expenses[0].type).toBe("recurringExpense");
    expect(store.getState().expenses[0].id).toBeTruthy();
  });

  it("updates an expense", () => {
    const store = createStore();
    store.getState().addExpense({ name: "Rent", type: "recurringExpense", amount: 900 });
    const id = store.getState().expenses[0].id;
    store.getState().updateExpense(id, { amount: 1000 });
    expect(store.getState().expenses[0].amount).toBe(1000);
  });

  it("deletes an expense", () => {
    const store = createStore();
    store.getState().addExpense({ name: "Rent", type: "recurringExpense", amount: 900 });
    const id = store.getState().expenses[0].id;
    store.getState().deleteExpense(id);
    expect(store.getState().expenses).toHaveLength(0);
  });
});

describe("income CRUD", () => {
  it("adds a RecurringIncome", () => {
    const store = createStore();
    store.getState().addIncome({ name: "Freelance", type: "recurringIncome", amount: 500 });
    expect(store.getState().incomes).toHaveLength(1);
    expect(store.getState().incomes[0].name).toBe("Freelance");
    expect(store.getState().incomes[0].type).toBe("recurringIncome");
    expect(store.getState().incomes[0].id).toBeTruthy();
  });

  it("updates an income", () => {
    const store = createStore();
    store.getState().addIncome({ name: "Freelance", type: "recurringIncome", amount: 500 });
    const id = store.getState().incomes[0].id;
    store.getState().updateIncome(id, { amount: 600 });
    expect(store.getState().incomes[0].amount).toBe(600);
  });

  it("deletes an income", () => {
    const store = createStore();
    store.getState().addIncome({ name: "Freelance", type: "recurringIncome", amount: 500 });
    const id = store.getState().incomes[0].id;
    store.getState().deleteIncome(id);
    expect(store.getState().incomes).toHaveLength(0);
  });
});

describe("settings", () => {
  it("updates settings", () => {
    const store = createStore();
    store.getState().updateSettings({ startingBalance: 5000 });
    expect(store.getState().settings.startingBalance).toBe(5000);
  });
});

describe("selectRunwayProjection", () => {
  it("returns correct totalMonths given a recurring expense", () => {
    const store = createStore();
    store.getState().updateSettings({ startingBalance: 2000, startingMonth: "2025-01" });
    store.getState().addExpense({ name: "Rent", type: "recurringExpense", amount: 1000 });

    const result = selectRunwayProjection(store.getState());
    expect(result.totalMonths).toBe(2);
  });

  it("reflects reduced totalMonths when expense amount increases", () => {
    const store = createStore();
    store.getState().updateSettings({ startingBalance: 2000, startingMonth: "2025-01" });
    store.getState().addExpense({ name: "Rent", type: "recurringExpense", amount: 1000 });

    const before = selectRunwayProjection(store.getState());
    expect(before.totalMonths).toBe(2);

    const id = store.getState().expenses[0].id;
    store.getState().updateExpense(id, { amount: 2000 });

    const after = selectRunwayProjection(store.getState());
    expect(after.totalMonths).toBe(1);
  });
});

describe("storageUnavailable", () => {
  it("is true when localStorage.setItem throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    const store = createStore();
    expect(store.getState().storageUnavailable).toBe(true);
    vi.restoreAllMocks();
  });
});
