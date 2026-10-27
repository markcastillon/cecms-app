// Registers a family and all its members at the center's desk in one step.
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Field, PageHeader } from "../../components/ui.jsx";
import { HOUSE_DAMAGE, RELATIONSHIPS, VULNERABLE_GROUPS } from "../../config.js";
import { useData } from "../../context/DataContext.jsx";
import { capacityForecast, recommendCenter } from "../../analytics/pipeline.js";
import { fmt } from "../../lib/status.js";

const newMember = (relationship = "Child") => ({ key: crypto.randomUUID(), fullName: "", age: "", sex: "", relationship, vulnerableGroup: "" });

// Suggests a vulnerable group from age, so staff only fill it in for other cases.
function suggestedGroup(age) {
  const n = Number(age);
  if (age === "" || !Number.isFinite(n)) return "";
  if (n >= 60) return "Senior Citizen";
  if (n < 1) return "Infant";
  return "";
}

export function validateFamily(family, members) {
  const errors = {};
  if (family.headOfFamily.trim().length < 2) errors.headOfFamily = "Enter the head of family's name.";
  if (!family.centerId) errors.centerId = "Choose a center.";
  if (family.contactNumber && !/^(09|\+639)\d{9}$/.test(family.contactNumber.replace(/[\s-]/g, ""))) {
    errors.contactNumber = "Use a PH mobile number, e.g. 09171234567.";
  }
  members.forEach((m, i) => {
    const age = Number(m.age);
    if (m.fullName.trim().length < 2) errors[`m${i}.fullName`] = "Name required";
    if (m.age === "" || !Number.isInteger(age) || age < 0 || age > 120) errors[`m${i}.age`] = "0 to 120";
    if (!m.sex) errors[`m${i}.sex`] = "Required";
  });
  return errors;
}

