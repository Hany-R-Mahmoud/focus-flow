create extension if not exists pgcrypto;

create table if not exists public.group_sessions (
  id uuid primary key default gen_random_uuid(),
  payload_session_id text not null unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 100),
  shared_objective text,
  starts_at timestamptz not null,
  focus_minutes integer not null check (focus_minutes between 5 and 240),
  break_minutes integer check (break_minutes between 0 and 120),
  meeting_url text,
  organizer_name text,
  opening_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.group_session_participants (
  session_id uuid not null references public.group_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 50),
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

create or replace function public.add_group_session_owner_participant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_session_participants (
    session_id,
    user_id,
    display_name
  ) values (
    new.id,
    new.owner_id,
    coalesce(nullif(trim(new.organizer_name), ''), 'Anonymous')
  )
  on conflict on constraint group_session_participants_pkey do update
    set display_name = excluded.display_name,
        last_seen_at = now();
  return new;
end;
$$;

drop trigger if exists add_group_session_owner_participant on public.group_sessions;
create trigger add_group_session_owner_participant
after insert on public.group_sessions
for each row execute function public.add_group_session_owner_participant();

create or replace function public.is_group_session_member(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_sessions
    where id = target_session_id and owner_id = auth.uid()
  ) or exists (
    select 1
    from public.group_session_participants
    where session_id = target_session_id and user_id = auth.uid()
  );
$$;

create or replace function public.join_group_session(
  requested_payload_session_id text,
  requested_display_name text
)
returns table (
  session_id uuid,
  participant_id uuid,
  display_name text,
  joined_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_session_id uuid;
  joined_at_value timestamptz := now();
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if char_length(trim(requested_display_name)) not between 1 and 50 then
    raise exception 'Display name must be between 1 and 50 characters';
  end if;

  select id
  into target_session_id
  from public.group_sessions
  where payload_session_id = requested_payload_session_id;

  if target_session_id is null then
    raise exception 'Group session not found';
  end if;

  insert into public.group_session_participants (
    session_id,
    user_id,
    display_name,
    joined_at,
    last_seen_at
  ) values (
    target_session_id,
    auth.uid(),
    trim(requested_display_name),
    joined_at_value,
    joined_at_value
  )
  on conflict (session_id, user_id) do update
    set display_name = excluded.display_name,
        last_seen_at = excluded.last_seen_at;

  return query
  select
    target_session_id,
    auth.uid(),
    trim(requested_display_name),
    joined_at_value;
end;
$$;

create or replace function public.get_group_session_by_payload_id(
  requested_payload_session_id text
)
returns setof public.group_sessions
language sql
security definer
set search_path = public
as $$
  select *
  from public.group_sessions
  where payload_session_id = requested_payload_session_id
  limit 1;
$$;

alter table public.group_sessions enable row level security;
alter table public.group_session_participants enable row level security;

drop policy if exists "owners can create group sessions" on public.group_sessions;
create policy "owners can create group sessions"
on public.group_sessions
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "members can view group sessions" on public.group_sessions;
create policy "members can view group sessions"
on public.group_sessions
for select
to authenticated
using (public.is_group_session_member(id));

drop policy if exists "owners can update group sessions" on public.group_sessions;
create policy "owners can update group sessions"
on public.group_sessions
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "owners can delete group sessions" on public.group_sessions;
create policy "owners can delete group sessions"
on public.group_sessions
for delete
to authenticated
using (owner_id = auth.uid());

drop policy if exists "members can view participants" on public.group_session_participants;
create policy "members can view participants"
on public.group_session_participants
for select
to authenticated
using (public.is_group_session_member(session_id));

revoke all on function public.join_group_session(text, text) from public;
grant execute on function public.join_group_session(text, text) to authenticated;
revoke all on function public.get_group_session_by_payload_id(text) from public;
grant execute on function public.get_group_session_by_payload_id(text) to authenticated;
