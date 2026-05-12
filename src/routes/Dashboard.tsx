import { NavLink } from "react-router-dom";

// TODO: replace with real data store
const BUDGET = 2500;
const SPENT = 1340;

const CATEGORIES = [
  { name: "Food", spent: 480, color: "#6366f1" },
  { name: "Transport", spent: 210, color: "#f59e0b" },
  { name: "Utilities", spent: 180, color: "#10b981" },
  { name: "Entertainment", spent: 320, color: "#ef4444" },
  { name: "Other", spent: 150, color: "#8b5cf6" },
];

const RECENT = [
  { date: "May 12", desc: "Grocery store", category: "Food", amount: 63.4 },
  { date: "May 11", desc: "Metro top-up", category: "Transport", amount: 30.0 },
  { date: "May 10", desc: "Netflix", category: "Entertainment", amount: 15.99 },
  { date: "May 09", desc: "Restaurant", category: "Food", amount: 48.2 },
  { date: "May 08", desc: "Electric bill", category: "Utilities", amount: 94.5 },
  { date: "May 07", desc: "Coffee shop", category: "Food", amount: 12.8 },
  { date: "May 06", desc: "Gym", category: "Other", amount: 45.0 },
];

const CATEGORY_COLOR: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.name, c.color]),
);

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const currentMonth = new Date().toISOString().slice(0, 7);

export default function Dashboard() {
  const remaining = BUDGET - SPENT;

  return (
    <div className="space-y-6">
      {/* Stats strip */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 rounded-xl border border-gray-200 bg-white">
        {[
          { label: "Spent this month", value: fmt(SPENT), accent: "text-gray-900" },
          { label: "Remaining", value: fmt(remaining), accent: "text-emerald-600" },
          { label: "Monthly budget", value: fmt(BUDGET), accent: "text-gray-900" },
        ].map((s) => (
          <div key={s.label} className="px-6 py-4">
            <p className="text-xs uppercase tracking-wider text-gray-400">{s.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${s.accent}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Two-column: transactions + categories */}
      <div className="grid grid-cols-5 gap-6">
        {/* Transactions table */}
        <div className="col-span-3">
          <div className="mb-3 flex items-baseline justify-between">
            <p className="text-sm font-medium text-gray-500">Recent transactions</p>
            <NavLink
              to={`/month/${currentMonth}`}
              className="text-xs text-indigo-500 hover:text-indigo-700"
            >
              View all →
            </NavLink>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                <th className="pb-2 text-left font-medium">Date</th>
                <th className="pb-2 text-left font-medium">Description</th>
                <th className="pb-2 text-left font-medium">Category</th>
                <th className="pb-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {RECENT.map((r) => (
                <tr key={r.desc + r.date} className="hover:bg-gray-50">
                  <td className="py-2.5 text-gray-400">{r.date}</td>
                  <td className="py-2.5 text-gray-700">{r.desc}</td>
                  <td className="py-2.5">
                    <span
                      className="rounded px-1.5 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: CATEGORY_COLOR[r.category] ?? "#9ca3af" }}
                    >
                      {r.category}
                    </span>
                  </td>
                  <td className="py-2.5 text-right tabular-nums text-gray-900">
                    {r.amount.toLocaleString("en-US", { style: "currency", currency: "USD" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Category breakdown */}
        <div className="col-span-2">
          <p className="mb-3 text-sm font-medium text-gray-500">By category</p>
          <div className="space-y-3">
            {[...CATEGORIES].sort((a, b) => b.spent - a.spent).map((c) => (
              <div key={c.name}>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">{c.name}</span>
                  <span className="tabular-nums text-gray-500">{fmt(c.spent)}</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(c.spent / SPENT) * 100}%`,
                      backgroundColor: c.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
