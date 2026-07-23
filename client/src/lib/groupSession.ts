/**
 * Group session payload encoding/decoding and validation
 * Handles URL-safe serialization of group session configuration
 */

export interface GroupSessionPayload {
  version: number;
  sessionId: string;
  title: string;
  sharedObjective?: string;
  startsAt: string; // ISO 8601
  focusMinutes: number;
  breakMinutes?: number;
  meetingUrl?: string;
  organizerName?: string;
  openingMessage?: string;
}

const PAYLOAD_VERSION = 1;
const MAX_TITLE_LENGTH = 100;
const MAX_OBJECTIVE_LENGTH = 300;
const MAX_MESSAGE_LENGTH = 500;
const MAX_NAME_LENGTH = 50;
const MAX_PAYLOAD_SIZE = 2000; // bytes

interface PayloadValidationOptions {
  allowStarted?: boolean;
}

export interface EncodePayloadOptions {
  allowStarted?: boolean;
}

/**
 * Generate a stable session ID (UUID-like)
 */
export function generateSessionId(): string {
  return `gs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate meeting URL (must be https)
 */
export function isValidMeetingUrl(url: string): boolean {
  if (!url) return true; // optional
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

/**
 * Validate group session payload
 */
export function validatePayload(
  payload: unknown,
  options: PayloadValidationOptions = {}
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!payload || typeof payload !== "object") {
    return { valid: false, errors: ["Invalid payload"] };
  }

  const p = payload as Record<string, unknown>;

  // Version check
  if (typeof p.version !== "number" || p.version !== PAYLOAD_VERSION) {
    errors.push(`Unsupported payload version: ${p.version}`);
  }

  // Session ID
  if (typeof p.sessionId !== "string" || !p.sessionId.startsWith("gs_")) {
    errors.push("Invalid session ID");
  }

  // Title (required)
  if (typeof p.title !== "string" || p.title.trim().length === 0) {
    errors.push("Title is required");
  } else if (p.title.length > MAX_TITLE_LENGTH) {
    errors.push(`Title exceeds ${MAX_TITLE_LENGTH} characters`);
  }

  // Shared objective (optional)
  if (p.sharedObjective !== undefined && p.sharedObjective !== null) {
    if (typeof p.sharedObjective !== "string") {
      errors.push("Shared objective must be a string");
    } else if (p.sharedObjective.length > MAX_OBJECTIVE_LENGTH) {
      errors.push(`Objective exceeds ${MAX_OBJECTIVE_LENGTH} characters`);
    }
  }

  // Start time (required, must be ISO and in future or present)
  if (typeof p.startsAt !== "string") {
    errors.push("Start time is required");
  } else {
    try {
      const startTime = new Date(p.startsAt);
      if (isNaN(startTime.getTime())) {
        errors.push("Invalid start time format");
      } else if (!options.allowStarted && startTime.getTime() < Date.now()) {
        errors.push("Start time must be in the future");
      }
    } catch {
      errors.push("Invalid start time format");
    }
  }

  // Focus minutes (required, 5-240)
  if (
    typeof p.focusMinutes !== "number" ||
    !Number.isFinite(p.focusMinutes) ||
    !Number.isInteger(p.focusMinutes) ||
    p.focusMinutes < 5 ||
    p.focusMinutes > 240
  ) {
    errors.push("Focus duration must be between 5 and 240 minutes");
  }

  // Break minutes (optional, 0-120)
  if (p.breakMinutes !== undefined && p.breakMinutes !== null) {
    if (
      typeof p.breakMinutes !== "number" ||
      !Number.isFinite(p.breakMinutes) ||
      !Number.isInteger(p.breakMinutes) ||
      p.breakMinutes < 0 ||
      p.breakMinutes > 120
    ) {
      errors.push("Break duration must be between 0 and 120 minutes");
    }
  }

  // Meeting URL (optional, must be https)
  if (
    p.meetingUrl !== undefined &&
    p.meetingUrl !== null &&
    p.meetingUrl !== ""
  ) {
    if (typeof p.meetingUrl !== "string" || !isValidMeetingUrl(p.meetingUrl)) {
      errors.push("Meeting URL must be a valid HTTPS URL");
    }
  }

  // Organizer name (optional)
  if (p.organizerName !== undefined && p.organizerName !== null) {
    if (typeof p.organizerName !== "string") {
      errors.push("Organizer name must be a string");
    } else if (p.organizerName.length > MAX_NAME_LENGTH) {
      errors.push(`Organizer name exceeds ${MAX_NAME_LENGTH} characters`);
    }
  }

  // Opening message (optional)
  if (p.openingMessage !== undefined && p.openingMessage !== null) {
    if (typeof p.openingMessage !== "string") {
      errors.push("Opening message must be a string");
    } else if (p.openingMessage.length > MAX_MESSAGE_LENGTH) {
      errors.push(`Opening message exceeds ${MAX_MESSAGE_LENGTH} characters`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Encode payload to URL-safe base64
 */
export function encodePayload(
  payload: GroupSessionPayload,
  options: EncodePayloadOptions = {}
): string {
  const validation = validatePayload(payload, options);
  if (!validation.valid) throw new Error(validation.errors.join(", "));
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);

  if (bytes.length > MAX_PAYLOAD_SIZE) {
    throw new Error(
      `Payload exceeds maximum size of ${MAX_PAYLOAD_SIZE} bytes`
    );
  }

  let binary = "";
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Decode URL-safe base64 payload
 */
export function decodePayload(encoded: string): GroupSessionPayload | null {
  try {
    if (!encoded || encoded.length === 0) return null;
    if (encoded.length > MAX_PAYLOAD_SIZE * 2) return null;

    // Restore base64 padding and characters
    let base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padding = 4 - (base64.length % 4);
    if (padding !== 4) {
      base64 += "=".repeat(padding);
    }

    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    if (bytes.length > MAX_PAYLOAD_SIZE) return null;
    const json = new TextDecoder().decode(bytes);
    const payload = JSON.parse(json);

    const validation = validatePayload(payload, { allowStarted: true });
    if (!validation.valid) {
      console.error("Payload validation failed:", validation.errors);
      return null;
    }

    return payload as GroupSessionPayload;
  } catch (err) {
    console.error("Failed to decode payload:", err);
    return null;
  }
}

/**
 * Generate shareable group session link
 */
export function generateGroupSessionLink(
  payload: GroupSessionPayload,
  options: EncodePayloadOptions = {}
): string {
  const encoded = encodePayload(payload, options);
  const baseUrl = window.location.origin + "/group-session";
  return `${baseUrl}#/group-session/${encoded}`;
}

