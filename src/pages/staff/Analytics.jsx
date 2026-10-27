// Emerging technology module: data analytics and visualization.
// Raw evacuee, family and supply records go through src/analytics/pipeline.js
// (clean -> aggregate -> forecast) and are drawn here as interactive charts.
// Every chart also has a table view for screen readers and printing.
import { Table2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ageSexBreakdown,
  arrivalsOverTime,
  capacityForecast,
  foodCoverage,
  formatHours,
  occupancyByCenter,
  recommendCenter,
  vulnerableCounts,
} from "../../analytics/pipeline.js";
import { PageHeader, StatusPill } from "../../components/ui.jsx";
import { ARRIVAL_RATE_WINDOW_HOURS, FOOD_PACKS_PER_FAMILY_PER_DAY } from "../../config.js";
import { useData } from "../../context/DataContext.jsx";
import { fmt } from "../../lib/status.js";

const STATUS_FILL = { Open: "var(--open)", "Nearly Full": "var(--nearly)", Full: "var(--full)", Closed: "var(--closed)" };
const axis = { stroke: "var(--muted)", fontSize: 12, tickLine: false, axisLine: { stroke: "var(--line)" } };
const grid = { stroke: "var(--grid)", vertical: false };

function ChartTooltip({ active, payload, label, unit = "" }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-lg">
      {label !== undefined && <p className="mb-1 font-bold text-ink">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-muted">
          <span className="size-2.5 rounded-sm" style={{ background: p.color ?? p.payload.fill }} aria-hidden="true" />
          {p.name}: <strong className="text-ink tabular-nums">{fmt(p.value)}{unit}</strong>
        </p>
      ))}
    </div>
  );
}

