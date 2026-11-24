// Crew collaboration (issue #38): who may edit, vote and suggest, and that editors never get
// the organizer's private details. In-memory Supabase (server/test/fakeSupabase.js).
import { describe, test, expect, beforeEach, vi } from "vitest";
import express from "express";
import request from "supertest";
import { db } from "./test/fakeSupabase.js";
import { OWNER, MEMBER, USERS, TOKENS, TRIP_ID, auth, readyTrip, members, leaksSecrets } from "./test/fixtures.js";

vi.mock("@supabase/supabase-js", async () => (await import("./test/fakeSupabase.js")).supabaseModule);
const { registerCollaborationRoutes, MAX_PENDING_SUGGESTIONS_PER_PERSON } = await import("./collaboration.js");

const notifier = { notify: vi.fn() };
const app = express();
app.use(express.json());
registerCollaborationRoutes(app, { supabaseUrl: "http://fake", serviceKey: "service", notifier });

const base = `/api/trips/${TRIP_ID}`;
const SUGGESTION_ID = "44444444-4444-4444-8444-444444444444";
const trip = () => db.rows("trips")[0];
const memberRow = () => db.rows("trip_members").find((m) => m.id === "m-approved");
const makeEditor = () => (memberRow().role = "editor");
const place = { title: "Ichiran Ramen", address: "Shibuya", coords: [35.66, 139.7] };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  db.reset(
    { trips: [readyTrip()], trip_members: members(), trip_votes: [], trip_suggestions: [] },
    { users: USERS, tokens: TOKENS }
  );
});

describe("choosing editors", () => {
  const setRole = (token, memberId, role) => request(app).post(`${base}/crew/${memberId}/role`).set(auth(token)).send({ role });
  const MEMBER_ROW = "00000000-0000-4000-8000-000000000001";
  const GUEST_ROW = "00000000-0000-4000-8000-000000000002";
  beforeEach(() => {
    memberRow().id = MEMBER_ROW;
    db.rows("trip_members").find((m) => m.id === "m-guest").id = GUEST_ROW;
  });

  test("the organizer makes a member an editor, and they're told", async () => {
    const res = await setRole("token-owner", MEMBER_ROW, "editor");
    expect(res.status).toBe(200);
    expect(db.rows("trip_members").find((m) => m.id === MEMBER_ROW).role).toBe("editor");
    expect(notifier.notify).toHaveBeenCalledWith(MEMBER.id, "made_editor", expect.objectContaining({ tripId: TRIP_ID }));
  });

  test("only the organizer can, and guests can't be editors", async () => {
    expect((await setRole("token-member", MEMBER_ROW, "editor")).status).toBe(403);
    expect((await setRole("token-stranger", MEMBER_ROW, "editor")).status).toBe(404);
    expect((await setRole("token-owner", GUEST_ROW, "editor")).status).toBe(400);
    expect((await setRole("token-owner", MEMBER_ROW, "owner")).status).toBe(400);
  });
});

describe("POST /itinerary/edits", () => {
  const edit = (token, body) => request(app).post(`${base}/itinerary/edits`).set(auth(token)).send({ edit: body });

  test("an editor's change is saved, and the reply has no private details", async () => {
    makeEditor();
    const res = await edit("token-member", { op: "add", dayKey: "d1", place });
    expect(res.status).toBe(200);
    expect(trip().itinerary_data.days[0].markers).toEqual(["s1", "ichiran_ramen"]);
    expect(trip().itinerary_data.spots.ichiran_ramen).toMatchObject({ title: "Ichiran Ramen", addedByTraveler: true });
    expect(leaksSecrets(res.body)).toEqual([]);
    // The organizer's reservations are still on the trip
    expect(trip().itinerary_data._form_data.reservations.flights).toHaveLength(1);
  });

  test("members, pending members and strangers can't edit", async () => {
    expect((await edit("token-member", { op: "remove", dayKey: "d1", spotKey: "s1" })).status).toBe(403);
    expect((await edit("token-pending", { op: "remove", dayKey: "d1", spotKey: "s1" })).status).toBe(404);
    expect((await edit("token-stranger", { op: "remove", dayKey: "d1", spotKey: "s1" })).status).toBe(404);
    expect(trip().itinerary_data.days[0].markers).toEqual(["s1"]);
  });

  test("bad edits are refused without saving", async () => {
    makeEditor();
    expect((await edit("token-member", { op: "drop_table", dayKey: "d1" })).status).toBe(400);
    expect((await edit("token-member", { op: "add", dayKey: "d9", place })).status).toBe(400);
    expect((await edit("token-member", { op: "add", dayKey: "d1", place: { title: "  " } })).status).toBe(400);
    expect(trip().revision).toBe(0);
  });

  test("an undo can't smuggle in fields a stop doesn't have", async () => {
    makeEditor();
    await edit("token-member", { op: "remove", dayKey: "d1", spotKey: "s1" });
    const spot = { title: "Senso-ji", coords: [35.71, 139.79], links: { maps: "javascript:alert(1)" }, evil: "x".repeat(10) };
    expect((await edit("token-member", { op: "restore", dayKey: "d1", spotKey: "s1", spot, index: 0 })).status).toBe(200);
    const saved = trip().itinerary_data.spots.s1;
    expect(saved.evil).toBeUndefined();
    expect(saved.links).toEqual({});
  });
});

