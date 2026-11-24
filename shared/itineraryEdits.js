// Editing a generated itinerary (issue #37), shared by the app and the server. Each edit is a
// pure function of the itinerary ({ days, spots, ... }) that returns a new one, and refers to
// stops by their spot key, not their position, so it still applies correctly when re-run on
// a newer copy of the trip (the revision check in src/utils/trips.js retries on conflict).
//
// A day's stops are `day.markers` (spot keys, in visiting order); `day.done` lists the keys
// ticked off during the trip.

// Search links for a place, built here rather than asked of Claude (model-written URLs are
// often wrong). `booking` (a search for tickets and reservations) only when asked for.
export const searchLinks = (title, city, { booking = false } = {}) => ({
  youtube: `https://youtube.com/search?q=${encodeURIComponent(title)}`,
  maps: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title)}`,
  ...(booking && { booking: `https://www.google.com/search?q=${encodeURIComponent(`${title} ${city || ""} tickets reservations`.trim())}` }),
});

const withDay = (itinerary, dayKey, change) => ({
  ...itinerary,
  days: itinerary.days.map((d) => (d.key === dayKey ? change(d) : d)),
});

// Spots no day uses anymore are dropped, so the map of spots doesn't fill with leftovers
function pruneSpots(itinerary) {
  const used = new Set(itinerary.days.flatMap((d) => d.markers || []));
  return { ...itinerary, spots: Object.fromEntries(Object.entries(itinerary.spots || {}).filter(([k]) => used.has(k))) };
}

// Moves a stop to `toIndex` within its day (clamped to the day's length)
export function moveStop(itinerary, dayKey, spotKey, toIndex) {
  return withDay(itinerary, dayKey, (day) => {
    const markers = (day.markers || []).filter((k) => k !== spotKey);
    if (markers.length === (day.markers || []).length) return day; // not on this day
    const at = Math.max(0, Math.min(toIndex, markers.length));
    return { ...day, markers: [...markers.slice(0, at), spotKey, ...markers.slice(at)] };
  });
}

// Puts the day's stops in this order. Keys not on the day are ignored; any of the day's stops
// missing from `order` keep their place at the end.
export function reorderStops(itinerary, dayKey, order) {
  return withDay(itinerary, dayKey, (day) => {
    const markers = day.markers || [];
    const ordered = [...new Set(order)].filter((k) => markers.includes(k));
    return { ...day, markers: [...ordered, ...markers.filter((k) => !ordered.includes(k))] };
  });
}

// Moves a stop from one day to the end of another
export function moveStopToDay(itinerary, fromDayKey, spotKey, toDayKey) {
  if (fromDayKey === toDayKey) return itinerary;
  const from = itinerary.days.find((d) => d.key === fromDayKey);
  if (!from?.markers?.includes(spotKey) || !itinerary.days.some((d) => d.key === toDayKey)) return itinerary;
  const removed = withDay(itinerary, fromDayKey, (day) => ({
    ...day,
    markers: day.markers.filter((k) => k !== spotKey),
    done: (day.done || []).filter((k) => k !== spotKey),
  }));
  return withDay(removed, toDayKey, (day) => ({ ...day, markers: [...(day.markers || []).filter((k) => k !== spotKey), spotKey] }));
}

export function removeStop(itinerary, dayKey, spotKey) {
  const changed = withDay(itinerary, dayKey, (day) => ({
    ...day,
    markers: (day.markers || []).filter((k) => k !== spotKey),
    done: (day.done || []).filter((k) => k !== spotKey),
  }));
  return pruneSpots(changed);
}

// A key for a new spot that isn't taken yet: "senso_ji", "senso_ji_2", ...
export function spotKeyFor(title, spots = {}) {
  const base =
    String(title || "stop")
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 40) || "stop";
  if (!spots[base]) return base;
  let n = 2;
  while (spots[`${base}_${n}`]) n++;
  return `${base}_${n}`;
}

// Adds a place (from a place search: { title, address, coords }) as the day's last stop.
// Returns { itinerary, key }.
export function addStop(itinerary, dayKey, place, { booking = false } = {}) {
  const day = itinerary.days.find((d) => d.key === dayKey);
  if (!day) return { itinerary, key: null };
  const key = spotKeyFor(place.title, itinerary.spots);
  const spot = {
    title: place.title,
    address: place.address || "",
    city: day.city || place.city || null,
    coords: place.coords || null,
    img: null,
    links: searchLinks(place.title, day.city, { booking }),
    location: "verified", // it came from the map service
    addedByTraveler: true,
  };
  const changed = withDay({ ...itinerary, spots: { ...itinerary.spots, [key]: spot } }, dayKey, (d) => ({
    ...d,
    markers: [...(d.markers || []), key],
  }));
  return { itinerary: changed, key };
}

// Ticks a stop off (or back on)
export function toggleDone(itinerary, dayKey, spotKey) {
  return withDay(itinerary, dayKey, (day) => {
    if (!(day.markers || []).includes(spotKey)) return day;
    const done = day.done || [];
    return { ...day, done: done.includes(spotKey) ? done.filter((k) => k !== spotKey) : [...done, spotKey] };
  });
}

