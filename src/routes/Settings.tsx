import { useStore } from "../store";

export default function Settings() {
  const settings = useStore((s) => s.settings);
  const storageUnavailable = useStore((s) => s.storageUnavailable);
  const updateSettings = useStore((s) => s.updateSettings);

  return (
    <div className="space-y-6">
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
    </div>
  );
}
