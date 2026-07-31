import { Check, Copy, ExternalLink, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePwa } from "@/pwa/PwaContext";

export default function PwaInstallHelpDialog() {
  const {
    androidIntentUrl,
    closeHelp,
    confirmInstalled,
    copyCurrentUrl,
    currentUrl,
    helpOpen,
    isWebView,
    platform,
  } = usePwa();
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">("idle");

  useEffect(() => {
    if (!helpOpen) setCopyState("idle");
  }, [helpOpen]);

  async function handleCopy() {
    const copied = await copyCurrentUrl();
    setCopyState(copied ? "copied" : "manual");
  }

  const isIos = platform === "ios";
  const browserHref = androidIntentUrl ?? currentUrl;

  return (
    <Dialog open={helpOpen} onOpenChange={open => (open ? undefined : closeHelp())}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 pt-8 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <Smartphone size={19} className="text-[var(--color-teal-foreground)]" aria-hidden="true" />
            Install Focus Flow
          </DialogTitle>
          <DialogDescription>
            Keep your focus workspace available from your device home screen.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm leading-6">
          {isIos ? (
            <div className="rounded-lg bg-[var(--surface-accent)] p-4">
              <p className="font-medium">On iPhone or iPad</p>
              <p className="mt-1 text-muted-foreground">
                Open this page in Safari, tap Share, choose Add to Home Screen,
                then confirm Add. On newer iOS versions, choose Open as Web App
                when that option is shown.
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-[var(--surface-accent)] p-4">
              <p className="font-medium">In a supported browser</p>
              <p className="mt-1 text-muted-foreground">
                Use the browser menu and choose Install app or Add to Home
                screen. Chrome and Edge may also show a native install prompt.
              </p>
            </div>
          )}

          {isWebView && (
            <div className="rounded-lg border border-[var(--color-teal)]/25 p-4">
              <p className="font-medium">This page is inside another app</p>
              <p className="mt-1 text-muted-foreground">
                {androidIntentUrl
                  ? "Try opening it in your device browser. If the host blocks that action, use the link below."
                  : "The host app controls whether a browser can open. Use the link below, then choose your browser’s install option."}
              </p>
              <a
                href={browserHref || undefined}
                target={androidIntentUrl ? undefined : "_blank"}
                rel={androidIntentUrl ? undefined : "noreferrer"}
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md bg-[var(--color-teal)] px-4 py-2 font-medium text-white hover:bg-[var(--color-teal-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal)] focus-visible:ring-offset-2"
              >
                <ExternalLink size={16} aria-hidden="true" />
                Open in browser
              </a>
            </div>
          )}

          <div>
            <label htmlFor="focus-flow-install-url" className="font-medium">
              Current page link
            </label>
            <textarea
              id="focus-flow-install-url"
              value={currentUrl}
              readOnly
              dir="ltr"
              rows={3}
              onFocus={event => event.currentTarget.select()}
              className="mt-2 min-h-20 w-full resize-none rounded-md border border-input bg-background p-3 text-left text-xs leading-5 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-describedby="focus-flow-install-url-help"
            />
            <p id="focus-flow-install-url-help" className="mt-2 text-xs text-muted-foreground">
              {copyState === "manual"
                ? "Clipboard access was blocked. Press and hold the link, select it, and choose Copy."
                : "If the browser handoff is blocked, select and copy this link manually."}
            </p>
            <Button type="button" variant="outline" size="sm" className="mt-3 gap-2" onClick={() => void handleCopy()}>
              {copyState === "copied" ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
              {copyState === "copied" ? "Copied" : "Copy link"}
            </Button>
          </div>
        </div>

        <DialogFooter className="mt-2 sm:justify-between">
          <Button type="button" variant="ghost" onClick={confirmInstalled}>
            I already installed it
          </Button>
          <Button type="button" onClick={closeHelp}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
