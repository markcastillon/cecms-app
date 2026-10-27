// Sample data for demo mode and for supabase/seed.sql (npm run seed).
// Centers, announcements, supplies and policies come from the CSC 106 system.
// Families and evacuees are generated with a fixed random seed so every run
// produces the same people. All names are fictional.
//
// Times are stored as "minutes ago" so the data always looks recent:
// demo mode converts them to dates on first load, and the SQL seed uses now() - interval.

export const SEED_CENTERS = [
  { id: "EC-01", name: "Pangabugan Elementary School", location: "Purok 3, Brgy. Pangabugan", capacity: 250, statusOverride: "", contactPerson: "Center Coordinator A", contactNumber: "" },
  { id: "EC-02", name: "Barangay Covered Court", location: "Purok 1, beside Barangay Hall", capacity: 180, statusOverride: "", contactPerson: "Center Coordinator B", contactNumber: "" },
  { id: "EC-03", name: "Barangay Multi-Purpose Hall", location: "Purok 1, Brgy. Pangabugan", capacity: 120, statusOverride: "", contactPerson: "Center Coordinator C", contactNumber: "" },
  { id: "EC-04", name: "Day Care Center", location: "Purok 5, Brgy. Pangabugan", capacity: 60, statusOverride: "", contactPerson: "Center Coordinator D", contactNumber: "" },
  { id: "EC-05", name: "Chapel Annex", location: "Purok 6, Brgy. Pangabugan", capacity: 80, statusOverride: "Closed", contactPerson: "Center Coordinator E", contactNumber: "" },
];

// Sheltered people per center (same occupancy as the CSC 106 sample data),
// and the window in which each center's families arrived (minutes ago).
const TARGETS = {
  "EC-01": { sheltered: 142, from: 2400, to: 20 },
  "EC-02": { sheltered: 161, from: 1800, to: 15 },
  "EC-03": { sheltered: 120, from: 2800, to: 600 },
  "EC-04": { sheltered: 18, from: 500, to: 30 },
};

export const SEED_ANNOUNCEMENTS = [
  { id: "a0000000-0000-4000-8000-000000000001", title: "Pre-emptive evacuation for low-lying puroks", message: "Families in flood-prone areas are advised to proceed to the nearest open evacuation center. Bring IDs, medicine, and water.", priority: "urgent", minutesAgo: 120, active: true },
  { id: "a0000000-0000-4000-8000-000000000002", title: "Covered Court is nearly full", message: "New arrivals are encouraged to go to Pangabugan Elementary School or the Day Care Center.", priority: "warning", minutesAgo: 40, active: true },
  { id: "a0000000-0000-4000-8000-000000000003", title: "Relief goods distribution at 12:00 NN", message: "Family heads, please line up at the center registration desk with your family number.", priority: "info", minutesAgo: 155, active: true },
];

export const SEED_SUPPLIES = [
  ["EC-01", "Family food packs", "packs", 100, 62],
  ["EC-01", "Bottled water", "bottles", 300, 214],
  ["EC-01", "Hygiene kits", "kits", 50, 31],
  ["EC-01", "Blankets", "pcs", 80, 57],
  ["EC-02", "Family food packs", "packs", 80, 58],
  ["EC-02", "Sleeping mats", "pcs", 60, 44],
  ["EC-03", "Family food packs", "packs", 90, 61],
  ["EC-03", "Bottled water", "bottles", 200, 171],
  ["EC-04", "Family food packs", "packs", 30, 6],
  ["EC-04", "Infant formula", "cans", 20, 4],
].map(([centerId, item, unit, quantityReceived, quantityReleased], i) => ({
  id: `S-${String(i + 1).padStart(3, "0")}`,
  centerId, item, unit, quantityReceived, quantityReleased, minutesAgo: 90,
}));

