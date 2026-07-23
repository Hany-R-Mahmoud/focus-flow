import { describe, expect, it } from "vitest";
import { buildCreateCloudGroupSessionArgs } from "../cloudGroupSessions";
import { readSupabaseConfig } from "../supabase";

describe("Supabase configuration", () => {
  it("keeps cloud mode disabled when no environment values exist", () => {
    expect(readSupabaseConfig({})).toBeNull();
  });

  it("rejects partially configured cloud mode", () => {
    expect(() =>
      readSupabaseConfig({ VITE_SUPABASE_URL: "https://example.supabase.co" })
    ).toThrow("requires both");
  });

  it("accepts a valid project URL and publishable key", () => {
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: "https://example.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      })
    ).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_test",
    });
  });

  it("keeps the Turnstile site key public and trims it", () => {
    expect(
      readSupabaseConfig({
        VITE_SUPABASE_URL: "https://example.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
        VITE_TURNSTILE_SITE_KEY: "  site-key  ",
      })
    ).toEqual({
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_test",
      turnstileSiteKey: "site-key",
    });
  });
});

describe("cloud group-session creation", () => {
  it("maps the invite payload to the owner RPC contract", () => {
    expect(
      buildCreateCloudGroupSessionArgs({
        version: 1,
        sessionId: "gs_test",
        title: "Focus room",
        startsAt: "2026-07-24T10:00:00.000Z",
        focusMinutes: 50,
      })
    ).toEqual({
      requested_payload_session_id: "gs_test",
      requested_title: "Focus room",
      requested_shared_objective: null,
      requested_starts_at: "2026-07-24T10:00:00.000Z",
      requested_focus_minutes: 50,
      requested_break_minutes: null,
      requested_meeting_url: null,
      requested_organizer_name: null,
      requested_opening_message: null,
    });
  });
});
