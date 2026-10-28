// Live backend: Supabase (Auth + Postgres + Realtime).
// Access rules live in supabase/schema.sql (Row Level Security), not here.
import { createClient } from "@supabase/supabase-js";
import {
  fromCenterPatch,
  toAnnouncement,
  toCenter,
  toEvacuee,
  toFamily,
  toPolicy,
  toSupply,
  toVolunteer,
} from "./mappers.js";

export function createSupabaseApi(url, anonKey) {
  const supabase = createClient(url, anonKey);

  // Throws the Supabase error so callers can show its message.
  async function run(query) {
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data;
  }

  // Supabase returns at most 1000 rows per request, so large tables are read in pages.
  async function selectAll(table, order) {
    const pageSize = 1000;
    const rows = [];
    for (let from = 0; ; from += pageSize) {
      const page = await run(
        supabase.from(table).select("*").order(order, { ascending: true }).range(from, from + pageSize - 1)
      );
      rows.push(...page);
      if (page.length < pageSize) return rows;
    }
  }

  async function staffState(user) {
    if (!user) return null;
    const { data } = await supabase.from("staff").select("approved, full_name").eq("user_id", user.id).maybeSingle();
    return {
      id: user.id,
      email: user.email,
      fullName: data?.full_name || user.user_metadata?.full_name || "",
      approved: Boolean(data?.approved),
    };
  }

  return {

    // ----- Auth -----
    async getSession() {
      const { data } = await supabase.auth.getSession();
      return staffState(data.session?.user);
    },
    onAuthChange(callback) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        // Run outside the auth callback, as Supabase recommends.
        setTimeout(async () => callback(await staffState(session?.user), event), 0);
      });
      return () => data.subscription.unsubscribe();
    },
    async signIn(email, password) {
      await run(supabase.auth.signInWithPassword({ email, password }));
    },
    async signUp(fullName, email, password) {
      const data = await run(
        supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName }, emailRedirectTo: `${window.location.origin}/login` },
        })
      );
      return { needsConfirmation: !data.session };
    },
    async signOut() {
      await run(supabase.auth.signOut());
    },
    async requestPasswordReset(email) {
      await run(supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/update-password` }));
    },
    async updatePassword(password) {
      await run(supabase.auth.updateUser({ password }));
    },

    // ----- Public data -----
    async getPublicStatus() {
      const [centers, announcements, policies, status] = await Promise.all([
        run(supabase.from("centers").select("*").order("id")),
        run(supabase.from("announcements").select("*").eq("active", true)),
        run(supabase.from("policies").select("*").order("id")),
        run(supabase.rpc("get_public_status")),
      ]);
      return {
        centers: centers.map(toCenter),
        occupancy: status?.occupancy ?? {},
        vulnerable: status?.vulnerable ?? [],
        announcements: announcements.map(toAnnouncement),
        policies: policies.map(toPolicy),
      };
    },

    // ----- Staff data -----
    async getStaffData() {
      const [centers, families, evacuees, announcements, supplies, volunteers] = await Promise.all([
        selectAll("centers", "id"),
        selectAll("families", "registered_at"),
        selectAll("evacuees", "arrived_at"),
        selectAll("announcements", "posted_at"),
        selectAll("supplies", "id"),
        selectAll("volunteers", "submitted_at"),
      ]);
      return {
        centers: centers.map(toCenter),
        families: families.map(toFamily),
        evacuees: evacuees.map(toEvacuee),
        announcements: announcements.map(toAnnouncement),
        supplies: supplies.map(toSupply),
        volunteers: volunteers.map(toVolunteer),
      };
    },

    // ----- Changes -----
    async registerFamily(family, members) {
      const [row] = await run(
        supabase
          .from("families")
          .insert({
            head_of_family: family.headOfFamily,
            purok: family.purok,
            contact_number: family.contactNumber,
            center_id: family.centerId,
            house_damage: family.houseDamage,
          })
          .select()
      );
      try {
        await run(
          supabase.from("evacuees").insert(
            members.map((m) => ({
              family_id: row.id,
              full_name: m.fullName,
              age: m.age,
              sex: m.sex,
              relationship: m.relationship,
              vulnerable_group: m.vulnerableGroup,
              center_id: family.centerId,
            }))
          )
        );
      } catch (err) {
        // Don't leave a family with no members behind.
        await supabase.from("families").delete().eq("id", row.id);
        throw err;
      }
      return row.id;
    },
    async setFamilyStatus(familyId, status) {
      await run(supabase.from("families").update({ status }).eq("id", familyId));
      await run(supabase.from("evacuees").update({ status }).eq("family_id", familyId));
    },
    async updateCenter(id, patch) {
      await run(supabase.from("centers").update({ ...fromCenterPatch(patch), updated_at: new Date().toISOString() }).eq("id", id));
    },
    async addAnnouncement(a) {
      await run(supabase.from("announcements").insert({ title: a.title, message: a.message, priority: a.priority }));
    },
    async setAnnouncementActive(id, active) {
      await run(supabase.from("announcements").update({ active }).eq("id", id));
    },
    async addSupply(s) {
      await run(
        supabase.from("supplies").insert({
          center_id: s.centerId,
          item: s.item,
          unit: s.unit,
          quantity_received: s.quantityReceived,
        })
      );
    },
    async adjustSupply(supply, { received = 0, released = 0 }) {
      await run(
        supabase
          .from("supplies")
          .update({
            quantity_received: supply.quantityReceived + received,
            quantity_released: supply.quantityReleased + released,
            updated_at: new Date().toISOString(),
          })
          .eq("id", supply.id)
      );
    },
    async addVolunteer(v) {
      // No .select(): visitors may insert a sign-up but not read the table back.
      await run(
        supabase.from("volunteers").insert({
          full_name: v.fullName,
          contact_number: v.contactNumber,
          email: v.email,
          availability: v.availability,
          skills: v.skills,
          preferred_center: v.preferredCenter,
        })
      );
    },
    async setVolunteerStatus(id, status) {
      await run(supabase.from("volunteers").update({ status }).eq("id", id));
    },

    // Calls onChange whenever any watched table changes (Supabase Realtime).
    subscribe(onChange) {
      const channel = supabase.channel(`cecms-changes-${crypto.randomUUID()}`);
      for (const table of ["centers", "families", "evacuees", "announcements", "supplies", "volunteers"]) {
        channel.on("postgres_changes", { event: "*", schema: "public", table }, onChange);
      }
      channel.subscribe();
      return () => supabase.removeChannel(channel);
    },
  };
}