// Card with a chart/table toggle.
function ChartCard({ title, subtitle, table, children, className = "" }) {
  const [showTable, setShowTable] = useState(false);
  return (
    <section className={`card ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">{title}</h2>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
        <button className="btn-ghost shrink-0 px-2.5 py-1.5 text-xs" onClick={() => setShowTable((s) => !s)} aria-pressed={showTable}>
          <Table2 size={14} aria-hidden="true" /> {showTable ? "Chart" : "Table"}
        </button>
      </div>
      {showTable ? <div className="overflow-x-auto">{table}</div> : children}
    </section>
  );
}

function DataTable({ columns, rows }) {
  return (
    <table className="w-full text-left text-sm">
      <thead className="text-xs text-muted">
        <tr>{columns.map((c) => <th key={c.key} className={`px-2 py-1.5 font-semibold ${c.num ? "text-right" : ""}`}>{c.label}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-line">
            {columns.map((c) => (
              <td key={c.key} className={`px-2 py-1.5 ${c.num ? "text-right tabular-nums" : ""}`}>
                {c.render ? c.render(r) : r[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Analytics() {
  const { centers, evacuees, families, supplies } = useData();
  const [bucketHours, setBucketHours] = useState(3);

  const occupancy = useMemo(() => occupancyByCenter(centers), [centers]);
  const arrivals = useMemo(() => arrivalsOverTime(evacuees, { bucketHours }), [evacuees, bucketHours]);
  const ageSex = useMemo(() => ageSexBreakdown(evacuees), [evacuees]);
  const vulnerable = useMemo(() => vulnerableCounts(evacuees), [evacuees]);
  const forecast = useMemo(() => capacityForecast(centers, evacuees), [centers, evacuees]);
  const food = useMemo(() => foodCoverage(centers, families, supplies), [centers, families, supplies]);
  const recommended = recommendCenter(forecast);

  const sheltered = evacuees.filter((e) => e.status === "Sheltered");
  const vulnerableTotal = vulnerable.reduce((n, v) => n + v.count, 0);
  const children = sheltered.filter((e) => e.age < 18).length;
  const recentRate = forecast.reduce((n, f) => n + f.perHour, 0);

  return (
    <>
      <PageHeader
        title="Analytics"
        subtitle={`Computed live from ${fmt(evacuees.length)} evacuee records, ${fmt(families.length)} families and ${fmt(supplies.length)} supply items.`}
      />

      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Arrivals per hour", recentRate.toFixed(1), `last ${ARRIVAL_RATE_WINDOW_HOURS} hours, all centers`],
          ["Vulnerable persons", fmt(vulnerableTotal), `${sheltered.length ? Math.round((vulnerableTotal / sheltered.length) * 100) : 0}% of sheltered`],
          ["Children under 18", fmt(children), `${sheltered.length ? Math.round((children / sheltered.length) * 100) : 0}% of sheltered`],
          ["Send arrivals to", recommended ? recommended.name : "No space", recommended ? `${fmt(recommended.available)} spaces, fills slowest` : "All open centers are full"],
        ].map(([label, value, hint]) => (
          <div key={label} className="card p-4">
            <p className="text-xs font-semibold text-muted">{label}</p>
            <p className="mt-1 truncate text-xl font-extrabold tabular-nums" title={value}>{value}</p>
            <p className="text-xs text-muted">{hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* 1. Occupancy by center */}
        <ChartCard
          title="Occupancy by center"
          subtitle="Percent of capacity in use. Colors follow center status."
          table={
            <DataTable
              columns={[
                { key: "name", label: "Center" },
                { key: "sheltered", label: "Sheltered", num: true },
                { key: "capacity", label: "Capacity", num: true },
                { key: "pct", label: "% full", num: true, render: (r) => `${r.pct}%` },
                { key: "status", label: "Status", render: (r) => <StatusPill status={r.status} /> },
              ]}
              rows={occupancy}
            />
          }
        >
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={occupancy} layout="vertical" margin={{ left: 0, right: 92 }} barCategoryGap={10}>
                <CartesianGrid {...grid} horizontal={false} vertical />
                <XAxis type="number" domain={[0, 100]} ticks={[0, 50, 100]} unit="%" {...axis} />
                <YAxis type="category" dataKey="short" width={96} interval={0} {...axis} />
                <Tooltip cursor={{ fill: "var(--tint)" }} content={<ChartTooltip unit="%" />} />
                <Bar dataKey="pct" name="Capacity used" radius={[0, 4, 4, 0]} maxBarSize={26}>
                  {occupancy.map((o) => <Cell key={o.id} fill={STATUS_FILL[o.status]} />)}
                  {/* Status as text too, so it never relies on color alone */}
                  <LabelList
                    dataKey="pct"
                    content={({ x, y, width, height, index }) => (
                      <text x={x + width + 8} y={y + height / 2} dy={4} fill="var(--muted)" fontSize={11}>
                        {occupancy[index].pct}% · {occupancy[index].status}
                      </text>
                    )}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* 2. Forecast */}
        <ChartCard
          title="Time until full"
          subtitle={`Projected from each center's arrivals in the last ${ARRIVAL_RATE_WINDOW_HOURS} hours, assuming the same pace continues.`}
          table={
            <DataTable
              columns={[
                { key: "name", label: "Center" },
                { key: "arrivals", label: "Recent arrivals", num: true },
                { key: "perHour", label: "Per hour", num: true, render: (r) => r.perHour.toFixed(1) },
                { key: "available", label: "Spaces left", num: true },
                { key: "hoursToFull", label: "Full in", render: (r) => formatHours(r.hoursToFull) },
              ]}
              rows={forecast}
            />
          }
        >
          <ul className="space-y-3">
            {forecast.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 rounded-xl bg-tint p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{f.name}</p>
                  {recommended?.id === f.id && (
                    <span className="mt-0.5 inline-block rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">Recommended</span>
                  )}
                  <p className="text-xs text-muted">{f.perHour.toFixed(1)} arrivals/hour · {fmt(f.available)} spaces left</p>
                </div>
                <p className={`shrink-0 text-right text-sm font-bold ${f.hoursToFull !== null && f.hoursToFull < 6 ? "text-full" : ""}`}>
                  {formatHours(f.hoursToFull)}
                </p>
              </li>
            ))}
          </ul>
        </ChartCard>

        {/* 3. Arrivals over time: two charts, one per measure (no dual axis) */}
        <ChartCard
          className="lg:col-span-2"
          title="Arrivals over time"
          subtitle="New evacuees per time block, and the running total registered."
          table={
            <DataTable
              columns={[
                { key: "label", label: "Time block" },
                { key: "arrivals", label: "Arrivals", num: true },
                { key: "cumulative", label: "Running total", num: true },
              ]}
              rows={arrivals}
            />
          }
        >
          <div className="mb-3 flex gap-2" role="group" aria-label="Time block size">
            {[1, 3, 6, 12].map((h) => (
              <button
                key={h}
                onClick={() => setBucketHours(h)}
                aria-pressed={bucketHours === h}
                className={`rounded-full border px-3 py-1 text-xs font-bold ${bucketHours === h ? "border-brand bg-brand text-brand-ink" : "border-line text-muted hover:text-ink"}`}
              >
                {h}h
              </button>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold text-muted">Arrivals per {bucketHours}-hour block</p>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={arrivals} margin={{ left: -16, right: 8 }} barCategoryGap={2}>
                    <CartesianGrid {...grid} />
                    <XAxis dataKey="label" {...axis} minTickGap={24} />
                    <YAxis allowDecimals={false} {...axis} />
                    <Tooltip cursor={{ fill: "var(--tint)" }} content={<ChartTooltip />} />
                    <Bar dataKey="arrivals" name="Arrivals" fill="var(--series-1)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-muted">Running total registered</p>
              <div className="h-56">
                <ResponsiveContainer>
                  <AreaChart data={arrivals} margin={{ left: -8, right: 8 }}>
                    <CartesianGrid {...grid} />
                    <XAxis dataKey="label" {...axis} minTickGap={24} />
                    <YAxis allowDecimals={false} {...axis} />
                    <Tooltip cursor={{ stroke: "var(--muted)", strokeDasharray: "3 3" }} content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="cumulative" name="Registered" stroke="var(--series-1)" strokeWidth={2} fill="var(--series-1)" fillOpacity={0.15} activeDot={{ r: 5, stroke: "var(--surface)", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </ChartCard>

        {/* 4. Age and sex */}
        <ChartCard
          title="Sheltered evacuees by age and sex"
          subtitle="Helps plan relief goods, infant supplies and senior care."
          table={
            <DataTable
              columns={[
                { key: "band", label: "Age" },
                { key: "male", label: "Male", num: true },
                { key: "female", label: "Female", num: true },
              ]}
              rows={ageSex}
            />
          }
        >
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={ageSex} margin={{ left: -16, right: 8 }} barGap={2}>
                <CartesianGrid {...grid} />
                <XAxis dataKey="band" {...axis} />
                <YAxis allowDecimals={false} {...axis} />
                <Tooltip cursor={{ fill: "var(--tint)" }} content={<ChartTooltip />} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 12, color: "var(--muted)" }} />
                <Bar dataKey="male" name="Male" fill="var(--series-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="female" name="Female" fill="var(--series-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* 5. Vulnerable groups */}
        <ChartCard
          title="Vulnerable groups"
          subtitle="Priority for space, relief and health checks (DRAFT policy P-03)."
          table={<DataTable columns={[{ key: "group", label: "Group" }, { key: "count", label: "Sheltered", num: true }]} rows={vulnerable} />}
        >
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={vulnerable} layout="vertical" margin={{ left: 8, right: 32 }} barCategoryGap={8}>
                <CartesianGrid {...grid} horizontal={false} vertical />
                <XAxis type="number" allowDecimals={false} {...axis} />
                <YAxis type="category" dataKey="group" width={110} {...axis} />
                <Tooltip cursor={{ fill: "var(--tint)" }} content={<ChartTooltip />} />
                <Bar dataKey="count" name="Sheltered" fill="var(--series-1)" radius={[0, 4, 4, 0]} maxBarSize={22}>
                  <LabelList dataKey="count" position="right" fill="var(--muted)" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* 6. Food coverage */}
        <ChartCard
          className="lg:col-span-2"
          title="Food coverage"
          subtitle={`Days of family food packs left, at ${FOOD_PACKS_PER_FAMILY_PER_DAY} pack per sheltered family per day (planning assumption, set in src/config.js).`}
          table={
            <DataTable
              columns={[
                { key: "name", label: "Center" },
                { key: "families", label: "Families", num: true },
                { key: "packs", label: "Packs left", num: true },
                { key: "days", label: "Days left", num: true, render: (r) => (r.days === null ? "No families" : r.days.toFixed(1)) },
              ]}
              rows={food}
            />
          }
        >
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {food.map((f) => {
              const low = f.days !== null && f.days < 1;
              return (
                <li key={f.id} className={`rounded-xl border p-3 ${low ? "border-full bg-full/5" : "border-line bg-tint"}`}>
                  <p className="truncate text-sm font-semibold">{f.name}</p>
                  <p className={`text-2xl font-extrabold tabular-nums ${low ? "text-full" : ""}`}>
                    {f.days === null ? "-" : `${f.days.toFixed(1)} days`}
                  </p>
                  <p className="text-xs text-muted">
                    {fmt(f.packs)} packs · {fmt(f.families)} families
                    {low && <strong className="block text-full">Request resupply</strong>}
                  </p>
                </li>
              );
            })}
          </ul>
        </ChartCard>
      </div>
    </>
  );
}
