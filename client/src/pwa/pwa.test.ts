import { describe, expect, it, vi } from "vitest";
import {
  buildAndroidIntentUrl,
  classifyPlatform,
  copyText,
  invokeInstallPrompt,
  isLikelyWebView,
  isStandalone,
  isTimestampActive,
  readTimestamp,
  restoreHashFromLocation,
} from "./pwa";

describe("PWA platform helpers", () => {
  it("classifies Android, iOS, and desktop platforms", () => {
    expect(classifyPlatform("Mozilla/5.0 Android 14 Chrome/130")).toBe("android");
    expect(classifyPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/605.1")).toBe("ios");
    expect(classifyPlatform("Mozilla/5.0 (X11; Linux x86_64) Chrome/130")).toBe("desktop");
  });

  it("detects embedded Android and iOS browsers without treating Safari as embedded", () => {
    expect(isLikelyWebView("Mozilla/5.0 Android 14; wv) Version/4.0 Chrome/130")).toBe(true);
    expect(isLikelyWebView("Mozilla/5.0 (Linux; Android 14) Instagram 350.0")).toBe(true);
    expect(isLikelyWebView("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15")).toBe(true);
    expect(isLikelyWebView("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1")).toBe(false);
  });

  it("recognizes standalone display mode and Apple's standalone signal", () => {
    expect(isStandalone({
      matchMedia: () => ({ matches: true }),
      navigator: {},
    } as never)).toBe(true);
    expect(isStandalone({
      matchMedia: () => ({ matches: false }),
      navigator: { standalone: true },
    } as never)).toBe(true);
  });
});

describe("PWA URL and state helpers", () => {
  it("preserves the original hash inside an Android intent fallback", () => {
    const intent = buildAndroidIntentUrl("https://focus.example/group?x=1#payload")!;
    expect(intent).toContain("intent://focus.example/group?x=1&__pwa_hash=payload");
    expect(intent).toContain("S.browser_fallback_url=https%3A%2F%2Ffocus.example%2Fgroup%3Fx%3D1%23payload");
  });

  it("restores a transported hash before routing", () => {
    let replacement = "";
    const restored = restoreHashFromLocation(
      {
        href: "https://focus.example/group?__pwa_hash=payload",
        search: "?__pwa_hash=payload",
        hash: "",
      } as Location,
      { replaceState: (_state, _title, url) => { replacement = String(url); } }
    );
    expect(restored).toBe(true);
    expect(replacement).toBe("https://focus.example/group#payload");
  });

  it("expires timestamps and rejects future timestamps", () => {
    expect(isTimestampActive(1_000, 500, 1_499)).toBe(true);
    expect(isTimestampActive(1_000, 500, 1_500)).toBe(false);
    expect(isTimestampActive(2_000, 500, 1_500)).toBe(false);
    const storage = { getItem: vi.fn(() => "2000") } as unknown as Storage;
    expect(readTimestamp("dismissed", storage, 1_500)).toBeNull();
  });
});

describe("PWA install fallbacks", () => {
  it("handles accepted, dismissed, and rejected install prompts", async () => {
    const accepted = await invokeInstallPrompt({
      preventDefault: vi.fn(),
      prompt: vi.fn(async () => undefined),
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    const dismissed = await invokeInstallPrompt({
      preventDefault: vi.fn(),
      prompt: vi.fn(async () => undefined),
      userChoice: Promise.resolve({ outcome: "dismissed" }),
    });
    const rejected = await invokeInstallPrompt({
      preventDefault: vi.fn(),
      prompt: vi.fn(async () => { throw new Error("blocked"); }),
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    expect(accepted).toBe("accepted");
    expect(dismissed).toBe("dismissed");
    expect(rejected).toBe("unavailable");
  });

  it("returns a manual-copy fallback when clipboard access is unavailable", async () => {
    expect(await copyText("https://focus.example")).toBe(false);
  });
});
