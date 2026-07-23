import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
      toast.success("Data exported successfully");
    } catch (err) {
      toast.error("Failed to export data");
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
        toast.success("Data imported successfully");
      } catch (err) {
        toast.error("Failed to import data");
      } finally {
        input.value = "";
      }
    };
    input.click();
  }

  async function handleClear() {
    if (confirm("Are you sure? This will delete all data.")) {
      try {
        await clearAllData();
        toast.success("All data cleared");
      } catch (err) {
        toast.error("Failed to clear data");
      }
    }
  }

  async function handleEnableNotifications() {
    const enabled = await requestNotificationPermission();
    toast[enabled ? "success" : "error"](
      enabled ? "Notifications enabled" : "Notifications were not enabled"
    );
  }

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-8">Settings</h1>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Data Management
        </h2>
        <div className="space-y-3">
          <div>
            <Label className="block mb-2">Export Your Data</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Download your sessions, templates, reviews, group sessions, and
              local group activity as a JSON file.
            </p>
            <Button
              className="gap-2 bg-[var(--color-teal)] hover:bg-[var(--color-teal-dark)] text-white"
              onClick={handleExport}
            >
              <Download size={18} />
              Export Data
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <Label className="block mb-2">Import Data</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Import previously exported data or data from another device.
            </p>
            <Button
              className="gap-2 bg-[var(--color-teal)] hover:bg-[var(--color-teal-dark)] text-white"
              onClick={handleImport}
            >
              <Upload size={18} />
              Import Data
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <Label className="block mb-2">Clear All Data</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Permanently delete all sessions, templates, and reviews. This
              cannot be undone.
            </p>
            <Button
              className="gap-2 bg-destructive hover:bg-red-700 text-white"
              onClick={handleClear}
            >
              <Trash2 size={18} />
              Clear All Data
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Notifications
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          Get an optional reminder before an upcoming group session. Permission
          is requested only when you choose to enable it.
        </p>
        <Button onClick={handleEnableNotifications} variant="outline">
          Enable Notifications
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">About</h2>
        <p className="text-sm text-muted-foreground mb-2">
          <strong>FocusSessionFlow</strong> v1.0.0
        </p>
        <p className="text-sm text-muted-foreground">
          An offline-first focus session planner for students, freelancers, and
          knowledge workers.
        </p>
      </Card>
    </div>
  );
}
