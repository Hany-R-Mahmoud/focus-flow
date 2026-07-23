create extension if not exists pg_cron;
create schema if not exists private;

create or replace function private.cleanup_unused_anonymous_users()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  deleted_count integer;
begin
  delete from auth.users as users
  where users.is_anonymous is true
    and users.created_at < now() - interval '30 days'
    and not exists (
      select 1
      from public.group_sessions as sessions
      where sessions.owner_id = users.id
    )
    and not exists (
      select 1
      from public.group_session_participants as participants
      where participants.user_id = users.id
    );

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function private.cleanup_unused_anonymous_users() from public;
revoke all on function private.cleanup_unused_anonymous_users() from anon;
revoke all on function private.cleanup_unused_anonymous_users() from authenticated;

select cron.unschedule(jobid)
from cron.job
where jobname = 'cleanup-unused-anonymous-users';

select cron.schedule(
  'cleanup-unused-anonymous-users',
  '0 3 * * *',
  $$select private.cleanup_unused_anonymous_users();$$
);