export default function RegisterFamily() {
  const { centers, evacuees, actions } = useData();
  const navigate = useNavigate();

  const open = centers.filter((c) => c.status !== "Closed" && c.status !== "Full");
  const recommended = useMemo(() => recommendCenter(capacityForecast(centers, evacuees)), [centers, evacuees]);

  const [family, setFamily] = useState({
    headOfFamily: "",
    purok: "",
    contactNumber: "",
    centerId: recommended?.id ?? "",
    houseDamage: "None",
  });
  const [members, setMembers] = useState([newMember("Head")]);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const selected = centers.find((c) => c.id === family.centerId);
  const overCapacity = selected && members.length > selected.available;

  const setF = (key) => (e) => {
    const value = e.target.value;
    setFamily((f) => ({ ...f, [key]: value }));
    // Keep the head's name in the member list in sync.
    if (key === "headOfFamily") setMembers((ms) => ms.map((m, i) => (i === 0 ? { ...m, fullName: value } : m)));
  };

  const setM = (index, key) => (e) => {
    const value = e.target.value;
    setMembers((ms) =>
      ms.map((m, i) => {
        if (i !== index) return m;
        const next = { ...m, [key]: value };
        if (key === "age" && (!m.vulnerableGroup || m.vulnerableGroup === suggestedGroup(m.age))) next.vulnerableGroup = suggestedGroup(value);
        return next;
      })
    );
  };

  async function onSubmit(e) {
    e.preventDefault();
    setFormError("");
    const found = validateFamily(family, members);
    setErrors(found);
    if (Object.keys(found).length) {
      setFormError("Please fix the highlighted fields.");
      return;
    }
    setBusy(true);
    try {
      await actions.registerFamily(
        { ...family, headOfFamily: family.headOfFamily.trim(), contactNumber: family.contactNumber.replace(/[\s-]/g, "") },
        members.map((m) => ({
          fullName: m.fullName.trim(),
          age: Number(m.age),
          sex: m.sex,
          relationship: m.relationship,
          vulnerableGroup: m.vulnerableGroup,
        }))
      );
      navigate("/app/evacuees", { replace: true });
    } catch (err) {
      setFormError(err.message);
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Register a family" subtitle="Record every member on arrival. Occupancy and status update automatically." />

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        <section className="card space-y-4">
          <h2 className="font-bold">Family information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Head of family" error={errors.headOfFamily} htmlFor="head">
              <input id="head" className="input" value={family.headOfFamily} onChange={setF("headOfFamily")} />
            </Field>
            <Field label="Purok" optional htmlFor="purok">
              <input id="purok" className="input" placeholder="e.g. Purok 3" value={family.purok} onChange={setF("purok")} />
            </Field>
            <Field label="Contact number" optional error={errors.contactNumber} htmlFor="contact">
              <input id="contact" className="input" type="tel" inputMode="tel" placeholder="09XXXXXXXXX" value={family.contactNumber} onChange={setF("contactNumber")} />
            </Field>
            <Field label="House damage" htmlFor="damage">
              <select id="damage" className="input" value={family.houseDamage} onChange={setF("houseDamage")}>
                {HOUSE_DAMAGE.map((d) => <option key={d}>{d}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Evacuation center" error={errors.centerId} htmlFor="center">
            <select id="center" className="input" value={family.centerId} onChange={setF("centerId")}>
              <option value="">Choose a center</option>
              {open.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({fmt(c.available)} spaces left){c.id === recommended?.id ? " · Recommended" : ""}
                </option>
              ))}
            </select>
          </Field>
          {overCapacity && (
            <p className="rounded-xl bg-nearly/10 px-3 py-2 text-sm font-semibold text-nearly" role="alert">
              This family has {members.length} members but {selected.name} has only {selected.available} spaces left.
            </p>
          )}
        </section>

        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Members ({members.length})</h2>
            <button type="button" className="btn-ghost px-3 py-1.5 text-xs" onClick={() => setMembers((ms) => [...ms, newMember()])}>
              <Plus size={14} aria-hidden="true" /> Add member
            </button>
          </div>
          {members.map((m, i) => (
            <fieldset key={m.key} className="grid gap-3 rounded-xl border border-line p-3 sm:grid-cols-[2fr_80px_90px_1fr_1.2fr_auto] sm:items-end">
              <legend className="sr-only">Member {i + 1}</legend>
              <Field label="Full name" error={errors[`m${i}.fullName`]} htmlFor={`n${i}`}>
                <input id={`n${i}`} className="input" value={m.fullName} onChange={setM(i, "fullName")} readOnly={i === 0} title={i === 0 ? "Same as head of family" : undefined} />
              </Field>
              <Field label="Age" error={errors[`m${i}.age`]} htmlFor={`a${i}`}>
                <input id={`a${i}`} className="input" type="number" inputMode="numeric" min={0} max={120} value={m.age} onChange={setM(i, "age")} />
              </Field>
              <Field label="Sex" error={errors[`m${i}.sex`]} htmlFor={`s${i}`}>
                <select id={`s${i}`} className="input" value={m.sex} onChange={setM(i, "sex")}>
                  <option value="">-</option>
                  <option value="M">M</option>
                  <option value="F">F</option>
                </select>
              </Field>
              <Field label="Relationship" htmlFor={`r${i}`}>
                <select id={`r${i}`} className="input" value={m.relationship} onChange={setM(i, "relationship")} disabled={i === 0}>
                  {RELATIONSHIPS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Vulnerable group" htmlFor={`v${i}`}>
                <select id={`v${i}`} className="input" value={m.vulnerableGroup} onChange={setM(i, "vulnerableGroup")}>
                  <option value="">None</option>
                  {VULNERABLE_GROUPS.map((g) => <option key={g}>{g}</option>)}
                </select>
              </Field>
              <button
                type="button"
                className="btn-ghost p-2.5"
                onClick={() => setMembers((ms) => ms.filter((_, j) => j !== i))}
                disabled={i === 0}
                aria-label={`Remove member ${i + 1}`}
              >
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </fieldset>
          ))}
        </section>

        {formError && <p className="rounded-xl bg-full/10 px-3 py-2 text-sm font-semibold text-full" role="alert">{formError}</p>}

        <div className="flex flex-wrap justify-end gap-3">
          <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
          <button className="btn-accent" disabled={busy}>{busy ? "Saving…" : `Register ${members.length} ${members.length === 1 ? "person" : "people"}`}</button>
        </div>
      </form>
    </>
  );
}
