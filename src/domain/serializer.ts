import type { Category, Entry, Settings } from "./types";

const VERSION = 1;

type Payload = { categories: Category[]; entries: Entry[]; settings: Settings };
type Export = Payload & { version: number };

type LegacyCategory = {
  id: string;
  name: string;
  type: "expense" | "income";
  plannedAmounts?: Array<{ amount: number; from: string }>;
  plannedAmount?: number;
  from?: string;
  until?: string;
};

function migrateLegacyCategory(cat: LegacyCategory): Category {
  if (Array.isArray(cat.plannedAmounts)) {
    const { plannedAmounts, ...rest } = cat;
    const month = new Date().toISOString().slice(0, 7);
    const sorted = [...plannedAmounts].sort((a, b) => b.from.localeCompare(a.from));
    const active = sorted.find((p) => p.from <= month);
    const amount = active?.amount ?? sorted[sorted.length - 1]?.amount ?? 0;
    return { ...rest, plannedAmount: amount };
  }
  return cat as Category;
}

export function exportData(payload: Payload): string {
  const data: Export = { ...payload, version: VERSION };
  return JSON.stringify(data, null, 2);
}

export function importData(json: string): Payload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("Invalid JSON file.");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as Export).categories) ||
    !Array.isArray((parsed as Export).entries) ||
    typeof (parsed as Export).settings !== "object"
  ) {
    throw new Error("Invalid backup file: missing required fields.");
  }

  const { categories, entries, settings } = parsed as Export;
  return {
    categories: (categories as LegacyCategory[]).map(migrateLegacyCategory),
    entries,
    settings,
  };
}
