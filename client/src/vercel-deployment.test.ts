import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Vercel deployment", () => {
  it("publishes the Vite app and rewrites client routes", () => {
    const config = JSON.parse(
      readFileSync(
        resolve(import.meta.dirname, "..", "..", "vercel.json"),
        "utf8"
      )
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

  it("publishes crawler endpoints and protects private routes from indexing", () => {
    const projectRoot = resolve(import.meta.dirname, "..", "..");
    for (const file of ["robots.txt", "sitemap.xml", "llms.txt"]) {
      const filePath = resolve(projectRoot, "client", "public", file);
      expect(existsSync(filePath)).toBe(true);
      expect(readFileSync(filePath, "utf8")).not.toContain("<html");
    }

    const config = JSON.parse(
      readFileSync(resolve(projectRoot, "vercel.json"), "utf8")
    ) as {
      headers?: Array<{
        source: string;
        headers: Array<{ key: string; value: string }>;
      }>;
    };

    expect(config.headers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "/dashboard/:path*",
          headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
        }),
        expect.objectContaining({
          source: "/session/:path*",
          headers: [{ key: "X-Robots-Tag", value: "noindex, follow" }],
        }),
      ])
    );
  });
});