/**
 * Extract payload from URL hash
 */
export function extractPayloadFromHash(
  hash: string
): GroupSessionPayload | null {
  const match = hash.match(/#\/group-session\/(.+)$/);
  if (!match || !match[1]) return null;
  return decodePayload(match[1]);
}

/**
 * Calculate session status
 */
export function calculateSessionStatus(
  startsAt: string,
  focusMinutes: number,
  breakMinutes?: number
): "upcoming" | "starting-soon" | "in-progress" | "break" | "ended" {
  const now = Date.now();
  const startMs = new Date(startsAt).getTime();
  const focusMs = focusMinutes * 60 * 1000;
  const breakMs = (breakMinutes || 0) * 60 * 1000;
  const endMs = startMs + focusMs + breakMs;

  if (now < startMs - 60_000) {
    return "upcoming"; // More than 1 minute until start
  } else if (now < startMs) {
    return "starting-soon"; // Within 1 minute of start
  } else if (now < startMs + focusMs) {
    return "in-progress";
  } else if (breakMs > 0 && now < endMs) {
    return "break";
  } else {
    return "ended";
  }
}

/**
 * Calculate time remaining (in ms) for focus period
 */
export function calculateTimeRemaining(
  startsAt: string,
  focusMinutes: number,
  breakMinutes: number = 0
): number {
  const now = Date.now();
  const startMs = new Date(startsAt).getTime();

  // If session hasn't started yet, return time until start
  if (now < startMs) {
    return Math.max(0, startMs - now);
  }

  const focusEndMs = startMs + focusMinutes * 60 * 1000;
  if (now < focusEndMs) return focusEndMs - now;

  const breakEndMs = focusEndMs + breakMinutes * 60 * 1000;
  return breakMinutes > 0 && now < breakEndMs ? breakEndMs - now : 0;
}

/**
 * Calculate time until start (in ms)
 */
export function calculateTimeUntilStart(startsAt: string): number {
  const now = Date.now();
  const startMs = new Date(startsAt).getTime();
  return Math.max(0, startMs - now);
}

/**
 * Check if session has started
 */
export function hasSessionStarted(startsAt: string): boolean {
  return Date.now() >= new Date(startsAt).getTime();
}

/**
 * Check if session has ended
 */
export function hasSessionEnded(
  startsAt: string,
  focusMinutes: number,
  breakMinutes: number = 0
): boolean {
  const now = Date.now();
  const startMs = new Date(startsAt).getTime();
  const endMs = startMs + (focusMinutes + breakMinutes) * 60 * 1000;
  return now >= endMs;
}
