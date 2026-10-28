// Public status board data: refreshes every minute, and falls back to the last
// copy saved on the device when there is no connection (useful in a typhoon).
import { useCallback, useEffect, useReducer } from "react";
import { PUBLIC_REFRESH_MS } from "../config.js";
import { countSheltered, sortAnnouncements, summarize, withOccupancy } from "../lib/status.js";
import { api } from "../services/api.js";

const CACHE_KEY = "cecms:last-public-status";

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* storage unavailable */
  }
}

function shape(raw, fetchedAt) {
  const centers = withOccupancy(raw.centers, raw.occupancy);
  return {
    fetchedAt,
    centers,
    summary: summarize(centers),
    announcements: sortAnnouncements(raw.announcements),
    policies: raw.policies,
    vulnerable: raw.vulnerable,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "SUCCESS":
      return { status: "ready", offline: false, data: action.data };
    case "OFFLINE":
      return { status: "ready", offline: true, data: action.data };
    case "ERROR":
      return { ...state, status: "error" };
    default:
      return state;
  }
}

export function usePublicStatus() {
  const [state, dispatch] = useReducer(reducer, { status: "loading", offline: false, data: null });

  const load = useCallback(async () => {
    try {
      const raw = await api.getPublicStatus();
      const fetchedAt = new Date().toISOString();
      writeCache({ raw, fetchedAt });
      dispatch({ type: "SUCCESS", data: shape(raw, fetchedAt) });
    } catch {
      const cached = readCache();
      if (cached) dispatch({ type: "OFFLINE", data: shape(cached.raw, cached.fetchedAt) });
      else dispatch({ type: "ERROR" });
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (!document.hidden) load();
    }, PUBLIC_REFRESH_MS);
    const onVisible = () => {
      if (!document.hidden) load();
    };
    document.addEventListener("visibilitychange", onVisible);
    const unsubscribe = api.subscribe(load);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      unsubscribe();
    };
  }, [load]);

  return { ...state, reload: load };
}
