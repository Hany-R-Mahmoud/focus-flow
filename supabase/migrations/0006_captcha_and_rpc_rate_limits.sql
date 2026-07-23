create schema if not exists private;

create table if not exists private.group_session_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  rate_limit_action text not null check (rate_limit_action in ('create', 'join')),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (user_id, rate_limit_action)
);

alter table private.group_session_rate_limits enable row level security;
revoke all on schema private from public, anon, authenticated;
revoke all on table private.group_session_rate_limits from public, anon, authenticated;

create or replace function private.consume_group_session_rate_limit(
  requested_action text
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth, private
as $$
declare
  caller_id uuid;
  max_requests integer;
  current_count integer;
  now_value timestamptz := clock_timestamp();
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  if requested_action = 'create' then
    max_requests := 5;
  elsif requested_action = 'join' then
    max_requests := 30;
  else
    raise exception 'Unknown rate-limit action';
  end if;

  insert into private.group_session_rate_limits (
    user_id,
    rate_limit_action,
    window_started_at,
    request_count
  ) values (
    caller_id,
    requested_action,
    now_value,
    1
  )
  on conflict (user_id, rate_limit_action) do update
    set window_started_at = case
          when now_value - group_session_rate_limits.window_started_at >= interval '1 hour'
            then now_value
          else group_session_rate_limits.window_started_at
        end,
        request_count = case
          when now_value - group_session_rate_limits.window_started_at >= interval '1 hour'
            then 1
          else group_session_rate_limits.request_count + 1
        end;

  select request_count
  into current_count
  from private.group_session_rate_limits
  where user_id = caller_id
    and rate_limit_action = requested_action;

  if current_count > max_requests then
    raise exception 'Rate limit exceeded. Try again later.'
      using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function private.consume_group_session_rate_limit(text)
  from public, anon, authenticated;

create or replace function public.create_group_session(
  requested_payload_session_id text,
  requested_title text,
  requested_shared_objective text,
  requested_starts_at timestamptz,
  requested_focus_minutes integer,
  requested_break_minutes integer,
  requested_meeting_url text,
  requested_organizer_name text,
  requested_opening_message text
)
returns setof public.group_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid;
  existing_owner_id uuid;
begin
  caller_id := auth.uid();
  if caller_id is null then
    raise exception 'Authentication required';
  end if;
  perform private.consume_group_session_rate_limit('create');
  if char_length(trim(requested_payload_session_id)) < 1 then
    raise exception 'Session ID is required';
  end if;

  insert into public.group_sessions (
    payload_session_id,
    owner_id,
    title,
    shared_objective,
    starts_at,
    focus_minutes,
    break_minutes,
    meeting_url,
    organizer_name,
    opening_message
  ) values (
    requested_payload_session_id,
    caller_id,
    requested_title,
    requested_shared_objective,
    requested_starts_at,
    requested_focus_minutes,
    requested_break_minutes,
    requested_meeting_url,
    requested_organizer_name,
    requested_opening_message
  )
  on conflict (payload_session_id) do nothing;

  select owner_id
  into existing_owner_id
  from public.group_sessions
  where payload_session_id = requested_payload_session_id;

  if existing_owner_id <> caller_id then
    raise exception 'Group session already belongs to another user';
  end if;

  update public.group_sessions
  set title = requested_title,
      shared_objective = requested_shared_objective,
      starts_at = requested_starts_at,
      focus_minutes = requested_focus_minutes,
      break_minutes = requested_break_minutes,
      meeting_url = requested_meeting_url,
      organizer_name = requested_organizer_name,
      opening_message = requested_opening_message,
      updated_at = now()
  where payload_session_id = requested_payload_session_id
    and owner_id = caller_id;

  return query
  select *
  from public.group_sessions
  where payload_session_id = requested_payload_session_id
    and owner_id = caller_id;
end;
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
  perform private.consume_group_session_rate_limit('join');
  if char_length(trim(requested_display_name)) not between 1 and 50 then
    raise exception 'Display name must be between 1 and 50 characters';
  end if;

  select gs.id
  into target_session_id
  from public.group_sessions as gs
  where gs.payload_session_id = requested_payload_session_id;

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
  on conflict on constraint group_session_participants_pkey do update
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

revoke all on function public.create_group_session(text, text, text, timestamptz, integer, integer, text, text, text)
  from public;
grant execute on function public.create_group_session(text, text, text, timestamptz, integer, integer, text, text, text)
  to authenticated;
revoke all on function public.join_group_session(text, text) from public;
grant execute on function public.join_group_session(text, text) to authenticated;
grant execute on function public.get_group_session_by_payload_id(text) to anon;

notify pgrst, 'reload schema';
