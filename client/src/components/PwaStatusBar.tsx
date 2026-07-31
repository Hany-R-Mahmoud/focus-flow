import { Download, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePwa } from "@/pwa/PwaContext";

export default function PwaStatusBar() {
  const {
    canInstall,
    dismissPromotion,
    isWebView,
    openHelp,
    platform,
    showTransientPromotion,
    install,
  } = usePwa();

  if (!showTransientPromotion) return null;

  const isIos = platform === "ios";
  const title = isWebView
    ? "Open Focus Flow in your browser"
    : isIos
      ? "Add Focus Flow to your Home Screen"
      : "Keep Focus Flow close at hand";
  const description = isWebView
    ? "Your current app is inside another app. Use the browser for the best install experience."
    : isIos
      ? "Use your browser’s Share menu to add Focus Flow as an app."
      : "Install the app for a focused, app-like workspace.";

  return (
    <div className="border-b border-[var(--color-teal)]/20 bg-[var(--surface-accent)] px-4 pt-[env(safe-area-inset-top)] text-foreground">
      <div className="container flex min-h-14 flex-wrap items-center justify-between gap-3 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm" aria-hidden="true">
            <Download size={16} className="text-[var(--color-teal-dark)]" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{title}</p>
            <p className="hidden text-xs text-muted-foreground sm:block">{description}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="gap-1.5 bg-background text-foreground hover:bg-card"
            onClick={() => {
              if (canInstall) {
                void install();
              } else {
                openHelp();
              }
            }}
          >
            {isWebView ? <ExternalLink size={15} aria-hidden="true" /> : <Download size={15} aria-hidden="true" />}
            <span>{isWebView ? "Open in browser" : "Install"}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground"
            onClick={dismissPromotion}
            aria-label="Dismiss install message"
            title="Dismiss install message"
          >
            <X size={16} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
