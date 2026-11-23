// What to call a trip, shared by the app and the server (PDF, notifications). Usually its
// country ("Japan"), but a trip in the traveler's own country is named after where in it they're
// going: someone based in the United States going to Pensacola, FL sees "Florida" (its state),
// not "United States"; elsewhere it's the cities. `homeCountry` is the viewer's (user_metadata.home_country, set in the profile menu).

// "New York", "New York & Boston", "Austin, Dallas & Houston", "Austin, Dallas + 2 more"
export function joinCities(cities) {
  if (cities.length <= 2) return cities.join(" & ");
  if (cities.length === 3) return `${cities[0]}, ${cities[1]} & ${cities[2]}`;
  return `${cities[0]}, ${cities[1]} + ${cities.length - 2} more`;
}

// US cities are written "Pensacola, FL"; their state's full name
const US_STATES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
  CT: "Connecticut", DE: "Delaware", DC: "Washington, D.C.", FL: "Florida", GA: "Georgia", HI: "Hawaii",
  ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", PR: "Puerto Rico",
};
const STATE_NAMES = new Set(Object.values(US_STATES).map((n) => n.toLowerCase()));

// The state a US city name ends in ("Pensacola, FL" or "Pensacola, Florida"), or null
function usState(city) {
  const tail = String(city).split(",").slice(1).join(",").trim();
  if (!tail) return null;
  const code = US_STATES[tail.toUpperCase()];
  if (code) return code;
  return STATE_NAMES.has(tail.toLowerCase()) ? tail.replace(/\b\w/g, (c) => c.toUpperCase()) : null;
}

// A home trip in the United States is named after its states ("Florida", "Florida & Georgia")
// when every city names one; otherwise after its cities.
export function placeName({ country, cities = [] }, homeCountry) {
  const names = [...new Set((cities || []).filter(Boolean))];
  if (!(country && homeCountry && country === homeCountry && names.length)) return country || "";
  if (country === "United States") {
    const states = names.map(usState);
    if (states.every(Boolean)) return joinCities([...new Set(states)]);
  }
  return joinCities(names);
}

// The city names of a trip row (the `cities` column, or the questionnaire answers)
export const tripCities = (trip) =>
  trip?.cities?.length ? trip.cities : (trip?.itinerary_data?._form_data?.cities || []).map((c) => c.name).filter(Boolean);

// A trip row's name, or "" when it has no destination yet
export const tripName = (trip, homeCountry) => placeName({ country: trip?.destination, cities: tripCities(trip) }, homeCountry);
