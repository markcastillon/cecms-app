// Staff area shell: sidebar on desktop, bottom tab bar on phones.
import {
  BarChart3,
  Building2,
  HandHeart,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Package,
  RefreshCw,
  Users,
} from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { useData } from "../context/DataContext.jsx";
import { Brand } from "./Brand.jsx";
import { OfflineBanner, Spinner } from "./ui.jsx";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true, mobile: true },
  { to: "/app/evacuees", label: "Evacuees", icon: Users, mobile: true },
  { to: "/app/analytics", label: "Analytics", icon: BarChart3, mobile: true },
  { to: "/app/centers", label: "Centers", icon: Building2, mobile: true },
  { to: "/app/announcements", label: "Announcements", icon: Megaphone, mobile: true },
  { to: "/app/supplies", label: "Supplies", icon: Package },
  { to: "/app/volunteers", label: "Volunteers", icon: HandHeart },
];

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
    isActive ? "bg-brand text-brand-ink" : "text-muted hover:bg-tint hover:text-ink"
  }`;

export function StaffLayout() {
  const { user, signOut } = useAuth();
  const { status, error, refresh } = useData();

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-svh flex-col border-r border-line bg-surface p-4 lg:flex">
        <Brand to="/app" />
        <nav className="mt-8 flex flex-col gap-1" aria-label="Staff">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon size={18} aria-hidden="true" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-3 border-t border-line pt-4 text-sm">
          <div className="min-w-0">
            <p className="truncate font-semibold">{user.fullName || "Staff"}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <NavLink to="/" className="block text-xs font-semibold text-link hover:underline">
            View public page
          </NavLink>
          <button className="btn-ghost w-full" onClick={signOut}>
            <LogOut size={16} aria-hidden="true" /> Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col pb-20 lg:pb-0">
        <OfflineBanner />
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur lg:px-8">
          <div className="lg:hidden">
            <Brand to="/app" />
          </div>
          <div className="hidden text-sm text-muted lg:block">Community Evacuation Center Management System</div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost p-2" onClick={refresh} aria-label="Refresh data">
              <RefreshCw size={16} aria-hidden="true" />
            </button>
            <button className="btn-ghost p-2 lg:hidden" onClick={signOut} aria-label="Log out">
              <LogOut size={16} aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8">
          {error && (
            <p className="mb-4 rounded-xl bg-full/10 px-4 py-3 text-sm font-semibold text-full" role="alert">
              Couldn't load the latest data: {error}
            </p>
          )}
          {status === "loading" ? <Spinner /> : status === "error" ? null : <Outlet />}
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
        aria-label="Staff"
      >
        {NAV.filter((n) => n.mobile).map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${isActive ? "text-accent" : "text-muted"}`
            }
          >
            <Icon size={20} aria-hidden="true" />
            {label === "Announcements" ? "Alerts" : label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
