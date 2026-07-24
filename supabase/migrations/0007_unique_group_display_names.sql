create unique index group_session_participants_session_display_name_key
on public.group_session_participants (
  session_id,
  lower(
    regexp_replace(
      normalize(display_name, NFKC),
      '^[[:space:]]+|[[:space:]]+$',
      '',
      'g'
    )
  )
);
