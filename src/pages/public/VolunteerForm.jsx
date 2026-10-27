// Volunteer sign-up. Same validation rules as the CSC 106 /api/volunteer endpoint;
// the database repeats these checks (supabase/schema.sql) so they can't be bypassed.
import { useState } from "react";
import { Field } from "../../components/ui.jsx";
import { AVAILABILITY } from "../../config.js";
import { api } from "../../services/api.js";

const EMPTY = { fullName: "", contactNumber: "", email: "", availability: "", preferredCenter: "", skills: "", website: "" };

export function validateVolunteer(v) {
  const errors = {};
  if (v.fullName.trim().length < 2) errors.fullName = "Please enter your full name.";
  if (!/^(09|\+639)\d{9}$/.test(v.contactNumber.replace(/[\s-]/g, ""))) errors.contactNumber = "Use a PH mobile number, e.g. 09171234567.";
  if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) errors.email = "That email address doesn't look right.";
  if (!AVAILABILITY.includes(v.availability)) errors.availability = "Please choose your availability.";
  return errors;
}

export default function VolunteerForm({ centers }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [state, setState] = useState({ sending: false, message: "", ok: false });

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    // Honeypot: real visitors never see or fill the "website" field.
    if (values.website) return;
    const found = validateVolunteer(values);
    setErrors(found);
    if (Object.keys(found).length) return;

    setState({ sending: true, message: "", ok: false });
    try {
      await api.addVolunteer({
        fullName: values.fullName.trim().slice(0, 80),
        contactNumber: values.contactNumber.replace(/[\s-]/g, ""),
        email: values.email.trim().slice(0, 120),
        availability: values.availability,
        skills: values.skills.trim().slice(0, 300),
        preferredCenter: values.preferredCenter,
      });
      setValues(EMPTY);
      setState({ sending: false, ok: true, message: "Thank you! A barangay coordinator will contact you soon." });
    } catch {
      setState({ sending: false, ok: false, message: "We couldn't save your sign-up right now. Please try again later." });
    }
  }

  return (
    <form className="card space-y-4" onSubmit={onSubmit} noValidate>
      <Field label="Full name" error={errors.fullName} htmlFor="v-name">
        <input id="v-name" className="input" autoComplete="name" maxLength={80} value={values.fullName} onChange={set("fullName")} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Mobile number" error={errors.contactNumber} htmlFor="v-phone">
          <input id="v-phone" className="input" type="tel" inputMode="tel" autoComplete="tel" placeholder="09XXXXXXXXX" maxLength={20} value={values.contactNumber} onChange={set("contactNumber")} />
        </Field>
        <Field label="Email" optional error={errors.email} htmlFor="v-email">
          <input id="v-email" className="input" type="email" autoComplete="email" maxLength={120} value={values.email} onChange={set("email")} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Availability" error={errors.availability} htmlFor="v-avail">
          <select id="v-avail" className="input" value={values.availability} onChange={set("availability")}>
            <option value="">Choose one</option>
            {AVAILABILITY.map((a) => <option key={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Preferred center" optional htmlFor="v-center">
          <select id="v-center" className="input" value={values.preferredCenter} onChange={set("preferredCenter")}>
            <option value="">Any center</option>
            {centers.filter((c) => c.status !== "Closed").map((c) => <option key={c.id}>{c.name}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Skills or experience" optional htmlFor="v-skills">
        <textarea id="v-skills" className="input" rows={3} maxLength={300} placeholder="e.g. first aid, cooking, encoding, driving" value={values.skills} onChange={set("skills")} />
      </Field>
      <div className="hidden" aria-hidden="true">
        <label htmlFor="v-website">Leave this empty</label>
        <input id="v-website" tabIndex={-1} autoComplete="off" value={values.website} onChange={set("website")} />
      </div>
      <button className="btn-accent w-full" type="submit" disabled={state.sending}>
        {state.sending ? "Sending…" : "Sign me up"}
      </button>
      {state.message && (
        <p role="status" className={`text-sm font-semibold ${state.ok ? "text-open" : "text-full"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
