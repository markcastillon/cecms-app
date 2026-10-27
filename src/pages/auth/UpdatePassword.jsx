// Opened from the password-reset email. Supabase signs the user in from the
// link, then they choose a new password here.
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Field } from "../../components/ui.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { AuthShell, FormMessage } from "./AuthShell.jsx";

export default function UpdatePassword() {
  const { user, loading, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Use at least 8 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    try {
      await updatePassword(password);
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (!loading && !user) {
    return (
      <AuthShell title="Link expired" subtitle="This reset link is no longer valid.">
        <Link to="/reset-password" className="btn-primary w-full">Request a new link</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password">
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="New password" htmlFor="password">
          <input id="password" className="input" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm">
          <input id="confirm" className="input" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        <FormMessage error={error} />
        <button className="btn-primary w-full" disabled={busy || loading}>
          {busy ? "Saving…" : "Save password"}
        </button>
      </form>
    </AuthShell>
  );
}
