import { createClient } from "@neondatabase/neon-js";

const rawUrl = import.meta.env.VITE_NEON_URL?.trim();

function validNeonUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    // This is a public API base URL, never a PostgreSQL connection string.
    return url.protocol === "https:" && url.hostname.endsWith(".neon.tech") && !url.username && !url.password;
  } catch {
    return false;
  }
}

if (rawUrl && !validNeonUrl(rawUrl)) {
  throw new Error("Invalid VITE_NEON_URL: expected the public HTTPS Neon database URL");
}

export const neon = validNeonUrl(rawUrl) ? createClient(rawUrl) : null;
export const isNeonConfigured = neon !== null;
export const neonAuthBaseUrl = validNeonUrl(rawUrl)
  ? (() => {
      const parsed = new URL(rawUrl);
      const labels = parsed.hostname.split(".");
      labels.splice(1, 0, "neonauth");
      parsed.hostname = labels.join(".");
      parsed.pathname = parsed.pathname.replace(/\/$/, "") + "/auth";
      return parsed.toString().replace(/\/$/, "");
    })()
  : null;

export const DISPLAY_NAME_KEY = "focusflow_display_name";

export function normalizeDisplayName(name: string): string {
  return name.normalize("NFKC").trim();
}

export function getDisplayNameKey(name: string): string {
  return normalizeDisplayName(name).toLowerCase();
}

export function getStoredDisplayName(): string {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(DISPLAY_NAME_KEY) ?? "";
}

export class CloudIntegrationError extends Error {
  readonly name = "CloudIntegrationError";
}

export class DisplayNameRequiredError extends Error {
  readonly name = "DisplayNameRequiredError";
}

export class DisplayNameTakenError extends Error {
  readonly name = "DisplayNameTakenError";
}

export function getGroupJoinErrorMessage(error: unknown): string {
  if (error instanceof DisplayNameRequiredError) return "Enter your name";
  if (
    error instanceof DisplayNameTakenError ||
    (error instanceof CloudIntegrationError &&
      error.cause &&
      typeof error.cause === "object" &&
      "code" in error.cause &&
      error.cause.code === "23505")
  ) return "That name is already in use. Choose another.";
  if (error instanceof Error && /sign.in/i.test(error.message)) return "Sign in to join this live room.";
  return "Failed to join session";
}

export async function saveDisplayName(name: string): Promise<string> {
  const normalized = normalizeDisplayName(name);
  if (!normalized) throw new DisplayNameRequiredError("Display name is required");
  if (normalized.length > 50) throw new CloudIntegrationError("Display name must be at most 50 characters");
  if (typeof localStorage !== "undefined") localStorage.setItem(DISPLAY_NAME_KEY, normalized);
  return normalized;
}
