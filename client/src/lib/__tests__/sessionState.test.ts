import { describe, expect, it } from "vitest";
import {
  getSessionEndTime,
  isClosedSessionStatus,
  shouldAutoCompleteSession,
} from "../sessionState";

describe("session state", () => {
  it("treats completed and abandoned sessions as read-only", () => {
    expect(isClosedSessionStatus("completed")).toBe(true);
    expect(isClosedSessionStatus("abandoned")).toBe(true);
    expect(isClosedSessionStatus("active")).toBe(false);
    expect(isClosedSessionStatus("paused")).toBe(false);
  });

  it("includes accumulated pause time in the timer deadline", () => {
    expect(getSessionEndTime(1_000, 25, 5_000)).toBe(1_506_000);
  });

  it("only auto-completes active sessions at the duration boundary", () => {
    expect(shouldAutoCompleteSession("active", 1_500_000, 1_500_000)).toBe(
      true
    );
    expect(shouldAutoCompleteSession("active", 1_499_999, 1_500_000)).toBe(
      false
    );
    expect(shouldAutoCompleteSession("paused", 1_500_000, 1_500_000)).toBe(
      false
    );
  });
});
