// Travel Crew collaboration (issue #38): editors, thumbs-up votes and suggested stops.
// Signed-in travelers only (guests stay view-only). Uses the service role key, so every
// route works out the caller's place on the trip first:
//   owner  - everything, and decides who is an editor
//   editor - changes the itinerary and answers suggestions; still gets the shared view of
//            the trip, so never the organizer's reservations or confirmation codes
//   member - votes and suggests stops
//
// Routes (signed in)
//   POST   /api/trips/:tripId/crew/:memberId/role            owner: { role: "editor" | "member" }
//   POST   /api/trips/:tripId/itinerary/edits                owner/editor: { edit } (shared/itineraryEdits.js applyEdit)
//   GET    /api/trips/:tripId/collab                         everyone: { role, votes, suggestions }
//   PUT    /api/trips/:tripId/votes                          everyone: { target, key, up }
//   POST   /api/trips/:tripId/suggestions                    everyone: { dayKey, place, note }
//   POST   /api/trips/:tripId/suggestions/:id/accept|decline owner/editor
//   DELETE /api/trips/:tripId/suggestions/:id                whoever suggested it (withdraw)
import { createClient } from "@supabase/supabase-js";
import { displayName } from "./crew.js";
import { updateTrip } from "./tripData.js";
import { logger } from "./logger.js";
import { applyEdit, cleanPlace, EditError } from "../shared/itineraryEdits.js";
import { canEditRole } from "../shared/collab.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const MAX_PENDING_SUGGESTIONS_PER_PERSON = 20;
const MAX_NOTE = 300;
const TARGETS = ["stop", "food"];

