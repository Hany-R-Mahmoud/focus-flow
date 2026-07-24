import { describe, expect, it } from "vitest";
import { resolveTheme } from "./ThemeContext";

describe("resolveTheme", () => {
  it("accepts persisted light and dark values", () => {
    expect(resolveTheme("dark", "light")).toBe("dark");
    expect(resolveTheme("light", "dark")).toBe("light");
  });

  it("falls back for invalid or missing persisted values", () => {
    expect(resolveTheme("sepia", "light")).toBe("light");
    expect(resolveTheme(null, "dark")).toBe("dark");
  });
});
