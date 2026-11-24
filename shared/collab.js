// Crew collaboration (issue #38), shared by the app and server/collaboration.js

// The organizer and editors may change the itinerary
export const canEditRole = (role) => role === "owner" || role === "editor";

// How a food spot is voted on ("<city>|<name>"): food spots have no ids of their own
export const foodVoteKey = (city, name) => `${city}|${name}`.slice(0, 300);
