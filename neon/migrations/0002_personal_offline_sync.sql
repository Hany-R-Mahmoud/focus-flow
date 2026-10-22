-- Focus Flow personal offline-first sync (additive, independent of group rooms).
-- Run on focus_flow in both isolated Neon Preview and Production databases.
-- No browser secret, no Supabase dependency, no destructive data migration.

CREATE TABLE IF NOT EXISTS public.focus_personal_records (
  owner_id text NOT NULL CHECK (length(owner_id) BETWEEN 1 AND 200),
  kind text NOT NULL CHECK (kind IN ('template', 'session', 'review')),
  record_id text NOT NULL CHECK (length(record_id) BETWEEN 1 AND 180),
  payload jsonb,
  deleted boolean NOT NULL DEFAULT false,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, kind, record_id),
  CONSTRAINT focus_personal_payload_valid CHECK (
    (deleted AND payload IS NULL) OR
    (NOT deleted AND jsonb_typeof(payload) = 'object')
  )
);

CREATE INDEX IF NOT EXISTS focus_personal_owner_updated_idx
  ON public.focus_personal_records (owner_id, updated_at DESC);

ALTER TABLE public.focus_personal_records ENABLE ROW LEVEL SECURITY;

DO $policy$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'focus_personal_records'
      AND policyname = 'focus_personal_owner_read'
  ) THEN
    CREATE POLICY focus_personal_owner_read ON public.focus_personal_records
      FOR SELECT TO authenticated
      USING (owner_id = (SELECT auth.user_id()));
  END IF;
END
$policy$;

-- The client can read only its own rows. It cannot directly mutate owner_id.
-- All writes use a server-side compare-and-swap RPC to prevent silent overwrites.
REVOKE ALL ON TABLE public.focus_personal_records FROM PUBLIC, anonymous, authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON TABLE public.focus_personal_records TO authenticated;

CREATE OR REPLACE FUNCTION public.focus_apply_changes(requested_changes jsonb)
RETURNS TABLE (kind text, record_id text, revision bigint, applied boolean)
LANGUAGE plpgsql VOLATILE SECURITY DEFINER
SET search_path = pg_catalog, public, auth AS $function$
DECLARE
  actor text;
  item jsonb;
  item_kind text;
  item_id text;
  item_payload jsonb;
  expected_version bigint;
  remove_item boolean;
  returned_version bigint;
BEGIN
  actor := auth.user_id();
  IF actor IS NULL OR actor = '' THEN
    RAISE EXCEPTION 'Account sign-in required' USING ERRCODE = '28000';
  END IF;

  IF requested_changes IS NULL OR jsonb_typeof(requested_changes) <> 'array'
     OR jsonb_array_length(requested_changes) NOT BETWEEN 1 AND 50 THEN
    RAISE EXCEPTION 'Expected an array of 1-50 changes' USING ERRCODE = '22023';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(requested_changes) LOOP
    IF jsonb_typeof(item) <> 'object' THEN
      RAISE EXCEPTION 'Invalid change object' USING ERRCODE = '22023';
    END IF;

    item_kind := item ->> 'kind';
    item_id := item ->> 'record_id';
    IF item_kind IS NULL OR item_kind NOT IN ('template', 'session', 'review')
       OR item_id IS NULL OR length(item_id) NOT BETWEEN 1 AND 180 THEN
      RAISE EXCEPTION 'Invalid record kind or id' USING ERRCODE = '22023';
    END IF;

    IF jsonb_typeof(item -> 'expected_revision') <> 'number'
       OR (item ->> 'expected_revision') !~ '^[0-9]{1,18}$' THEN
      RAISE EXCEPTION 'Invalid expected revision' USING ERRCODE = '22023';
    END IF;
    expected_version := (item ->> 'expected_revision')::bigint;

    IF jsonb_typeof(item -> 'deleted') <> 'boolean' THEN
      RAISE EXCEPTION 'Invalid deletion flag' USING ERRCODE = '22023';
    END IF;
    remove_item := (item ->> 'deleted')::boolean;
    item_payload := CASE WHEN remove_item THEN NULL ELSE item -> 'payload' END;

    IF NOT remove_item AND (
      jsonb_typeof(item_payload) <> 'object'
      OR length(item_payload::text) > 100000
      OR item_payload ->> 'id' IS DISTINCT FROM item_id
    ) THEN
      RAISE EXCEPTION 'Invalid personal record payload' USING ERRCODE = '22023';
    END IF;

    returned_version := NULL;

    IF expected_version = 0 THEN
      INSERT INTO public.focus_personal_records AS r
        (owner_id, kind, record_id, payload, deleted)
      VALUES (actor, item_kind, item_id, item_payload, remove_item)
      ON CONFLICT (owner_id, kind, record_id) DO NOTHING
      RETURNING r.revision INTO returned_version;
    ELSE
      UPDATE public.focus_personal_records AS r
        SET payload = item_payload,
            deleted = remove_item,
            revision = r.revision + 1,
            updated_at = now()
      WHERE r.owner_id = actor AND r.kind = item_kind
        AND r.record_id = item_id AND r.revision = expected_version
      RETURNING r.revision INTO returned_version;
    END IF;

    kind := item_kind;
    record_id := item_id;
    revision := returned_version;
    applied := (returned_version IS NOT NULL);
    RETURN NEXT;
  END LOOP;
END
$function$;

REVOKE ALL ON FUNCTION public.focus_apply_changes(jsonb) FROM PUBLIC, anonymous;
GRANT EXECUTE ON FUNCTION public.focus_apply_changes(jsonb) TO authenticated;
