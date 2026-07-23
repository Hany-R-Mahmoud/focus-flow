import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearGroupSessionLocalData,
  clearLocalData,
  exportLocalData,
  importLocalData,
  replaceLocalData,
} from "../localData";

function createStorage(): Storage {
  const values = new Map<string, string>();
  const storage = {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => Array.from(values.keys())[index] ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, value),
  };
  return storage as unknown as Storage;
}

describe("local data boundary", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: createStorage(),
    });
  });

  afterEach(() => {
    delete (globalThis as { localStorage?: Storage }).localStorage;
  });

  it("exports and clears only owned data", () => {
    localStorage.setItem("focusflow_group_outcome_g1", "done");
    localStorage.setItem("unrelated_preference", "dark");

    expect(exportLocalData()).toEqual({
      focusflow_group_outcome_g1: "done",
    });
    clearLocalData();
    expect(localStorage.getItem("focusflow_group_outcome_g1")).toBeNull();
    expect(localStorage.getItem("unrelated_preference")).toBe("dark");
  });

  it("rejects foreign keys and restores valid snapshots", () => {
    expect(() => importLocalData({ external_key: "unsafe" })).toThrow();
    importLocalData({ focusflow_group_intention_g1: "plan" });
    expect(localStorage.getItem("focusflow_group_intention_g1")).toBe("plan");
  });

  it("clears only the deleted group session's local data", () => {
    localStorage.setItem("focusflow_participants_g1", "[]");
    localStorage.setItem("focusflow_group_intention_g1", "plan");
    localStorage.setItem("focusflow_participants_g10", "[]");

    clearGroupSessionLocalData("g1");

    expect(localStorage.getItem("focusflow_participants_g1")).toBeNull();
    expect(localStorage.getItem("focusflow_group_intention_g1")).toBeNull();
    expect(localStorage.getItem("focusflow_participants_g10")).toBe("[]");
  });

  it("replaces the local snapshot without retaining stale owned keys", () => {
    localStorage.setItem("focusflow_old", "old");

    replaceLocalData({ focusflow_new: "new" });

    expect(localStorage.getItem("focusflow_old")).toBeNull();
    expect(localStorage.getItem("focusflow_new")).toBe("new");
  });
});
