import { Clock } from "lucide-react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext.jsx";
import { DataProvider } from "../context/DataContext.jsx";
import { Spinner } from "./ui.jsx";

// Only approved staff get past this point. Evacuee records are personal data
// (RA 10173), so a new account waits until an administrator approves it.
export function ProtectedRoute({ children }) {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (!user.approved) {
    return (
      <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center px-4 text-center">
        <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
          <Clock size={28} aria-hidden="true" />
        </span>
        <h1 className="text-xl font-extrabold">Waiting for approval</h1>
        <p className="mt-2 text-sm text-muted">
          Your account ({user.email}) was created. A barangay administrator needs to approve it before you can see
          evacuee records. Please check back later.
        </p>
        <button className="btn-ghost mt-6" onClick={signOut}>
          Log out
        </button>
      </main>
    );
  }

  return <DataProvider>{children}</DataProvider>;
}
