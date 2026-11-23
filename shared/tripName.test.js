// A trip in the traveler's own country is named after its cities, not the country
import { test, expect } from "vitest";
import { placeName, joinCities, tripName } from "./tripName.js";

const US = "United States";

test("a trip in your own country is named after its cities", () => {
  expect(placeName({ country: US, cities: ["New York"] }, US)).toBe("New York");
  expect(placeName({ country: US, cities: ["New York", "Boston", "New York"] }, US)).toBe("New York & Boston");
});

test("a trip abroad, or with no home country set, keeps the country", () => {
  expect(placeName({ country: US, cities: ["New York"] }, "Canada")).toBe(US);
  expect(placeName({ country: US, cities: ["New York"] }, null)).toBe(US);
  expect(placeName({ country: "South Korea", cities: ["Seoul"] }, "Japan")).toBe("South Korea");
});

test("a home trip with no cities yet (an early draft) keeps the country", () => {
  expect(placeName({ country: US, cities: ["", null] }, US)).toBe(US);
  expect(placeName({ country: "", cities: [] }, US)).toBe("");
});

test("joinCities", () => {
  expect(joinCities(["Austin", "Dallas", "Houston"])).toBe("Austin, Dallas & Houston");
  expect(joinCities(["Austin", "Dallas", "Houston", "El Paso", "Waco"])).toBe("Austin, Dallas + 3 more");
});

test("tripName reads the cities column, or the questionnaire answers", () => {
  expect(tripName({ destination: US, cities: ["Chicago"] }, US)).toBe("Chicago");
  expect(tripName({ destination: US, itinerary_data: { _form_data: { cities: [{ name: "Miami" }] } } }, US)).toBe("Miami");
});

test("a home trip in the United States is named after its states", () => {
  expect(placeName({ country: US, cities: ["Pensacola, FL"] }, US)).toBe("Florida");
  expect(placeName({ country: US, cities: ["Miami, FL", "Orlando, FL"] }, US)).toBe("Florida");
  expect(placeName({ country: US, cities: ["Miami, FL", "Atlanta, GA"] }, US)).toBe("Florida & Georgia");
  expect(placeName({ country: US, cities: ["Austin, texas"] }, US)).toBe("Texas");
  // A city without a state keeps the city names
  expect(placeName({ country: US, cities: ["Miami, FL", "Somewhere"] }, US)).toBe("Miami, FL & Somewhere");
  // Abroad, the country as before
  expect(placeName({ country: US, cities: ["Pensacola, FL"] }, "Canada")).toBe(US);
});
