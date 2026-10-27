// Edit capacity, contact details and manual status override per center.
// Occupancy is never typed in: it is counted from registered evacuees.
import { useState } from "react";
import { Field, Meter, PageHeader, StatusPill } from "../../components/ui.jsx";
import { STATUSES } from "../../config.js";
import { useData } from "../../context/DataContext.jsx";
import { fmt, formatDateTime } from "../../lib/status.js";

function CenterEditor({ center, onSave }) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(center);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    const capacity = Number(values.capacity);
    if (!Number.isInteger(capacity) || capacity < 0) return setError("Capacity must be a whole number.");
    setBusy(true);
    setError("");
    try {
      await onSave(center.id, {
        capacity,
        statusOverride: values.statusOverride,
        contactPerson: values.contactPerson.trim(),
        contactNumber: values.contactNumber.trim(),
      });
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-bold">{center.name}</h2>
          <p className="text-sm text-muted">{center.location} · {center.id}</p>
        </div>
        <StatusPill status={center.status} />
      </div>
      <div className="mt-3">
        <Meter value={center.occupancy} max={center.capacity} status={center.status} />
        <p className="mt-1 text-xs text-muted">
          {fmt(center.occupancy)} sheltered of {fmt(center.capacity)} · {fmt(center.available)} spaces left
          {center.statusOverride && <> · status set manually to <strong>{center.statusOverride}</strong></>}
        </p>
      </div>

      {editing ? (
        <form className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2" onSubmit={save}>
          <Field label="Capacity (persons)" htmlFor={`cap-${center.id}`}>
            <input id={`cap-${center.id}`} className="input" type="number" min={0} value={values.capacity} onChange={set("capacity")} />
          </Field>
          <Field label="Status" htmlFor={`st-${center.id}`}>
            <select id={`st-${center.id}`} className="input" value={values.statusOverride} onChange={set("statusOverride")}>
              <option value="">Automatic (from occupancy)</option>
              {STATUSES.map((s) => <option key={s} value={s}>Force: {s}</option>)}
            </select>
          </Field>
          <Field label="Contact person" htmlFor={`cp-${center.id}`}>
            <input id={`cp-${center.id}`} className="input" value={values.contactPerson} onChange={set("contactPerson")} />
          </Field>
          <Field label="Contact number" htmlFor={`cn-${center.id}`}>
            <input id={`cn-${center.id}`} className="input" type="tel" value={values.contactNumber} onChange={set("contactNumber")} />
          </Field>
          {error && <p className="text-sm font-semibold text-full sm:col-span-2">{error}</p>}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="btn-ghost" onClick={() => { setValues(center); setEditing(false); }}>Cancel</button>
            <button className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-muted">
          <span>
            {center.contactPerson || "No contact person"} {center.contactNumber && `· ${center.contactNumber}`}
            {center.updatedAt && ` · edited ${formatDateTime(center.updatedAt)}`}
          </span>
          <button className="btn-ghost px-3 py-1.5 text-xs" onClick={() => { setValues(center); setEditing(true); }}>Edit</button>
        </div>
      )}
    </li>
  );
}

export default function Centers() {
  const { centers, actions } = useData();
  return (
    <>
      <PageHeader title="Evacuation centers" subtitle="Status is automatic: Nearly Full at 80%, Full at 100%. Override it to close a center." />
      <ul className="grid gap-4 md:grid-cols-2">
        {centers.map((c) => <CenterEditor key={c.id} center={c} onSave={actions.updateCenter} />)}
      </ul>
    </>
  );
}
