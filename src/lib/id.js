// A random id for list keys and channel names.
// crypto.randomUUID() only exists on secure pages (https, or localhost), so a
// phone opening the dev server over Wi-Fi (http://192.168...) needs the fallback.
export function randomId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
