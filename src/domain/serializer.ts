import type { Category, Entry, Settings } from "./types";

const VERSION = 1;

type Payload = { categories: Category[]; entries: Entry[]; settings: Settings };
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
    !Array.isArray((parsed as Export).categories) ||
    !Array.isArray((parsed as Export).entries) ||
    typeof (parsed as Export).settings !== "object"
  ) {
    throw new Error("Invalid backup file: missing required fields.");
  }

  const { categories, entries, settings } = parsed as Export;
  return { categories, entries, settings };
}
