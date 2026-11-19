// "Install the app" button for phones, tablets and computers (the PWA set up in
// vite.config.js). Chrome and Edge can show their own install box; iPhone and
// iPad can't, so those get short instructions instead. Hidden once installed
// and inside the Android/iOS app.
import { Capacitor } from "@capacitor/core";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";

// Chrome/Edge send this event once the site can be installed, sometimes before
// the page has finished loading, so it's caught here as soon as the file loads.
let installPrompt = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  window.dispatchEvent(new Event("cecms:can-install"));
});

const ua = navigator.userAgent;
const isInstalled = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIos = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isAndroid = /Android/i.test(ua);
// Messenger, Facebook and Instagram open links in their own browser, which can't install apps.
const isInAppBrowser = /FBAN|FBAV|FB_IAB|Messenger|Instagram|Line\//i.test(ua);

function helpText() {
  if (isInAppBrowser) return "This page is open inside another app. Tap ⋯ and choose Open in browser (Chrome or Safari), then tap Install the app again.";
  if (isIos) return "In Safari, tap the Share button (the square with an arrow), then choose Add to Home Screen.";
  if (isAndroid) return "In Chrome, tap the ⋮ menu (top right), then choose Install app or Add to Home screen.";
  return "In Chrome or Edge, click the install icon at the right end of the address bar, or open the browser menu and choose Install CECMS.";
}

export function InstallButton({ className = "" }) {
  const [canPrompt, setCanPrompt] = useState(Boolean(installPrompt));
  const [installed, setInstalled] = useState(isInstalled);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const onCanInstall = () => setCanPrompt(true);
    const onInstalled = () => setInstalled(true);
    window.addEventListener("cecms:can-install", onCanInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("cecms:can-install", onCanInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || Capacitor.isNativePlatform()) return null;

  async function install() {
    if (!canPrompt || !installPrompt) {
      setShowHelp((shown) => !shown);
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    installPrompt = null;
    setCanPrompt(false);
    if (outcome === "accepted") setInstalled(true);
  }

  return (
    <div className={className}>
      <button type="button" className="btn-ghost" onClick={install} aria-expanded={canPrompt ? undefined : showHelp}>
        <Download size={16} aria-hidden="true" /> Install the app
      </button>
      {showHelp && (
        <p role="note" className="mt-2 max-w-sm rounded-xl bg-tint px-3 py-2 text-sm text-ink">
          {helpText()}
        </p>
      )}
    </div>
  );
}