// Swaps in a regenerated day: its title, notes, rainy-day plan and stops. `spots` are the new
// stops' details by key (keys already made unique against the trip's other spots).
export function replaceDay(itinerary, dayKey, { title, notes, rainyDayBackup, markers }, spots) {
  const changed = withDay({ ...itinerary, spots: { ...itinerary.spots, ...spots } }, dayKey, (day) => {
    const { rainyDayBackup: _old, ...rest } = day;
    return {
      ...rest,
      title,
      notes,
      markers,
      done: [],
      ...(rainyDayBackup && { rainyDayBackup }),
    };
  });
  return pruneSpots(changed);
}

// Puts a removed stop back where it was (undo): `spot` is its details, `index` its old place
export function restoreStop(itinerary, dayKey, spotKey, spot, index) {
  const withSpot = { ...itinerary, spots: { ...itinerary.spots, [spotKey]: itinerary.spots?.[spotKey] || spot } };
  return withDay(withSpot, dayKey, (day) => {
    const markers = (day.markers || []).filter((k) => k !== spotKey);
    const at = Math.max(0, Math.min(index, markers.length));
    return { ...day, markers: [...markers.slice(0, at), spotKey, ...markers.slice(at)] };
  });
}

// ---- Edits as data (issue #38) ----
// Editors change a trip through the server (they can't write the row themselves), so an edit
// travels as a plain object, e.g. { op: "move", dayKey, spotKey, to }, and both the app (for
// the instant, optimistic change) and the server apply it with applyEdit. Anything from the
// browser is cleaned first: bad input throws an EditError rather than saving junk.

export class EditError extends Error {}

const MAX_TEXT = 300;
const text = (value, max = MAX_TEXT) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const isKey = (value) => typeof value === "string" && value.length > 0 && value.length <= 100;
const isHttps = (value) => typeof value === "string" && value.length <= 2000 && /^https:\/\//.test(value);

const cleanCoords = (coords) => {
  if (!Array.isArray(coords) || coords.length !== 2) return null;
  const [lat, lng] = coords.map(Number);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lat, lng] : null;
};

// A place from a place search ({ title, address, coords }), or null if it has no name
export function cleanPlace(place) {
  const title = text(place?.title, 200);
  if (!title) return null;
  return { title, address: text(place.address), coords: cleanCoords(place.coords) };
}

// A stop's details coming back from the browser (undoing a remove): only the fields stops have
const LOCATIONS = ["verified", "corrected", "unverified", "estimated", "far"];
function cleanSpot(spot) {
  const place = cleanPlace(spot);
  if (!place) return null;
  const links = Object.fromEntries(
    ["maps", "youtube", "booking"].filter((k) => isHttps(spot.links?.[k])).map((k) => [k, spot.links[k]])
  );
  return {
    ...place,
    city: text(spot.city, 100) || null,
    img: isHttps(spot.img) ? spot.img : null,
    links,
    ...(text(spot.estimatedCost, 60) && { estimatedCost: text(spot.estimatedCost, 60) }),
    ...(LOCATIONS.includes(spot.location) && { location: spot.location }),
    ...(spot.addedByTraveler === true && { addedByTraveler: true }),
  };
}

// Applies one edit ({ op, ... }) to an itinerary and returns the new one. Throws EditError if
// the edit is malformed or refers to a day that isn't on the trip.
export function applyEdit(itinerary, edit) {
  const { op, dayKey } = edit || {};
  if (!isKey(dayKey) || !itinerary.days?.some((d) => d.key === dayKey)) throw new EditError("That day isn't part of this trip");
  const needKey = () => {
    if (!isKey(edit.spotKey)) throw new EditError("Missing stop");
    return edit.spotKey;
  };
  switch (op) {
    case "move":
      if (!Number.isInteger(edit.to)) throw new EditError("Missing position");
      return moveStop(itinerary, dayKey, needKey(), edit.to);
    case "reorder":
      if (!Array.isArray(edit.order) || edit.order.length > 200 || !edit.order.every(isKey)) throw new EditError("Bad order");
      return reorderStops(itinerary, dayKey, edit.order);
    case "moveToDay":
      if (!isKey(edit.toDayKey)) throw new EditError("Missing day");
      return moveStopToDay(itinerary, dayKey, needKey(), edit.toDayKey);
    case "remove":
      return removeStop(itinerary, dayKey, needKey());
    case "restore": {
      const key = needKey();
      // The trip's own copy wins if the stop is still there
      const spot = itinerary.spots?.[key] || cleanSpot(edit.spot);
      if (!spot) throw new EditError("Missing stop details");
      return restoreStop(itinerary, dayKey, key, spot, Number.isInteger(edit.index) ? edit.index : Infinity);
    }
    case "add": {
      const place = cleanPlace(edit.place);
      if (!place) throw new EditError("Missing place");
      return addStop(itinerary, dayKey, place).itinerary;
    }
    case "toggleDone":
      return toggleDone(itinerary, dayKey, needKey());
    default:
      throw new EditError("Unknown edit");
  }
}
