import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCollab, voteOn, suggestStop, answerSuggestion, withdrawSuggestion, setCrewRole } from "../utils/aiService";

// Crew collaboration on a trip (issue #38): the viewer's role ("owner" | "editor" | "member"),
// thumbs-up votes and pending suggested stops. Signed-in viewers only (not guests).
export function useCollab(tripId, { enabled = true } = {}) {
  return useQuery({
    queryKey: ["collab", tripId],
    queryFn: () => getCollab(tripId),
    enabled: !!tripId && enabled,
    staleTime: 15_000,
    // Picks up the crew's votes and suggestions while the trip is open
    refetchInterval: 60_000,
  });
}

// mutate({ target: "stop" | "food", key, up }). Shows at once; goes back if saving fails.
export function useVote(tripId) {
  const qc = useQueryClient();
  const key = ["collab", tripId];
  return useMutation({
    mutationFn: (vote) => voteOn(tripId, vote),
    onMutate: async ({ target, key: targetKey, up }) => {
      await qc.cancelQueries({ queryKey: key });
      const before = qc.getQueryData(key);
      if (before) {
        const list = (before.votes?.[target]?.[targetKey] || []).filter((v) => !v.isYou);
        const next = up ? [...list, { name: "You", isYou: true }] : list;
        qc.setQueryData(key, { ...before, votes: { ...before.votes, [target]: { ...before.votes?.[target], [targetKey]: next } } });
      }
      return { before };
    },
    onError: (_err, _vote, context) => context?.before && qc.setQueryData(key, context.before),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });
}

// mutate({ dayKey, place, note })
export function useSuggestStop(tripId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (suggestion) => suggestStop(tripId, suggestion),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collab", tripId] }),
  });
}

// mutate({ id, decision: "accept" | "decline" | "withdraw" })
export function useAnswerSuggestion(tripId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision }) => (decision === "withdraw" ? withdrawSuggestion(tripId, id) : answerSuggestion(tripId, id, decision)),
    onSuccess: (saved, { decision }) => {
      if (decision === "accept") {
        qc.setQueryData(["trip", tripId], (trip) => trip && { ...trip, itinerary_data: { ...trip.itinerary_data, days: saved.days, spots: saved.spots } });
      }
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["collab", tripId] }),
  });
}

// The organizer makes someone an editor or back: mutate({ memberId, role: "editor" | "member" })
export function useSetCrewRole(tripId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }) => setCrewRole(tripId, memberId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["crew", tripId] }),
  });
}