export const SEED_VOLUNTEERS = [
  { id: "b0000000-0000-4000-8000-000000000001", fullName: "Sample Volunteer One", contactNumber: "09170000101", email: "", availability: "Anytime during emergencies", skills: "First aid, encoding", preferredCenter: "Barangay Covered Court", status: "Pending review", minutesAgo: 300 },
  { id: "b0000000-0000-4000-8000-000000000002", fullName: "Sample Volunteer Two", contactNumber: "09170000102", email: "", availability: "Weekends", skills: "Cooking", preferredCenter: "", status: "Contacted", minutesAgo: 900 },
];

export const SEED_POLICIES = [
  { id: "P-01", type: "Ordinance", title: "DRAFT Barangay Ordinance No. ___, Series of 2026: Adopting the Community Evacuation Center Management System", summary: "Adopts the system as the official record of evacuees, evacuation centers, supplies, and announcements during disasters. Designates the BDRRM Committee as system administrator and requires all evacuation center staff to record evacuees through the system.", legalBasis: "RA 10121 (Philippine DRRM Act of 2010); RA 10173 (Data Privacy Act of 2012)", status: "Draft (sample)" },
  { id: "P-02", type: "Policy", title: "Registration of evacuees", summary: "Every family is registered upon arrival at an evacuation center, with the head of family as the main contact. Each member is listed with age, sex, relationship, and vulnerable group, if any.", legalBasis: "RA 10121", status: "Draft (sample)" },
  { id: "P-03", type: "Policy", title: "Priority for vulnerable groups", summary: "Senior citizens, persons with disability, pregnant and lactating women, infants, and children receive priority in space allocation, relief distribution, and health checks.", legalBasis: "RA 10821 (Children's Emergency Relief and Protection Act); RA 9994 (Expanded Senior Citizens Act of 2010); RA 7277 (Magna Carta for Disabled Persons)", status: "Draft (sample)" },
  { id: "P-04", type: "Rule", title: "Evacuation center house rules", summary: "Follow the instructions of center coordinators. Keep your assigned area clean. No alcohol, gambling, or weapons. Quiet hours from 9:00 PM to 5:00 AM. Report illness or injury to the health desk immediately.", legalBasis: "Barangay policy (to be confirmed)", status: "Draft (sample)" },
  { id: "P-05", type: "Policy", title: "Relief distribution", summary: "Relief goods are released per family to the head of family or an authorized adult member, and every release is recorded in the distribution list with the receiver's signature.", legalBasis: "RA 10121", status: "Draft (sample)" },
  { id: "P-06", type: "Policy", title: "Health records and data privacy", summary: "Health information of evacuees is sensitive personal information. Only health workers and the system administrator may view or update it, and it is used only to provide assistance. It is never shown on the public website.", legalBasis: "RA 10173 (Data Privacy Act of 2012)", status: "Draft (sample)" },
  { id: "P-07", type: "Policy", title: "Evacuation center capacity", summary: "A center is marked Nearly Full at 80% of capacity and Full at 100%. New arrivals at a full center are directed to the nearest open center.", legalBasis: "Barangay policy (to be confirmed)", status: "Draft (sample)" },
];

// ---------------------------------------------------------------------------
// Generated families and evacuees
// ---------------------------------------------------------------------------

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SURNAMES = ["Dela Cruz", "Santos", "Reyes", "Garcia", "Mendoza", "Villanueva", "Bautista", "Ramos", "Aquino", "Castillo", "Flores", "Gonzales", "Torres", "Navarro", "Morales", "Lim", "Tan", "Domingo", "Salazar", "Padilla", "Mercado", "Manalo", "Pascual", "Soriano", "Ocampo", "Rivera", "Cabrera", "Galang", "Abad", "Lagman"];
const MALE = ["Juan", "Pedro", "Jose", "Roberto", "Miguel", "Mark", "John", "Carlo", "Rafael", "Andres", "Paolo", "Joshua", "Liam", "Nathan", "Gabriel", "Ramon", "Ernesto", "Lito", "Dante", "Rey"];
const FEMALE = ["Maria", "Ana", "Rosa", "Carmen", "Elena", "Lorna", "Jessa", "Althea", "Grace", "Joy", "Kristine", "Angel", "Mae", "Liza", "Teresa", "Nora", "Bea", "Sofia", "Princess", "Marites"];

