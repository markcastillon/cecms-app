import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { Field } from "../../components/ui.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { DEMO_ACCOUNT } from "../../services/demoApi.js";
import { AuthShell, FormMessage } from "./AuthShell.jsx";

export default function Login() {
  const { user, signIn, mode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(mode === "demo" ? DEMO_ACCOUNT.email : "");
  const [password, setPassword] = useState(mode === "demo" ? DEMO_ACCOUNT.password : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={location.state?.from ?? "/app"} replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      navigate(location.state?.from ?? "/app", { replace: true });
    } catch (err) {
      setError(err.message === "Invalid login credentials" ? "Wrong email or password." : err.message);
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Staff login"
      subtitle="For barangay officials, center coordinators and volunteers."
      footer={
        <>
          No account yet? <Link to="/register" className="font-semibold text-link hover:underline">Register</Link>
        </>
      }
    >
      {mode === "demo" && (
        <p className="mb-4 rounded-xl bg-accent-soft px-3 py-2 text-xs text-ink">
          <strong>Demo mode:</strong> the demo account is filled in for you. Data is saved only in this browser.
        </p>
      )}
      <form className="space-y-4" onSubmit={onSubmit}>
        <Field label="Email" htmlFor="email">
          <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" htmlFor="password">
          <input id="password" className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div className="text-right text-xs">
          <Link to="/reset-password" className="font-semibold text-link hover:underline">Forgot password?</Link>
        </div>
        <FormMessage error={error} />
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? "Logging in…" : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}
