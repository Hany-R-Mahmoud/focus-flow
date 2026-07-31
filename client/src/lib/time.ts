import type { Language } from "@/lib/i18n";
import { translate } from "@/lib/i18n";

/**
 * Time formatting and calculation utilities for FocusSessionFlow
 */

export function formatDuration(
  minutes: number,
  language: Language = "en"
): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (language === "ar") {
    if (hours > 0) return `${hours}س ${mins}د`;
    return `${mins}د`;
  }

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatDate(
  timestamp: number,
  language: Language = "en"
): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return translate(language, "common.today");
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return translate(language, "common.yesterday");
  }

  return date.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export function formatDateTime(
  timestamp: number,
  language: Language = "en"
): string {
  const date = new Date(timestamp);
  return date.toLocaleString(language === "ar" ? "ar-EG" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getDateString(timestamp: number): string {
  const date = new Date(timestamp);
  return formatLocalDate(date);
}

export function getTodayString(): string {
  return formatLocalDate(new Date());
}

export function getLocalDayStart(timestamp: number = Date.now()): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function getWeekStartDate(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export function getWeekDates(date: Date = new Date()): string[] {
  const start = getWeekStartDate(date);
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(formatLocalDate(d));
  }
  return dates;
}

function formatLocalDate(date: Date): string {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) =>
      index === 0 ? String(part) : String(part).padStart(2, "0")
    )
    .join("-");
}

export function getElapsedSessionTime(
  startTime: number,
  pausedTime: number,
  status: "active" | "paused" | "completed" | "abandoned",
  endTime: number | null = null,
  pausedAt: number | null = null,
  now: number = Date.now()
): number {
  const effectiveEnd = endTime ?? now;
  const currentPause =
    status === "paused" && pausedAt ? Math.max(0, now - pausedAt) : 0;
  return Math.max(0, effectiveEnd - startTime - pausedTime - currentPause);
}

export function calculateSessionDuration(
  startTime: number,
  endTime: number | null,
  pausedTime: number = 0
): number {
  if (!endTime) return 0;
  return Math.floor((endTime - startTime - pausedTime) / 1000 / 60);
}
