// Small shared building blocks used across pages.
import { Loader2, WifiOff } from "lucide-react";
import { useNetwork } from "../hooks/useNetwork.js";

const STATUS_STYLES = {
  Open: "bg-open/15 text-open",
  "Nearly Full": "bg-nearly/15 text-nearly",
  Full: "bg-full/15 text-full",
  Closed: "bg-closed/15 text-closed",
};

const STATUS_BAR = { Open: "bg-open", "Nearly Full": "bg-nearly", Full: "bg-full", Closed: "bg-closed" };

export function StatusPill({ status }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[status] ?? ""}`}>
      {status}
    </span>
  );
}

export function Meter({ value, max, status, label }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div
      className="h-2.5 w-full overflow-hidden rounded-full bg-tint"
      role="meter"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label ?? `${pct}% full`}
    >
      <div className={`h-full rounded-full ${STATUS_BAR[status] ?? "bg-brand"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const PRIORITY_STYLES = {
  urgent: "border-l-full bg-full/5",
  warning: "border-l-nearly bg-nearly/5",
  info: "border-l-brand bg-surface",
};
const PRIORITY_TAG = { urgent: "bg-full text-white", warning: "bg-nearly text-white", info: "bg-tint text-ink" };

export function PriorityTag({ priority }) {
  return (
    <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase ${PRIORITY_TAG[priority] ?? PRIORITY_TAG.info}`}>
      {priority}
    </span>
  );
}

export function AnnouncementCard({ a, children }) {
  return (
    <article className={`rounded-2xl border border-line border-l-4 p-4 ${PRIORITY_STYLES[a.priority] ?? PRIORITY_STYLES.info}`}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <PriorityTag priority={a.priority} />
        {a.postedAt && <time className="text-xs text-muted">{new Date(a.postedAt).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</time>}
      </div>
      <h3 className="font-bold">{a.title}</h3>
      {a.message && <p className="mt-1 text-sm text-muted">{a.message}</p>}
      {children}
    </article>
  );
}

export function StatCard({ label, value, icon: Icon, tone = "text-ink", hint }) {
  return (
    <div className="card flex items-start gap-3 p-4">
      {Icon && (
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-tint text-brand">
          <Icon size={20} aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted">{label}</p>
        <p className={`text-2xl font-extrabold tabular-nums ${tone}`}>{value}</p>
        {hint && <p className="text-xs text-muted">{hint}</p>}
      </div>
    </div>
  );
}

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-muted" role="status">
      <Loader2 className="animate-spin" size={20} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function Field({ label, error, optional, children, htmlFor }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs font-semibold text-full">{error}</p>}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function OfflineBanner() {
  const online = useNetwork();
  if (online) return null;
  return (
    <div className="flex items-center justify-center gap-2 bg-nearly px-4 py-2 text-sm font-semibold text-white" role="status">
      <WifiOff size={16} aria-hidden="true" />
      You're offline. Showing the last saved data.
    </div>
  );
}

export function DemoBadge({ mode }) {
  if (mode !== "demo") return null;
  return (
    <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold whitespace-nowrap text-accent" title="No Supabase keys set: sample data stored in this browser">
      Demo data
    </span>
  );
}

export function EmptyState({ children }) {
  return <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">{children}</p>;
}
