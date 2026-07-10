import { NavLink } from "react-router-dom";

export default function Nav() {
  return (
    <nav className="border-b border-hairline bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <span className="font-display text-sm font-semibold tracking-tight text-ink">
          Expendito
        </span>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `text-sm transition-colors ${isActive ? "font-medium text-ink" : "text-muted hover:text-ink"}`
          }
        >
          Settings
        </NavLink>
      </div>
    </nav>
  );
}
