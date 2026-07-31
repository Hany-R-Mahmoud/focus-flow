import { describe, expect, it } from "vitest";
import type { FocusSession } from "../db";
import { getRecentFocusDays } from "../focusStats";

function session(
  id: string,
  startTime: number,
  duration: number,
  status: FocusSession["status"] = "completed"
): FocusSession {
  return {
    id,
    templateId: "template",
    templateName: "Deep work",
    duration,
    startTime,
    endTime: startTime + duration * 60 * 1000,
    pausedTime: 0,
    pausedAt: null,
    taskIntention: "",
    outcome: "",
    distractions: [],
    status,
    createdAt: startTime,
  };
}

describe("focus review helpers", () => {
  it("returns a 30-day local calendar with completed focus grouped by day", () => {
    const now = new Date(2026, 6, 31, 12).getTime();
    const today = new Date(2026, 6, 31, 9).getTime();
    const yesterday = new Date(2026, 6, 30, 9).getTime();

    const days = getRecentFocusDays(
      [
        session("today-a", today, 25),
        session("today-b", today + 60 * 60 * 1000, 30),
        session("paused", today, 120, "paused"),
        session("yesterday", yesterday, 100),
      ],
      30,
      now
    );

    expect(days).toHaveLength(30);
    expect(days.at(-1)).toMatchObject({
      date: "2026-07-31",
      minutes: 55,
      sessions: 2,
      level: 3,
    });
    expect(days.at(-2)).toMatchObject({
      date: "2026-07-30",
      minutes: 100,
      sessions: 1,
      level: 4,
    });
    expect(days[0]).toMatchObject({ minutes: 0, sessions: 0, level: 0 });
  });
});
