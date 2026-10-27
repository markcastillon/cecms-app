// Evacuee registry grouped by family, with search and filters.
import { ChevronDown, Search, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router";
import { EmptyState, PageHeader } from "../../components/ui.jsx";
import { useData } from "../../context/DataContext.jsx";
import { formatDateTime } from "../../lib/status.js";

const PAGE_SIZE = 25;

function FamilyRow({ family, members, centerName, onStatus }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const sheltered = family.status === "Sheltered";

  async function toggleStatus() {
    const next = sheltered ? "Returned home" : "Sheltered";
    if (!window.confirm(`Mark the ${family.headOfFamily} family (${members.length} people) as "${next}"?`)) return;
    setBusy(true);
    try {
      await onStatus(family.id, next);
    } catch (err) {
      window.alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="card p-0">
      <div className="flex flex-wrap items-center gap-3 p-4">
        <button
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          <ChevronDown size={18} className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
          <span className="min-w-0">
            <span className="block truncate font-bold">{family.headOfFamily}</span>
            <span className="block text-xs text-muted">
              {members.length} {members.length === 1 ? "person" : "people"} · {family.purok} · {centerName(family.centerId)} · {formatDateTime(family.registeredAt)}
            </span>
          </span>
        </button>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${sheltered ? "bg-open/15 text-open" : "bg-closed/15 text-closed"}`}>
          {family.status}
        </span>
        <button className="btn-ghost px-3 py-1.5 text-xs" onClick={toggleStatus} disabled={busy}>
          {sheltered ? "Mark returned home" : "Mark sheltered"}
        </button>
      </div>
      {open && (
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-tint text-xs text-muted">
              <tr>
                <th className="px-4 py-2 font-semibold">Name</th>
                <th className="px-4 py-2 font-semibold">Relationship</th>
                <th className="px-4 py-2 font-semibold">Age</th>
                <th className="px-4 py-2 font-semibold">Sex</th>
                <th className="px-4 py-2 font-semibold">Vulnerable group</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-line">
                  <td className="px-4 py-2 font-medium">{m.fullName}</td>
                  <td className="px-4 py-2">{m.relationship}</td>
                  <td className="px-4 py-2 tabular-nums">{m.age}</td>
                  <td className="px-4 py-2">{m.sex}</td>
                  <td className="px-4 py-2">{m.vulnerableGroup || <span className="text-muted">None</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-4 py-2 text-xs text-muted">
            House damage: {family.houseDamage} · Contact: {family.contactNumber || "none"}
          </p>
        </div>
      )}
    </li>
  );
}

export default function Evacuees() {
  const { families, evacuees, centers, centerName, actions } = useData();
  const [query, setQuery] = useState("");
  const [center, setCenter] = useState("all");
  const [status, setStatus] = useState("Sheltered");
  const [shown, setShown] = useState(PAGE_SIZE);

  const membersByFamily = useMemo(() => {
    const map = {};
    for (const e of evacuees) (map[e.familyId] ??= []).push(e);
    return map;
  }, [evacuees]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return families
      .filter((f) => (center === "all" || f.centerId === center) && (status === "all" || f.status === status))
      .filter((f) => !q || (membersByFamily[f.id] ?? []).some((m) => m.fullName.toLowerCase().includes(q)) || f.headOfFamily.toLowerCase().includes(q))
      .sort((a, b) => String(b.registeredAt).localeCompare(String(a.registeredAt)));
  }, [families, membersByFamily, query, center, status]);

  const people = list.reduce((n, f) => n + (membersByFamily[f.id]?.length ?? 0), 0);

  return (
    <>
      <PageHeader title="Evacuees" subtitle={`${list.length} families, ${people} people`}>
        <Link to="/app/evacuees/new" className="btn-accent">
          <UserPlus size={16} aria-hidden="true" /> Register family
        </Link>
      </PageHeader>

      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <label className="relative block">
          <span className="sr-only">Search by name</span>
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input className="input pl-9" type="search" placeholder="Search any family member by name" value={query} onChange={(e) => { setQuery(e.target.value); setShown(PAGE_SIZE); }} />
        </label>
        <select className="input" value={center} onChange={(e) => { setCenter(e.target.value); setShown(PAGE_SIZE); }} aria-label="Filter by center">
          <option value="all">All centers</option>
          {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="input" value={status} onChange={(e) => { setStatus(e.target.value); setShown(PAGE_SIZE); }} aria-label="Filter by status">
          <option value="Sheltered">Sheltered</option>
          <option value="Returned home">Returned home</option>
          <option value="all">All statuses</option>
        </select>
      </div>

      {list.length === 0 ? (
        <EmptyState>No families match these filters.</EmptyState>
      ) : (
        <ul className="space-y-3">
          {list.slice(0, shown).map((f) => (
            <FamilyRow key={f.id} family={f} members={membersByFamily[f.id] ?? []} centerName={centerName} onStatus={actions.setFamilyStatus} />
          ))}
        </ul>
      )}
      {shown < list.length && (
        <div className="mt-4 text-center">
          <button className="btn-ghost" onClick={() => setShown((n) => n + PAGE_SIZE)}>
            Show more ({list.length - shown} left)
          </button>
        </div>
      )}
    </>
  );
}
