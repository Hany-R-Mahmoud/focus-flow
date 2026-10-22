import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocaleProvider, useLocale } from "./contexts/LocaleContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { shouldRecoverGoogleOAuthReturn } from "./lib/googleOAuthReturn";
import Sidebar from "./components/Sidebar";
import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useSessionReminders } from "@/hooks/useSessionReminders";
import { seedDatabase, selectDatabaseScope } from "@/lib/db";
import { startPersonalSync, stopPersonalSync, syncPersonal } from "@/lib/personalSync";
import SeoMetadata from "./components/SeoMetadata";
import PwaInstallHelpDialog from "./components/PwaInstallHelpDialog";
import PwaStatusBar from "./components/PwaStatusBar";

const Home = lazy(() => import("./pages/Home"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SessionTemplates = lazy(() => import("./pages/SessionTemplates"));
const ActiveSession = lazy(() => import("./pages/ActiveSession"));
const SessionHistory = lazy(() => import("./pages/SessionHistory"));
const DailyReview = lazy(() => import("./pages/DailyReview"));
const WeeklyReview = lazy(() => import("./pages/WeeklyReview"));
const Settings = lazy(() => import("./pages/Settings"));
const CreateGroupSession = lazy(() => import("./pages/CreateGroupSession"));
const GroupSessionPreview = lazy(() => import("./pages/GroupSessionPreview"));
const GroupSessions = lazy(() => import("./pages/GroupSessions"));
const ActiveGroupSession = lazy(() => import("./pages/ActiveGroupSession"));
const NotFound = lazy(() => import("@/pages/NotFound"));

function Router() {
  const { t } = useLocale();

  return (
    <Suspense
      fallback={
        <div
          className="min-h-full p-8 text-center text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {t("common.loading")}
        </div>
      }
    >
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/auth"} component={AuthPage} />
        <Route path={"/auth/:mode"} component={AuthPage} />
        <Route path={"/dashboard"} component={Dashboard} />
        <Route path={"/templates"} component={SessionTemplates} />
        <Route path={"/session/:id"} component={ActiveSession} />
        <Route path={"/history"} component={SessionHistory} />
        <Route path={"/daily-review"} component={DailyReview} />
        <Route path={"/weekly-review"} component={WeeklyReview} />
        <Route path={"/settings"} component={Settings} />
        <Route path={"/create-group-session"} component={CreateGroupSession} />
        <Route path={"/group-session"} component={GroupSessionPreview} />
        <Route path={"/group-sessions"} component={GroupSessions} />
        <Route path={"/active-group/:id"} component={ActiveGroupSession} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function GoogleOAuthReturnRecovery() {
  const [location, navigate] = useLocation();
  const { ready, user } = useAuth();

  useEffect(() => {
    // An ordinary signed-in visitor at "/" must still see the landing page.
    // Recover only an explicit Google sign-in attempt after session validation.
    if (!ready) return;

    try {
      if (shouldRecoverGoogleOAuthReturn(location, Boolean(user), window.sessionStorage)) {
        navigate("/dashboard", { replace: true });
      }
    } catch {
      // Browser storage may be unavailable in restrictive privacy modes.
      // Login itself remains available with Neon Auth's direct callbackURL.
    }
  }, [location, navigate, ready, user]);

  return null;
}

function AppContent() {
  // Initialize reminders
  useSessionReminders();
  const [location] = useLocation();
  const isLandingPage = location === "/" || location.startsWith("/auth");

  return (
    <div className={isLandingPage ? "min-h-screen" : "flex h-[100dvh] min-h-0"}>
      {!isLandingPage && <Sidebar />}
      <main
        className={
          isLandingPage
            ? "min-h-screen"
            : "min-h-0 min-w-0 flex-1 overflow-auto"
        }
      >
        <Router />
      </main>
    </div>
  );
}

function AccountDataGate() {
  const { ready, user } = useAuth();
  const [scopeReady, setScopeReady] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const scope = ready ? (user?.id ?? "guest") : null;
  useEffect(() => {
    if (!scope) return;
    let cancelled = false;
    stopPersonalSync();
    setScopeReady(null);
    setFailure(null);
    void selectDatabaseScope(user?.id ?? null)
      .then(() => seedDatabase())
      .then(() => {
        if (cancelled) return;
        setScopeReady(scope);
        if(user?.id) startPersonalSync(user.id);
      })
      .catch(error => {
        console.error("Could not open account data", error);
        if(!cancelled)setFailure("Cannot open local account data.");
      });
    return () => { cancelled = true; stopPersonalSync(); };
  }, [scope, user?.id]);
  useEffect(() => {
    if(scopeReady !== scope || !user?.id)return;
    const update = () => { void syncPersonal(); };
    window.addEventListener("online",update);
    window.addEventListener("focus",update);
    document.addEventListener("visibilitychange",update);
    return () => {
      window.removeEventListener("online",update);
      window.removeEventListener("focus",update);
      document.removeEventListener("visibilitychange",update);
    };
  }, [scopeReady, scope, user?.id]);
  if(failure)return <div className="p-8 text-destructive">{failure}</div>;
  if(!ready || scopeReady!==scope)return <div className="p-8">Preparing your focus space…</div>;
  return <AppContent key={scope} />;
}

function App() {
  return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="light" switchable>
      <LocaleProvider>
        <AuthProvider>
        <GoogleOAuthReturnRecovery />
        <SeoMetadata />
        <PwaStatusBar />
        <ErrorBoundary>
          <TooltipProvider>
            <Toaster />
            <AccountDataGate />
            <PwaInstallHelpDialog />
          </TooltipProvider>
        </ErrorBoundary>
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  );
}

export default App;
