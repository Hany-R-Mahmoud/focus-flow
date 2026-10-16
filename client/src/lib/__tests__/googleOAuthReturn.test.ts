import { describe, expect, it } from "vitest";
import {
  markGoogleOAuthStarted,
  clearGoogleOAuthStarted,
  shouldRecoverGoogleOAuthReturn,
  type OAuthReturnStorage,
} from "../googleOAuthReturn";

function memoryStorage(): OAuthReturnStorage {
  const entries = new Map<string, string>();
  return {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => { entries.set(key, value); },
    removeItem: key => { entries.delete(key); },
  };
}

const start = 1_800_000_000_000;

describe("Google OAuth return recovery", () => {
  it("sends a validated Google return from the public home to dashboard exactly once", () => {
    const tab = memoryStorage();
    markGoogleOAuthStarted(tab, start);
    expect(shouldRecoverGoogleOAuthReturn("/", true, tab, start + 2_000)).toBe(true);
    expect(shouldRecoverGoogleOAuthReturn("/", true, tab, start + 2_100)).toBe(false);
  });

  it("does not hijack a normal logged-in visitor opening the public home", () => {
    expect(shouldRecoverGoogleOAuthReturn("/", true, memoryStorage(), start)).toBe(false);
  });

  it("does not mistake a pending redirect for authentication", () => {
    const tab = memoryStorage();
    markGoogleOAuthStarted(tab, start);
    expect(shouldRecoverGoogleOAuthReturn("/", false, tab, start + 1_000)).toBe(false);
    // A later Neon Auth session restoration can still complete the same flow.
    expect(shouldRecoverGoogleOAuthReturn("/", true, tab, start + 2_000)).toBe(true);
  });

  it("does not interfere with email login, account management or the guest route", () => {
    const tab = memoryStorage();
    markGoogleOAuthStarted(tab, start);
    for (const path of ["/auth/login", "/auth/signup", "/settings", "/group-sessions"]) {
      expect(shouldRecoverGoogleOAuthReturn(path, true, tab, start + 100)).toBe(false);
    }
  });

  it("does not redirect again if Neon lands on dashboard directly", () => {
    const tab = memoryStorage();
    markGoogleOAuthStarted(tab, start);
    expect(shouldRecoverGoogleOAuthReturn("/dashboard", true, tab, start + 100)).toBe(false);
    expect(shouldRecoverGoogleOAuthReturn("/", true, tab, start + 200)).toBe(false);
  });

  it("expires abandoned OAuth requests instead of trapping a later visit", () => {
    const tab = memoryStorage();
    markGoogleOAuthStarted(tab, start);
    expect(shouldRecoverGoogleOAuthReturn("/", true, tab, start + 15 * 60_000 + 1)).toBe(false);
    expect(shouldRecoverGoogleOAuthReturn("/", true, tab, start + 1_000)).toBe(false);
  });

  it("ignores malformed or future-dated return markers", () => {
    const tab = memoryStorage();
    tab.setItem("focusflow_google_oauth_started_at", "not-a-timestamp");
    expect(shouldRecoverGoogleOAuthReturn("/", true, tab, start)).toBe(false);
    markGoogleOAuthStarted(tab, start + 10_000);
    expect(shouldRecoverGoogleOAuthReturn("/", true, tab, start)).toBe(false);
  });

  it("is tab-scoped and cannot redirect another guest browser tab", () => {
    const initiatingTab = memoryStorage();
    const guestTab = memoryStorage();
    markGoogleOAuthStarted(initiatingTab, start);
    expect(shouldRecoverGoogleOAuthReturn("/", true, guestTab, start + 100)).toBe(false);
    expect(shouldRecoverGoogleOAuthReturn("/", true, initiatingTab, start + 100)).toBe(true);
  });

  it("allows the visitor to cancel the pending sign-in and continue as a guest", () => {
    const tab = memoryStorage();
    markGoogleOAuthStarted(tab, start);
    clearGoogleOAuthStarted(tab);
    expect(shouldRecoverGoogleOAuthReturn("/", true, tab, start + 100)).toBe(false);
  });
});
