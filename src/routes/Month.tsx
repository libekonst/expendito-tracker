import { Navigate, useParams } from "react-router-dom";
import MonthDetail from "../components/MonthDetail";

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function formatMonthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split("-");
  return new Date(Number(y), Number(m) - 1).toLocaleString("en-GB", { month: "long", year: "numeric" });
}

export default function Month() {
  const { yyyymm } = useParams<{ yyyymm: string }>();

  if (!yyyymm) return <Navigate to="/months" replace />;
  if (yyyymm === currentMonth()) return <Navigate to="/" replace />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{formatMonthLabel(yyyymm)}</h1>
      <MonthDetail month={yyyymm} isCurrentMonth={false} />
    </div>
  );
}
