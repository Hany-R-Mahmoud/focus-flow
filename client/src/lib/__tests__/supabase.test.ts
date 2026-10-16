import { describe, expect, it } from "vitest";
import { buildCreateCloudGroupSessionArgs } from "../cloudGroupSessions";
import { getDisplayNameKey, normalizeDisplayName } from "../neon";

describe("Neon group identity", () => {
  it("normalizes guest and account display names consistently", () => {
    expect(normalizeDisplayName("  Hany  ")).toBe("Hany");
    expect(getDisplayNameKey("  ALI ")).toBe("ali");
  });
});

describe("Neon cloud group-session creation", () => {
  it("maps shared invite data to the validated database RPC", () => {
    expect(buildCreateCloudGroupSessionArgs({
      version: 1,
      sessionId: "gs_test",
      title: "Focus room",
      startsAt: "2026-07-24T10:00:00.000Z",
      focusMinutes: 50,
    })).toEqual({
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
