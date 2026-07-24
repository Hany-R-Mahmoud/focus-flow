import { useEffect, useState } from "react";
import { getSessions, getReviews } from "@/lib/db";
import { Card } from "@/components/ui/card";
import {
  getWeekDates,
  getDateString,
  calculateSessionDuration,
  formatDuration,
} from "@/lib/time";

export default function WeeklyReview() {
  const [weekStats, setWeekStats] = useState({
    totalSessions: 0,
    totalFocusTime: 0,
    avgDistractions: 0,
    topTemplate: "",
  });

  useEffect(() => {
    loadWeekStats();
  }, []);

  async function loadWeekStats() {
    const weekDates = getWeekDates();
    const sessions = await getSessions();

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
      "None";

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

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">Weekly Review</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Sessions</p>
          <p className="text-3xl font-bold text-[var(--color-teal-foreground)]">
            {weekStats.totalSessions}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Focus</p>
          <p className="text-3xl font-bold text-[var(--color-teal-foreground)]">
            {formatDuration(weekStats.totalFocusTime)}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Avg Distractions</p>
          <p className="text-3xl font-bold text-[var(--color-teal-foreground)]">
            {weekStats.avgDistractions}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Top Template</p>
          <p className="text-lg font-bold text-[var(--color-teal-foreground)]">
            {weekStats.topTemplate}
          </p>
        </Card>
      </div>
    </div>
  );
}
