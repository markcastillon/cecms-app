// App-wide settings. Change these values here instead of inside components.

export const BARANGAY = "Brgy. Pangabugan";
export const CITY = "Butuan City";

// A center is "Nearly Full" at 80% of capacity and "Full" at 100%
// (DRAFT policy P-07 from the CSC 106 system).
export const NEARLY_FULL_RATIO = 0.8;

export const STATUSES = ["Open", "Nearly Full", "Full", "Closed"];
export const PRIORITIES = ["urgent", "warning", "info"];
export const VULNERABLE_GROUPS = ["Senior Citizen", "PWD", "Pregnant", "Lactating", "Infant", "Chronic Illness"];
export const RELATIONSHIPS = ["Head", "Spouse", "Child", "Parent", "Sibling", "Grandchild", "Relative", "Other"];
export const HOUSE_DAMAGE = ["None", "Partially damaged", "Totally damaged"];
export const AVAILABILITY = ["Weekdays", "Weekends", "Anytime during emergencies", "On call only"];
export const VOLUNTEER_STATUSES = ["Pending review", "Contacted", "Assigned", "Not available"];

// Analytics: how far back to look when measuring each center's arrival rate.
export const ARRIVAL_RATE_WINDOW_HOURS = 6;
// Analytics: planning assumption for food coverage. Adjust to the barangay's actual ration.
export const FOOD_PACKS_PER_FAMILY_PER_DAY = 1;

// Public pages refresh this often (milliseconds).
export const PUBLIC_REFRESH_MS = 60_000;
