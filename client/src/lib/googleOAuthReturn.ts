/**
 * Remember an explicit Google sign-in attempt across the third-party redirect.
 *
 * Some OAuth providers return to the app root instead of the requested
 * callbackURL. Only recover that journey after Neon Auth confirms a session.
 * sessionStorage is tab-scoped: regular visitors and guest sessions stay put.
 */
const GOOGLE_OAUTH_STARTED_KEY = "focusflow_google_oauth_started_at";
const GOOGLE_OAUTH_MAX_AGE_MS = 15 * 60 * 1000;

export interface OAuthReturnStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function markGoogleOAuthStarted(
  storage: OAuthReturnStorage,
  now = Date.now()
): void {
  storage.setItem(GOOGLE_OAUTH_STARTED_KEY, String(now));
}

export function clearGoogleOAuthStarted(storage: OAuthReturnStorage): void {
  storage.removeItem(GOOGLE_OAUTH_STARTED_KEY);
}

function hasRecentGoogleOAuthAttempt(
  storage: OAuthReturnStorage,
  now: number
): boolean {
  const raw = storage.getItem(GOOGLE_OAUTH_STARTED_KEY);
  if (raw === null) return false;

  const startedAt = Number(raw);
  if (
    !Number.isSafeInteger(startedAt) ||
    startedAt <= 0 ||
    startedAt > now ||
    now - startedAt > GOOGLE_OAUTH_MAX_AGE_MS
  ) {
    clearGoogleOAuthStarted(storage);
    return false;
  }
  return true;
}

/**
 * Returns true only when an authenticated Google OAuth return landed at "/".
 * Do not automatically redirect ordinary signed-in visits to the public home.
 * Successful returns to "/dashboard" simply clear the pending marker.
 *
 * If the callback has no valid session, leave the visitor on the public page;
 * this never treats an OAuth attempt marker as authentication.
 */
export function shouldRecoverGoogleOAuthReturn(
  pathname: string,
  hasAuthenticatedUser: boolean,
  storage: OAuthReturnStorage,
  now = Date.now()
): boolean {
  if (!hasRecentGoogleOAuthAttempt(storage, now)) return false;

  if (pathname === "/dashboard") {
    clearGoogleOAuthStarted(storage);
    return false;
  }

  if (pathname !== "/" || !hasAuthenticatedUser) return false;

  clearGoogleOAuthStarted(storage);
  return true;
}
