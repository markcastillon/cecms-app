import { useState } from "react";
import { AnnouncementCard, EmptyState, Field, PageHeader } from "../../components/ui.jsx";
import { PRIORITIES } from "../../config.js";
import { useData } from "../../context/DataContext.jsx";
import { sortAnnouncements } from "../../lib/status.js";

export default function Announcements() {
  const { announcements, actions } = useData();
  const [values, setValues] = useState({ title: "", message: "", priority: "info" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));
  const active = sortAnnouncements(announcements.filter((a) => a.active));
  const hidden = sortAnnouncements(announcements.filter((a) => !a.active));

  async function onSubmit(e) {
    e.preventDefault();
    if (values.title.trim().length < 3) return setError("Write a short title.");
    setBusy(true);
    setError("");
    try {
      await actions.addAnnouncement({ title: values.title.trim(), message: values.message.trim(), priority: values.priority });
      setValues({ title: "", message: "", priority: "info" });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const toggle = (a) => actions.setAnnouncementActive(a.id, !a.active).catch((err) => window.alert(err.message));

  return (
    <>
      <PageHeader title="Announcements" subtitle="Active announcements appear on the public page right away. Urgent ones also show as a red banner." />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <form className="card h-fit space-y-4" onSubmit={onSubmit}>
          <h2 className="font-bold">Post an announcement</h2>
          <Field label="Title" htmlFor="title">
            <input id="title" className="input" maxLength={140} value={values.title} onChange={set("title")} />
          </Field>
          <Field label="Message" optional htmlFor="message">
            <textarea id="message" className="input" rows={4} maxLength={600} value={values.message} onChange={set("message")} />
          </Field>
          <Field label="Priority" htmlFor="priority">
            <select id="priority" className="input" value={values.priority} onChange={set("priority")}>
              {PRIORITIES.map((p) => <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>)}
            </select>
          </Field>
          {error && <p className="text-sm font-semibold text-full">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>{busy ? "Posting…" : "Post"}</button>
        </form>

        <div className="space-y-6">
          <section>
            <h2 className="mb-3 font-bold">Active ({active.length})</h2>
            <div className="space-y-3">
              {active.map((a) => (
                <AnnouncementCard key={a.id} a={a}>
                  <button className="btn-ghost mt-3 px-3 py-1.5 text-xs" onClick={() => toggle(a)}>Hide from public</button>
                </AnnouncementCard>
              ))}
              {active.length === 0 && <EmptyState>No active announcements.</EmptyState>}
            </div>
          </section>
          {hidden.length > 0 && (
            <section>
              <h2 className="mb-3 font-bold text-muted">Hidden ({hidden.length})</h2>
              <div className="space-y-3 opacity-70">
                {hidden.map((a) => (
                  <AnnouncementCard key={a.id} a={a}>
                    <button className="btn-ghost mt-3 px-3 py-1.5 text-xs" onClick={() => toggle(a)}>Show again</button>
                  </AnnouncementCard>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
