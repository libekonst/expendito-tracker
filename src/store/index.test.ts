import { describe, it, expect, beforeEach, vi } from "vitest";
import { createStore, selectRunwayProjection } from "./index";

beforeEach(() => {
  localStorage.clear();
});

describe("category CRUD", () => {
  it("adds a category", () => {
    const store = createStore();
    store.getState().addCategory({ name: "Rent", type: "expense", plannedAmounts: [{ amount: 900, from: "2026-01" }] });
    expect(store.getState().categories).toHaveLength(1);
    expect(store.getState().categories[0].name).toBe("Rent");
  });

  it("updates a category", () => {
    const store = createStore();
    store.getState().addCategory({ name: "Rent", type: "expense", plannedAmounts: [] });
    const id = store.getState().categories[0].id;
    store.getState().updateCategory(id, { name: "Housing" });
    expect(store.getState().categories[0].name).toBe("Housing");
  });

  it("deletes a category and cascade-deletes its entries", () => {
    const store = createStore();
    store.getState().addCategory({ name: "Rent", type: "expense", plannedAmounts: [] });
    const catId = store.getState().categories[0].id;
    store.getState().addEntry({ categoryId: catId, amount: 900, date: "2026-05-01" });
    store.getState().addEntry({ categoryId: catId, amount: 50, date: "2026-05-15" });

    store.getState().deleteCategory(catId);

    expect(store.getState().categories).toHaveLength(0);
    expect(store.getState().entries).toHaveLength(0);
  });
});

describe("entry CRUD", () => {
  it("adds an entry", () => {
    const store = createStore();
    store.getState().addEntry({ categoryId: "c1", amount: 100, date: "2026-05-01" });
    expect(store.getState().entries).toHaveLength(1);
    expect(store.getState().entries[0].amount).toBe(100);
  });

  it("updates an entry", () => {
    const store = createStore();
    store.getState().addEntry({ categoryId: "c1", amount: 100, date: "2026-05-01" });
    const id = store.getState().entries[0].id;
    store.getState().updateEntry(id, { amount: 150 });
    expect(store.getState().entries[0].amount).toBe(150);
  });

  it("deletes an entry", () => {
    const store = createStore();
    store.getState().addEntry({ categoryId: "c1", amount: 100, date: "2026-05-01" });
    const id = store.getState().entries[0].id;
    store.getState().deleteEntry(id);
    expect(store.getState().entries).toHaveLength(0);
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
  it("returns a projection that updates as entries are added", () => {
    const store = createStore();
    store.getState().updateSettings({ startingBalance: 2000, startingMonth: "2025-01" });
    store.getState().addCategory({ name: "Rent", type: "expense", plannedAmounts: [{ amount: 1000, from: "2025-01" }] });

    const before = selectRunwayProjection(store.getState());
    expect(before.runwayMonths).toBe(2);

    // Add an overspend — runway should shrink
    const catId = store.getState().categories[0].id;
    store.getState().addEntry({ categoryId: catId, amount: 1500, date: "2025-01-10" });

    const after = selectRunwayProjection(store.getState());
    expect(after.runwayMonths).toBe(1);
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
