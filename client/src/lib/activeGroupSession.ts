const ACTIVE_GROUP_SESSION_KEY = "focusflow_active_group_session";
const ACTIVE_GROUP_SESSION_TTL_MS = 120_000;

interface ActiveGroupSessionState {
  readonly sessionKey: string;
  readonly updatedAt: number;
}

function readActiveGroupSession(): ActiveGroupSessionState | null {
  try {
    const raw = localStorage.getItem(ACTIVE_GROUP_SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("sessionKey" in parsed) ||
      !("updatedAt" in parsed)
    ) {
      return null;
    }
    if (
      typeof parsed.sessionKey !== "string" ||
      typeof parsed.updatedAt !== "number"
    ) {
      return null;
    }
    return {
      sessionKey: parsed.sessionKey,
      updatedAt: parsed.updatedAt,
    };
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof DOMException) {
      return null;
    }
    throw error;
  }
}

export function claimActiveGroupSession(sessionKey: string): boolean {
  const current = readActiveGroupSession();
  const isFresh =
    current !== null &&
    Date.now() - current.updatedAt < ACTIVE_GROUP_SESSION_TTL_MS;

  if (isFresh && current.sessionKey !== sessionKey) return false;

  localStorage.setItem(
    ACTIVE_GROUP_SESSION_KEY,
    JSON.stringify({ sessionKey, updatedAt: Date.now() })
  );
  return true;
}

export function refreshActiveGroupSession(sessionKey: string): void {
  const current = readActiveGroupSession();
  if (current?.sessionKey !== sessionKey) return;

  localStorage.setItem(
    ACTIVE_GROUP_SESSION_KEY,
    JSON.stringify({ sessionKey, updatedAt: Date.now() })
  );
}

export function releaseActiveGroupSession(sessionKey: string): void {
  const current = readActiveGroupSession();
  if (current?.sessionKey === sessionKey) {
    localStorage.removeItem(ACTIVE_GROUP_SESSION_KEY);
  }
}