describe("votes", () => {
  const vote = (token, body) => request(app).put(`${base}/votes`).set(auth(token)).send(body);
  const collab = (token) => request(app).get(`${base}/collab`).set(auth(token));

  test("thumbs up and back down, with who liked what", async () => {
    await vote("token-member", { target: "stop", key: "s1", up: true });
    await vote("token-member", { target: "stop", key: "s1", up: true }); // twice still counts once
    await vote("token-owner", { target: "food", key: "Tokyo|Ichiran", up: true });
    let res = await collab("token-owner");
    expect(res.body.role).toBe("owner");
    expect(res.body.votes.stop.s1).toEqual([{ name: "Max Member", isYou: false }]);
    expect(res.body.votes.food["Tokyo|Ichiran"]).toEqual([{ name: "Olivia Owner", isYou: true }]);

    await vote("token-member", { target: "stop", key: "s1", up: false });
    res = await collab("token-member");
    expect(res.body.role).toBe("member");
    expect(res.body.votes.stop.s1).toBeUndefined();
  });

  test("someone who left doesn't count, and outsiders can't vote or look", async () => {
    await vote("token-member", { target: "stop", key: "s1", up: true });
    db.rows("trip_members").splice(db.rows("trip_members").indexOf(memberRow()), 1);
    expect((await collab("token-owner")).body.votes.stop.s1).toBeUndefined();
    expect((await vote("token-member", { target: "stop", key: "s1", up: true })).status).toBe(404);
    expect((await collab("token-stranger")).status).toBe(404);
    expect((await vote("token-owner", { target: "hotel", key: "x", up: true })).status).toBe(400);
  });
});

describe("suggestions", () => {
  const suggest = (token, body) => request(app).post(`${base}/suggestions`).set(auth(token)).send(body);
  const answer = (token, id, decision) => request(app).post(`${base}/suggestions/${id}/${decision}`).set(auth(token));
  const pending = () => db.rows("trip_suggestions")[0];

  test("a member suggests a stop; the organizer is told and adds it", async () => {
    const res = await suggest("token-member", { dayKey: "d1", place, note: "Best ramen" });
    expect(res.status).toBe(201);
    expect(notifier.notify).toHaveBeenCalledWith(OWNER.id, "stop_suggested", expect.objectContaining({ data: expect.objectContaining({ name: "Max Member", title: "Ichiran Ramen" }) }));
    const list = (await request(app).get(`${base}/collab`).set(auth("token-owner"))).body.suggestions;
    expect(list).toEqual([expect.objectContaining({ dayKey: "d1", by: "Max Member", note: "Best ramen", isYours: false })]);

    pending().id = SUGGESTION_ID;
    const accepted = await answer("token-owner", SUGGESTION_ID, "accept");
    expect(accepted.status).toBe(200);
    expect(trip().itinerary_data.days[0].markers).toEqual(["s1", "ichiran_ramen"]);
    expect(pending().status).toBe("accepted");
    expect(notifier.notify).toHaveBeenCalledWith(MEMBER.id, "suggestion_accepted", expect.anything());
    // Only once
    expect((await answer("token-owner", SUGGESTION_ID, "accept")).status).toBe(404);
    expect(trip().itinerary_data.days[0].markers).toHaveLength(2);
  });

  test("members can't answer suggestions, editors can; the suggester can withdraw", async () => {
    await suggest("token-member", { dayKey: "d1", place });
    pending().id = SUGGESTION_ID;
    expect((await answer("token-member", SUGGESTION_ID, "decline")).status).toBe(403);
    makeEditor();
    expect((await answer("token-member", SUGGESTION_ID, "decline")).status).toBe(200);
    expect(pending().status).toBe("declined");

    memberRow().role = "member";
    await suggest("token-member", { dayKey: "d1", place });
    const second = db.rows("trip_suggestions")[1];
    second.id = "55555555-5555-4555-8555-555555555555";
    expect((await request(app).delete(`${base}/suggestions/${second.id}`).set(auth("token-owner"))).status).toBe(403);
    expect((await request(app).delete(`${base}/suggestions/${second.id}`).set(auth("token-member"))).status).toBe(200);
    expect(db.rows("trip_suggestions")).toHaveLength(1);
  });

  test("bad suggestions and too many waiting are refused", async () => {
    expect((await suggest("token-member", { dayKey: "d9", place })).status).toBe(400);
    expect((await suggest("token-member", { dayKey: "d1", place: {} })).status).toBe(400);
    expect((await suggest("token-pending", { dayKey: "d1", place })).status).toBe(404);
    for (let i = 0; i < MAX_PENDING_SUGGESTIONS_PER_PERSON; i++) {
      db.rows("trip_suggestions").push({ id: `s${i}`, trip_id: TRIP_ID, suggested_by: MEMBER.id, status: "pending" });
    }
    expect((await suggest("token-member", { dayKey: "d1", place })).status).toBe(429);
  });
});
