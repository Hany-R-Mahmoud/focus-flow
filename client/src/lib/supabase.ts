import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

const DISPLAY_NAME_KEY = "focusflow_display_name";
const MAX_DISPLAY_NAME_LENGTH = 50;

type SupabaseEnv = {
  readonly VITE_SUPABASE_URL?: unknown;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: unknown;
};

export type SupabaseConfig = {
  readonly url: string;
  readonly publishableKey: string;
};

export class SupabaseIntegrationError extends Error {
  readonly name = "SupabaseIntegrationError";
}

export function readSupabaseConfig(env: SupabaseEnv): SupabaseConfig | null {
  const url = env.VITE_SUPABASE_URL;
  const publishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (url === undefined && publishableKey === undefined) return null;
  if (typeof url !== "string" || typeof publishableKey !== "string") {
    throw new SupabaseIntegrationError(
      "Supabase configuration requires both VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY"
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    throw new SupabaseIntegrationError(
      "VITE_SUPABASE_URL must be a valid URL",
      {
        cause: error,
      }
    );
  }

  if (parsedUrl.protocol !== "https:" || !parsedUrl.hostname) {
    throw new SupabaseIntegrationError(
      "VITE_SUPABASE_URL must use HTTPS and include a hostname"
    );
  }
  if (publishableKey.trim().length === 0) {
    throw new SupabaseIntegrationError(
      "VITE_SUPABASE_PUBLISHABLE_KEY must not be empty"
    );
  }

  return { url, publishableKey };
}

const config = readSupabaseConfig({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
});

export const supabase: SupabaseClient | null = config
  ? createClient(config.url, config.publishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

export const isSupabaseConfigured = supabase !== null;

export function getStoredDisplayName(): string {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(DISPLAY_NAME_KEY) ?? "";
}

export async function ensureAnonymousUser(
  displayName = getStoredDisplayName()
): Promise<User | null> {
  if (!supabase) return null;

  const existing = await supabase.auth.getSession();
  if (existing.error) {
    throw new SupabaseIntegrationError("Failed to load the Supabase session", {
      cause: existing.error,
    });
  }
  if (existing.data.session?.user) return existing.data.session.user;

  const metadata = displayName.trim()
    ? { display_name: displayName.trim().slice(0, MAX_DISPLAY_NAME_LENGTH) }
    : undefined;
  const result = await supabase.auth.signInAnonymously({
    options: metadata ? { data: metadata } : undefined,
  });
  if (result.error || !result.data.user) {
    throw new SupabaseIntegrationError("Failed to create an anonymous user", {
      cause: result.error,
    });
  }
  return result.data.user;
}

export async function saveDisplayName(name: string): Promise<string> {
  const normalized = name.trim();
  if (normalized.length === 0 || normalized.length > MAX_DISPLAY_NAME_LENGTH) {
    throw new SupabaseIntegrationError(
      `Display name must be between 1 and ${MAX_DISPLAY_NAME_LENGTH} characters`
    );
  }

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(DISPLAY_NAME_KEY, normalized);
  }

  if (supabase) {
    await ensureAnonymousUser(normalized);
    const result = await supabase.auth.updateUser({
      data: { display_name: normalized },
    });
    if (result.error) {
      throw new SupabaseIntegrationError("Failed to save the display name", {
        cause: result.error,
      });
    }
  }

  return normalized;
}
