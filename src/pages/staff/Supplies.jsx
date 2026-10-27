// Relief supplies per center: record deliveries (received) and hand-outs (released).
import { useMemo, useState } from "react";
import { Field, PageHeader } from "../../components/ui.jsx";
import { useData } from "../../context/DataContext.jsx";
import { fmt, formatDateTime } from "../../lib/status.js";

function AdjustForm({ supply, onAdjust }) {
  const [qty, setQty] = useState("");
  const [busy, setBusy] = useState(false);
  const remaining = supply.quantityReceived - supply.quantityReleased;

  async function apply(kind) {
    const n = Number(qty);
    if (!Number.isInteger(n) || n <= 0) return window.alert("Enter a whole number above 0.");
    if (kind === "released" && n > remaining) return window.alert(`Only ${remaining} ${supply.unit} left.`);
    setBusy(true);
    try {
      await onAdjust(supply, { [kind]: n });
      setQty("");
    } catch (err) {
      window.alert(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        className="input w-20 px-2 py-1.5"
        type="number"
        min={1}
        inputMode="numeric"
        placeholder="Qty"
        aria-label={`Quantity of ${supply.item}`}
        value={qty}
        onChange={(e) => setQty(e.target.value)}
      />
      <button className="btn-ghost px-2.5 py-1.5 text-xs" disabled={busy} onClick={() => apply("received")}>+ In</button>
      <button className="btn-ghost px-2.5 py-1.5 text-xs" disabled={busy} onClick={() => apply("released")}>- Out</button>
    </div>
  );
}

export default function Supplies() {
  const { supplies, centers, centerName, actions } = useData();
  const [center, setCenter] = useState("all");
  const [values, setValues] = useState({ centerId: "", item: "", unit: "", quantityReceived: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const list = useMemo(
    () => supplies.filter((s) => center === "all" || s.centerId === center).sort((a, b) => a.centerId.localeCompare(b.centerId) || a.item.localeCompare(b.item)),
    [supplies, center]
  );

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  async function onAdd(e) {
    e.preventDefault();
    const qty = Number(values.quantityReceived);
    if (!values.centerId || values.item.trim().length < 2 || !Number.isInteger(qty) || qty < 0) {
      return setError("Choose a center, enter the item name and a whole-number quantity.");
    }
    setBusy(true);
    setError("");
    try {
      await actions.addSupply({ centerId: values.centerId, item: values.item.trim(), unit: values.unit.trim(), quantityReceived: qty });
      setValues({ centerId: values.centerId, item: "", unit: "", quantityReceived: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Supplies" subtitle="Record what arrives (+ In) and what is handed out (- Out). Remaining is computed for you." />

      <div className="mb-4 flex justify-end">
        <select className="input w-auto" value={center} onChange={(e) => setCenter(e.target.value)} aria-label="Filter by center">
          <option value="all">All centers</option>
          {centers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-tint text-xs text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Center</th>
              <th className="px-4 py-2.5 font-semibold">Item</th>
              <th className="px-4 py-2.5 text-right font-semibold">Received</th>
              <th className="px-4 py-2.5 text-right font-semibold">Released</th>
              <th className="px-4 py-2.5 text-right font-semibold">Remaining</th>
              <th className="px-4 py-2.5 font-semibold">Update</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => {
              const remaining = s.quantityReceived - s.quantityReleased;
              const low = s.quantityReceived > 0 && remaining / s.quantityReceived < 0.2;
              return (
                <tr key={s.id} className="border-t border-line">
                  <td className="px-4 py-2.5">{centerName(s.centerId)}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-medium">{s.item}</span>
                    <span className="block text-xs text-muted">{s.updatedAt && `Updated ${formatDateTime(s.updatedAt)}`}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmt(s.quantityReceived)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmt(s.quantityReleased)}</td>
                  <td className={`px-4 py-2.5 text-right font-bold tabular-nums ${low ? "text-full" : ""}`}>
                    {fmt(remaining)} <span className="font-normal text-muted">{s.unit}</span>
                  </td>
                  <td className="px-4 py-2.5"><AdjustForm supply={s} onAdjust={actions.adjustSupply} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <form className="card mt-6 grid gap-3 sm:grid-cols-[1.3fr_1.3fr_0.8fr_0.8fr_auto] sm:items-end" onSubmit={onAdd}>
        <h2 className="font-bold sm:col-span-5">Add a new item</h2>
        <Field label="Center" htmlFor="s-center">
          <select id="s-center" className="input" value={values.centerId} onChange={set("centerId")}>
            <option value="">Choose</option>
            {centers.filter((c) => c.status !== "Closed").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Item" htmlFor="s-item">
          <input id="s-item" className="input" placeholder="e.g. Family food packs" value={values.item} onChange={set("item")} />
        </Field>
        <Field label="Unit" htmlFor="s-unit">
          <input id="s-unit" className="input" placeholder="packs" value={values.unit} onChange={set("unit")} />
        </Field>
        <Field label="Received" htmlFor="s-qty">
          <input id="s-qty" className="input" type="number" min={0} value={values.quantityReceived} onChange={set("quantityReceived")} />
        </Field>
        <button className="btn-primary" disabled={busy}>Add</button>
        {error && <p className="text-sm font-semibold text-full sm:col-span-5">{error}</p>}
      </form>
    </>
  );
}
