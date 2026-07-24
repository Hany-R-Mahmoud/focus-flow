import { beforeEach, describe, expect, it, vi } from "vitest";
import { addParticipant, getSessionParticipants } from "../participants";
import {
  DisplayNameRequiredError,
  DisplayNameTakenError,
  normalizeDisplayName,
} from "../supabase";

class TestStorage implements Storage {
  readonly #values = new Map<string, string>();

  get length(): number {
    return this.#values.size;
  }

  clear(): void {
    this.#values.clear();
  }

  getItem(key: string): string | null {
    return this.#values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.#values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.#values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.#values.set(key, value);
  }
}

describe("participant display names", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", new TestStorage());
  });

  it("normalizes compatibility characters and surrounding whitespace", () => {
    // Given
    const name = "  Ｈａｎｙ  ";

    // When
    const normalized = normalizeDisplayName(name);

    // Then
    expect(normalized).toBe("Hany");
  });

  it("rejects a blank participant name", () => {
    // Given
    const name = " \t ";

    // When
    const addBlankParticipant = () => addParticipant("session-a", name);

    // Then
    expect(addBlankParticipant).toThrow(DisplayNameRequiredError);
  });

  it("rejects an equivalent name already used in the session", () => {
    // Given
    addParticipant("session-a", "Hany");

    // When
    const addDuplicateParticipant = () =>
      addParticipant("session-a", "  ＨＡＮＹ ");

    // Then
    expect(addDuplicateParticipant).toThrow(DisplayNameTakenError);
    expect(getSessionParticipants("session-a")).toHaveLength(1);
  });

  it("allows the same name in a different session", () => {
    // Given
    addParticipant("session-a", "Hany");

    // When
    const participant = addParticipant("session-b", "HANY");

    // Then
    expect(participant.sessionId).toBe("session-b");
  });
});
