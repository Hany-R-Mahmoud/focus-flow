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
  localStorage.setItem(`${ACTIVITY_LOG_KEY}_${sessionId}`, JSON.stringify(logs));

  return event;
}

export function getActivityLog(sessionId: string): ActivityEvent[] {
  try {
    const stored = localStorage.getItem(`${ACTIVITY_LOG_KEY}_${sessionId}`);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading activity log:", error);
    return [];
  }
}

export function clearActivityLog(sessionId: string): void {
  localStorage.removeItem(`${ACTIVITY_LOG_KEY}_${sessionId}`);
}

function getActivityMessage(type: ActivityEvent["type"], participantName?: string): string {
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
