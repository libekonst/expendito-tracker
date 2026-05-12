import { useRef, useState } from "react";
import { useStore } from "../store";
import { exportData, importData } from "../domain/serializer";

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function Settings() {
  const settings = useStore((s) => s.settings);
  const categories = useStore((s) => s.categories);
  const entries = useStore((s) => s.entries);
  const storageUnavailable = useStore((s) => s.storageUnavailable);
  const updateSettings = useStore((s) => s.updateSettings);
  const importAll = useStore((s) => s.importAll);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState("");

  function handleExport() {
    const json = exportData({ categories, entries, settings });
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expendito-${todayString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const payload = importData(ev.target?.result as string);
        if (!window.confirm("This will overwrite all existing data. Continue?")) return;
        importAll(payload);
        setImportError("");
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "Invalid file.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {storageUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          localStorage is unavailable — data will not persist across page reloads.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Starting balance (EUR)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={settings.startingBalance}
            onChange={(e) => updateSettings({ startingBalance: parseFloat(e.target.value) || 0 })}
            className="mt-1 block w-48 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Starting month
          </label>
          <input
            type="month"
            value={settings.startingMonth}
            onChange={(e) => updateSettings({ startingMonth: e.target.value })}
            className="mt-1 block w-48 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-3 border-t border-gray-100 pt-6">
        <p className="text-sm font-medium text-gray-700">Data</p>

        <button
          onClick={handleExport}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Export backup
        </button>

        <div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Import backup
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />
          {importError && <p className="mt-1 text-sm text-red-600">{importError}</p>}
        </div>
      </div>
    </div>
  );
}
