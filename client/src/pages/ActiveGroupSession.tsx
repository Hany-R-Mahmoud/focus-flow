import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getGroupSession, updateGroupSession, initDB } from "@/lib/db";
import { calculateSessionStatus, calculateTimeRemaining } from "@/lib/groupSession";
import { GroupSession } from "@/lib/db";
import { AlertCircle, Copy, Check, ExternalLink } from "lucide-react";

export default function ActiveGroupSession() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const sessionId = params?.id;

  const [session, setSession] = useState<GroupSession | null>(null);
  const [status, setStatus] = useState<string>("loading");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [outcome, setOutcome] = useState("");
  const [reflection, setReflection] = useState("");
  const [distractionCount, setDistractionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  useEffect(() => {
    if (!session) return;

    const updateStatus = () => {
      const newStatus = calculateSessionStatus(
        session.startsAt,
        session.focusMinutes,
        session.breakMinutes
      );
      setStatus(newStatus);

      const remaining = calculateTimeRemaining(session.startsAt, session.focusMinutes);
      setTimeRemaining(remaining);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const loadSession = async () => {
    if (!sessionId) {
      setError("Invalid session ID");
      setLoading(false);
      return;
    }

    try {
      // Initialize database first
      await initDB();
      const loaded = await getGroupSession(sessionId);
      if (!loaded) {
        setError("Session not found");
        setLoading(false);
        return;
      }
      setSession(loaded);
    } catch (err) {
      console.error("Error loading session:", err);
      setError("Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  const getStatusColor = () => {
    switch (status) {
      case "upcoming":
        return "bg-blue-50 border-blue-200";
      case "starting-soon":
        return "bg-yellow-50 border-yellow-200";
      case "in-progress":
        return "bg-green-50 border-green-200";
      case "ended":
        return "bg-slate-50 border-slate-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  const generateCompletionSummary = (): string => {
    if (!session) return "";

    let summary = "Focus session completed\n";
    summary += `Session: ${session.title}\n`;
    if (outcome) {
      summary += `Intention: ${outcome}\n`;
    }
    summary += `Focused: ${session.focusMinutes} minutes\n`;
    if (outcome) {
      summary += `Outcome: ${outcome}\n`;
    }
    if (distractionCount > 0) {
      summary += `Distractions recorded: ${distractionCount}\n`;
    }
    if (reflection) {
      summary += `Reflection: ${reflection}`;
    }

    return summary;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full border-red-200 bg-red-50">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-lg font-semibold text-red-900">Error</h2>
          </div>
          <p className="text-red-700 mb-6">{error}</p>
          <Button onClick={() => setLocation("/group-sessions")} className="w-full">
            Back to Group Sessions
          </Button>
        </Card>
      </div>
    );
  }

  const startTime = new Date(session.startsAt);
  const endTime = new Date(startTime.getTime() + session.focusMinutes * 60 * 1000);
  const isEnded = status === "ended";

  if (isEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Session Complete</h1>
            <p className="text-slate-600 mt-2">Great work! Record your outcome below.</p>
          </div>

          <Card className="p-6 mb-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Session Summary</h2>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium text-slate-700">Session:</span>{" "}
                  <span className="text-slate-600">{session.title}</span>
                </p>
                <p>
                  <span className="font-medium text-slate-700">Duration:</span>{" "}
                  <span className="text-slate-600">{session.focusMinutes} minutes</span>
                </p>
                <p>
                  <span className="font-medium text-slate-700">Completed at:</span>{" "}
                  <span className="text-slate-600">{endTime.toLocaleString()}</span>
                </p>
              </div>
            </div>

            <div className="border-t pt-6 space-y-4">
              <div>
                <Label htmlFor="outcome" className="text-sm font-medium text-slate-700">
                  What did you accomplish?
                </Label>
                <Textarea
                  id="outcome"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  placeholder="Describe what you completed or achieved..."
                  className="mt-2 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="reflection" className="text-sm font-medium text-slate-700">
                  Reflection (optional)
                </Label>
                <Textarea
                  id="reflection"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Any thoughts about the session?"
                  className="mt-2 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="distractions" className="text-sm font-medium text-slate-700">
                  Distractions recorded
                </Label>
                <Input
                  id="distractions"
                  type="number"
                  min="0"
                  value={distractionCount}
                  onChange={(e) => setDistractionCount(parseInt(e.target.value) || 0)}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="border-t pt-6 mt-6">
              <h3 className="font-semibold text-slate-900 mb-3">Completion Summary</h3>
              <textarea
                value={generateCompletionSummary()}
                readOnly
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm text-slate-600 font-mono h-32 resize-none"
              />
              <Button
                onClick={() => copyToClipboard(generateCompletionSummary())}
                variant="outline"
                size="sm"
                className="mt-2 gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy Summary"}
              </Button>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button
              onClick={() => setLocation("/group-sessions")}
              variant="outline"
              className="flex-1"
            >
              Back to Group Sessions
            </Button>
            <Button
              onClick={() => setLocation("/")}
              className="flex-1"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{session.title}</h1>
          <p className="text-slate-600 mt-2">Group Focus Session</p>
        </div>

        <Card className={`p-6 mb-6 border-2 ${getStatusColor()}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-slate-600">Time Remaining</p>
              <p className="text-4xl font-bold text-slate-900 font-mono">
                {formatTime(timeRemaining)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Status</p>
              <p className="text-lg font-semibold text-slate-900 capitalize">
                {status === "starting-soon" ? "Starting Soon" : status}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm border-t pt-4">
            <p>
              <span className="font-medium text-slate-700">Start:</span>{" "}
              <span className="text-slate-600">{startTime.toLocaleString()}</span>
            </p>
            <p>
              <span className="font-medium text-slate-700">End:</span>{" "}
              <span className="text-slate-600">{endTime.toLocaleString()}</span>
            </p>
            {session.organizerName && (
              <p>
                <span className="font-medium text-slate-700">Organized by:</span>{" "}
                <span className="text-slate-600">{session.organizerName}</span>
              </p>
            )}
          </div>

          {session.meetingUrl && status !== "upcoming" && (
            <div className="mt-4 pt-4 border-t">
              <a
                href={session.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Open Meeting
              </a>
            </div>
          )}
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            <strong>Group Session:</strong> This session runs on your device based on the scheduled
            start and end times. Your personal intentions, distractions, and outcomes stay private
            unless you manually share them.
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={() => setLocation("/group-sessions")}
            variant="outline"
            className="flex-1"
          >
            Back to Sessions
          </Button>
          {status === "in-progress" && (
            <Button
              onClick={() => setLocation("/")}
              className="flex-1"
            >
              Go to Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
