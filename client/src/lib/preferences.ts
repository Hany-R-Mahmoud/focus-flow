export interface UserPreferences {
  keepScreenAwake: boolean;
  completionSound: boolean;
  completionHaptics: boolean;
  personalNotifications: boolean;
}

export const defaultUserPreferences: UserPreferences = {
  keepScreenAwake: false,
  completionSound: false,
  completionHaptics: false,
  personalNotifications: false,
};

const PREFERENCES_STORAGE_KEY = "focusflow_preferences";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function loadUserPreferences(): UserPreferences {
  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return defaultUserPreferences;
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return defaultUserPreferences;

    return {
      keepScreenAwake:
        typeof parsed.keepScreenAwake === "boolean"
          ? parsed.keepScreenAwake
          : defaultUserPreferences.keepScreenAwake,
      completionSound:
        typeof parsed.completionSound === "boolean"
          ? parsed.completionSound
          : defaultUserPreferences.completionSound,
      completionHaptics:
        typeof parsed.completionHaptics === "boolean"
          ? parsed.completionHaptics
          : defaultUserPreferences.completionHaptics,
      personalNotifications:
        typeof parsed.personalNotifications === "boolean"
          ? parsed.personalNotifications
          : defaultUserPreferences.personalNotifications,
    };
  } catch {
    return defaultUserPreferences;
  }
}

export function saveUserPreferences(
  preferences: UserPreferences
): UserPreferences {
  try {
    window.localStorage.setItem(
      PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences)
    );
  } catch {
    // Preferences are a progressive enhancement and do not block sessions.
  }
  return preferences;
}

export function updateUserPreferences(
  patch: Partial<UserPreferences>
): UserPreferences {
  return saveUserPreferences({ ...loadUserPreferences(), ...patch });
}
