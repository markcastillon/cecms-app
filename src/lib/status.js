// Center status rules, ported from the CSC 106 system (lib/data.js) so both
// systems agree: a staff override wins, otherwise status follows occupancy.
import { NEARLY_FULL_RATIO, STATUSES } from "../config.js";

export function computeStatus(capacity, occupancy, override) {
  const manual = STATUSES.find((s) => s.toLowerCase() === String(override ?? "").trim().toLowerCase());
  if (manual) return manual;
  if (capacity <= 0) return "Closed";
  const ratio = occupancy / capacity;
  if (ratio >= 1) return "Full";
  if (ratio >= NEARLY_FULL_RATIO) return "Nearly Full";
  return "Open";
}

// Adds occupancy, available spaces and status to raw center rows.
// occupancyById maps center id -> number of sheltered evacuees.
export function withOccupancy(centers, occupancyById) {
  return centers.map((c) => {
    const occupancy = occupancyById[c.id] ?? 0;
    const status = computeStatus(c.capacity, occupancy, c.statusOverride);
    return {
      ...c,
      occupancy,
      available: status === "Closed" ? 0 : Math.max(c.capacity - occupancy, 0),
      status,
    };
  });
}

export function countSheltered(evacuees) {
  const counts = {};
  for (const e of evacuees) {
    if (e.status === "Sheltered") counts[e.centerId] = (counts[e.centerId] ?? 0) + 1;
  }
  return counts;
}

export function summarize(centers) {
  const active = centers.filter((c) => c.status !== "Closed");
  return {
    totalCenters: centers.length,
    openCenters: centers.filter((c) => c.status === "Open" || c.status === "Nearly Full").length,
    evacuees: active.reduce((sum, c) => sum + c.occupancy, 0),
    availableSpaces: active.filter((c) => c.status !== "Full").reduce((sum, c) => sum + c.available, 0),
  };
}

const PRIORITY_RANK = { urgent: 0, warning: 1, info: 2 };

export function sortAnnouncements(items) {
  return [...items].sort(
    (a, b) =>
      (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3) ||
      String(b.postedAt).localeCompare(String(a.postedAt))
  );
}

export const fmt = (n) => Number(n || 0).toLocaleString("en-PH");

export function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (!Number.isFinite(mins)) return "";
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? `${hrs} hr ago` : formatDateTime(iso);
}
