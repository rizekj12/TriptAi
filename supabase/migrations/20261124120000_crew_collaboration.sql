-- Travel Crew collaboration (issue #38): an "editor" role, thumbs-up votes, and suggested stops.
-- Only the server (service role) reads and writes the new tables: it checks who is on the trip
-- first (server/collaboration.js), so they have row-level security with no policies.

-- Editors: signed-in members the organizer lets change the itinerary. They still get the
-- shared view of the trip, so never the organizer's reservations or confirmation codes.
alter table public.trip_members drop constraint if exists trip_members_role_check;
alter table public.trip_members
  add constraint trip_members_role_check check (role = any (array['member', 'editor', 'guest']));

-- One thumbs up per person per stop or food spot. `target_key` is a stop's spot key, or
-- "<city>|<food spot name>" for a food spot.
create table if not exists public.trip_votes (
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  target text not null check (target in ('stop', 'food')),
  target_key text not null check (char_length(target_key) <= 300),
  created_at timestamptz not null default now(),
  primary key (trip_id, target, target_key, user_id)
);

-- A stop a traveler suggests for one day. The organizer or an editor accepts it (it's added
-- to the day) or declines it.
create table if not exists public.trip_suggestions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  suggested_by uuid references auth.users (id) on delete set null,
  suggested_by_name text not null,
  day_key text not null,
  place jsonb not null, -- { title, address, coords }
  note text check (char_length(note) <= 300),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null
);
create index if not exists trip_suggestions_trip_id_idx on public.trip_suggestions (trip_id, status);

alter table public.trip_votes enable row level security;
alter table public.trip_suggestions enable row level security;
revoke all on table public.trip_votes from anon, authenticated;
revoke all on table public.trip_suggestions from anon, authenticated;
