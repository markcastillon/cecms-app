// Public page: live center status, announcements, policies and volunteer sign-up.
// Visitors never see names; only totals and center information.
import { AlertTriangle, LogIn, Phone, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Brand } from "../../components/Brand.jsx";
import { AnnouncementCard, EmptyState, Meter, OfflineBanner, Spinner, StatusPill } from "../../components/ui.jsx";
import { BARANGAY, CITY, STATUSES } from "../../config.js";
import { usePublicStatus } from "../../hooks/usePublicStatus.js";
import { fmt, timeAgo } from "../../lib/status.js";
import VolunteerForm from "./VolunteerForm.jsx";

function CenterCard({ c }) {
  return (
    <article className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold">{c.name}</h3>
          {c.location && <p className="text-sm text-muted">{c.location}</p>}
        </div>
        <StatusPill status={c.status} />
      </div>
      <Meter value={c.occupancy} max={c.capacity} status={c.status} label={`${c.name} occupancy`} />
      <div className="flex justify-between text-sm">
        <span>
          <strong className="tabular-nums">{fmt(c.occupancy)}</strong> / {fmt(c.capacity)} occupied
        </span>
        <span>
          <strong className="tabular-nums">{fmt(c.available)}</strong> spaces left
        </span>
      </div>
      {(c.contactPerson || c.contactNumber) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-xs text-muted">
          {c.contactPerson && <span>{c.contactPerson}</span>}
          {c.contactNumber && (
            <a className="font-semibold text-link" href={`tel:${c.contactNumber.replace(/[^\d+]/g, "")}`}>
              {c.contactNumber}
            </a>
          )}
        </div>
      )}
    </article>
  );
}

