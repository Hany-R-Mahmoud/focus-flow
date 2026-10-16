-- Focus Flow Neon group collaboration. Run in Neon SQL editor on a new database.
-- This migration is additive; never apply to an unrelated project's public schema.

CREATE TABLE IF NOT EXISTS public.group_sessions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 payload_session_id text NOT NULL UNIQUE CHECK (length(payload_session_id) BETWEEN 4 AND 96 AND payload_session_id LIKE 'gs_%'),
 owner_id text NOT NULL,
 title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 100),
 shared_objective text CHECK (length(shared_objective) <= 300),
 starts_at timestamptz NOT NULL,
 focus_minutes integer NOT NULL CHECK (focus_minutes BETWEEN 5 AND 240),
 break_minutes integer CHECK (break_minutes BETWEEN 0 AND 120),
 meeting_url text CHECK (length(meeting_url) <= 2048 AND meeting_url LIKE 'https://%'),
 organizer_name text CHECK (length(organizer_name) <= 50),
 opening_message text CHECK (length(opening_message) <= 500),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_session_participants (
 session_id uuid NOT NULL REFERENCES public.group_sessions(id) ON DELETE CASCADE,
 user_id text NOT NULL,
 display_name text NOT NULL CHECK (length(btrim(display_name)) BETWEEN 1 AND 50),
 joined_at timestamptz NOT NULL DEFAULT now(),
 last_seen_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(session_id,user_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS group_session_unique_display_name ON public.group_session_participants(session_id,lower(btrim(display_name)));

CREATE INDEX IF NOT EXISTS group_session_presence_idx ON public.group_session_participants(session_id,last_seen_at DESC);

CREATE TABLE IF NOT EXISTS public.focus_group_rate_limits (
 identity_key text NOT NULL,
 action text NOT NULL,
 window_start timestamptz NOT NULL,
 hits integer NOT NULL CHECK(hits>0),
 PRIMARY KEY(identity_key,action,window_start)
);

ALTER TABLE public.group_sessions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.group_session_participants ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.focus_group_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_group_session_member(target_session_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public, auth AS $$
 SELECT auth.user_id() IS NOT NULL AND (
 EXISTS(SELECT 1 FROM public.group_sessions g WHERE g.id=target_session_id AND g.owner_id=auth.user_id())
 OR EXISTS(SELECT 1 FROM public.group_session_participants p WHERE p.session_id=target_session_id AND p.user_id=auth.user_id())
 )
$$;

CREATE POLICY "Group members read sessions" ON public.group_sessions FOR SELECT TO authenticated USING(public.is_group_session_member(id));

CREATE POLICY "Owners cancel sessions" ON public.group_sessions FOR DELETE TO authenticated USING(owner_id=auth.user_id());

CREATE POLICY "Group members read participant history" ON public.group_session_participants FOR SELECT TO authenticated USING(public.is_group_session_member(session_id));

CREATE OR REPLACE FUNCTION public._focus_group_limit(requested_action text, allowed_hits integer)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = pg_catalog, public, auth AS $$
DECLARE hits_now integer; actor text;
BEGIN
 actor := auth.user_id();
 IF actor IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE='28000'; END IF;
 INSERT INTO public.focus_group_rate_limits(identity_key,action,window_start,hits)
 VALUES(actor,requested_action,date_trunc('minute',now()),1)
 ON CONFLICT(identity_key,action,window_start) DO UPDATE
 SET hits=public.focus_group_rate_limits.hits+1
 WHERE public.focus_group_rate_limits.hits < allowed_hits
 RETURNING hits INTO hits_now;
 IF hits_now IS NULL THEN RAISE EXCEPTION 'Too many requests, please retry later' USING ERRCODE='P0001'; END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.create_group_session(
 requested_payload_session_id text, requested_title text,
 requested_shared_objective text, requested_starts_at timestamptz,
 requested_focus_minutes integer, requested_break_minutes integer,
 requested_meeting_url text, requested_organizer_name text, requested_opening_message text
) RETURNS SETOF public.group_sessions LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public,auth AS $$
DECLARE actor text; session_row public.group_sessions; display text;
BEGIN
 actor:=auth.user_id();
 IF actor IS NULL THEN RAISE EXCEPTION 'Sign in to create a cloud room' USING ERRCODE='28000'; END IF;
 PERFORM public._focus_group_limit('create',6);
 display:=left(coalesce(nullif(btrim(requested_organizer_name),''),'Organizer'),50);
 INSERT INTO public.group_sessions(payload_session_id,owner_id,title,shared_objective,starts_at,focus_minutes,break_minutes,meeting_url,organizer_name,opening_message)
 VALUES(requested_payload_session_id,actor,requested_title,requested_shared_objective,requested_starts_at,requested_focus_minutes,requested_break_minutes,requested_meeting_url,display,requested_opening_message)
 RETURNING * INTO session_row;
 INSERT INTO public.group_session_participants(session_id,user_id,display_name)
 VALUES(session_row.id,actor,display);
 RETURN NEXT session_row;
END
$$;

CREATE OR REPLACE FUNCTION public.get_group_session_by_payload_id(requested_payload_session_id text)
RETURNS SETOF public.group_sessions LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,auth AS $$
BEGIN
 IF auth.user_id() IS NULL THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='28000'; END IF;
 RETURN QUERY SELECT * FROM public.group_sessions WHERE payload_session_id=requested_payload_session_id LIMIT 1;
END
$$;

CREATE OR REPLACE FUNCTION public.join_group_session(requested_payload_session_id text,requested_display_name text)
RETURNS TABLE(session_id uuid,participant_id text,display_name text,joined_at timestamptz)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public,auth AS $$
DECLARE target_id uuid; actor text; added_at timestamptz;
BEGIN
 actor:=auth.user_id();
 IF actor IS NULL THEN RAISE EXCEPTION 'Sign in to join a cloud room' USING ERRCODE='28000'; END IF;
 IF requested_display_name IS NULL OR length(btrim(requested_display_name)) NOT BETWEEN 1 AND 50 THEN RAISE EXCEPTION 'Invalid display name' USING ERRCODE='22023'; END IF;
 PERFORM public._focus_group_limit('join',12);
 SELECT id INTO target_id FROM public.group_sessions WHERE payload_session_id=requested_payload_session_id;
 IF target_id IS NULL THEN RAISE EXCEPTION 'Room not found' USING ERRCODE='P0002'; END IF;
 INSERT INTO public.group_session_participants(session_id,user_id,display_name)
 VALUES(target_id,actor,btrim(requested_display_name))
 ON CONFLICT(session_id,user_id) DO UPDATE SET display_name=excluded.display_name,last_seen_at=now()
 RETURNING public.group_session_participants.joined_at INTO added_at;
 RETURN QUERY SELECT target_id,actor,btrim(requested_display_name),added_at;
END
$$;

CREATE OR REPLACE FUNCTION public.touch_group_session_presence(requested_payload_session_id text)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public,auth AS $$
DECLARE target_id uuid;
BEGIN
 SELECT id INTO target_id FROM public.group_sessions WHERE payload_session_id=requested_payload_session_id;
 IF target_id IS NULL OR NOT public.is_group_session_member(target_id) THEN RAISE EXCEPTION 'Not a member' USING ERRCODE='42501'; END IF;
 UPDATE public.group_session_participants SET last_seen_at=now() WHERE session_id=target_id AND user_id=auth.user_id();
END
$$;

CREATE OR REPLACE FUNCTION public.leave_group_session_presence(requested_payload_session_id text)
RETURNS void LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public,auth AS $$
DECLARE target_id uuid;
BEGIN
 SELECT id INTO target_id FROM public.group_sessions WHERE payload_session_id=requested_payload_session_id;
 IF target_id IS NULL OR NOT public.is_group_session_member(target_id) THEN RAISE EXCEPTION 'Not a member' USING ERRCODE='42501'; END IF;
 UPDATE public.group_session_participants SET last_seen_at='epoch'::timestamptz WHERE session_id=target_id AND user_id=auth.user_id();
END
$$;

CREATE OR REPLACE FUNCTION public.get_live_group_participants(requested_payload_session_id text)
RETURNS TABLE(user_id text,display_name text,joined_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,auth AS $$
DECLARE target_id uuid;
BEGIN
 SELECT id INTO target_id FROM public.group_sessions WHERE payload_session_id=requested_payload_session_id;
 IF target_id IS NULL OR NOT public.is_group_session_member(target_id) THEN RAISE EXCEPTION 'Not a member' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT p.user_id,p.display_name,p.joined_at FROM public.group_session_participants p
 WHERE p.session_id=target_id AND p.last_seen_at >= now()-interval '45 seconds'
 ORDER BY p.joined_at;
END
$$;

REVOKE ALL ON TABLE public.group_sessions, public.group_session_participants, public.focus_group_rate_limits FROM PUBLIC, anonymous, authenticated;

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT, DELETE ON public.group_sessions TO authenticated;

GRANT SELECT ON public.group_session_participants TO authenticated;

REVOKE ALL ON FUNCTION public._focus_group_limit(text,integer), public.is_group_session_member(uuid),
 public.create_group_session(text,text,text,timestamptz,integer,integer,text,text,text),
 public.join_group_session(text,text),public.get_group_session_by_payload_id(text),
 public.touch_group_session_presence(text),public.leave_group_session_presence(text),
 public.get_live_group_participants(text) FROM PUBLIC,anonymous;

GRANT EXECUTE ON FUNCTION public.is_group_session_member(uuid),
 public.create_group_session(text,text,text,timestamptz,integer,integer,text,text,text),
 public.join_group_session(text,text),public.get_group_session_by_payload_id(text),
 public.touch_group_session_presence(text),public.leave_group_session_presence(text),
 public.get_live_group_participants(text) TO authenticated;
