import type { Expense, Income, Settings } from "./types";

const VERSION = 1;

type Payload = { expenses: Expense[]; incomes: Income[]; settings: Settings };
type Export = Payload & { version: number };

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
    !Array.isArray((parsed as Export).expenses) ||
    !Array.isArray((parsed as Export).incomes) ||
    typeof (parsed as Export).settings !== "object"
  ) {
    throw new Error("Invalid backup file: missing required fields.");
  }

  const { expenses, incomes, settings } = parsed as Export;
  return { expenses, incomes, settings };
}
