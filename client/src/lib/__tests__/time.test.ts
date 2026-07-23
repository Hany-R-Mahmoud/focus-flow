import { describe, expect, it } from "vitest";
import { getDateString, getElapsedSessionTime } from "../time";

describe("time helpers", () => {
  it("uses the local calendar date", () => {
    const date = new Date(2026, 6, 23, 23, 30);
    expect(getDateString(date.getTime())).toBe("2026-07-23");
  });

  it("excludes the active pause from elapsed time", () => {
    expect(
      getElapsedSessionTime(1_000, 2_000, "paused", null, 6_000, 10_000)
    ).toBe(3_000);
  });
});
