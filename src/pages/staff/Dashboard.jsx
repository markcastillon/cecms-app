import { ArrowRight, Building2, HandHeart, Navigation, Package, UserPlus, Users } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router";
import { AnnouncementCard, Meter, PageHeader, StatCard, StatusPill } from "../../components/ui.jsx";
import { useData } from "../../context/DataContext.jsx";
import { capacityForecast, formatHours, recommendCenter } from "../../analytics/pipeline.js";
import { fmt, sortAnnouncements, timeAgo } from "../../lib/status.js";

export default function Dashboard() {
  const { centers, evacuees, families, announcements, volunteers, summary, loadedAt } = useData();

  const forecast = useMemo(() => capacityForecast(centers, evacuees), [centers, evacuees]);
  const recommended = recommendCenter(forecast);
  const forecastById = Object.fromEntries(forecast.map((f) => [f.id, f]));

  const shelteredFamilies = families.filter((f) => f.status === "Sheltered").length;
  const pendingVolunteers = volunteers.filter((v) => v.status === "Pending review").length;
  const active = sortAnnouncements(announcements.filter((a) => a.active)).slice(0, 3);

  return (
    <>
      <PageHeader title="Dashboard" subtitle={loadedAt ? `Updated ${timeAgo(loadedAt)}` : ""}>
        <Link to="/app/evacuees/new" className="btn-accent">
          <UserPlus size={16} aria-hidden="true" /> Register family
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Evacuees sheltered" value={fmt(summary.evacuees)} icon={Users} tone="text-accent" hint={`${fmt(shelteredFamilies)} families`} />
        <StatCard label="Spaces available" value={fmt(summary.availableSpaces)} icon={Building2} />
        <StatCard label="Centers accepting" value={`${summary.openCenters} / ${summary.totalCenters}`} icon={Building2} tone="text-open" />
        <StatCard label="Volunteer sign-ups" value={fmt(pendingVolunteers)} icon={HandHeart} hint="waiting for review" />
      </div>

      {/* Analytics result used directly in the registration workflow */}
      <section className="card mt-6 border-l-4 border-l-accent" aria-labelledby="rec-title">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
            <Navigation size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="rec-title" className="font-bold">Where to send new arrivals</h2>
            {recommended ? (
              <>
                <p className="mt-1 text-lg font-extrabold">{recommended.name}</p>
                <p className="text-sm text-muted">
                  {fmt(recommended.available)} spaces left · {recommended.perHour.toFixed(1)} arrivals per hour ·
                  {" "}full in: {formatHours(recommended.hoursToFull)}
                </p>
              </>
            ) : (
              <p className="mt-1 font-semibold text-full">Every open center is full. Coordinate with the CDRRMO for overflow sites.</p>
            )}
            <Link to="/app/analytics" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-link hover:underline">
              See the analysis <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card" aria-labelledby="centers-title">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="centers-title" className="font-bold">Center capacity</h2>
            <Link to="/app/centers" className="text-sm font-semibold text-link hover:underline">Manage</Link>
          </div>
          <ul className="space-y-4">
            {centers.map((c) => (
              <li key={c.id}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{c.name}</span>
                  <StatusPill status={c.status} />
                </div>
                <Meter value={c.occupancy} max={c.capacity} status={c.status} label={`${c.name} occupancy`} />
                <div className="mt-1 flex justify-between text-xs text-muted">
                  <span className="tabular-nums">{fmt(c.occupancy)} / {fmt(c.capacity)}</span>
                  {c.status !== "Closed" && <span>Full in: {formatHours(forecastById[c.id]?.hoursToFull ?? null)}</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="ann-title">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="ann-title" className="font-bold">Active announcements</h2>
            <Link to="/app/announcements" className="text-sm font-semibold text-link hover:underline">Manage</Link>
          </div>
          <div className="space-y-3">
            {active.map((a) => <AnnouncementCard key={a.id} a={a} />)}
            {active.length === 0 && <p className="text-sm text-muted">No active announcements.</p>}
          </div>
        </section>
      </div>

      {/* Phones: pages that don't fit in the bottom bar */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:hidden">
        <Link to="/app/supplies" className="card flex items-center gap-3 p-4 font-semibold">
          <Package size={20} className="text-brand" aria-hidden="true" /> Supplies
        </Link>
        <Link to="/app/volunteers" className="card flex items-center gap-3 p-4 font-semibold">
          <HandHeart size={20} className="text-brand" aria-hidden="true" /> Volunteers
        </Link>
      </div>
    </>
  );
}
