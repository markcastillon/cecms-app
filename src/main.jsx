import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { missingConfig } from "./services/api.js";
import "./index.css";

function SetupNotice() {
  return (
    <main className="grid min-h-svh place-items-center p-6">
      <div className="card max-w-md p-6">
        <h1 className="text-xl font-extrabold">Supabase is not set up</h1>
        <p className="mt-2 text-sm text-muted">
          Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to a <code>.env</code> file
          (or to Vercel's Environment Variables), then restart or redeploy. See the README.
        </p>
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>{missingConfig ? <SetupNotice /> : <App />}</StrictMode>
);
