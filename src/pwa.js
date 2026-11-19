// Turns on the installable, works-offline website (PWA). Settings: vite.config.js.
// Skipped inside the Android/iOS app (its files are already on the phone) and
// while developing (npm run dev), where a cached copy would hide your changes.
import { Capacitor } from "@capacitor/core";

let applyUpdate = null;

export function startPwa() {
  if (!import.meta.env.PROD || Capacitor.isNativePlatform() || !("serviceWorker" in navigator)) return;
  import("virtual:pwa-register").then(({ registerSW }) => {
    applyUpdate = registerSW({
      // A new version was deployed. Don't reload by surprise (someone may be
      // typing a family's details); show the UpdateBanner instead.
      onNeedRefresh() {
        window.dispatchEvent(new Event("cecms:update-ready"));
      },
    });
  });
}

export function reloadWithUpdate() {
  if (applyUpdate) applyUpdate(true);
  else window.location.reload();
}
