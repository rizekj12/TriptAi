// Crew collaboration helpers (issue #38)
export { canEditRole, foodVoteKey } from "../../shared/collab.js";

// Votes and suggestions only mean something once someone else is on the trip
export const hasCrew = (collab) => (collab?.crewSize || 0) > 1;

// "Ana", "You and Ana", "Ana, Ben and 2 others" (you first)
export function likedBy(voters) {
  const names = [...voters].sort((a, b) => b.isYou - a.isYou).map((v) => (v.isYou ? "You" : v.name));
  if (names.length <= 2) return names.join(" and ");
  return `${names.slice(0, 2).join(", ")} and ${names.length - 2} other${names.length === 3 ? "" : "s"}`;
}
