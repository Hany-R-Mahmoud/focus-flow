import { z } from "zod";
import type { GroupSession } from "./db";
import type { Participant } from "./participants";
import {
  ensureAnonymousUser,
  getStoredDisplayName,
  isSupabaseConfigured,
  normalizeDisplayName,
  saveDisplayName,
  supabase,
  SupabaseIntegrationError,
  isCloudSessionActive,
} from "./neon";
import type { GroupSessionPayload } from "./groupSession";

const CloudGroupSessionSchema = z.object({
  id: z.string().uuid(),
  payload_session_id: z.string().min(1),
  title: z.string().min(1),
  shared_objective: z.string().nullable(),
  starts_at: z.string(),
  focus_minutes: z.number().int(),
  break_minutes: z.number().int().nullable(),
  meeting_url: z.string().nullable(),
  organizer_name: z.string().nullable(),
  opening_message: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const JoinResultSchema = z.array(
  z.object({
    session_id: z.string().uuid(),
    participant_id: z.string().min(1),
    display_name: z.string(),
    joined_at: z.string(),
  })
);

const ParticipantSchema = z.object({
  user_id: z.string().min(1),
  display_name: z.string().min(1),
  joined_at: z.string(),
});

const PresenceSchema = z.object({
  display_name: z.string().min(1),
  joined_at: z.string(),
});

export type CloudGroupSession = z.infer<typeof CloudGroupSessionSchema>;

function getClient(): NonNullable<typeof supabase> | null {
  return isCloudSessionActive() ? supabase : null;
}

function parseGroupSession(value: unknown): CloudGroupSession {
  return CloudGroupSessionSchema.parse(value);
}

export function buildCreateCloudGroupSessionArgs(payload: GroupSessionPayload) {
  return {
    requested_payload_session_id: payload.sessionId,
    requested_title: payload.title,
    requested_shared_objective: payload.sharedObjective ?? null,
    requested_starts_at: payload.startsAt,
    requested_focus_minutes: payload.focusMinutes,
    requested_break_minutes: payload.breakMinutes ?? null,
    requested_meeting_url: payload.meetingUrl ?? null,
    requested_organizer_name: payload.organizerName ?? null,
    requested_opening_message: payload.openingMessage ?? null,
  } as const;
}

export function cloudGroupSessionToLocal(
  cloudSession: CloudGroupSession,
  localId: string,
  source: GroupSession["source"],
  joinedAt?: string
): GroupSession {
  return {
    id: localId,
    payloadVersion: 1,
    payloadSessionId: cloudSession.payload_session_id,
    title: cloudSession.title,
    sharedObjective: cloudSession.shared_objective ?? undefined,
    startsAt: cloudSession.starts_at,
    focusMinutes: cloudSession.focus_minutes,
    breakMinutes: cloudSession.break_minutes ?? undefined,
    meetingUrl: cloudSession.meeting_url ?? undefined,
    organizerName: cloudSession.organizer_name ?? undefined,
    openingMessage: cloudSession.opening_message ?? undefined,
    source,
    joinedAt,
    createdAt: cloudSession.created_at,
    updatedAt: cloudSession.updated_at,
  };
}

async function getCloudSessionById(
  sessionId: string
): Promise<CloudGroupSession | null> {
  const client = getClient();
  if (!client) return null;

  const result = await client
    .from("group_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();
  if (result.error) {
    throw new SupabaseIntegrationError(
      "Failed to load the cloud group session",
      {
        cause: result.error,
      }
    );
  }
  return result.data ? parseGroupSession(result.data) : null;
}

export async function syncGroupSessionToCloud(
  payload: GroupSessionPayload,
  captchaToken?: string
): Promise<CloudGroupSession | null> {
  const client = getClient();
  if (!client) return null;

  const user = await ensureAnonymousUser(payload.organizerName, captchaToken);
  if (!user) return null;

  const result = await client.rpc(
    "create_group_session",
    buildCreateCloudGroupSessionArgs(payload)
  );
  if (result.error) {
    throw new SupabaseIntegrationError("Failed to sync the group session", {
      cause: result.error,
    });
  }
  const rows = z.array(CloudGroupSessionSchema).parse(result.data);
  const created = rows[0];
  if (!created) {
    throw new SupabaseIntegrationError(
      "Cloud group-session creation returned no session"
    );
  }
  return created;
}

export async function getCloudGroupSessionByPayloadId(
  payloadSessionId: string
): Promise<CloudGroupSession | null> {
  const client = getClient();
  if (!client) return null;

  const result = await client.rpc("get_group_session_by_payload_id", {
    requested_payload_session_id: payloadSessionId,
  });
  if (result.error) {
    throw new SupabaseIntegrationError(
      "Failed to find the cloud group session",
      {
        cause: result.error,
      }
    );
  }
  const rows = z.array(CloudGroupSessionSchema).parse(result.data);
  return rows[0] ?? null;
}

export async function deleteCloudGroupSession(
  payloadSessionId: string
): Promise<void> {
  const client = getClient();
  if (!client) return;

  const result = await client
    .from("group_sessions")
    .delete()
    .eq("payload_session_id", payloadSessionId)
    .select("id");
  if (result.error) {
    throw new SupabaseIntegrationError(
      "Failed to cancel the cloud group session",
      {
        cause: result.error,
      }
    );
  }
  if (!result.data?.length) throw new SupabaseIntegrationError("Only the organizer can cancel a connected room");
}

export async function joinCloudGroupSession(
  payloadSessionId: string,
  displayName: string,
  captchaToken?: string
): Promise<GroupSession | null> {
  const client = getClient();
  if (!client) return null;

  const normalizedName = normalizeDisplayName(displayName);
  await saveDisplayName(normalizedName, captchaToken);
  const result = await client.rpc("join_group_session", {
    requested_payload_session_id: payloadSessionId,
    requested_display_name: normalizedName,
  });
  if (result.error) {
    throw new SupabaseIntegrationError(
      "Failed to join the cloud group session",
      {
        cause: result.error,
      }
    );
  }

  const rows = JoinResultSchema.parse(result.data);
  const joined = rows[0];
  if (!joined) {
    throw new SupabaseIntegrationError("Cloud join returned no participant");
  }
  const cloudSession = await getCloudSessionById(joined.session_id);
  if (!cloudSession) {
    throw new SupabaseIntegrationError("Cloud join returned no session");
  }
  return cloudGroupSessionToLocal(
    cloudSession,
    payloadSessionId,
    "joined",
    joined.joined_at
  );
}

export async function getCloudGroupParticipants(
  payloadSessionId: string
): Promise<Participant[]> {
  const client = getClient();
  if (!client) return [];

  const cloudSession = await getCloudGroupSessionByPayloadId(payloadSessionId);
  if (!cloudSession) return [];

  const result = await client
    .from("group_session_participants")
    .select("user_id, display_name, joined_at")
    .eq("session_id", cloudSession.id)
    .order("joined_at", { ascending: true });
  if (result.error) {
    throw new SupabaseIntegrationError("Failed to load cloud participants", {
      cause: result.error,
    });
  }

  return z
    .array(ParticipantSchema)
    .parse(result.data)
    .map(participant => ({
      id: participant.user_id,
      sessionId: payloadSessionId,
      name: participant.display_name,
      joinedAt: participant.joined_at,
    }));
}

export async function subscribeToCloudGroupPresence(
  payloadSessionId: string,
  _displayName: string,
  onChange: (participants: Participant[]) => void,
  onLeave?: (displayName: string) => void
): Promise<(() => void) | null> {
  const client = getClient();
  if (!client) return null;

  let disposed = false;
  let pending = false;
  let known = new Map<string, string>();
  const poll = async () => {
    if (disposed || pending) return;
    pending = true;
    try {
      const heartbeat = await client.rpc("touch_group_session_presence", {
        requested_payload_session_id: payloadSessionId,
      });
      if (heartbeat.error) throw new SupabaseIntegrationError("Presence heartbeat failed", { cause: heartbeat.error });
      const result = await client.rpc("get_live_group_participants", {
        requested_payload_session_id: payloadSessionId,
      });
      if (result.error) throw new SupabaseIntegrationError("Unable to read live participants", { cause: result.error });
      const participants = z.array(ParticipantSchema).parse(result.data).map(p => ({
        id: p.user_id, sessionId: payloadSessionId, name: p.display_name, joinedAt: p.joined_at,
      }));
      if (!disposed) {
        const next = new Map(participants.map(p => [p.id, p.name]));
        known.forEach((name, id) => {
          if (!next.has(id)) onLeave?.(name);
        });
        known = next;
        onChange(participants);
      }
    } finally {
      pending = false;
    }
  };
  await poll();
  const interval = window.setInterval(() => {
    void poll().catch(error => console.warn("Presence polling unavailable", error));
  }, 12_000);
  return () => {
    disposed = true;
    window.clearInterval(interval);
    void client.rpc("leave_group_session_presence", {
      requested_payload_session_id: payloadSessionId,
    });
  };
}
