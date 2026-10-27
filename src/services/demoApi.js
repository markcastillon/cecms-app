// Demo backend: same functions as supabaseApi.js, but the data lives in this
// browser's localStorage. Used when no Supabase keys are set, so the app can be
// run and graded without any account. Nothing here leaves the device.
import {
  SEED_ANNOUNCEMENTS,
  SEED_CENTERS,
  SEED_EVACUEES,
  SEED_FAMILIES,
  SEED_POLICIES,
  SEED_SUPPLIES,
  SEED_VOLUNTEERS,
} from "../data/seed.js";

const DB_KEY = "cecms-demo-db-v1";
const SESSION_KEY = "cecms-demo-session";
export const DEMO_ACCOUNT = { email: "coordinator@demo.ph", password: "demo1234", fullName: "Demo Coordinator" };

const latency = () => new Promise((r) => setTimeout(r, 150));
const at = (minutesAgo) => new Date(Date.now() - minutesAgo * 60_000).toISOString();
const strip = ({ minutesAgo, ...rest }) => rest; // eslint-disable-line no-unused-vars

async function hash(text) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function freshDb() {
  return {
    centers: SEED_CENTERS.map((c) => ({ ...c, updatedAt: at(60) })),
    families: SEED_FAMILIES.map((f) => ({ ...strip(f), registeredAt: at(f.minutesAgo) })),
    evacuees: SEED_EVACUEES.map((e) => ({ ...strip(e), arrivedAt: at(e.minutesAgo) })),
    announcements: SEED_ANNOUNCEMENTS.map((a) => ({ ...strip(a), postedAt: at(a.minutesAgo) })),
    supplies: SEED_SUPPLIES.map((s) => ({ ...strip(s), updatedAt: at(s.minutesAgo) })),
    volunteers: SEED_VOLUNTEERS.map((v) => ({ ...strip(v), submittedAt: at(v.minutesAgo) })),
    policies: SEED_POLICIES.map((p) => ({ ...p, isDraft: /draft/i.test(p.status) })),
    users: [],
  };
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(DB_KEY));
    if (saved?.centers) return saved;
  } catch {
    /* storage unavailable or corrupted: start fresh */
  }
  return freshDb();
}

