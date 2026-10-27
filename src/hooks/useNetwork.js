// Online/offline status from the Capacitor Network plugin. On the phone it uses
// the device's own network state; in a browser it falls back to navigator.onLine.
import { Network } from "@capacitor/network";
import { useEffect, useState } from "react";

export function useNetwork() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let handle;
    Network.getStatus().then((s) => setOnline(s.connected)).catch(() => {});
    Network.addListener("networkStatusChange", (s) => setOnline(s.connected)).then((h) => {
      handle = h;
    });
    return () => handle?.remove();
  }, []);

  return online;
}
