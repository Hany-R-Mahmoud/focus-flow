import { useEffect, useState } from "react";
import { releaseScreenWakeLock, requestScreenWakeLock } from "@/lib/wakeLock";

export function useScreenWakeLock(enabled: boolean): boolean {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function acquire() {
      const acquired = await requestScreenWakeLock();
      if (!cancelled) setIsActive(acquired);
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void acquire();
      } else if (!cancelled) {
        setIsActive(false);
      }
    }

    if (!enabled) {
      setIsActive(false);
      void releaseScreenWakeLock();
      return;
    }

    void acquire();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      setIsActive(false);
      void releaseScreenWakeLock();
    };
  }, [enabled]);

  return isActive;
}
