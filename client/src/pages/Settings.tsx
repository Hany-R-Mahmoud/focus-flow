import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { exportData, importData, clearAllData } from "@/lib/db";
import type {
  DailyReview,
  Distraction,
  FocusSession,
  GroupSession,
  SessionTemplate,
} from "@/lib/db";
import { toast } from "sonner";
import { Download, Upload, Trash2 } from "lucide-react";
import { requestNotificationPermission } from "@/lib/notifications";
import { useLocale } from "@/contexts/LocaleContext";
import ThemeToggle from "@/components/ThemeToggle";
import {
  loadUserPreferences,
  updateUserPreferences,
  type UserPreferences,
} from "@/lib/preferences";
import { canKeepScreenAwake } from "@/lib/wakeLock";

type ImportData = Parameters<typeof importData>[0];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isIntegerInRange(
  value: unknown,
  minimum: number,
  maximum: number
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum
  );
}

function isDateString(value: unknown): value is string {
  return isString(value) && !Number.isNaN(new Date(value).getTime());
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function isDistraction(value: unknown): value is Distraction {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.sessionId) &&
    isFiniteNumber(value.time) &&
    isString(value.category) &&
    isString(value.note)
  );
}

function isSessionTemplate(value: unknown): value is SessionTemplate {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.name) &&
    isFiniteNumber(value.duration) &&
    isString(value.description) &&
    isString(value.color) &&
    isFiniteNumber(value.createdAt)
  );
}

function isFocusSession(value: unknown): value is FocusSession {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.templateId) &&
    isString(value.templateName) &&
    isFiniteNumber(value.startTime) &&
    (value.endTime === null || isFiniteNumber(value.endTime)) &&
    isFiniteNumber(value.pausedTime) &&
    (value.pausedAt === undefined ||
      value.pausedAt === null ||
      isFiniteNumber(value.pausedAt)) &&
    isString(value.taskIntention) &&
    isString(value.outcome) &&
    Array.isArray(value.distractions) &&
    value.distractions.every(isDistraction) &&
    isString(value.status) &&
    ["active", "paused", "completed", "abandoned"].includes(value.status) &&
    isFiniteNumber(value.createdAt)
  );
}

function isDailyReview(value: unknown): value is DailyReview {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.date) &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    isFiniteNumber(value.sessionsCompleted) &&
    isFiniteNumber(value.totalFocusTime) &&
    isString(value.notes) &&
    isFiniteNumber(value.createdAt)
  );
}

function isGroupSession(value: unknown): value is GroupSession {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isFiniteNumber(value.payloadVersion) &&
    isString(value.title) &&
    value.title.trim().length > 0 &&
    isDateString(value.startsAt) &&
    isIntegerInRange(value.focusMinutes, 5, 240) &&
    (value.breakMinutes === undefined ||
      isIntegerInRange(value.breakMinutes, 0, 120)) &&
    (value.sharedObjective === undefined || isString(value.sharedObjective)) &&
    (value.meetingUrl === undefined ||
      (isString(value.meetingUrl) && isHttpsUrl(value.meetingUrl))) &&
    (value.organizerName === undefined || isString(value.organizerName)) &&
    (value.openingMessage === undefined || isString(value.openingMessage)) &&
    (value.payloadSessionId === undefined ||
      isString(value.payloadSessionId)) &&
    (value.outcome === undefined || isString(value.outcome)) &&
    (value.reflection === undefined || isString(value.reflection)) &&
    (value.joinedAt === undefined || isDateString(value.joinedAt)) &&
    (value.source === "created" || value.source === "joined") &&
    isDateString(value.createdAt) &&
    isDateString(value.updatedAt)
  );
}

function isLocalData(value: unknown): value is Record<string, string> {
  if (!isRecord(value) || Array.isArray(value)) return false;
  return Object.entries(value).every(
    ([key, entry]) =>
      key.startsWith("focusflow_") && isString(entry) && entry.length <= 500_000
  );
}

function isImportData(value: unknown): value is ImportData {
  if (!isRecord(value)) return false;

  return (
    (value.snapshotVersion === undefined || value.snapshotVersion === 1) &&
    Array.isArray(value.templates) &&
    value.templates.every(isSessionTemplate) &&
    Array.isArray(value.sessions) &&
    value.sessions.every(isFocusSession) &&
    Array.isArray(value.reviews) &&
    value.reviews.every(isDailyReview) &&
    (value.groupSessions === undefined ||
      (Array.isArray(value.groupSessions) &&
        value.groupSessions.every(isGroupSession))) &&
    (value.localData === undefined || isLocalData(value.localData))
  );
}

