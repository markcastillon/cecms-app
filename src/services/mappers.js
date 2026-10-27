// Converts database rows (snake_case) to app objects (camelCase) and back.

export const toCenter = (r) => ({
  id: r.id,
  name: r.name,
  location: r.location ?? "",
  capacity: Number(r.capacity) || 0,
  statusOverride: r.status_override ?? "",
  contactPerson: r.contact_person ?? "",
  contactNumber: r.contact_number ?? "",
  updatedAt: r.updated_at,
});

export const fromCenterPatch = (p) => {
  const row = {};
  if ("name" in p) row.name = p.name;
  if ("location" in p) row.location = p.location;
  if ("capacity" in p) row.capacity = p.capacity;
  if ("statusOverride" in p) row.status_override = p.statusOverride;
  if ("contactPerson" in p) row.contact_person = p.contactPerson;
  if ("contactNumber" in p) row.contact_number = p.contactNumber;
  return row;
};

export const toFamily = (r) => ({
  id: r.id,
  headOfFamily: r.head_of_family,
  purok: r.purok ?? "",
  contactNumber: r.contact_number ?? "",
  centerId: r.center_id,
  houseDamage: r.house_damage ?? "None",
  status: r.status,
  registeredAt: r.registered_at,
});

export const toEvacuee = (r) => ({
  id: r.id,
  familyId: r.family_id,
  fullName: r.full_name,
  age: Number(r.age),
  sex: r.sex,
  relationship: r.relationship ?? "",
  vulnerableGroup: r.vulnerable_group ?? "",
  centerId: r.center_id,
  status: r.status,
  arrivedAt: r.arrived_at,
});

export const toAnnouncement = (r) => ({
  id: r.id,
  title: r.title,
  message: r.message ?? "",
  priority: r.priority,
  active: Boolean(r.active),
  postedAt: r.posted_at,
});

export const toSupply = (r) => ({
  id: r.id,
  centerId: r.center_id,
  item: r.item,
  unit: r.unit ?? "",
  quantityReceived: Number(r.quantity_received) || 0,
  quantityReleased: Number(r.quantity_released) || 0,
  updatedAt: r.updated_at,
});

export const toVolunteer = (r) => ({
  id: r.id,
  fullName: r.full_name,
  contactNumber: r.contact_number,
  email: r.email ?? "",
  availability: r.availability,
  skills: r.skills ?? "",
  preferredCenter: r.preferred_center ?? "",
  status: r.status,
  submittedAt: r.submitted_at,
});

export const toPolicy = (r) => ({
  id: r.id,
  type: r.type ?? "Policy",
  title: r.title,
  summary: r.summary ?? "",
  legalBasis: r.legal_basis ?? "",
  isDraft: /draft/i.test(r.status ?? ""),
});
