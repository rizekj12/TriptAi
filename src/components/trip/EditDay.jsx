import React, { useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { ChevronDown, ChevronUp, GripVertical, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useEditItinerary, useRegenerateDay } from "../../hooks/useTrips";
import PlaceSearch from "./PlaceSearch";

const iconButton =
  "flex h-11 w-11 flex-none items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30";

// The organizer's editing tools for one day (issue #37): reorder (drag the handle, or the
// arrows), move to another day, remove (with undo), add a stop from a place search, and
// re-plan the day with AI. Every change saves straight away. Editors (issue #38) get the same
// tools; useEditItinerary sends their changes through the server.
// `days`: describeDays() for every day (labels for "Move to"); `country` narrows place search.
export default function EditDay({ tripId, day, spots, days, country }) {
  const edit = useEditItinerary(tripId);
  const markers = day.markers || [];
  // The order while a drag is in progress (saved when it ends, not on every swap); otherwise
  // the day's saved order
  const [dragOrder, setDragOrder] = useState(null);
  const order = dragOrder || markers;
  const drop = () => {
    if (dragOrder && dragOrder.join("|") !== markers.join("|")) save({ op: "reorder", dayKey: day.key, order: dragOrder });
    setDragOrder(null);
  };
  const [removed, setRemoved] = useState(null); // { key, spot, index } for Undo

  const save = (change) => edit.mutate(change);
  const remove = (key) => {
    setRemoved({ key, spot: spots[key], index: markers.indexOf(key) });
    save({ op: "remove", dayKey: day.key, spotKey: key });
  };
  const undo = () => {
    const { key, spot, index } = removed;
    setRemoved(null);
    save({ op: "restore", dayKey: day.key, spotKey: key, spot, index });
  };

  return (
    // Swiping changes day; while editing, a drag must not
    <div className="space-y-5" onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
      {order.length ? (
        <Reorder.Group axis="y" values={order} onReorder={setDragOrder} className="space-y-2">
          {order.map((key, i) => (
            <EditableStop
              key={key}
              spotKey={key}
              spot={spots[key]}
              index={i}
              count={order.length}
              day={day}
              days={days}
              onDrop={drop}
              onMove={(to) => save({ op: "move", dayKey: day.key, spotKey: key, to })}
              onMoveToDay={(toKey) => save({ op: "moveToDay", dayKey: day.key, spotKey: key, toDayKey: toKey })}
              onRemove={() => remove(key)}
            />
          ))}
        </Reorder.Group>
      ) : (
        <p className="text-sm text-slate-600">No stops yet. Add one below.</p>
      )}

      {removed && (
        <div role="status" className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-2 text-sm text-white">
          <span className="truncate">Removed {removed.spot?.title || "stop"}</span>
          <button onClick={undo} className="min-h-[40px] flex-none font-bold text-mango-300 hover:underline">Undo</button>
        </div>
      )}
      {edit.isError && <p className="text-sm text-red-600">Couldn't save that change: {edit.error.message}</p>}

      <PlaceSearch
        id="add-stop"
        label={<><Plus size={16} /> Add a stop</>}
        city={day.city}
        country={country}
        onPick={(place) => save({ op: "add", dayKey: day.key, place })}
      />
      <ReplanDay tripId={tripId} day={day} />
    </div>
  );
}

function EditableStop({ spotKey, spot, index, count, day, days, onDrop, onMove, onMoveToDay, onRemove }) {
  const controls = useDragControls();
  const title = spot?.title || "Stop";
  return (
    <Reorder.Item
      value={spotKey}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDrop}
      className="glass rounded-2xl p-1.5"
    >
      {/* Phone first: the name gets its own line; moving controls sit underneath */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onPointerDown={(e) => controls.start(e)}
          className={`${iconButton} cursor-grab touch-none active:cursor-grabbing`}
          aria-label={`Drag to reorder ${title}`}
        >
          <GripVertical size={18} />
        </button>
        <p className="min-w-0 flex-1 px-1 font-bold leading-snug text-slate-900">
          <span className="mr-1.5 text-orchid-700">{index + 1}.</span>
          {title}
        </p>
        <button type="button" onClick={onRemove} className={`${iconButton} hover:bg-red-50 hover:text-red-600`} aria-label={`Remove ${title}`}>
          <Trash2 size={18} />
        </button>
      </div>
      <div className="flex items-center gap-1 pl-12">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Move {title} to another day</span>
          <select
            value=""
            onChange={(e) => e.target.value && onMoveToDay(e.target.value)}
            className="min-h-[40px] w-full rounded-xl border border-slate-200 bg-white pl-2 pr-6 text-base text-slate-700 sm:text-sm"
          >
            <option value="">Move to day…</option>
            {days.filter((d) => d.key !== day.key).map((d) => (
              <option key={d.key} value={d.key}>
                Day {d.n}{d.shortDate ? ` · ${d.shortDate}` : ""}{d.city ? ` · ${d.city}` : ""}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={() => onMove(index - 1)} disabled={index === 0} className={iconButton} aria-label={`Move ${title} up`}>
          <ChevronUp size={18} />
        </button>
        <button type="button" onClick={() => onMove(index + 1)} disabled={index === count - 1} className={iconButton} aria-label={`Move ${title} down`}>
          <ChevronDown size={18} />
        </button>
      </div>
    </Reorder.Item>
  );
}

// "Re-plan this day": a new set of stops from Claude, with an optional note
function ReplanDay({ tripId, day }) {
  const replan = useRegenerateDay(tripId);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border-2 border-orchid-200 px-4 text-sm font-bold text-orchid-800 hover:bg-orchid-50"
      >
        <Sparkles size={16} /> Re-plan this day with AI
      </button>
    );
  }
  return (
    <div className="space-y-3 rounded-2xl border-2 border-orchid-200 bg-orchid-50/50 p-4">
      <label htmlFor="replan-note" className="block text-sm font-bold text-slate-800">
        Re-plan this day
        <span className="mt-0.5 block text-xs font-normal text-slate-600">
          Replaces this day's stops and tips. Other days stay as they are.
        </span>
      </label>
      <textarea
        id="replan-note"
        rows={2}
        maxLength={300}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder='Anything to change? e.g. "more food, less museums"'
        className="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-base focus:border-orchid-500 focus:outline-none"
      />
      {replan.isError && <p className="text-sm text-red-600">{replan.error.message}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={replan.isPending}
          onClick={() => replan.mutate({ dayKey: day.key, note: note.trim() }, { onSuccess: () => (setOpen(false), setNote("")) })}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-orchid-700 px-4 text-sm font-bold text-white hover:bg-orchid-800 disabled:opacity-60"
        >
          {replan.isPending ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {replan.isPending ? "Re-planning… (about 30 s)" : "Re-plan"}
        </button>
        <button
          type="button"
          disabled={replan.isPending}
          onClick={() => setOpen(false)}
          className="min-h-[44px] rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
