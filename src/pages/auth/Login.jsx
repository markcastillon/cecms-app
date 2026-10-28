import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { Field } from "../../components/ui.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { AuthShell, FormMessage } from "./AuthShell.jsx";

export default function Login() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
