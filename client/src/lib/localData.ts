const LOCAL_DATA_PREFIX = "focusflow_";

const GROUP_SESSION_LOCAL_KEYS = [
  "participants",
  "activity_log",
  "group_intention",
  "group_outcome",
  "group_reflection",
  "group_interruptions",
] as const;

export function exportLocalData(): Record<string, string> {
  if (typeof localStorage === "undefined") return {};

  const data: Record<string, string> = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(LOCAL_DATA_PREFIX)) {
      const value = localStorage.getItem(key);
      if (value !== null) data[key] = value;
    }
  }
  return data;
}

export function importLocalData(data: unknown): void {
  validateLocalData(data);
  if (data === undefined) return;

  for (const [key, value] of Object.entries(data as Record<string, string>))
    localStorage.setItem(key, value);
}

export function replaceLocalData(data: unknown): void {
  validateLocalData(data);
  if (typeof localStorage === "undefined") return;

  const previousData = exportLocalData();
  const nextData = data === undefined ? {} : (data as Record<string, string>);
  try {
    for (const [key, value] of Object.entries(nextData)) {
      localStorage.setItem(key, value);
    }
    for (const key of Object.keys(previousData)) {
      if (!(key in nextData)) localStorage.removeItem(key);
    }
  } catch (error) {
    try {
      const currentData = exportLocalData();
      for (const key of Object.keys(currentData)) {
        if (!(key in previousData)) localStorage.removeItem(key);
      }
      for (const [key, value] of Object.entries(previousData)) {
        localStorage.setItem(key, value);
      }
    } catch (rollbackError) {
      throw new Error(
        `Local data replacement failed and rollback failed: ${String(rollbackError)}`
      );
    }
    throw error;
  }
}

export function validateLocalData(data: unknown): void {
  if (data === undefined) return;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Invalid local data");
  }

  for (const [key, value] of Object.entries(data)) {
    if (!key.startsWith(LOCAL_DATA_PREFIX) || typeof value !== "string") {
      throw new Error("Invalid local data entry");
    }
    if (value.length > 500_000)
      throw new Error("Local data entry is too large");
  }
}

export function clearLocalData(): void {
  if (typeof localStorage === "undefined") return;

  const keysToRemove: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(LOCAL_DATA_PREFIX)) keysToRemove.push(key);
  }
  for (const key of keysToRemove) localStorage.removeItem(key);
}

export function clearGroupSessionLocalData(sessionId: string): void {
  if (typeof localStorage === "undefined") return;

  for (const keyPrefix of GROUP_SESSION_LOCAL_KEYS) {
    localStorage.removeItem(`${LOCAL_DATA_PREFIX}${keyPrefix}_${sessionId}`);
  }
}
