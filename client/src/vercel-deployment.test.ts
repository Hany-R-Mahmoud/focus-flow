import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Vercel deployment", () => {
  it("publishes the Vite app and rewrites client routes", () => {
    const config = JSON.parse(
      readFileSync(resolve(import.meta.dirname, "..", "..", "vercel.json"), "utf8"),
    ) as {
      outputDirectory?: string;
      rewrites?: Array<{ source: string; destination: string }>;
    };

    expect(config.outputDirectory).toBe("dist/public");
    expect(config.rewrites).toContainEqual({
      source: "/(.*)",
      destination: "/index.html",
    });
  });
});
