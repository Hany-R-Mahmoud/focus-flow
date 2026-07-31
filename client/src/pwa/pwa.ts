export const PWA_DISMISSAL_DAYS = 7;
export const PWA_INSTALLED_HINT_DAYS = 30;
export const PWA_DISMISSED_AT_KEY = "focusflow-pwa-dismissed-at";
export const PWA_INSTALLED_HINT_AT_KEY = "focusflow-pwa-installed-hint-at";
export const PWA_HASH_PARAM = "__pwa_hash";

export type PwaPlatform = "android" | "ios" | "desktop";
export type InstallOutcome = "accepted" | "dismissed" | "unavailable";

export interface BeforeInstallPromptEventLike {
  preventDefault: () => void;
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function defaultUserAgent(): string {
  return typeof navigator === "undefined" ? "" : navigator.userAgent;
}

export function classifyPlatform(userAgent = defaultUserAgent()): PwaPlatform {
  const value = userAgent.toLowerCase();
  if (/android/.test(value)) return "android";
  if (/iphone|ipad|ipod/.test(value)) return "ios";
  return "desktop";
}

export function isLikelyWebView(userAgent = defaultUserAgent()): boolean {
  const value = userAgent.toLowerCase();
  const embeddedMarkers =
    /\bwv\b|; wv\)|fbav|fban|instagram|line\b|micromessenger|pinterest|snapchat|tiktok|twitter|gsa\//;

  if (embeddedMarkers.test(value)) return true;

  const isAppleDevice = /iphone|ipad|ipod/.test(value);
  const hasBrowserToken = /safari|crios|fxios|edgios|opios/.test(value);
  return isAppleDevice && !hasBrowserToken;
}

export function isStandalone(
  source: Pick<Window, "matchMedia" | "navigator"> = window
): boolean {
  return (
    source.matchMedia?.("(display-mode: standalone)").matches === true ||
    Reflect.get(source.navigator, "standalone") === true
  );
}

export function isBeforeInstallPromptEvent(
  value: unknown
): value is BeforeInstallPromptEventLike {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<BeforeInstallPromptEventLike>;
  return (
    typeof candidate.preventDefault === "function" &&
    typeof candidate.prompt === "function" &&
    candidate.userChoice !== undefined &&
    typeof (candidate.userChoice as Promise<unknown>).then === "function"
  );
}

export async function invokeInstallPrompt(
  event: BeforeInstallPromptEventLike
): Promise<InstallOutcome> {
  try {
    await event.prompt();
    const choice = await event.userChoice;
    return choice.outcome;
  } catch {
    return "unavailable";
  }
}

export function readTimestamp(
  key: string,
  storage: Storage | null = typeof window === "undefined"
    ? null
    : window.localStorage,
  now = Date.now()
): number | null {
  try {
    const value = Number(storage?.getItem(key));
    if (!Number.isFinite(value) || value <= 0 || value > now) return null;
    return value;
  } catch {
    return null;
  }
}

export function writeTimestamp(
  key: string,
  timestamp = Date.now(),
  storage: Storage | null = typeof window === "undefined"
    ? null
    : window.localStorage
): boolean {
  try {
    storage?.setItem(key, String(timestamp));
    return storage !== null;
  } catch {
    return false;
  }
}

export function removeTimestamp(
  key: string,
  storage: Storage | null = typeof window === "undefined"
    ? null
    : window.localStorage
): void {
  try {
    storage?.removeItem(key);
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
}

export function isTimestampActive(
  timestamp: number | null,
  durationMs: number,
  now = Date.now()
): boolean {
  return timestamp !== null && now >= timestamp && now - timestamp < durationMs;
}

export function buildAndroidIntentUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    const fallbackUrl = parsed.toString();
    if (parsed.hash) {
      parsed.searchParams.set(PWA_HASH_PARAM, parsed.hash.slice(1));
      parsed.hash = "";
    }

    const target = parsed.toString().replace(/^https?:\/\//, "");
    const scheme = parsed.protocol.slice(0, -1);
    return `intent://${target}#Intent;scheme=${scheme};S.browser_fallback_url=${encodeURIComponent(fallbackUrl)};end`;
  } catch {
    return null;
  }
}

export function restoreHashFromLocation(
  location: Pick<Location, "href" | "search" | "hash"> = window.location,
  historyObject: Pick<History, "replaceState"> = window.history
): boolean {
  try {
    const parsed = new URL(location.href);
    const transportedHash = parsed.searchParams.get(PWA_HASH_PARAM);
    if (transportedHash === null) return false;

    parsed.searchParams.delete(PWA_HASH_PARAM);
    parsed.hash = transportedHash ? `#${transportedHash}` : "";
    historyObject.replaceState(null, "", parsed.toString());
    return true;
  } catch {
    return false;
  }
}

export async function copyText(value: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Use the visible-selectable fallback below.
  }
  return false;
}

export function getCurrentUrl(): string {
  return typeof window === "undefined" ? "" : window.location.href;
}
