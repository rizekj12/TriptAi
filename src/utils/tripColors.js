// Distinct solid colors for telling trips (and people) apart on calendars and avatars. Each one is
// dark enough for white text and they're spread around the color wheel, so neighbors never look
// alike. Written out as full class names so Tailwind keeps them.
export const TRIP_COLORS = [
  "bg-[#44605e]", // slate
  "bg-[#e5870a]", // gold
  "bg-[#5d8bb5]", // blue
  "bg-[#c0564b]", // terracotta
  "bg-[#3f8f86]", // teal
  "bg-[#7b6aa8]", // purple
  "bg-[#2b4142]", // dark teal
  "bg-[#a8792a]", // mustard
];

// The same id or name always gets the same color
export const colorForKey = (key = "") =>
  TRIP_COLORS[[...String(key)].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % TRIP_COLORS.length];
