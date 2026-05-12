import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import MonthDetail from "../components/MonthDetail";
import { useStore, selectRunwayProjection } from "../store";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function formatRunwayEnd(months: ReturnType<typeof selectRunwayProjection>["months"]): string {
  const last = months[months.length - 1];
  if (!last) return "—";
  const [y, m] = last.month.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

function shortMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-GB", { month: "short", year: "2-digit" });
}

export default function Dashboard() {
  const runway = useStore(selectRunwayProjection);
  const storageUnavailable = useStore((s) => s.storageUnavailable);
  const cm = currentMonth();

  const runwayEnd = formatRunwayEnd(runway.months);
  const runwayLabel = `${runway.runwayMonths} months · runs out ${runwayEnd}`;

  // Zero-crossing month for the reference line
  const zeroMonth = runway.months.find((m) => m.closingBalance <= 0);

  // Chart data — all months with a label
  const chartData = runway.months.map((m) => ({
    month: shortMonth(m.month),
    balance: Math.round(m.closingBalance),
    projected: m.isProjected,
  }));

  return (
    <div className="space-y-10">
      {storageUnavailable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          localStorage is unavailable — data will not persist across page reloads.
        </div>
      )}

      {/* Runway counter */}
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Runway</p>
        <p className="mt-2 text-6xl font-bold tabular-nums text-gray-900">
          {runway.runwayMonths}
        </p>
        <p className="mt-1 text-base text-gray-500">{runwayLabel}</p>
      </div>

      {/* Current month detail */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          {new Date().toLocaleString("en-GB", { month: "long", year: "numeric" })}
        </h2>
        <MonthDetail month={cm} isCurrentMonth={true} />
      </div>

      {/* Balance chart */}
      {chartData.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-medium text-gray-500">Balance projection</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
                width={40}
              />
              <Tooltip
                formatter={(v: number) =>
                  [`€${v.toLocaleString("de-DE", { minimumFractionDigits: 0 })}`, "Balance"]
                }
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,.12)",
                }}
              />
              {/* Horizontal zero line */}
              <ReferenceLine y={0} stroke="#e5e7eb" strokeWidth={1} />
              {/* Vertical marker at runway end */}
              {zeroMonth && (
                <ReferenceLine
                  x={shortMonth(zeroMonth.month)}
                  stroke="#ef4444"
                  strokeDasharray="4 2"
                  label={{ value: shortMonth(zeroMonth.month), position: "top", fontSize: 10, fill: "#ef4444" }}
                />
              )}
              {/* Past months — solid */}
              <Line
                dataKey="balance"
                data={chartData.filter((d) => !d.projected)}
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
              {/* Projected months — dashed */}
              <Line
                dataKey="balance"
                data={chartData.filter((d) => d.projected)}
                stroke="#6366f1"
                strokeWidth={2}
                strokeDasharray="5 3"
                dot={false}
                connectNulls
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
