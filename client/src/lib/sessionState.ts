import type { FocusSession } from "./db";

export function isClosedSessionStatus(status: FocusSession["status"]): boolean {
  return status === "completed" || status === "abandoned";
}
