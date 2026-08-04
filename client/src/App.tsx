import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocaleProvider, useLocale } from "./contexts/LocaleContext";
import Sidebar from "./components/Sidebar";
import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useSessionReminders } from "@/hooks/useSessionReminders";
import { seedDatabase, initDB } from "@/lib/db";
import SeoMetadata from "./components/SeoMetadata";
import PwaInstallHelpDialog from "./components/PwaInstallHelpDialog";
import PwaStatusBar from "./components/PwaStatusBar";

const Home = lazy(() => import("./pages/Home"));
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

function AppContent() {
  // Initialize reminders
  useSessionReminders();
  const [location] = useLocation();
  const isLandingPage = location === "/";

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

function App() {
  const [isReady, setIsReady] = useState(false);
  const [startupError, setStartupError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    initDB()
      .then(() => seedDatabase())
      .then(() => {
        if (!cancelled) setIsReady(true);
      })
      .catch(error => {
        console.error("Failed to initialize local data", error);
        if (!cancelled) setStartupError("Local data could not be initialized.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ThemeProvider defaultTheme="light" switchable>
      <LocaleProvider>
        <SeoMetadata />
        <PwaStatusBar />
        <ErrorBoundary>
          {startupError ? (
            <div className="min-h-screen p-8 text-center text-destructive">
              {startupError}
            </div>
          ) : !isReady ? (
            <div className="min-h-screen p-8 text-center text-muted-foreground">
              Preparing your focus space…
            </div>
          ) : (
            <TooltipProvider>
              <Toaster />
              <AppContent />
              <PwaInstallHelpDialog />
            </TooltipProvider>
          )}
        </ErrorBoundary>
      </LocaleProvider>
    </ThemeProvider>
  );
}

export default App;
