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

revoke all on function public.create_group_session(text, text, text, timestamptz, integer, integer, text, text, text) from public;
grant execute on function public.create_group_session(text, text, text, timestamptz, integer, integer, text, text, text) to authenticated;
