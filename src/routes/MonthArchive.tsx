import { Link } from "react-router-dom";
import { useStore, selectRunwayProjection } from "../store";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function formatMonthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-GB", { month: "long", year: "numeric" });
}

function fmt(n: number): string {
  return n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MonthArchive() {
  const runway = useStore(selectRunwayProjection);
  const current = currentMonth();

  const pastMonths = runway.months.filter((m) => m.month < current);
  const sorted = [...pastMonths].sort((a, b) => b.month.localeCompare(a.month));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Month Archive</h1>

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-500">No past months yet. Check back once your starting month has passed.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {sorted.map((m) => (
            <Link
              key={m.month}
              to={`/month/${m.month}`}
              className="flex items-center justify-between py-3 hover:bg-gray-50"
            >
              <span className="text-sm font-medium text-gray-900">{formatMonthLabel(m.month)}</span>
              <span className={`tabular-nums text-sm ${m.closingBalance < 0 ? "text-red-600" : "text-gray-600"}`}>
                €{fmt(m.closingBalance)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