export function registerCollaborationRoutes(app, { supabaseUrl, serviceKey, notifier }) {
  const admin = serviceKey
    ? createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    : null;

  // The caller and their role on the trip, or sends an error and returns null
  async function access(req, res) {
    if (!admin) {
      res.status(500).json({ error: "Travel Crew isn't set up on the server (SUPABASE_SERVICE_ROLE_KEY missing)" });
      return null;
    }
    const token = req.headers.authorization?.replace(/^Bearer /, "");
    const { data } = token ? await admin.auth.getUser(token) : { data: null };
    const user = data?.user;
    if (!user) return res.status(401).json({ error: "Please sign in" }), null;

    const { data: trip } = await admin
      .from("trips")
      .select("id, user_id, destination, cities, itinerary_data")
      .eq("id", req.params.tripId)
      .maybeSingle();
    if (!trip) return res.status(404).json({ error: "Trip not found" }), null;
    if (trip.user_id === user.id) return { user, trip, role: "owner" };

    const { data: membership } = await admin
      .from("trip_members")
      .select("id, role, status")
      .eq("trip_id", trip.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (membership?.status !== "approved") return res.status(404).json({ error: "Trip not found" }), null;
    return { user, trip, role: membership.role === "editor" ? "editor" : "member", memberId: membership.id };
  }

  const needsEditor = (found, res) => {
    if (canEditRole(found.role)) return true;
    res.status(403).json({ error: "Only the organizer and the trip's editors can change the itinerary" });
    return false;
  };

  // Who can vote: the organizer and approved members with accounts, by user id -> name
  async function voters(trip) {
    const { data: rows = [] } = await admin
      .from("trip_members")
      .select("user_id, name, status")
      .eq("trip_id", trip.id)
      .eq("status", "approved");
    const names = new Map(rows.filter((r) => r.user_id).map((r) => [r.user_id, r.name]));
    const owner = (await admin.auth.admin.getUserById(trip.user_id)).data?.user;
    names.set(trip.user_id, displayName(owner));
    return names;
  }

  const place = (trip) => ({ destination: trip.destination, cities: trip.cities || [] });

  // ---- Roles ----
  app.post("/api/trips/:tripId/crew/:memberId/role", async (req, res) => {
    const found = await access(req, res);
    if (!found) return;
    if (found.role !== "owner") return res.status(403).json({ error: "Only the trip's organizer can choose editors" });
    const role = req.body?.role;
    if (!["editor", "member"].includes(role)) return res.status(400).json({ error: "Choose editor or member" });
    if (!UUID_RE.test(req.params.memberId)) return res.status(404).json({ error: "That person isn't on this trip" });

    const { data: member } = await admin
      .from("trip_members")
      .select("id, user_id, role, status")
      .eq("id", req.params.memberId)
      .eq("trip_id", found.trip.id)
      .maybeSingle();
    if (!member || member.status !== "approved") return res.status(404).json({ error: "That person isn't on this trip" });
    // Editing needs an account: a guest's link is view-only
    if (!member.user_id) return res.status(400).json({ error: "Guests can't edit. Ask them to join with an account first." });

    const { error } = await admin.from("trip_members").update({ role }).eq("id", member.id);
    if (error) {
      logger.error({ err: error }, "Couldn't change crew role");
      return res.status(500).json({ error: "Couldn't change their role. Please try again." });
    }
    if (role === "editor" && member.role !== "editor") {
      await notifier?.notify(member.user_id, "made_editor", { tripId: found.trip.id, data: place(found.trip) });
    }
    res.json({ id: member.id, role });
  });

  // ---- Editing the itinerary (editors; the organizer can too) ----
  app.post("/api/trips/:tripId/itinerary/edits", async (req, res) => {
    const found = await access(req, res);
    if (!found || !needsEditor(found, res)) return;
    if (!found.trip.itinerary_data?.days?.length) return res.status(409).json({ error: "This trip has no itinerary yet" });
    try {
      const saved = await updateTrip(admin, found.trip.id, {
        patch: (current) => {
          const { days, spots } = applyEdit(current, req.body?.edit);
          return { days, spots };
        },
      });
      res.json({ days: saved.days, spots: saved.spots });
    } catch (err) {
      if (err instanceof EditError) return res.status(400).json({ error: err.message });
      logger.error({ err, tripId: found.trip.id }, "Itinerary edit failed");
      res.status(500).json({ error: "Couldn't save that change. Please try again." });
    }
  });

  // ---- What the crew has said: votes and suggestions ----
  app.get("/api/trips/:tripId/collab", async (req, res) => {
    const found = await access(req, res);
    if (!found) return;
    const { trip, user, role } = found;
    try {
      const [names, { data: voteRows = [] }, { data: suggestionRows = [] }] = await Promise.all([
        voters(trip),
        admin.from("trip_votes").select("target, target_key, user_id, created_at").eq("trip_id", trip.id),
        admin
          .from("trip_suggestions")
          .select("id, suggested_by, suggested_by_name, day_key, place, note, created_at")
          .eq("trip_id", trip.id)
          .eq("status", "pending")
          .order("created_at"),
      ]);

      // { stop: { key: [{ name, isYou }] }, food: {...} }; votes from people who've left don't count
      const votes = { stop: {}, food: {} };
      for (const v of [...voteRows].sort((a, b) => (a.created_at > b.created_at ? 1 : -1))) {
        if (!names.has(v.user_id) || !votes[v.target]) continue;
        (votes[v.target][v.target_key] ||= []).push({ name: names.get(v.user_id), isYou: v.user_id === user.id });
      }
      const suggestions = suggestionRows.map((s) => ({
        id: s.id,
        dayKey: s.day_key,
        place: s.place,
        note: s.note,
        by: s.suggested_by_name,
        isYours: s.suggested_by === user.id,
        createdAt: s.created_at,
      }));
      res.set("Cache-Control", "no-store");
      res.json({ role, crewSize: names.size, votes, suggestions });
    } catch (err) {
      logger.error({ err, tripId: trip.id }, "Couldn't load crew votes and suggestions");
      res.status(500).json({ error: "Couldn't load the crew's votes. Please try again." });
    }
  });

  // ---- Votes ----
  app.put("/api/trips/:tripId/votes", async (req, res) => {
    const found = await access(req, res);
    if (!found) return;
    const { target, key, up } = req.body || {};
    if (!TARGETS.includes(target) || typeof key !== "string" || !key || key.length > 300 || typeof up !== "boolean") {
      return res.status(400).json({ error: "Bad vote" });
    }
    const row = { trip_id: found.trip.id, user_id: found.user.id, target, target_key: key };
    const { error } = up
      ? await admin.from("trip_votes").upsert(row, { onConflict: "trip_id,target,target_key,user_id", ignoreDuplicates: true })
      : await admin
          .from("trip_votes")
          .delete()
          .eq("trip_id", row.trip_id)
          .eq("user_id", row.user_id)
          .eq("target", target)
          .eq("target_key", key);
    if (error) {
      logger.error({ err: error }, "Vote failed");
      return res.status(500).json({ error: "Couldn't save your vote. Please try again." });
    }
    res.json({ ok: true });
  });

  // ---- Suggestions ----
  app.post("/api/trips/:tripId/suggestions", async (req, res) => {
    const found = await access(req, res);
    if (!found) return;
    const { trip, user } = found;
    const dayKey = req.body?.dayKey;
    if (!(trip.itinerary_data?.days || []).some((d) => d.key === dayKey)) {
      return res.status(400).json({ error: "That day isn't part of this trip" });
    }
    const suggested = cleanPlace(req.body?.place);
    if (!suggested) return res.status(400).json({ error: "Pick a place to suggest" });
    const note = typeof req.body?.note === "string" ? req.body.note.trim().slice(0, MAX_NOTE) : "";

    const { count } = await admin
      .from("trip_suggestions")
      .select("id", { count: "exact", head: true })
      .eq("trip_id", trip.id)
      .eq("suggested_by", user.id)
      .eq("status", "pending");
    if ((count || 0) >= MAX_PENDING_SUGGESTIONS_PER_PERSON) {
      return res.status(429).json({ error: "You have a lot of suggestions waiting. Give the organizer a chance to answer them first." });
    }

    const name = displayName(user);
    const { data, error } = await admin
      .from("trip_suggestions")
      .insert({ trip_id: trip.id, suggested_by: user.id, suggested_by_name: name, day_key: dayKey, place: suggested, note: note || null, status: "pending" })
      .select("id")
      .single();
    if (error) {
      logger.error({ err: error }, "Suggestion failed");
      return res.status(500).json({ error: "Couldn't send your suggestion. Please try again." });
    }
    if (trip.user_id !== user.id) {
      await notifier?.notify(trip.user_id, "stop_suggested", {
        tripId: trip.id,
        data: { ...place(trip), name, title: suggested.title, day_key: dayKey },
      });
    }
    res.status(201).json({ id: data.id });
  });

  // The pending suggestion behind :id, or sends 404 and returns null
  async function pendingSuggestion(found, req, res) {
    if (!UUID_RE.test(req.params.id)) return res.status(404).json({ error: "That suggestion isn't waiting anymore" }), null;
    const { data } = await admin
      .from("trip_suggestions")
      .select("id, suggested_by, day_key, place, status")
      .eq("id", req.params.id)
      .eq("trip_id", found.trip.id)
      .maybeSingle();
    if (!data || data.status !== "pending") return res.status(404).json({ error: "That suggestion isn't waiting anymore" }), null;
    return data;
  }

  const resolve = (suggestion, status, userId) =>
    admin
      .from("trip_suggestions")
      .update({ status, resolved_at: new Date().toISOString(), resolved_by: userId })
      .eq("id", suggestion.id)
      .eq("status", "pending")
      .select("id");

  // Accept: the place is added as the day's last stop. Replies with the trip's new { days, spots }.
  app.post("/api/trips/:tripId/suggestions/:id/accept", async (req, res) => {
    const found = await access(req, res);
    if (!found || !needsEditor(found, res)) return;
    const suggestion = await pendingSuggestion(found, req, res);
    if (!suggestion) return;
    try {
      // Marked first, so two people accepting at once can't add it twice
      const { data: claimed } = await resolve(suggestion, "accepted", found.user.id);
      if (!claimed?.length) return res.status(404).json({ error: "That suggestion isn't waiting anymore" });
      const saved = await updateTrip(admin, found.trip.id, {
        patch: (current) => {
          const { days, spots } = applyEdit(current, { op: "add", dayKey: suggestion.day_key, place: suggestion.place });
          return { days, spots };
        },
      });
      if (suggestion.suggested_by && suggestion.suggested_by !== found.user.id) {
        await notifier?.notify(suggestion.suggested_by, "suggestion_accepted", {
          tripId: found.trip.id,
          data: { ...place(found.trip), title: suggestion.place?.title },
        });
      }
      res.json({ days: saved.days, spots: saved.spots });
    } catch (err) {
      // Put it back so it can be tried again
      await admin.from("trip_suggestions").update({ status: "pending", resolved_at: null, resolved_by: null }).eq("id", suggestion.id);
      if (err instanceof EditError) return res.status(409).json({ error: "That day is no longer part of this trip" });
      logger.error({ err, tripId: found.trip.id }, "Accepting a suggestion failed");
      res.status(500).json({ error: "Couldn't add that stop. Please try again." });
    }
  });

  app.post("/api/trips/:tripId/suggestions/:id/decline", async (req, res) => {
    const found = await access(req, res);
    if (!found || !needsEditor(found, res)) return;
    const suggestion = await pendingSuggestion(found, req, res);
    if (!suggestion) return;
    await resolve(suggestion, "declined", found.user.id);
    res.json({ ok: true });
  });

  // Withdraw your own suggestion
  app.delete("/api/trips/:tripId/suggestions/:id", async (req, res) => {
    const found = await access(req, res);
    if (!found) return;
    const suggestion = await pendingSuggestion(found, req, res);
    if (!suggestion) return;
    if (suggestion.suggested_by !== found.user.id) return res.status(403).json({ error: "Only the person who suggested it can withdraw it" });
    await admin.from("trip_suggestions").delete().eq("id", suggestion.id);
    res.json({ ok: true });
  });
}
