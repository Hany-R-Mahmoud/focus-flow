import { describe, expect, it } from "vitest";
import { isClosedSessionStatus } from "../sessionState";

describe("session state", () => {
  it("treats completed and abandoned sessions as read-only", () => {
    expect(isClosedSessionStatus("completed")).toBe(true);
    expect(isClosedSessionStatus("abandoned")).toBe(true);
    expect(isClosedSessionStatus("active")).toBe(false);
    expect(isClosedSessionStatus("paused")).toBe(false);
  });
});
