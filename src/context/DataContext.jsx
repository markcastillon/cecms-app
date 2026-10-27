// Global state for the staff area (Context API + useReducer).
// Pages read from here instead of fetching on their own, so every screen shows
// the same numbers and updates together without reloading the page.
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { countSheltered, summarize, withOccupancy } from "../lib/status.js";
import { api } from "../services/api.js";

const DataContext = createContext(null);

const initialState = {
  status: "loading", // loading | ready | error
  error: "",
  loadedAt: null,
  centers: [],
  families: [],
  evacuees: [],
  announcements: [],
  supplies: [],
  volunteers: [],
};

function reducer(state, action) {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, status: state.loadedAt ? "ready" : "loading", error: "" };
    case "LOAD_SUCCESS":
      return { ...state, ...action.data, status: "ready", error: "", loadedAt: new Date().toISOString() };
    case "LOAD_ERROR":
      return { ...state, status: state.loadedAt ? "ready" : "error", error: action.error };
    default:
      return state;
  }
}

export function DataProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const timer = useRef(null);

  const refresh = useCallback(async () => {
    dispatch({ type: "LOAD_START" });
    try {
      dispatch({ type: "LOAD_SUCCESS", data: await api.getStaffData() });
    } catch (err) {
      dispatch({ type: "LOAD_ERROR", error: err.message });
    }
  }, []);

  useEffect(() => {
    refresh();
    // Several changes can arrive at once (e.g. a family and its members), so
    // wait briefly and reload once.
    const unsubscribe = api.subscribe(() => {
      clearTimeout(timer.current);
      timer.current = setTimeout(refresh, 300);
    });
    return () => {
      clearTimeout(timer.current);
      unsubscribe();
    };
  }, [refresh]);

  // Wraps a change so the data reloads afterwards, even without Realtime.
  const withRefresh = useCallback(
    (fn) =>
      async (...args) => {
        const result = await fn(...args);
        await refresh();
        return result;
      },
    [refresh]
  );

  const value = useMemo(() => {
    const centers = withOccupancy(state.centers, countSheltered(state.evacuees));
    return {
      ...state,
      centers,
      summary: summarize(centers),
      centerName: (id) => state.centers.find((c) => c.id === id)?.name ?? id,
      refresh,
      actions: {
        registerFamily: withRefresh(api.registerFamily),
        setFamilyStatus: withRefresh(api.setFamilyStatus),
        updateCenter: withRefresh(api.updateCenter),
        addAnnouncement: withRefresh(api.addAnnouncement),
        setAnnouncementActive: withRefresh(api.setAnnouncementActive),
        addSupply: withRefresh(api.addSupply),
        adjustSupply: withRefresh(api.adjustSupply),
        setVolunteerStatus: withRefresh(api.setVolunteerStatus),
        resetDemo: api.resetDemo ? withRefresh(async () => api.resetDemo()) : null,
      },
    };
  }, [state, refresh, withRefresh]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}