export default function Settings() {
  const { language, setLanguage, t } = useLocale();
  const [preferences, setPreferences] =
    useState<UserPreferences>(loadUserPreferences);
  const wakeLockSupported =
    typeof navigator !== "undefined" && canKeepScreenAwake();

  function updatePreference(patch: Partial<UserPreferences>) {
    setPreferences(current => updateUserPreferences({ ...current, ...patch }));
  }

  async function handleExport() {
    try {
      const data = await exportData();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `focussessionflow-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("toast.exported"));
    } catch (err) {
      toast.error(t("toast.exportFailed"));
    }
  }

  async function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data: unknown = JSON.parse(text);
        if (!isImportData(data)) {
          throw new Error("Invalid backup format");
        }
        await importData(data);
        toast.success(t("toast.imported"));
      } catch (err) {
        toast.error(t("toast.importFailed"));
      } finally {
        input.value = "";
      }
    };
    input.click();
  }

  async function handleClear() {
    if (confirm(t("toast.clearConfirm"))) {
      try {
        await clearAllData();
        toast.success(t("toast.cleared"));
      } catch (err) {
        toast.error(t("toast.clearFailed"));
      }
    }
  }

  async function handleEnableNotifications() {
    const enabled = await requestNotificationPermission();
    toast[enabled ? "success" : "error"](
      enabled
        ? t("toast.notificationsEnabled")
        : t("toast.notificationsDisabled")
    );
  }

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-8">
        {t("settings.title")}
      </h1>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-4">
          {t("settings.language")}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          {t("settings.languageDescription")}
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label={t("settings.language")}
        >
          {(["en", "ar"] as const).map(option => (
            <Button
              key={option}
              type="button"
              variant={language === option ? "default" : "outline"}
              onClick={() => setLanguage(option)}
            >
              {option === "en"
                ? t("settings.languageEnglish")
                : t("settings.languageArabic")}
            </Button>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium text-foreground">{t("settings.theme")}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("settings.themeDescription")}
            </p>
          </div>
          <ThemeToggle showLabel />
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-4">
          {t("settings.focusPreferences")}
        </h2>
        <div className="space-y-5">
          {(
            [
              [
                "keepScreenAwake",
                "settings.wakeLock",
                "settings.wakeLockDescription",
              ],
              [
                "completionSound",
                "settings.completionSound",
                "settings.completionSoundDescription",
              ],
              [
                "completionHaptics",
                "settings.completionHaptics",
                "settings.completionHapticsDescription",
              ],
              [
                "personalNotifications",
                "settings.personalNotifications",
                "settings.personalNotificationsDescription",
              ],
            ] as const
          ).map(([preference, label, description]) => (
            <div
              key={preference}
              className="flex items-start justify-between gap-4"
            >
              <div>
                <Label htmlFor={`preference-${preference}`}>{t(label)}</Label>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(description)}
                  {preference === "keepScreenAwake" && !wakeLockSupported && (
                    <span className="mt-1 block">
                      {t("settings.wakeLockUnsupported")}
                    </span>
                  )}
                </p>
              </div>
              <Switch
                id={`preference-${preference}`}
                checked={preferences[preference]}
                onCheckedChange={checked =>
                  updatePreference({ [preference]: checked })
                }
                disabled={
                  preference === "keepScreenAwake" && !wakeLockSupported
                }
                aria-label={t(label)}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-4">
          {t("settings.dataManagement")}
        </h2>
        <div className="space-y-3">
          <div>
            <Label className="block mb-2">{t("settings.exportTitle")}</Label>
            <p className="text-sm text-muted-foreground mb-3">
              {t("settings.exportDescription")}
            </p>
            <Button
              className="gap-2 bg-[var(--color-teal)] hover:bg-[var(--color-teal-dark)] text-white"
              onClick={handleExport}
            >
              <Download size={18} />
              {t("settings.export")}
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <Label className="block mb-2">{t("settings.importTitle")}</Label>
            <p className="text-sm text-muted-foreground mb-3">
              {t("settings.importDescription")}
            </p>
            <Button
              className="gap-2 bg-[var(--color-teal)] hover:bg-[var(--color-teal-dark)] text-white"
              onClick={handleImport}
            >
              <Upload size={18} />
              {t("settings.import")}
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <Label className="block mb-2">{t("settings.clearTitle")}</Label>
            <p className="text-sm text-muted-foreground mb-3">
              {t("settings.clearDescription")}
            </p>
            <Button
              className="gap-2 bg-destructive hover:bg-red-700 text-white"
              onClick={handleClear}
            >
              <Trash2 size={18} />
              {t("settings.clear")}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-4">
          {t("settings.notifications")}
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          {t("settings.notificationsDescription")}
        </p>
        <Button onClick={handleEnableNotifications} variant="outline">
          {t("settings.enableNotifications")}
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">
          {t("settings.about")}
        </h2>
        <p className="text-sm text-muted-foreground mb-2">
          <strong>FocusSessionFlow</strong> v1.0.0
        </p>
        <p className="text-sm text-muted-foreground">
          {t("settings.aboutDescription")}
        </p>
      </Card>
    </div>
  );
}
