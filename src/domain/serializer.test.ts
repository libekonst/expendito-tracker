import { describe, it, expect } from "vitest";
import { exportData, importData } from "./serializer";
import type { Category, Entry, Settings } from "./types";

const settings: Settings = { startingBalance: 10000, startingMonth: "2026-01" };

const categories: Category[] = [
  { id: "c1", name: "Rent", type: "expense", plannedAmounts: [{ amount: 900, from: "2026-01" }] },
];

const entries: Entry[] = [
  { id: "e1", categoryId: "c1", amount: 920, date: "2026-01-05" },
];

describe("exportData", () => {
  it("serialises categories, entries, and settings to a JSON string", () => {
    const json = exportData({ categories, entries, settings });
    const parsed = JSON.parse(json);
    expect(parsed.categories).toEqual(categories);
    expect(parsed.entries).toEqual(entries);
    expect(parsed.settings).toEqual(settings);
  });

  it("includes a version field", () => {
    const json = exportData({ categories, entries, settings });
    const parsed = JSON.parse(json);
    expect(parsed.version).toBeDefined();
  });
});

describe("importData", () => {
  it("round-trips exported data correctly", () => {
    const json = exportData({ categories, entries, settings });
    const result = importData(json);
    expect(result.categories).toEqual(categories);
    expect(result.entries).toEqual(entries);
    expect(result.settings).toEqual(settings);
  });

  it("throws on malformed JSON", () => {
    expect(() => importData("not json")).toThrow();
  });

  it("throws when categories is missing", () => {
    const bad = JSON.stringify({ entries, settings, version: 1 });
    expect(() => importData(bad)).toThrow();
  });

  it("throws when entries is missing", () => {
    const bad = JSON.stringify({ categories, settings, version: 1 });
    expect(() => importData(bad)).toThrow();
  });

  it("throws when settings is missing", () => {
    const bad = JSON.stringify({ categories, entries, version: 1 });
    expect(() => importData(bad)).toThrow();
  });
});
