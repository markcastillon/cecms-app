import { useState } from "react";
import { EmptyState, PageHeader } from "../../components/ui.jsx";
import { VOLUNTEER_STATUSES } from "../../config.js";
import { useData } from "../../context/DataContext.jsx";
import { formatDateTime } from "../../lib/status.js";

export default function Volunteers() {
  const { volunteers, actions } = useData();
  const [filter, setFilter] = useState("all");

  const list = volunteers
    .filter((v) => filter === "all" || v.status === filter)
    .sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));

  const change = (v) => (e) => actions.setVolunteerStatus(v.id, e.target.value).catch((err) => window.alert(err.message));

  return (
    <>
      <PageHeader title="Volunteers" subtitle="Sign-ups from the public page. Contact details are visible to staff only.">
        <select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by status">
          <option value="all">All statuses</option>
          {VOLUNTEER_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </PageHeader>

      {list.length === 0 ? (
        <EmptyState>No volunteer sign-ups yet.</EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((v) => (
            <li key={v.id} className="card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-bold">{v.fullName}</h2>
                  <p className="text-xs text-muted">Signed up {formatDateTime(v.submittedAt)}</p>
                </div>
                <select className="input w-auto px-2 py-1.5 text-xs" value={v.status} onChange={change(v)} aria-label={`Status for ${v.fullName}`}>
                  {VOLUNTEER_STATUSES.includes(v.status) ? null : <option>{v.status}</option>}
                  {VOLUNTEER_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <dl className="mt-3 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1 text-sm">
                <dt className="text-muted">Mobile</dt>
                <dd><a className="font-semibold text-link" href={`tel:${v.contactNumber}`}>{v.contactNumber}</a></dd>
                {v.email && (<><dt className="text-muted">Email</dt><dd className="truncate">{v.email}</dd></>)}
                <dt className="text-muted">Availability</dt>
                <dd>{v.availability}</dd>
                <dt className="text-muted">Preferred center</dt>
                <dd>{v.preferredCenter || "Any"}</dd>
                {v.skills && (<><dt className="text-muted">Skills</dt><dd>{v.skills}</dd></>)}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
