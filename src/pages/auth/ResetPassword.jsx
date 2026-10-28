import { useState } from "react";
import { Link } from "react-router";
import { Field } from "../../components/ui.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { AuthShell, FormMessage } from "./AuthShell.jsx";

export default function ResetPassword() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      setSuccess("If that email has an account, a reset link is on its way. Check your inbox.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll email you a link to set a new password."
      footer={<Link to="/login" className="font-semibold text-link hover:underline">Back to login</Link>}
    >
      {success ? (
        <FormMessage success={success} />
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Email" htmlFor="email">
            <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <FormMessage error={error} />
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
