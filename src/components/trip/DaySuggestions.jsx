import React, { useState } from "react";
import { Check, Lightbulb, Loader2, MapPin, Send, X } from "lucide-react";
import PlaceSearch from "./PlaceSearch";
import { useAnswerSuggestion, useSuggestStop } from "../../hooks/useCollab";
import { canEditRole } from "../../utils/collab";

const card = "glass rounded-3xl p-5 shadow-[0_6px_20px_rgba(15,23,42,0.06)] sm:p-6";

// Stops the crew suggested for this day (issue #38). The organizer and editors accept (it's
// added as the day's last stop) or decline; whoever suggested one can withdraw it; members
// can suggest more. `collab` is useCollab's data.
export default function DaySuggestions({ tripId, day, country, collab }) {
  const [open, setOpen] = useState(false);
  const answer = useAnswerSuggestion(tripId);
  const role = collab?.role;
  const canAnswer = canEditRole(role);
  const pending = (collab?.suggestions || []).filter((s) => s.dayKey === day.key);
  // Editors add stops themselves; suggesting is for everyone else on the crew
  const canSuggest = role === "member";
  if (!pending.length && !canSuggest) return null;

  return (
    <section className={card} aria-labelledby="day-suggestions">
      <h3 id="day-suggestions" className="mb-1 flex items-center gap-2 text-lg font-extrabold">
        <Lightbulb size={18} className="text-mango-600" aria-hidden="true" /> Suggested stops
      </h3>
      {canSuggest && !pending.length && !open && (
        <p className="mb-3 text-sm text-slate-600">Know a place that belongs on this day? Suggest it to the organizer.</p>
      )}

      {pending.length > 0 && (
        <ul className="mb-3 mt-3 space-y-2">
          {pending.map((s) => {
            const busy = answer.isPending && answer.variables?.id === s.id;
            return (
              <li key={s.id} className="rounded-2xl bg-white/70 p-3 ring-1 ring-slate-200">
                <p className="font-bold leading-snug text-slate-900">{s.place?.title}</p>
                {s.place?.address && (
                  <p className="mt-0.5 flex items-start gap-1 text-sm text-slate-600">
                    <MapPin size={14} className="mt-0.5 flex-none" aria-hidden="true" /> {s.place.address}
                  </p>
                )}
                <p className="mt-1 text-xs font-semibold text-slate-600">Suggested by {s.isYours ? "you" : s.by}</p>
                {s.note && <p className="mt-1 text-sm italic text-slate-700">"{s.note}"</p>}
                {(canAnswer || s.isYours) && (
                  <div className="mt-2.5 flex gap-2">
                    {canAnswer && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => answer.mutate({ id: s.id, decision: "accept" })}
                        className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-orchid-700 px-3 text-sm font-bold text-white hover:bg-orchid-800 disabled:opacity-60"
                      >
                        {busy && answer.variables?.decision === "accept" ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                        Add to day
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => answer.mutate({ id: s.id, decision: canAnswer ? "decline" : "withdraw" })}
                      className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      <X size={15} />
                      {canAnswer ? "Decline" : "Withdraw"}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {answer.isError && <p className="mb-3 text-sm text-red-600">{answer.error.message}</p>}

      {canSuggest &&
        (open ? (
          <SuggestForm tripId={tripId} day={day} country={country} onDone={() => setOpen(false)} />
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-orchid-200 px-4 text-sm font-bold text-orchid-800 hover:bg-orchid-50"
          >
            <Lightbulb size={16} /> Suggest a stop
          </button>
        ))}
    </section>
  );
}

// Pick a place, add an optional note, send
function SuggestForm({ tripId, day, country, onDone }) {
  const suggest = useSuggestStop(tripId);
  const [place, setPlace] = useState(null);
  const [note, setNote] = useState("");

  if (!place) {
    return (
      <div className="space-y-2">
        <PlaceSearch id="suggest-stop" label="Which place?" city={day.city} country={country} onPick={setPlace} />
        <button type="button" onClick={onDone} className="min-h-[40px] text-sm font-bold text-slate-600 hover:underline">
          Cancel
        </button>
      </div>
    );
  }
  return (
    <div className="space-y-3 rounded-2xl border-2 border-orchid-200 bg-orchid-50/50 p-4">
      <div>
        <p className="font-bold text-slate-900">{place.title}</p>
        {place.address && <p className="text-sm text-slate-600">{place.address}</p>}
      </div>
      <label htmlFor="suggest-note" className="block text-sm font-bold text-slate-800">
        Why this place? <span className="font-normal text-slate-600">(optional)</span>
      </label>
      <textarea
        id="suggest-note"
        rows={2}
        maxLength={300}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="e.g. Best ramen in town, and it's on the way"
        className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-base focus:border-orchid-500 focus:outline-none"
      />
      {suggest.isError && <p className="text-sm text-red-600">{suggest.error.message}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={suggest.isPending}
          onClick={() => suggest.mutate({ dayKey: day.key, place, note: note.trim() }, { onSuccess: onDone })}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-orchid-700 px-4 text-sm font-bold text-white hover:bg-orchid-800 disabled:opacity-60"
        >
          {suggest.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Send suggestion
        </button>
        <button
          type="button"
          disabled={suggest.isPending}
          onClick={() => setPlace(null)}
          className="min-h-[44px] rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Back
        </button>
      </div>
    </div>
  );
}
