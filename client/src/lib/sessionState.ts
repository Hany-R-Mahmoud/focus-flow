import type { FocusSession } from "./db";

export function isClosedSessionStatus(status: FocusSession["status"]): boolean {
  return status === "completed" || status === "abandoned";
}

export function getSessionEndTime(
  startTime: number,
  durationMinutes: number,
  pausedTime = 0
): number {
  return startTime + durationMinutes * 60 * 1000 + pausedTime;
}

export function shouldAutoCompleteSession(
  status: FocusSession["status"],
  elapsedTime: number,
  totalDuration: number
): boolean {
  return (
    status === "active" && totalDuration > 0 && elapsedTime >= totalDuration
  );
}
