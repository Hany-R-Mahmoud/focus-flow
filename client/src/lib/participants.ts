import { nanoid } from "nanoid";
import { addActivityEvent } from "./activityLog";

export interface Participant {
  id: string;
  sessionId: string;
  name: string;
  joinedAt: string;
}

const PARTICIPANTS_KEY = "focusflow_participants";

export function getParticipantStorageKey(sessionId: string): string {
  return `${PARTICIPANTS_KEY}_${sessionId}`;
}

export function addParticipant(sessionId: string, name: string): Participant {
  const participant: Participant = {
    id: nanoid(),
    sessionId,
    name: name.trim() || "Anonymous",
    joinedAt: new Date().toISOString(),
  };

  // Store in localStorage
  const participants = getSessionParticipants(sessionId);
  participants.push(participant);
  localStorage.setItem(
    getParticipantStorageKey(sessionId),
    JSON.stringify(participants)
  );

  // Log activity
  addActivityEvent(sessionId, "join", participant.name);

  return participant;
}

export function getSessionParticipants(sessionId: string): Participant[] {
  try {
    const stored = localStorage.getItem(getParticipantStorageKey(sessionId));
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      participant =>
        isParticipant(participant) && participant.sessionId === sessionId
    );
  } catch (error) {
    console.error("Error reading participants:", error);
    return [];
  }
}

export function removeParticipant(
  sessionId: string,
  participantId: string
): void {
  const participants = getSessionParticipants(sessionId);
  const participant = participants.find(p => p.id === participantId);

  if (participant) {
    addActivityEvent(sessionId, "leave", participant.name);
  }

  const updated = participants.filter(p => p.id !== participantId);
  if (updated.length === 0) {
    localStorage.removeItem(getParticipantStorageKey(sessionId));
  } else {
    localStorage.setItem(
      getParticipantStorageKey(sessionId),
      JSON.stringify(updated)
    );
  }
}

export function removeParticipantByName(sessionId: string, name: string): void {
  const normalizedName = name.trim() || "Anonymous";
  const participant = getSessionParticipants(sessionId)
    .reverse()
    .find(item => item.name === normalizedName);
  if (participant) removeParticipant(sessionId, participant.id);
}

export function clearSessionParticipants(sessionId: string): void {
  localStorage.removeItem(getParticipantStorageKey(sessionId));
}

function isParticipant(value: unknown): value is Participant {
  if (!value || typeof value !== "object") return false;
  const participant = value as Record<string, unknown>;
  return (
    typeof participant.id === "string" &&
    typeof participant.sessionId === "string" &&
    typeof participant.name === "string" &&
    typeof participant.joinedAt === "string"
  );
}
