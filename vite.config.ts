import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";

function pwaServiceWorkerPlugin(): Plugin {
  return {
    name: "focus-flow-pwa-service-worker",
    apply: "build",
    closeBundle() {
      const outputDir = path.resolve(import.meta.dirname, "dist", "public");
      const assetsDir = path.join(outputDir, "assets");
      const publicEntries = [
        "/index.html",
        "/manifest.webmanifest",
        "/favicon.svg",
        "/apple-touch-icon.png",
        "/focus-flow-icon-192.png",
        "/focus-flow-icon-512.png",
        "/focus-flow-icon-maskable-512.png",
      ].filter(entry => existsSync(path.join(outputDir, entry.slice(1))));
      const assetEntries = existsSync(assetsDir)
        ? readdirSync(assetsDir)
            .filter(file => /^(?:index|Home|geist-).+\.(?:js|css|woff2?)$/.test(file))
            .map(file => `/assets/${file}`)
        : [];
      const workerSource = readFileSync(
        path.resolve(import.meta.dirname, "client", "src", "pwa", "service-worker.js"),
        "utf8"
      ).replace("__PRECACHE_ENTRIES__", JSON.stringify([...publicEntries, ...assetEntries]));
      writeFileSync(path.join(outputDir, "sw.js"), workerSource);
    },
  };
}

const plugins = [
  pwaServiceWorkerPlugin(),
  react(),
  tailwindcss(),
  jsxLocPlugin(),
  vitePluginManusRuntime(),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    strictPort: false, // Will find next available port if 3000 is busy
    host: "localhost",
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