function uuidFrom(rand) {
  const hex = Array.from({ length: 32 }, () => Math.floor(rand() * 16).toString(16));
  hex[12] = "4";
  hex[16] = "89ab"[Math.floor(rand() * 4)];
  const s = hex.join("");
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

function generatePeople() {
  const rand = mulberry32(2026);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const between = (min, max) => min + Math.floor(rand() * (max - min + 1));

  const families = [];
  const evacuees = [];

  function addFamily(centerId, size, minutesAgo, status) {
    const surname = pick(SURNAMES);
    const familyId = uuidFrom(rand);
    const headMale = rand() < 0.6;
    const headAge = between(24, 68);
    // Placeholder numbers in the same 09170000xxx range as the CSC 106 sample data.
    const contact = `09170000${String(between(1, 999)).padStart(3, "0")}`;
    const members = [{ relationship: "Head", sex: headMale ? "M" : "F", age: headAge }];
    if (size > 1) members.push({ relationship: "Spouse", sex: headMale ? "F" : "M", age: Math.max(20, headAge + between(-6, 4)) });
    while (members.length < size) {
      const roll = rand();
      if (roll < 0.72) members.push({ relationship: "Child", sex: rand() < 0.5 ? "M" : "F", age: between(0, Math.max(0, Math.min(25, headAge - 20))) });
      else if (roll < 0.88) members.push({ relationship: "Parent", sex: rand() < 0.5 ? "M" : "F", age: between(Math.min(90, headAge + 18), Math.min(92, headAge + 32)) });
      else members.push({ relationship: "Relative", sex: rand() < 0.5 ? "M" : "F", age: between(8, 70) });
    }

    families.push({
      id: familyId,
      headOfFamily: "",
      purok: `Purok ${between(1, 6)}`,
      contactNumber: contact,
      centerId,
      houseDamage: pick(["None", "None", "Partially damaged", "Partially damaged", "Totally damaged"]),
      status,
      minutesAgo,
    });

    members.forEach((m, i) => {
      const first = pick(m.sex === "M" ? MALE : FEMALE);
      const fullName = `${first} ${surname}`;
      if (i === 0) families[families.length - 1].headOfFamily = fullName;
      let vulnerableGroup = "";
      const r = rand();
      if (m.age >= 60) vulnerableGroup = "Senior Citizen";
      else if (m.age < 1) vulnerableGroup = "Infant";
      else if (m.sex === "F" && m.age >= 18 && m.age <= 40 && r < 0.08) vulnerableGroup = "Pregnant";
      else if (m.sex === "F" && m.age >= 18 && m.age <= 40 && r < 0.14) vulnerableGroup = "Lactating";
      else if (r < 0.03) vulnerableGroup = "PWD";
      else if (m.age >= 35 && r < 0.08) vulnerableGroup = "Chronic Illness";
      evacuees.push({
        id: uuidFrom(rand),
        familyId,
        fullName,
        age: m.age,
        sex: m.sex,
        relationship: m.relationship,
        vulnerableGroup,
        centerId,
        status,
        minutesAgo,
      });
    });
  }

  for (const [centerId, t] of Object.entries(TARGETS)) {
    let remaining = t.sheltered;
    while (remaining > 0) {
      const size = Math.min(remaining, between(1, 7));
      // Skewed toward recent arrivals, the way an evacuation builds up.
      const minutesAgo = Math.round(t.to + (t.from - t.to) * rand() ** 1.6);
      addFamily(centerId, size, minutesAgo, "Sheltered");
      remaining -= size;
    }
  }
  // A few families that already went home, so history shows departures too.
  for (let i = 0; i < 6; i++) addFamily(pick(["EC-01", "EC-02", "EC-04"]), between(2, 5), between(1500, 2800), "Returned home");

  return { families, evacuees };
}

export const { families: SEED_FAMILIES, evacuees: SEED_EVACUEES } = generatePeople();
