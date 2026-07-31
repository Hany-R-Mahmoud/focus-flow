import { useEffect, useState } from "react";
import { getSessions } from "@/lib/db";
import { Card } from "@/components/ui/card";
import {
  getWeekDates,
  getDateString,
  calculateSessionDuration,
  formatDuration,
} from "@/lib/time";
import { getRecentFocusDays, type FocusDaySummary } from "@/lib/focusStats";
import { useLocale } from "@/contexts/LocaleContext";

export default function WeeklyReview() {
  const { language, t } = useLocale();
  const [weekStats, setWeekStats] = useState({
    totalSessions: 0,
    totalFocusTime: 0,
    avgDistractions: 0,
    topTemplate: "",
  });
  const [focusDays, setFocusDays] = useState<FocusDaySummary[]>([]);

  useEffect(() => {
    loadWeekStats();
  }, []);

  async function loadWeekStats() {
    const weekDates = getWeekDates();
    const sessions = await getSessions();
    setFocusDays(getRecentFocusDays(sessions));

    const weekSessions = sessions.filter(s => {
      const sessionDate = getDateString(s.startTime);
      return weekDates.includes(sessionDate) && s.status === "completed";
    });

    const totalFocusTime = weekSessions.reduce(
      (acc, s) =>
        acc + calculateSessionDuration(s.startTime, s.endTime, s.pausedTime),
      0
    );

    const totalDistractions = weekSessions.reduce(
      (acc, s) => acc + s.distractions.length,
      0
    );

    const templateCounts: Record<string, number> = {};
    weekSessions.forEach(s => {
      templateCounts[s.templateName] =
        (templateCounts[s.templateName] || 0) + 1;
    });

    const topTemplate =
      Object.entries(templateCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      t("review.noFocus");

    setWeekStats({
      totalSessions: weekSessions.length,
      totalFocusTime,
      avgDistractions:
        weekSessions.length > 0
          ? Math.round(totalDistractions / weekSessions.length)
          : 0,
      topTemplate,
    });
  }

  const heatmapColors = [
    "bg-muted",
    "bg-teal-100 dark:bg-teal-950/70",
    "bg-teal-200 dark:bg-teal-800",
    "bg-teal-400 dark:bg-teal-600",
    "bg-teal-600 dark:bg-teal-400",
  ];

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">
        {t("review.weeklyTitle")}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">
            {t("review.sessions")}
          </p>
          <p className="text-3xl font-bold text-[var(--color-teal-foreground)]">
            {weekStats.totalSessions}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">
            {t("review.totalFocus")}
          </p>
          <p className="text-3xl font-bold text-[var(--color-teal-foreground)]">
            {formatDuration(weekStats.totalFocusTime, language)}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">
            {t("review.avgDistractions")}
          </p>
          <p className="text-3xl font-bold text-[var(--color-teal-foreground)]">
            {weekStats.avgDistractions}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">
            {t("review.topTemplate")}
          </p>
          <p className="text-lg font-bold text-[var(--color-teal-foreground)]">
            {weekStats.topTemplate}
          </p>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {t("review.activityTitle")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("review.activityDescription")}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{t("review.less")}</span>
            <span className="size-3 rounded-sm bg-muted" aria-hidden="true" />
            <span
              className="size-3 rounded-sm bg-teal-200 dark:bg-teal-800"
              aria-hidden="true"
            />
            <span
              className="size-3 rounded-sm bg-teal-600 dark:bg-teal-400"
              aria-hidden="true"
            />
            <span>{t("review.more")}</span>
          </div>
        </div>
        <div
          className="mt-5 grid grid-cols-10 gap-1.5 sm:grid-cols-[repeat(15,minmax(0,1fr))]"
          aria-label={t("review.activityTitle")}
        >
          {focusDays.map(day => (
            <div
              key={day.date}
              className={`aspect-square rounded-sm ${heatmapColors[day.level]}`}
              title={`${day.date}: ${t("review.focusDay", {
                minutes: day.minutes,
                sessions: day.sessions,
              })}`}
              aria-label={`${day.date}: ${t("review.focusDay", {
                minutes: day.minutes,
                sessions: day.sessions,
              })}`}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
