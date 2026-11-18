// Online/offline status from the Capacitor Network plugin. On the phone it uses
// the device's own network state; in a browser it falls back to navigator.onLine.
import { Network } from "@capacitor/network";
import { useEffect, useState } from "react";

export function useNetwork() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    // The listener is added asynchronously. If the screen closes before that
    // finishes, remove it as soon as it arrives instead of leaving it running.
    let closed = false;
    let handle;
    Network.getStatus()
      .then((s) => {
        if (!closed) setOnline(s.connected);
      })
      .catch(() => {});
    Network.addListener("networkStatusChange", (s) => setOnline(s.connected))
      .then((h) => {
        if (closed) h.remove();
        else handle = h;
      })
      .catch(() => {});
    return () => {
      closed = true;
      handle?.remove();
    };
  }, []);

  return online;
}
