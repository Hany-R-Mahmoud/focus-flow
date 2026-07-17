import { nanoid } from "nanoid";
import { addActivityEvent } from "./activityLog";

export interface Participant {
  id: string;
  sessionId: string;
  name: string;
  joinedAt: string;
}

const PARTICIPANTS_KEY = "focusflow_participants";

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
  localStorage.setItem(`${PARTICIPANTS_KEY}_${sessionId}`, JSON.stringify(participants));

  // Log activity
  addActivityEvent(sessionId, "join", participant.name);

  return participant;
}

export function getSessionParticipants(sessionId: string): Participant[] {
  try {
    const stored = localStorage.getItem(`${PARTICIPANTS_KEY}_${sessionId}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading participants:", error);
    return [];
  }
}

export function removeParticipant(sessionId: string, participantId: string): void {
  const participants = getSessionParticipants(sessionId);
  const participant = participants.find((p) => p.id === participantId);
  
  if (participant) {
    addActivityEvent(sessionId, "leave", participant.name);
  }

  const updated = participants.filter((p) => p.id !== participantId);
  localStorage.setItem(`${PARTICIPANTS_KEY}_${sessionId}`, JSON.stringify(updated));
}

export function clearSessionParticipants(sessionId: string): void {
  localStorage.removeItem(`${PARTICIPANTS_KEY}_${sessionId}`);
}