export function createDemoApi() {
  let db = load();
  const dataListeners = new Set();
  const authListeners = new Set();

  function save() {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch {
      /* storage full or blocked: keep working in memory */
    }
    dataListeners.forEach((fn) => fn());
  }

  // Other tabs of the same browser see changes too.
  window.addEventListener("storage", (e) => {
    if (e.key === DB_KEY) {
      db = load();
      dataListeners.forEach((fn) => fn());
    }
  });

  async function ensureDemoUser() {
    if (!db.users.some((u) => u.email === DEMO_ACCOUNT.email)) {
      db.users.push({
        id: "demo-user",
        email: DEMO_ACCOUNT.email,
        fullName: DEMO_ACCOUNT.fullName,
        passwordHash: await hash(DEMO_ACCOUNT.password),
      });
      save();
    }
  }

  function currentUser() {
    const id = localStorage.getItem(SESSION_KEY);
    const user = db.users.find((u) => u.id === id);
    // Demo accounts are approved immediately; Supabase accounts need approval.
    return user ? { id: user.id, email: user.email, fullName: user.fullName, approved: true } : null;
  }

  function setSession(id) {
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
    const user = currentUser();
    authListeners.forEach((fn) => fn(user));
  }

  const clone = (x) => structuredClone(x);

  return {
    mode: "demo",

    // ----- Auth -----
    async getSession() {
      await ensureDemoUser();
      return currentUser();
    },
    onAuthChange(callback) {
      authListeners.add(callback);
      return () => authListeners.delete(callback);
    },
    async signIn(email, password) {
      await latency();
      await ensureDemoUser();
      const user = db.users.find((u) => u.email === email.trim().toLowerCase());
      if (!user || user.passwordHash !== (await hash(password))) throw new Error("Invalid login credentials");
      setSession(user.id);
    },
    async signUp(fullName, email, password) {
      await latency();
      const normalized = email.trim().toLowerCase();
      if (db.users.some((u) => u.email === normalized)) throw new Error("User already registered");
      const user = { id: crypto.randomUUID(), email: normalized, fullName, passwordHash: await hash(password) };
      db.users.push(user);
      save();
      setSession(user.id);
      return { needsConfirmation: false };
    },
    async signOut() {
      setSession(null);
    },
    async requestPasswordReset() {
      await latency();
      // Demo mode cannot send email. Supabase mode sends a real reset link.
    },
    async updatePassword(password) {
      const user = db.users.find((u) => u.id === localStorage.getItem(SESSION_KEY));
      if (!user) throw new Error("Please log in first.");
      user.passwordHash = await hash(password);
      save();
    },

    // ----- Public data -----
    async getPublicStatus() {
      await latency();
      const occupancy = {};
      const vulnerable = {};
      for (const e of db.evacuees) {
        if (e.status !== "Sheltered") continue;
        occupancy[e.centerId] = (occupancy[e.centerId] ?? 0) + 1;
        if (e.vulnerableGroup) vulnerable[e.vulnerableGroup] = (vulnerable[e.vulnerableGroup] ?? 0) + 1;
      }
      return {
        centers: clone(db.centers),
        occupancy,
        vulnerable: Object.entries(vulnerable).map(([group, count]) => ({ group, count })),
        announcements: clone(db.announcements.filter((a) => a.active)),
        policies: clone(db.policies),
      };
    },

    // ----- Staff data -----
    async getStaffData() {
      await latency();
      const { centers, families, evacuees, announcements, supplies, volunteers } = db;
      return clone({ centers, families, evacuees, announcements, supplies, volunteers });
    },

    // ----- Changes -----
    async registerFamily(family, members) {
      await latency();
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      db.families.push({ ...family, id, status: "Sheltered", registeredAt: now });
      for (const m of members) {
        db.evacuees.push({ ...m, id: crypto.randomUUID(), familyId: id, centerId: family.centerId, status: "Sheltered", arrivedAt: now });
      }
      save();
      return id;
    },
    async setFamilyStatus(familyId, status) {
      await latency();
      db.families.forEach((f) => { if (f.id === familyId) f.status = status; });
      db.evacuees.forEach((e) => { if (e.familyId === familyId) e.status = status; });
      save();
    },
    async updateCenter(id, patch) {
      await latency();
      db.centers = db.centers.map((c) => (c.id === id ? { ...c, ...patch, updatedAt: new Date().toISOString() } : c));
      save();
    },
    async addAnnouncement(a) {
      await latency();
      db.announcements.push({ ...a, id: crypto.randomUUID(), active: true, postedAt: new Date().toISOString() });
      save();
    },
    async setAnnouncementActive(id, active) {
      await latency();
      db.announcements.forEach((a) => { if (a.id === id) a.active = active; });
      save();
    },
    async addSupply(s) {
      await latency();
      db.supplies.push({ ...s, id: `S-${crypto.randomUUID().slice(0, 8)}`, quantityReleased: 0, updatedAt: new Date().toISOString() });
      save();
    },
    async adjustSupply(supply, { received = 0, released = 0 }) {
      await latency();
      db.supplies.forEach((s) => {
        if (s.id !== supply.id) return;
        s.quantityReceived += received;
        s.quantityReleased += released;
        s.updatedAt = new Date().toISOString();
      });
      save();
    },
    async addVolunteer(v) {
      await latency();
      db.volunteers.push({ ...v, id: crypto.randomUUID(), status: "Pending review", submittedAt: new Date().toISOString() });
      save();
    },
    async setVolunteerStatus(id, status) {
      await latency();
      db.volunteers.forEach((v) => { if (v.id === id) v.status = status; });
      save();
    },

    subscribe(onChange) {
      dataListeners.add(onChange);
      return () => dataListeners.delete(onChange);
    },

    // Demo only: puts the sample data back.
    resetDemo() {
      const users = db.users;
      db = { ...freshDb(), users };
      save();
    },
  };
}
