import { nanoid } from "nanoid";

export interface ActivityEvent {
  id: string;
  sessionId: string;
  type: "join" | "leave" | "session-start" | "session-end";
  participantName?: string;
  timestamp: string;
  message: string;
}

const ACTIVITY_LOG_KEY = "focusflow_activity_log";
export type GroupSessionLocalField =
  | "intention"
  | "outcome"
  | "reflection"
  | "interruptions";

export function getActivityLogStorageKey(sessionId: string): string {
  return `${ACTIVITY_LOG_KEY}_${sessionId}`;
}

export function getGroupSessionLocalStorageKey(
  field: GroupSessionLocalField,
  sessionId: string
): string {
  return `focusflow_group_${field}_${sessionId}`;
}

export function readGroupSessionLocalText(
  field: Exclude<GroupSessionLocalField, "interruptions">,
  sessionId: string
): string {
  try {
    return (
      localStorage.getItem(getGroupSessionLocalStorageKey(field, sessionId)) ||
      ""
    );
  } catch (error) {
    console.error("Error reading group session data:", error);
    return "";
  }
}

export function writeGroupSessionLocalText(
  field: Exclude<GroupSessionLocalField, "interruptions">,
  sessionId: string,
  value: string
): void {
  try {
    localStorage.setItem(
      getGroupSessionLocalStorageKey(field, sessionId),
      value
    );
  } catch (error) {
    console.error("Error writing group session data:", error);
  }
}

export function readGroupSessionLocalJson<T>(
  field: GroupSessionLocalField,
  sessionId: string,
  fallback: T,
  isValue: (value: unknown) => value is T
): T {
  try {
    const stored = localStorage.getItem(
      getGroupSessionLocalStorageKey(field, sessionId)
    );
    if (!stored) return fallback;
    const parsed: unknown = JSON.parse(stored);
    return isValue(parsed) ? parsed : fallback;
  } catch (error) {
    console.error("Error reading group session data:", error);
    return fallback;
  }
}

export function writeGroupSessionLocalJson<T>(
  field: GroupSessionLocalField,
  sessionId: string,
  value: T
): void {
  try {
    localStorage.setItem(
      getGroupSessionLocalStorageKey(field, sessionId),
      JSON.stringify(value)
    );
  } catch (error) {
    console.error("Error writing group session data:", error);
  }
}

export function addActivityEvent(
  sessionId: string,
  type: ActivityEvent["type"],
  participantName?: string
): ActivityEvent {
  const event: ActivityEvent = {
    id: nanoid(),
    sessionId,
    type,
    participantName,
    timestamp: new Date().toISOString(),
    message: getActivityMessage(type, participantName),
  };

  // Store in localStorage
  const logs = getActivityLog(sessionId);
  logs.push(event);
  localStorage.setItem(
    getActivityLogStorageKey(sessionId),
    JSON.stringify(logs)
  );

  return event;
}

export function getActivityLog(sessionId: string): ActivityEvent[] {
  try {
    const stored = localStorage.getItem(getActivityLogStorageKey(sessionId));
    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      event => isActivityEvent(event) && event.sessionId === sessionId
    );
  } catch (error) {
    console.error("Error reading activity log:", error);
    return [];
  }
}

export function clearActivityLog(sessionId: string): void {
  localStorage.removeItem(getActivityLogStorageKey(sessionId));
}

function isActivityEvent(value: unknown): value is ActivityEvent {
  if (!value || typeof value !== "object") return false;
  const event = value as Record<string, unknown>;
  return (
    typeof event.id === "string" &&
    typeof event.sessionId === "string" &&
    typeof event.type === "string" &&
    ["join", "leave", "session-start", "session-end"].includes(event.type) &&
    typeof event.timestamp === "string" &&
    typeof event.message === "string"
  );
}

function getActivityMessage(
  type: ActivityEvent["type"],
  participantName?: string
): string {
  switch (type) {
    case "join":
      return `${participantName || "Someone"} joined the session`;
    case "leave":
      return `${participantName || "Someone"} left the session`;
    case "session-start":
      return "Session started";
    case "session-end":
      return "Session ended";
    default:
      return "Activity event";
  }
}

export function formatActivityTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
