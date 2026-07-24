import { useEffect, useState } from "react";
import {
  getSessions,
  getReviews,
  getGroupSessions,
  GroupSession,
  initDB,
} from "@/lib/db";
import { FocusSession, DailyReview } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, TrendingUp, Clock, Users } from "lucide-react";
import { useLocation } from "wouter";
import {
  formatDuration,
  getTodayString,
  getLocalDayStart,
  calculateSessionDuration,
} from "@/lib/time";
import {
  calculateSessionStatus,
  calculateTimeRemaining,
  calculateTimeUntilStart,
} from "@/lib/groupSession";
import { formatTime } from "@/lib/time";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [todayReview, setTodayReview] = useState<DailyReview | null>(null);
  const [upcomingGroupSessions, setUpcomingGroupSessions] = useState<
    GroupSession[]
  >([]);
  const [stats, setStats] = useState({
    todayFocusTime: 0,
    sessionsCompleted: 0,
    weeklyFocusTime: 0,
  });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      await initDB();
      const allSessions = await getSessions();
      if (cancelled) return;
      setSessions(allSessions.slice(0, 5));

      const reviews = await getReviews();
      const today = getTodayString();
      const todayReviewData = reviews.find(r => r.date === today);
      if (cancelled) return;
      setTodayReview(todayReviewData || null);

      // Load upcoming group sessions
      const groupSessions = await getGroupSessions();
      const upcomingGroups = groupSessions
        .filter(gs => {
          const status = calculateSessionStatus(
            gs.startsAt,
            gs.focusMinutes,
            gs.breakMinutes
          );
          return status !== "ended";
        })
        .sort(
          (a, b) =>
            new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
        )
        .slice(0, 3);
      if (cancelled) return;
      setUpcomingGroupSessions(upcomingGroups);

      // Calculate stats
      const now = Date.now();
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
      const todayStart = getLocalDayStart();

      const todaySessions = allSessions.filter(
        s => s.startTime >= todayStart && s.status === "completed"
      );
      const weeklySessions = allSessions.filter(
        s => s.startTime >= weekAgo && s.status === "completed"
      );

      const todayFocusTime = todaySessions.reduce(
        (acc, s) =>
          acc + calculateSessionDuration(s.startTime, s.endTime, s.pausedTime),
        0
      );
      const weeklyFocusTime = weeklySessions.reduce(
        (acc, s) =>
          acc + calculateSessionDuration(s.startTime, s.endTime, s.pausedTime),
        0
      );

      if (cancelled) return;
      setStats({
        todayFocusTime,
        sessionsCompleted: todaySessions.length,
        weeklyFocusTime,
      });
    }

    const refreshData = () =>
      void loadData().catch((error: unknown) => {
        console.error("Error loading dashboard:", error);
      });

    refreshData();
    window.addEventListener("focus", refreshData);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshData);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      {/* Hero Section */}
      <div
        className="h-[300px] rounded-lg mb-8 overflow-hidden"
        style={{
          backgroundImage: "linear-gradient(135deg, #0f766e, #164e63)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="bg-black/30 backdrop-blur-sm p-8 h-full flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Focus Session Flow
          </h1>
          <p className="text-lg text-white/90 mb-6">
            Plan your focus. Track your time. Understand your patterns.
          </p>
          <Button
            className="w-fit gap-2 bg-[var(--color-teal)] hover:bg-[var(--color-teal-dark)] text-white"
            onClick={() => setLocation("/session/new")}
          >
            <Play size={18} />
            Start a Session
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Today's Focus
              </p>
              <p className="text-3xl font-bold text-foreground">
                {formatDuration(stats.todayFocusTime)}
              </p>
            </div>
            <Clock className="text-[var(--color-teal-foreground)]" size={24} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Sessions Today
              </p>
              <p className="text-3xl font-bold text-foreground">
                {stats.sessionsCompleted}
              </p>
            </div>
            <Play className="text-[var(--color-teal-foreground)]" size={24} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">This Week</p>
              <p className="text-3xl font-bold text-foreground">
                {formatDuration(stats.weeklyFocusTime)}
              </p>
            </div>
            <TrendingUp className="text-[var(--color-teal-foreground)]" size={24} />
          </div>
        </Card>
      </div>

      {/* Upcoming Group Sessions */}
      {upcomingGroupSessions.some(
        session =>
          calculateSessionStatus(
            session.startsAt,
            session.focusMinutes,
            session.breakMinutes
          ) !== "ended"
      ) && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Users size={24} className="text-[var(--color-teal-foreground)]" />
              Group Sessions
            </h2>
            <Button
              onClick={() => setLocation("/group-sessions")}
              variant="outline"
              size="sm"
            >
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {upcomingGroupSessions
              .filter(
                session =>
                  calculateSessionStatus(
                    session.startsAt,
                    session.focusMinutes,
                    session.breakMinutes
                  ) !== "ended"
              )
              .map(session => {
                const status = calculateSessionStatus(
                  session.startsAt,
                  session.focusMinutes,
                  session.breakMinutes
                );
                let displayText: string = status;
                if (status === "upcoming") {
                  const timeUntil = calculateTimeUntilStart(session.startsAt);
                  displayText = `Starting in ${formatTime(timeUntil)}`;
                } else if (status === "starting-soon") {
                  displayText = "Starting very soon!";
                } else if (status === "in-progress") {
                  displayText = `Focus ends in ${formatTime(calculateTimeRemaining(session.startsAt, session.focusMinutes))}`;
                } else if (status === "break") {
                  const breakEnd =
                    new Date(session.startsAt).getTime() +
                    (session.focusMinutes + (session.breakMinutes || 0)) *
                      60 *
                      1000;
                  displayText = `Break ends in ${formatTime(Math.max(0, breakEnd - now))}`;
                }

                return (
                  <Card
                    key={session.id}
                    className="p-4 border-2 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setLocation(`/active-group/${session.id}`)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open group session ${session.title}`}
                    onKeyDown={event => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setLocation(`/active-group/${session.id}`);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-foreground">
                          {session.title}
                        </p>
                        {session.sharedObjective && (
                          <p className="text-sm text-muted-foreground">
                            {session.sharedObjective}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(session.startsAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold px-2 py-1 rounded bg-white border border-slate-200">
                          <span aria-live="polite">{displayText}</span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {session.focusMinutes}m
                          {session.breakMinutes &&
                            ` + ${session.breakMinutes}m`}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Recent Sessions
        </h2>
        <div className="space-y-3">
          {sessions.length > 0 ? (
            sessions.map(session => (
              <Card
                key={session.id}
                className="p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">
                      {session.templateName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {session.taskIntention}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[var(--color-teal-foreground)]">
                      {calculateSessionDuration(
                        session.startTime,
                        session.endTime,
                        session.pausedTime
                      )}
                      m
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.distractions.length} distractions
                    </p>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">
                No sessions yet. Start one to begin tracking!
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
