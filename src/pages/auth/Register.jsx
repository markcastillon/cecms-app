import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import { Field } from "../../components/ui.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { AuthShell, FormMessage } from "./AuthShell.jsx";

export default function Register() {
  const { user, signUp, mode } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  if (user && !success) return <Navigate to="/app" replace />;

  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (values.fullName.trim().length < 2) return setError("Please enter your full name.");
    if (values.password.length < 8) return setError("Use at least 8 characters for your password.");
    if (values.password !== values.confirm) return setError("The two passwords don't match.");

    setBusy(true);
    try {
      const { needsConfirmation } = await signUp(values.fullName.trim(), values.email.trim(), values.password);
      if (needsConfirmation) {
        setSuccess("Check your email and click the confirmation link. An administrator will then approve your account.");
        setBusy(false);
      } else {
        navigate("/app", { replace: true });
      }
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Create a staff account"
      subtitle={
        mode === "demo"
          ? "Demo mode: accounts are stored in this browser only."
          : "New accounts can see evacuee records only after an administrator approves them."
      }
      footer={
        <>
          Already registered? <Link to="/login" className="font-semibold text-link hover:underline">Log in</Link>
        </>
      }
    >
      {success ? (
        <FormMessage success={success} />
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Full name" htmlFor="name">
            <input id="name" className="input" autoComplete="name" required value={values.fullName} onChange={set("fullName")} />
          </Field>
          <Field label="Email" htmlFor="email">
            <input id="email" className="input" type="email" autoComplete="email" required value={values.email} onChange={set("email")} />
          </Field>
          <Field label="Password" htmlFor="password">
            <input id="password" className="input" type="password" autoComplete="new-password" required minLength={8} value={values.password} onChange={set("password")} />
          </Field>
          <Field label="Confirm password" htmlFor="confirm">
            <input id="confirm" className="input" type="password" autoComplete="new-password" required value={values.confirm} onChange={set("confirm")} />
          </Field>
          <FormMessage error={error} />
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Creating account…" : "Register"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
