// Data analytics pipeline: raw records -> cleaned -> aggregated -> chart-ready series.
// Every function is pure (same input, same output), so the Analytics page,
// the Dashboard and the tests all get identical numbers.
import {
  ARRIVAL_RATE_WINDOW_HOURS,
  FOOD_PACKS_PER_FAMILY_PER_DAY,
  VULNERABLE_GROUPS,
} from "../config.js";

const HOUR = 3_600_000;

// Step 1: clean. Drops rows that cannot be analysed (bad dates or ages).
export function cleanEvacuees(evacuees) {
  return evacuees.filter((e) => {
    const t = new Date(e.arrivedAt).getTime();
    return Number.isFinite(t) && Number.isFinite(Number(e.age)) && e.centerId;
  });
}

// Occupancy vs capacity for every center that is not closed.
export function occupancyByCenter(centers) {
  return centers
    .filter((c) => c.status !== "Closed")
    .map((c) => ({
      id: c.id,
      name: c.name,
      short: c.name.replace(/^(Barangay|Pangabugan)\s+/i, ""),
      capacity: c.capacity,
      sheltered: c.occupancy,
      available: c.available,
      pct: c.capacity ? Math.round((c.occupancy / c.capacity) * 100) : 0,
      status: c.status,
    }));
}

// Arrivals per time bucket plus the running total of people still sheltered.
export function arrivalsOverTime(evacuees, { bucketHours = 3, now = Date.now() } = {}) {
  const rows = cleanEvacuees(evacuees);
  if (!rows.length) return [];
  const size = bucketHours * HOUR;
  const first = Math.min(...rows.map((e) => new Date(e.arrivedAt).getTime()));
  const start = Math.floor(first / size) * size;
  const buckets = [];
  for (let t = start; t <= now; t += size) buckets.push({ t, arrivals: 0 });

  for (const e of rows) {
    const i = Math.floor((new Date(e.arrivedAt).getTime() - start) / size);
    if (buckets[i]) buckets[i].arrivals += 1;
  }
  let total = 0;
  return buckets.map((b) => {
    total += b.arrivals;
    return {
      label: new Date(b.t).toLocaleString("en-PH", { weekday: "short", hour: "numeric" }),
      arrivals: b.arrivals,
      cumulative: total,
    };
  });
}

const AGE_BANDS = [
  { label: "0-4", min: 0, max: 4 },
  { label: "5-12", min: 5, max: 12 },
  { label: "13-17", min: 13, max: 17 },
  { label: "18-35", min: 18, max: 35 },
  { label: "36-59", min: 36, max: 59 },
  { label: "60+", min: 60, max: 200 },
];

// Sheltered evacuees by age band and sex.
export function ageSexBreakdown(evacuees) {
  const sheltered = cleanEvacuees(evacuees).filter((e) => e.status === "Sheltered");
  return AGE_BANDS.map((band) => {
    const inBand = sheltered.filter((e) => e.age >= band.min && e.age <= band.max);
    return {
      band: band.label,
      male: inBand.filter((e) => e.sex === "M").length,
      female: inBand.filter((e) => e.sex === "F").length,
    };
  });
}

// Sheltered evacuees per vulnerable group, in a fixed order.
export function vulnerableCounts(evacuees) {
  const sheltered = evacuees.filter((e) => e.status === "Sheltered");
  return VULNERABLE_GROUPS.map((group) => ({
    group,
    count: sheltered.filter((e) => e.vulnerableGroup === group).length,
  }));
}

// Arrival rate per center over the recent window, and a linear projection of
// when each center fills up at that rate.
export function capacityForecast(centers, evacuees, { now = Date.now(), windowHours = ARRIVAL_RATE_WINDOW_HOURS } = {}) {
  const since = now - windowHours * HOUR;
  const recent = cleanEvacuees(evacuees).filter(
    (e) => e.status === "Sheltered" && new Date(e.arrivedAt).getTime() >= since
  );
  return centers
    .filter((c) => c.status !== "Closed")
    .map((c) => {
      const arrivals = recent.filter((e) => e.centerId === c.id).length;
      const perHour = arrivals / windowHours;
      let hoursToFull = null;
      if (c.available === 0) hoursToFull = 0;
      else if (perHour > 0) hoursToFull = c.available / perHour;
      return { id: c.id, name: c.name, status: c.status, available: c.available, arrivals, perHour, hoursToFull };
    });
}

// Picks the center new arrivals should go to: open, with room, and filling
// slowest. Returns null when every center is full or closed.
export function recommendCenter(forecast) {
  const candidates = forecast.filter((f) => f.available > 0 && f.status !== "Full");
  if (!candidates.length) return null;
  const score = (f) => (f.hoursToFull === null ? Infinity : f.hoursToFull);
  return [...candidates].sort((a, b) => score(b) - score(a) || b.available - a.available)[0];
}

// Days of food left per center at the planning ration.
export function foodCoverage(centers, families, supplies) {
  return centers
    .filter((c) => c.status !== "Closed")
    .map((c) => {
      const sheltered = families.filter((f) => f.centerId === c.id && f.status === "Sheltered").length;
      const packs = supplies
        .filter((s) => s.centerId === c.id && /food pack/i.test(s.item))
        .reduce((sum, s) => sum + Math.max(s.quantityReceived - s.quantityReleased, 0), 0);
      const perDay = sheltered * FOOD_PACKS_PER_FAMILY_PER_DAY;
      return {
        id: c.id,
        name: c.name,
        families: sheltered,
        packs,
        days: perDay ? packs / perDay : null,
      };
    });
}

export function formatHours(hours) {
  if (hours === null) return "No recent arrivals";
  if (hours === 0) return "Full now";
  if (hours < 1) return "Under 1 hour";
  if (hours < 48) return `About ${Math.round(hours)} hours`;
  return `About ${Math.round(hours / 24)} days`;
}
