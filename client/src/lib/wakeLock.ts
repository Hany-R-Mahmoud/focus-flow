interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: "release", listener: () => void) => void;
}

interface NavigatorWithOptionalWakeLock {
  wakeLock?: {
    request: (type: "screen") => Promise<WakeLockSentinelLike>;
  };
}

let currentSentinel: WakeLockSentinelLike | null = null;

export function canKeepScreenAwake(): boolean {
  return Boolean(
    (navigator as unknown as NavigatorWithOptionalWakeLock).wakeLock
  );
}

export async function requestScreenWakeLock(): Promise<boolean> {
  const wakeLock = (navigator as unknown as NavigatorWithOptionalWakeLock)
    .wakeLock;
  if (!wakeLock || document.visibilityState !== "visible") return false;

  try {
    if (currentSentinel && !currentSentinel.released) return true;
    currentSentinel = await wakeLock.request("screen");
    currentSentinel.addEventListener("release", () => {
      currentSentinel = null;
    });
    return true;
  } catch {
    currentSentinel = null;
    return false;
  }
}

export async function releaseScreenWakeLock(): Promise<void> {
  const sentinel = currentSentinel;
  currentSentinel = null;
  if (!sentinel || sentinel.released) return;

  try {
    await sentinel.release();
  } catch {
    // The browser may release the lock when the document is hidden.
  }
}
