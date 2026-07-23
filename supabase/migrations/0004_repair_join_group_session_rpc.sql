drop function if exists public.join_group_session(text, text);

create function public.join_group_session(
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

revoke all on function public.join_group_session(text, text) from public;
grant execute on function public.join_group_session(text, text) to authenticated;

notify pgrst, 'reload schema';
