import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { neon, setActiveCloudSession } from "@/lib/neon";

export interface FocusUser {
  id: string;
  email: string;
  name?: string;
  image?: string | null;
  emailVerified?: boolean;
}

interface AuthState {
  user: FocusUser | null;
  ready: boolean;
  configured: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FocusUser | null>(null);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!neon) {
      setUser(null);
      setActiveCloudSession(false);
      setReady(true);
      return;
    }
    try {
      const result = await neon.auth.getSession();
      if(result.error) throw new Error(result.error.message);
      setUser((result.data?.user ?? null) as FocusUser | null);
      setActiveCloudSession(Boolean(result.data?.user));
    } catch (error) {
      console.warn("Could not restore account session", error);
      // A temporary offline Auth failure must not switch a signed-in account to guest.
      // Keep the last verified identity until an explicit sign-out or verified empty session.
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  const signOut = useCallback(async () => {
    if (neon) {
      const result = await neon.auth.signOut();
      if (result.error) throw new Error(result.error.message);
    }
    // Do not erase IndexedDB: personal local data belongs to this browser.
    setUser(null);
    setActiveCloudSession(false);
  }, []);

  const value = useMemo<AuthState>(() => ({
    user, ready, configured: neon !== null, refresh, signOut,
  }), [user, ready, refresh, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const state = useContext(AuthContext);
  if (!state) throw new Error("useAuth requires AuthProvider");
  return state;
}
