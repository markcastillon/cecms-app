import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

const AuthContext = createContext(null);

// A password-reset email link opens the app with "type=recovery" in the address.
// Read it now, before Supabase signs the user in and clears it from the address.
const openedFromResetLink = /type=recovery/.test(window.location.hash);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Set when the user arrives from a password-reset email.
  const [recovering, setRecovering] = useState(openedFromResetLink);

  useEffect(() => {
    let active = true;
    api
      .getSession()
      .then((u) => {
        if (active) setUser(u);
      })
      .catch(() => {
        // Treat as logged out rather than showing "Checking your session" forever.
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    const unsubscribe = api.onAuthChange((u, event) => {
      setUser(u);
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      recovering,
      signIn: api.signIn,
      signUp: api.signUp,
      signOut: api.signOut,
      requestPasswordReset: api.requestPasswordReset,
      updatePassword: async (password) => {
        await api.updatePassword(password);
        setRecovering(false);
      },
    }),
    [user, loading, recovering]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
