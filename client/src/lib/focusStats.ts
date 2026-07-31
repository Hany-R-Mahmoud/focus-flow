import type { FocusSession } from "./db";
import { calculateSessionDuration, getDateString } from "./time";

export interface FocusDaySummary {
  date: string;
  minutes: number;
  sessions: number;
  level: 0 | 1 | 2 | 3 | 4;
}

function getFocusLevel(minutes: number): FocusDaySummary["level"] {
  if (minutes >= 100) return 4;
  if (minutes >= 50) return 3;
  if (minutes >= 25) return 2;
  if (minutes > 0) return 1;
  return 0;
}

function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

export function getRecentFocusDays(
  sessions: FocusSession[],
  dayCount = 30,
  now = Date.now()
): FocusDaySummary[] {
  const safeDayCount = Math.max(1, Math.floor(dayCount));
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const firstDay = addDays(today, -(safeDayCount - 1));
  const summaries = new Map<string, Omit<FocusDaySummary, "level">>();

  for (let index = 0; index < safeDayCount; index += 1) {
    const date = getDateString(addDays(firstDay, index).getTime());
    summaries.set(date, { date, minutes: 0, sessions: 0 });
  }

  sessions
    .filter(session => session.status === "completed" && session.endTime)
    .forEach(session => {
      const date = getDateString(session.startTime);
      const summary = summaries.get(date);
      if (!summary) return;

      summary.minutes += calculateSessionDuration(
        session.startTime,
        session.endTime,
        session.pausedTime
      );
      summary.sessions += 1;
    });

  return Array.from(summaries.values()).map(summary => ({
    ...summary,
    level: getFocusLevel(summary.minutes),
  }));
}
