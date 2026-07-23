import { useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, turnstileSiteKey } from "@/lib/supabase";

type TurnstileStatus = "loading" | "ready" | "error" | "unconfigured";

type TurnstileOptions = {
  readonly sitekey: string;
  readonly action: string;
  readonly callback: (token: string) => void;
  readonly "expired-callback": () => void;
  readonly "error-callback": () => void;
};

type TurnstileApi = {
  readonly render: (element: HTMLElement, options: TurnstileOptions) => string;
  readonly remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstileScript: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (turnstileScript) return turnstileScript;

  turnstileScript = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-focusflow-turnstile="true"]'
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Turnstile script failed to load")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.defer = true;
    script.dataset.focusflowTurnstile = "true";
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Turnstile script failed to load")),
      { once: true }
    );
    document.head.appendChild(script);
  }).catch(error => {
    turnstileScript = null;
    throw error;
  });

  return turnstileScript;
}

type TurnstileChallengeProps = {
  readonly action: string;
  readonly onTokenChange: (token: string | null) => void;
};

export function TurnstileChallenge({
  action,
  onTokenChange,
}: TurnstileChallengeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<TurnstileStatus>(
    turnstileSiteKey ? "loading" : "unconfigured"
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !turnstileSiteKey || !containerRef.current) {
      onTokenChange(null);
      return;
    }
    const siteKey = turnstileSiteKey;

    let cancelled = false;
    let widgetId: string | null = null;

    void loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          callback: token => onTokenChange(token),
          "expired-callback": () => onTokenChange(null),
          "error-callback": () => {
            onTokenChange(null);
            setStatus("error");
          },
        });
        setStatus("ready");
      })
      .catch(error => {
        if (cancelled) return;
        onTokenChange(null);
        setStatus("error");
        console.error("Turnstile could not load:", error);
      });

    return () => {
      cancelled = true;
      onTokenChange(null);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [action, onTokenChange]);

  if (!isSupabaseConfigured) return null;

  return (
    <div className="space-y-2" aria-live="polite">
      <div ref={containerRef} />
      {status === "unconfigured" && (
        <p className="text-xs text-amber-700">
          CAPTCHA is not configured. Add VITE_TURNSTILE_SITE_KEY before enabling
          Supabase CAPTCHA protection.
        </p>
      )}
      {status === "error" && (
        <p className="text-xs text-destructive">
          CAPTCHA could not load. Check the site key and browser connection.
        </p>
      )}
    </div>
  );
}
