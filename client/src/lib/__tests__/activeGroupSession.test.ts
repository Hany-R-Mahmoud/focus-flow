import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  claimActiveGroupSession,
  releaseActiveGroupSession,
} from "../activeGroupSession";

function createStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: key => values.get(key) ?? null,
    key: index => Array.from(values.keys())[index] ?? null,
    removeItem: key => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  } as unknown as Storage;
}

describe("active group session lock", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: createStorage(),
    });
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-23T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as { localStorage?: Storage }).localStorage;
  });

  it("blocks a different session while one is active", () => {
    expect(claimActiveGroupSession("session-a")).toBe(true);
    expect(claimActiveGroupSession("session-b")).toBe(false);
    expect(claimActiveGroupSession("session-a")).toBe(true);
  });

  it("releases the active session", () => {
    expect(claimActiveGroupSession("session-a")).toBe(true);
    releaseActiveGroupSession("session-a");
    expect(claimActiveGroupSession("session-b")).toBe(true);
  });

  it("allows a stale lock to be reclaimed", () => {
    expect(claimActiveGroupSession("session-a")).toBe(true);
    vi.advanceTimersByTime(121_000);
    expect(claimActiveGroupSession("session-b")).toBe(true);
  });
});
