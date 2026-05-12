import { useParams } from "react-router-dom";

export default function Month() {
  const { yyyymm } = useParams<{ yyyymm: string }>();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Month</h1>
      <p className="mt-1 text-sm text-gray-500">{yyyymm}</p>
    </div>
  );
}