function PolicyCard({ p }) {
  const sentences = p.summary.split(/(?<=\.)\s+/).filter(Boolean);
  const asList = p.type.toLowerCase() === "rule" && sentences.length > 1;
  return (
    <article className={`card ${p.type === "Ordinance" ? "md:col-span-2 border-l-4 border-l-brand" : ""}`}>
      <div className="mb-2 flex gap-2">
        <span className="rounded-md bg-tint px-2 py-0.5 text-[11px] font-bold uppercase">{p.type}</span>
        {p.isDraft && <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-bold text-accent uppercase">Draft</span>}
      </div>
      <h3 className="font-bold">{p.title}</h3>
      {asList ? (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted">
          {sentences.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">{p.summary}</p>
      )}
      {p.legalBasis && (
        <p className="mt-3 text-xs text-muted">
          <strong>Legal basis:</strong> {p.legalBasis}
        </p>
      )}
    </article>
  );
}

export default function Home() {
  const { status, offline, data } = usePublicStatus();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const centers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.centers ?? []).filter(
      (c) => (filter === "all" || c.status === filter) && (!q || `${c.name} ${c.location}`.toLowerCase().includes(q))
    );
  }, [data, filter, query]);

  const urgent = data?.announcements.find((a) => a.priority === "urgent");
  const s = data?.summary;

  return (
    <div className="min-h-svh">
      <OfflineBanner />
      <header className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <Brand />
          <nav className="flex items-center gap-1 text-sm font-semibold" aria-label="Main">
            <a href="#centers" className="hidden rounded-lg px-3 py-2 hover:bg-tint sm:block">Centers</a>
            <a href="#announcements" className="hidden rounded-lg px-3 py-2 hover:bg-tint sm:block">Announcements</a>
            <a href="#volunteer" className="hidden rounded-lg px-3 py-2 hover:bg-tint md:block">Volunteer</a>
            <Link to="/login" className="btn-primary ml-1 px-3 py-2">
              <LogIn size={16} aria-hidden="true" /> Staff login
            </Link>
          </nav>
        </div>
      </header>

      {urgent && (
        <div className="bg-full text-white">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 text-sm md:px-8">
            <AlertTriangle size={18} className="shrink-0" aria-hidden="true" />
            <p className="min-w-0 flex-1 font-semibold">{urgent.title}</p>
            <a href="#announcements" className="shrink-0 underline">Read more</a>
          </div>
        </div>
      )}

      <main>
        {/* Hero + live board */}
        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_1fr] md:px-8 md:py-16">
          <div className="flex flex-col justify-center">
            <p className="eyebrow">Community Evacuation Center Management System</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-balance md:text-5xl">
              Know where it's safe, and where there's still room.
            </h1>
            <p className="mt-4 max-w-xl text-muted md:text-lg">
              One shared, up-to-date record of every evacuation center in {BARANGAY}: how many people are sheltered, how
              much space is left, and what everyone needs to know right now.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#centers" className="btn-primary">See center status</a>
              <a href="#volunteer" className="btn-ghost">Volunteer to help</a>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-muted">
              <Phone size={14} aria-hidden="true" /> In a life-threatening emergency, call{" "}
              <a href="tel:911" className="font-bold text-link">911</a>.
            </p>
          </div>

          <aside className="card self-center" aria-labelledby="board-title">
            <div className="flex items-center justify-between gap-2">
              <h2 id="board-title" className="font-bold">Live situation board</h2>
              {offline && (
                <span className="rounded-full bg-nearly/15 px-2.5 py-1 text-xs font-bold text-nearly">Offline copy</span>
              )}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              {[
                ["Centers accepting evacuees", s?.openCenters, "text-open"],
                ["Spaces available", s?.availableSpaces, "text-ink"],
                ["Evacuees sheltered", s?.evacuees, "text-accent"],
                ["Total centers", s?.totalCenters, "text-ink"],
              ].map(([label, value, tone]) => (
                <div key={label} className="rounded-xl bg-tint p-3">
                  <dt className="text-xs font-semibold text-muted">{label}</dt>
                  <dd className={`text-2xl font-extrabold tabular-nums ${tone}`}>{value === undefined ? "-" : fmt(value)}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-xs text-muted" aria-live="polite">
              {status === "loading" && "Fetching latest data…"}
              {status === "error" && "Couldn't reach the server. We'll retry automatically."}
              {data && (offline ? `No connection. Showing data saved ${timeAgo(data.fetchedAt)}.` : `Updated ${timeAgo(data.fetchedAt)}. Refreshes every minute.`)}
            </p>
          </aside>
        </section>

        {/* Centers */}
        <section id="centers" className="scroll-mt-20 border-t border-line py-12">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <p className="eyebrow">Real-time capacity</p>
            <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">Evacuation center status</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Status updates automatically from each center's registered evacuees. Go to a center marked <strong>Open</strong> whenever possible.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="relative block sm:w-72">
                <span className="sr-only">Search centers</span>
                <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden="true" />
                <input className="input pl-9" type="search" placeholder="Search by name or purok" value={query} onChange={(e) => setQuery(e.target.value)} />
              </label>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
                {["all", ...STATUSES].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    aria-pressed={filter === f}
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                      filter === f ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface text-muted hover:text-ink"
                    }`}
                  >
                    {f === "all" ? "All" : f}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-live="polite">
              {status === "loading" && <div className="md:col-span-2 lg:col-span-3"><Spinner /></div>}
              {data && centers.map((c) => <CenterCard key={c.id} c={c} />)}
            </div>
            {data && centers.length === 0 && <EmptyState>No centers match your search.</EmptyState>}

            {data?.vulnerable.length > 0 && (
              <div className="card mt-6">
                <h3 className="font-bold">Priority groups currently sheltered</h3>
                <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {data.vulnerable.map((g) => (
                    <li key={g.group} className="rounded-xl bg-tint p-3 text-center">
                      <strong className="block text-xl tabular-nums">{fmt(g.count)}</strong>
                      <span className="text-xs text-muted">{g.group}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-muted">
                  Counts only. Names and personal information are kept private under the Data Privacy Act of 2012 (RA 10173).
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Announcements */}
        <section id="announcements" className="scroll-mt-20 border-t border-line bg-tint py-12">
          <div className="mx-auto max-w-6xl px-4 md:px-8">
            <p className="eyebrow">From barangay officials</p>
            <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">Emergency announcements</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {data?.announcements.map((a) => <AnnouncementCard key={a.id} a={a} />)}
            </div>
            {data && data.announcements.length === 0 && <EmptyState>No active announcements right now.</EmptyState>}
          </div>
        </section>

        {/* Policies */}
        {data?.policies.length > 0 && (
          <section id="policies" className="scroll-mt-20 border-t border-line py-12">
            <div className="mx-auto max-w-6xl px-4 md:px-8">
              <p className="eyebrow">Barangay policies</p>
              <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">Ordinance, policies &amp; center rules</h2>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {data.policies.map((p) => <PolicyCard key={p.id} p={p} />)}
              </div>
            </div>
          </section>
        )}

        {/* Volunteer */}
        <section id="volunteer" className="scroll-mt-20 border-t border-line bg-tint py-12">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-2 md:px-8">
            <div>
              <p className="eyebrow">Lend a hand</p>
              <h2 className="mt-2 text-2xl font-extrabold md:text-3xl">Volunteer at an evacuation center</h2>
              <p className="mt-3 text-muted">
                Registration desks, relief distribution, and record keeping all need extra hands during an emergency. Leave
                your details and a barangay coordinator will reach out.
              </p>
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted">
                <li>No special skills needed: we'll brief you on site</li>
                <li>Your details are only visible to barangay coordinators</li>
                <li>You can choose the center closest to you</li>
              </ul>
            </div>
            <VolunteerForm centers={data?.centers ?? []} />
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-8 text-sm text-muted">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 md:flex-row md:justify-between md:px-8">
          <p>
            <strong className="text-ink">Community Evacuation Center Management System</strong>
            <br />
            {BARANGAY}, {CITY}
          </p>
          <p className="max-w-md">
            An academic project. This system supports evacuation management and does not replace official instructions from
            the barangay, CDRRMO, or emergency responders. In an emergency, call <a className="font-bold text-link" href="tel:911">911</a>.
          </p>
        </div>
      </footer>
    </div>
  );
}
