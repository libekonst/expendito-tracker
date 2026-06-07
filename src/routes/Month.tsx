import { useMemo } from "react";
import { Navigate, useParams } from "react-router-dom";
import MonthDetail from "../components/MonthDetail";
import { useStore } from "../store";
import { calculateRunway } from "../domain/runwayEngine";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function formatMonthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-GB", { month: "long", year: "numeric" });
}

export default function Month() {
  const { yyyymm } = useParams<{ yyyymm: string }>();
  const settings = useStore((s) => s.settings);
  const categories = useStore((s) => s.categories);
  const entries = useStore((s) => s.entries);
  const runway = useMemo(
    () => calculateRunway(settings, categories, entries),
    [settings, categories, entries],
  );

  if (!yyyymm) return <Navigate to="/months" replace />;
  if (yyyymm === currentMonth()) return <Navigate to="/" replace />;

  const openingBalance = runway.months.find((m) => m.month === yyyymm)?.openingBalance ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{formatMonthLabel(yyyymm)}</h1>
      <MonthDetail month={yyyymm} isCurrentMonth={false} openingBalance={openingBalance} />
    </div>
  );
}
