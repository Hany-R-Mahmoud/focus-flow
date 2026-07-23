import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calculateSessionStatus,
  calculateTimeRemaining,
  decodePayload,
  encodePayload,
  validatePayload,
} from "../groupSession";

const startsAt = "2026-07-23T14:00:00.000Z";

describe("group session payloads and timing", () => {
  afterEach(() => vi.useRealTimers());

  it("round-trips Unicode payloads", () => {
    vi.setSystemTime(new Date("2026-07-23T13:00:00.000Z"));
    const payload = {
      version: 1,
      sessionId: "gs_test",
      title: "深 focus 🚀",
      startsAt,
      focusMinutes: 25,
      breakMinutes: 5,
    };

    expect(decodePayload(encodePayload(payload))).toEqual(payload);
  });

  it("rejects non-finite durations and past starts", () => {
    vi.setSystemTime(new Date("2026-07-23T13:00:00.000Z"));
    const result = validatePayload({
      version: 1,
      sessionId: "gs_test",
      title: "Focus",
      startsAt: "2026-07-23T12:00:00.000Z",
      focusMinutes: Number.NaN,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        "Start time must be in the future",
        "Focus duration must be between 5 and 240 minutes",
      ])
    );
  });

  it("rejects negative break durations", () => {
    vi.setSystemTime(new Date("2026-07-23T13:00:00.000Z"));
    const result = validatePayload({
      version: 1,
      sessionId: "gs_negative_break",
      title: "Focus",
      startsAt,
      focusMinutes: 25,
      breakMinutes: -1,
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Break duration must be between 0 and 120 minutes"
    );
  });

  it("keeps a valid invite usable after its start time", () => {
    const payload = {
      version: 1,
      sessionId: "gs_started",
      title: "Started focus",
      startsAt,
      focusMinutes: 25,
    };
    vi.setSystemTime(new Date("2026-07-23T13:00:00.000Z"));
    const encoded = encodePayload(payload);
    vi.setSystemTime(new Date("2026-07-23T14:05:00.000Z"));

    expect(decodePayload(encoded)).toEqual(payload);
  });

  it("allows explicitly sharing an already-started session", () => {
    const payload = {
      version: 1,
      sessionId: "gs_started_share",
      title: "Started focus",
      startsAt,
      focusMinutes: 25,
    };
    vi.setSystemTime(new Date("2026-07-23T14:05:00.000Z"));

    expect(() => encodePayload(payload, { allowStarted: true })).not.toThrow();
    expect(() => encodePayload(payload)).toThrow(
      "Start time must be in the future"
    );
  });

  it("shows the current phase duration", () => {
    vi.setSystemTime(new Date("2026-07-23T14:10:00.000Z"));
    expect(calculateSessionStatus(startsAt, 10, 5)).toBe("break");
    expect(calculateTimeRemaining(startsAt, 10, 5)).toBe(5 * 60 * 1000);
  });
});
