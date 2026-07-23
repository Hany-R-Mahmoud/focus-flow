import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import SessionTemplates from "./pages/SessionTemplates";
import ActiveSession from "./pages/ActiveSession";
import SessionHistory from "./pages/SessionHistory";
import DailyReview from "./pages/DailyReview";
import WeeklyReview from "./pages/WeeklyReview";
import Settings from "./pages/Settings";
import Sidebar from "./components/Sidebar";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import CreateGroupSession from "./pages/CreateGroupSession";
import GroupSessionPreview from "./pages/GroupSessionPreview";
import GroupSessions from "./pages/GroupSessions";
import ActiveGroupSession from "./pages/ActiveGroupSession";
import { useSessionReminders } from "@/hooks/useSessionReminders";
import { seedDatabase, initDB } from "@/lib/db";
import { ensureAnonymousUser } from "@/lib/supabase";

function Router() {
  return (
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
  );
}

function AppContent() {
  // Initialize reminders
  useSessionReminders();
  const [location] = useLocation();
  const isLandingPage = location === "/";

  return (
    <div className={isLandingPage ? "min-h-screen" : "flex h-screen"}>
      {!isLandingPage && <Sidebar />}
      <main className={isLandingPage ? "min-h-screen" : "flex-1 overflow-auto"}>
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
    void ensureAnonymousUser().catch(error => {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.warn(
        `Supabase anonymous auth unavailable; using local mode. ${message}`
      );
    });

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

  if (startupError) {
    return (
      <div className="min-h-screen p-8 text-center text-destructive">
        {startupError}
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen p-8 text-center text-muted-foreground">
        Preparing your focus space…
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
