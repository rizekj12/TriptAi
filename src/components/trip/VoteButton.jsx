import React from "react";
import { ThumbsUp } from "lucide-react";
import { useVote } from "../../hooks/useCollab";
import { likedBy } from "../../utils/collab";

// A thumbs up on a stop or food spot (issue #38), with who liked it. `voters` is
// collab.votes[target][voteKey]. Only shown on trips with a crew.
export default function VoteButton({ tripId, target, voteKey, voters = [], title }) {
  const vote = useVote(tripId);
  const mine = voters.some((v) => v.isYou);
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <button
        type="button"
        onClick={() => vote.mutate({ target, key: voteKey, up: !mine })}
        aria-pressed={mine}
        aria-label={mine ? `Remove your thumbs up from ${title}` : `Thumbs up ${title}`}
        className={`inline-flex min-h-[32px] flex-none items-center gap-1 rounded-full px-2.5 text-[13px] font-bold ring-1 transition ${
          mine ? "bg-orchid-700 text-white ring-orchid-700" : "text-orchid-800 ring-orchid-200 hover:bg-orchid-50"
        }`}
      >
        <ThumbsUp size={14} aria-hidden="true" />
        {voters.length > 0 && <span>{voters.length}</span>}
      </button>
      {voters.length > 0 && <span className="truncate text-xs font-semibold text-slate-600">{likedBy(voters)}</span>}
    </span>
  );
}
