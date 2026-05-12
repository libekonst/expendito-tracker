import { NavLink } from "react-router-dom";

const currentMonth = new Date().toISOString().slice(0, 7);

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: `/month/${currentMonth}`, label: "Month", end: false },
  { to: "/categories", label: "Categories", end: false },
  { to: "/settings", label: "Settings", end: false },
];

export default function Nav() {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-3">
        <span className="text-sm font-semibold tracking-tight text-gray-900">Expendito</span>
        <div className="flex gap-1">
          {links.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `rounded px-3 py-1.5 text-sm transition-colors ${
                  isActive
                    ? "bg-gray-100 font-medium text-gray-900"
                    : "text-gray-500 hover:text-gray-900"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
