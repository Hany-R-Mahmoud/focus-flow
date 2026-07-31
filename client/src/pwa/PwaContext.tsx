import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  buildAndroidIntentUrl,
  copyText,
  getCurrentUrl,
  invokeInstallPrompt,
  isBeforeInstallPromptEvent,
  isLikelyWebView,
  isStandalone,
  readTimestamp,
  removeTimestamp,
  classifyPlatform,
  PWA_DISMISSED_AT_KEY,
  PWA_DISMISSAL_DAYS,
  PWA_INSTALLED_HINT_AT_KEY,
  PWA_INSTALLED_HINT_DAYS,
  writeTimestamp,
  type BeforeInstallPromptEventLike,
  type InstallOutcome,
  type PwaPlatform,
} from "./pwa";

const dismissalDuration = PWA_DISMISSAL_DAYS * 24 * 60 * 60 * 1000;
const installedHintDuration = PWA_INSTALLED_HINT_DAYS * 24 * 60 * 60 * 1000;

interface PwaContextValue {
  platform: PwaPlatform;
  isWebView: boolean;
  isStandalone: boolean;
  isOnline: boolean;
  canInstall: boolean;
  isDismissed: boolean;
  hasInstalledHint: boolean;
  showTransientPromotion: boolean;
  showPersistentInstallAction: boolean;
  helpOpen: boolean;
  currentUrl: string;
  androidIntentUrl: string | null;
  dismissPromotion: () => void;
  openHelp: () => void;
  closeHelp: () => void;
  install: () => Promise<InstallOutcome>;
  confirmInstalled: () => void;
  copyCurrentUrl: () => Promise<boolean>;
}

const PwaContext = createContext<PwaContextValue | null>(null);

function storageOrNull(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function timestampIsActive(key: string, durationMs: number): boolean {
  return readTimestamp(key, storageOrNull()) !== null && durationMs > 0;
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const [platform] = useState<PwaPlatform>(() => classifyPlatform());
  const [webView] = useState(() => isLikelyWebView());
  const [standalone, setStandalone] = useState(() =>
    typeof window !== "undefined" ? isStandalone() : false
  );
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const [currentUrl, setCurrentUrl] = useState(getCurrentUrl);
  const [dismissed, setDismissed] = useState(() =>
    timestampIsActive(PWA_DISMISSED_AT_KEY, dismissalDuration)
  );
  const [installedHint, setInstalledHint] = useState(() =>
    timestampIsActive(PWA_INSTALLED_HINT_AT_KEY, installedHintDuration)
  );
  const [canInstall, setCanInstall] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEventLike | null>(null);

  const reconcile = useCallback(() => {
    if (typeof window === "undefined") return;
    setStandalone(isStandalone());
    setCurrentUrl(window.location.href);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstallPrompt = (event: Event) => {
      if (!isBeforeInstallPromptEvent(event)) return;
      event.preventDefault();
      deferredPrompt.current = event;
      setCanInstall(true);
      setInstalledHint(false);
      removeTimestamp(PWA_INSTALLED_HINT_AT_KEY);
    };
    const handleAppInstalled = () => {
      deferredPrompt.current = null;
      setCanInstall(false);
      setInstalledHint(true);
      writeTimestamp(PWA_INSTALLED_HINT_AT_KEY);
    };
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener
    );
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("pageshow", reconcile);
    window.addEventListener("visibilitychange", reconcile);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {
        // Install UI remains available when the worker cannot register.
      });
    }

    reconcile();
    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("pageshow", reconcile);
      window.removeEventListener("visibilitychange", reconcile);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [reconcile]);

  useEffect(() => {
    if (!dismissed || typeof window === "undefined") return;

    const stored = readTimestamp(PWA_DISMISSED_AT_KEY, storageOrNull());
    const remaining = stored
      ? Math.max(0, dismissalDuration - (Date.now() - stored))
      : dismissalDuration;
    const timeout = window.setTimeout(() => setDismissed(false), remaining);
    return () => window.clearTimeout(timeout);
  }, [dismissed]);

  const dismissPromotion = useCallback(() => {
    setDismissed(true);
    writeTimestamp(PWA_DISMISSED_AT_KEY);
  }, []);

  const confirmInstalled = useCallback(() => {
    setInstalledHint(true);
    writeTimestamp(PWA_INSTALLED_HINT_AT_KEY);
    setHelpOpen(false);
  }, []);

  const install = useCallback(async (): Promise<InstallOutcome> => {
    const event = deferredPrompt.current;
    if (!event || standalone || installedHint) {
      setHelpOpen(true);
      return "unavailable";
    }

    deferredPrompt.current = null;
    setCanInstall(false);
    const outcome = await invokeInstallPrompt(event);
    if (outcome === "dismissed") dismissPromotion();
    if (outcome === "unavailable") setHelpOpen(true);
    return outcome;
  }, [dismissPromotion, installedHint, standalone]);

  const copyCurrentUrl = useCallback(() => copyText(currentUrl), [currentUrl]);

  const value = useMemo<PwaContextValue>(
    () => ({
      platform,
      isWebView: webView,
      isStandalone: standalone,
      isOnline: online,
      canInstall,
      isDismissed: dismissed,
      hasInstalledHint: installedHint,
      showTransientPromotion: !standalone && !installedHint && !dismissed,
      showPersistentInstallAction: !standalone && !installedHint,
      helpOpen,
      currentUrl,
      androidIntentUrl:
        platform === "android" && webView
          ? buildAndroidIntentUrl(currentUrl)
          : null,
      dismissPromotion,
      openHelp: () => setHelpOpen(true),
      closeHelp: () => setHelpOpen(false),
      install,
      confirmInstalled,
      copyCurrentUrl,
    }),
    [
      canInstall,
      confirmInstalled,
      copyCurrentUrl,
      currentUrl,
      dismissed,
      helpOpen,
      install,
      installedHint,
      online,
      platform,
      standalone,
      webView,
      dismissPromotion,
    ]
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa(): PwaContextValue {
  const context = useContext(PwaContext);
  if (!context) throw new Error("usePwa must be used within PwaProvider");
  return context;
}
