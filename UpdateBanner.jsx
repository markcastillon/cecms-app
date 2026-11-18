// Small notice shown when a new version of the website is ready (see src/pwa.js).
import { useEffect, useState } from "react";
import { reloadWithUpdate } from "../pwa.js";

export function UpdateBanner() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const show = () => setReady(true);
    window.addEventListener("cecms:update-ready", show);
    return () => window.removeEventListener("cecms:update-ready", show);
  }, []);

  if (!ready) return null;
  return (
    <div
      role="status"
      className="card fixed inset-x-4 bottom-[calc(5.5rem_+_env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-md items-center justify-between gap-3 p-3 shadow-lg lg:bottom-6"
    >
      <p className="text-sm font-semibold">A new version of CECMS is ready.</p>
      <div className="flex shrink-0 gap-2">
        <button className="btn-ghost px-3 py-2" onClick={() => setReady(false)}>
          Later
        </button>
        <button className="btn-primary px-3 py-2" onClick={reloadWithUpdate}>
          Reload
        </button>
      </div>
    </div>
  );
}
