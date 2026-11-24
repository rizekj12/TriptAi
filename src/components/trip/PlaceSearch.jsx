import React, { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { searchPlaces } from "../../utils/aiService";

// Search for a place near the day's city; tapping a result hands it ({ title, address, coords })
// to `onPick`. Used to add a stop (editing) and to suggest one (issue #38).
export default function PlaceSearch({ id, label, city, country, onPick }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [state, setState] = useState("idle"); // idle | searching | error

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setState("idle");
      return undefined;
    }
    let cancelled = false;
    setState("searching");
    // Waits for a pause in typing, so each keystroke isn't a search
    const timer = setTimeout(() => {
      searchPlaces(q, { city, country })
        .then((places) => !cancelled && (setResults(places), setState("idle")))
        .catch(() => !cancelled && setState("error"));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, city, country]);

  const pick = (place) => {
    onPick(place);
    setQuery("");
    setResults([]);
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-800">
        {label}
      </label>
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          id={id}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search places in ${city || "this city"}`}
          className="min-h-[44px] w-full rounded-xl border-2 border-slate-200 py-2 pl-9 pr-3 text-base focus:border-orchid-500 focus:outline-none"
          autoComplete="off"
        />
        {state === "searching" && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />}
      </div>
      {state === "error" && <p className="mt-1.5 text-sm text-red-600">Place search isn't available right now.</p>}
      {results.length > 0 && (
        <ul className="mt-2 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          {results.map((p) => (
            <li key={`${p.title}|${p.address}`}>
              <button type="button" onClick={() => pick(p)} className="block min-h-[44px] w-full px-3 py-2 text-left hover:bg-orchid-50">
                <span className="block font-semibold text-slate-900">{p.title}</span>
                <span className="block truncate text-xs text-slate-600">{p.address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {query.trim().length >= 2 && state === "idle" && !results.length && (
        <p className="mt-1.5 text-sm text-slate-600">No places found. Try another name.</p>
      )}
    </div>
  );
}
