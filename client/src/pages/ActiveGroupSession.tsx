import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { deleteGroupSession, getGroupSession, initDB } from "@/lib/db";
import {
  calculateSessionStatus,
  calculateTimeRemaining,
  generateGroupSessionLink,
} from "@/lib/groupSession";
import type { Distraction, GroupSession } from "@/lib/db";
import {
  getSessionParticipants,
  removeParticipantByName,
  type Participant,
} from "@/lib/participants";
import { getStoredDisplayName, isSupabaseConfigured } from "@/lib/supabase";
import {
  claimActiveGroupSession,
  refreshActiveGroupSession,
  releaseActiveGroupSession,
} from "@/lib/activeGroupSession";
import {
  deleteCloudGroupSession,
  getCloudGroupSessionByPayloadId,
  subscribeToCloudGroupPresence,
} from "@/lib/cloudGroupSessions";
import {
  getActivityLog,
  readGroupSessionLocalJson,
  readGroupSessionLocalText,
  writeGroupSessionLocalJson,
  writeGroupSessionLocalText,
} from "@/lib/activityLog";
import ActivityTimeline from "@/components/ActivityTimeline";
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  LogOut,
  Share2,
} from "lucide-react";

type GroupSessionStatus = ReturnType<typeof calculateSessionStatus>;

function isDistraction(value: unknown): value is Distraction {
  if (!value || typeof value !== "object") return false;
  const distraction = value as Record<string, unknown>;
  return (
    typeof distraction.id === "string" &&
    typeof distraction.sessionId === "string" &&
    typeof distraction.time === "number" &&
    typeof distraction.category === "string" &&
    typeof distraction.note === "string"
  );
}

function isDistractionList(value: unknown): value is Distraction[] {
  return Array.isArray(value) && value.every(isDistraction);
}

export default function ActiveGroupSession() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const sessionId = params?.id;

  const [session, setSession] = useState<GroupSession | null>(null);
  const [status, setStatus] = useState<GroupSessionStatus | "loading">(
    "loading"
  );
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [intention, setIntention] = useState("");
  const [outcome, setOutcome] = useState("");
  const [reflection, setReflection] = useState("");
  const [interruptions, setInterruptions] = useState<Distraction[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [cloudPresenceActive, setCloudPresenceActive] = useState(false);
  const [activityEvents, setActivityEvents] = useState<
    ReturnType<typeof getActivityLog>
  >([]);
  const [interruptionForm, setInterruptionForm] = useState({
    category: "other",
    note: "",
  });
  const [showInterruptionDialog, setShowInterruptionDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      if (!sessionId) {
        setError("Invalid session ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setSession(null);
      try {
        await initDB();
        const loaded = await getGroupSession(sessionId);
        if (!loaded) {
          if (!cancelled) setError("Session not found");
          return;
        }

        const storedInterruptions = readGroupSessionLocalJson(
          "interruptions",
          loaded.id,
          [],
          isDistractionList
        );
        const storedIntention = readGroupSessionLocalText(
          "intention",
          loaded.id
        );
        const storedOutcome =
          loaded.outcome || readGroupSessionLocalText("outcome", loaded.id);
        const storedReflection =
          loaded.reflection ||
          readGroupSessionLocalText("reflection", loaded.id);

        if (!cancelled) {
          setSession(loaded);
          setIntention(storedIntention);
          setOutcome(storedOutcome);
          setReflection(storedReflection);
          setInterruptions(storedInterruptions);
          setParticipants(getSessionParticipants(loaded.id));
          setActivityEvents(getActivityLog(loaded.id));
        }
      } catch (err) {
        console.error("Error loading session:", err);
        if (!cancelled) setError("Failed to load session");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadSession();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!session) return;

    const activeSessionKey = session.payloadSessionId || session.id;
    if (!claimActiveGroupSession(activeSessionKey)) {
      setError("You already have another group session open.");
      setSession(null);
      return;
    }

    const heartbeat = window.setInterval(() => {
      refreshActiveGroupSession(activeSessionKey);
    }, 15_000);

    return () => {
      window.clearInterval(heartbeat);
      releaseActiveGroupSession(activeSessionKey);
    };
  }, [session]);

  useEffect(() => {
    if (!session) return;

    const updateStatus = () => {
      const newStatus = calculateSessionStatus(
        session.startsAt,
        session.focusMinutes,
        session.breakMinutes
      );
      setStatus(newStatus);

      setTimeRemaining(
        calculateTimeRemaining(
          session.startsAt,
          session.focusMinutes,
          session.breakMinutes || 0
        )
      );
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [session]);

  useEffect(() => {
    const payloadSessionId = session?.payloadSessionId;
    if (!session || !payloadSessionId) return;

    let cancelled = false;
    let cleanup: (() => void) | null = null;
    setCloudPresenceActive(false);

    const connectPresence = async () => {
      try {
        const cloudCleanup = await subscribeToCloudGroupPresence(
          payloadSessionId,
          getStoredDisplayName(),
          nextParticipants => {
            if (!cancelled) setParticipants(nextParticipants);
          },
          participantName => {
            if (!cancelled) toast.info(`${participantName} left the session`);
          }
        );
        if (cancelled) {
          cloudCleanup?.();
        } else {
          cleanup = cloudCleanup;
          setCloudPresenceActive(cloudCleanup !== null);
        }
      } catch (error) {
        setCloudPresenceActive(false);
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.warn(
          `Cloud presence unavailable; using local participants. ${message}`
        );
      }
    };

    void connectPresence();
    return () => {
      cancelled = true;
      setCloudPresenceActive(false);
      cleanup?.();
    };
  }, [session]);

  useEffect(() => {
    if (!session) return;

    const refreshLocalData = () => {
      if (
        !cloudPresenceActive &&
        !(isSupabaseConfigured && session.payloadSessionId)
      ) {
        setParticipants(getSessionParticipants(session.id));
      }
      setActivityEvents(getActivityLog(session.id));
    };
    refreshLocalData();
    const interval = window.setInterval(refreshLocalData, 1000);
    return () => window.clearInterval(interval);
  }, [cloudPresenceActive, session]);

  useEffect(() => {
    if (!session || !isSupabaseConfigured || !session.payloadSessionId) return;

    let cancelled = false;
    const checkSession = async () => {
      try {
        const cloudSession = await getCloudGroupSessionByPayloadId(
          session.payloadSessionId as string
        );
        if (!cloudSession && !cancelled) {
          releaseActiveGroupSession(session.payloadSessionId as string);
          setError("The organizer cancelled this session.");
          setSession(null);
        }
      } catch (error) {
        console.warn("Unable to check group session status", error);
      }
    };

    const interval = window.setInterval(() => void checkSession(), 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [session]);

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
      case "break":
        return "bg-amber-50 border-amber-200";
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
    if (intention) summary += `Intention: ${intention}\n`;
    summary += `Focused: ${session.focusMinutes} minutes\n`;
    if (outcome) summary += `Outcome: ${outcome}\n`;
    if (interruptions.length > 0) {
      summary += `Interruptions recorded: ${interruptions.length}\n`;
    }
    if (reflection) {
      summary += `Reflection: ${reflection}\n`;
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

  const handleAddInterruption = () => {
    if (!session) return;

    const interruption: Distraction = {
      id: `group_dist_${Date.now()}`,
      sessionId: session.id,
      time: Date.now(),
      category: interruptionForm.category,
      note: interruptionForm.note.trim(),
    };

    const nextInterruptions = [...interruptions, interruption];
    setInterruptions(nextInterruptions);
    writeGroupSessionLocalJson("interruptions", session.id, nextInterruptions);
    setInterruptionForm({ category: "other", note: "" });
    setShowInterruptionDialog(false);
    toast.success("Interruption logged");
  };

  const getInviteLink = (): string => {
    if (!session) return "";

    return generateGroupSessionLink(
      {
        version: session.payloadVersion,
        sessionId:
          session.payloadSessionId ||
          (session.id.startsWith("gs_") ? session.id : `gs_${session.id}`),
        title: session.title,
        sharedObjective: session.sharedObjective,
        startsAt: session.startsAt,
        focusMinutes: session.focusMinutes,
        breakMinutes: session.breakMinutes,
        meetingUrl: session.meetingUrl,
        organizerName: session.organizerName,
        openingMessage: session.openingMessage,
      },
      { allowStarted: true }
    );
  };

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(getInviteLink());
      setInviteCopied(true);
      toast.success("Invite link copied");
      setTimeout(() => setInviteCopied(false), 2000);
    } catch {
      toast.error("Failed to copy invite link");
    }
  };

  const handleExitSession = (destination = "/group-sessions") => {
    if (!session) return;
    removeParticipantByName(session.id, getStoredDisplayName());
    releaseActiveGroupSession(session.payloadSessionId || session.id);
    toast.success("You left the session");
    setLocation(destination);
  };

  const handleCancelSession = async () => {
    if (
      !session ||
      session.source !== "created" ||
      calculateSessionStatus(
        session.startsAt,
        session.focusMinutes,
        session.breakMinutes
      ) === "ended"
    ) {
      return;
    }
    if (!confirm("Cancel this group session for everyone?")) return;

    try {
      if (isSupabaseConfigured && session.payloadSessionId) {
        await deleteCloudGroupSession(session.payloadSessionId);
      }
      await deleteGroupSession(session.id);
      releaseActiveGroupSession(session.payloadSessionId || session.id);
      toast.success("Group session cancelled");
      setLocation("/group-sessions");
    } catch {
      toast.error("Failed to cancel group session");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted/60 to-background p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted/60 to-background p-4 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full border-red-200 bg-red-50">
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h2 className="text-lg font-semibold text-red-900">Error</h2>
          </div>
          <p className="text-red-700 mb-6">{error}</p>
          <Button
            onClick={() => setLocation("/group-sessions")}
            className="w-full"
          >
            Back to Group Sessions
          </Button>
        </Card>
      </div>
    );
  }

  const startTime = new Date(session.startsAt);
  const endTime = new Date(
    startTime.getTime() +
      (session.focusMinutes + (session.breakMinutes || 0)) * 60 * 1000
  );
  const isEnded = status === "ended";

  if (isEnded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-muted/60 to-background p-4">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">
              Session Complete
            </h1>
            <p className="text-slate-600 mt-2">
              Great work! Record your outcome below.
            </p>
          </div>

          <Card className="p-6 mb-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Session Summary
              </h2>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium text-slate-700">Session:</span>{" "}
                  <span className="text-slate-600">{session.title}</span>
                </p>
                <p>
                  <span className="font-medium text-slate-700">Duration:</span>{" "}
                  <span className="text-slate-600">
                    {session.focusMinutes} minutes
                  </span>
                </p>
                <p>
                  <span className="font-medium text-slate-700">
                    Completed at:
                  </span>{" "}
                  <span className="text-slate-600">
                    {endTime.toLocaleString()}
                  </span>
                </p>
              </div>
            </div>

            <div className="border-t pt-6 space-y-4">
              <div>
                <Label
                  htmlFor="group-intention"
                  className="text-sm font-medium text-slate-700"
                >
                  What is your intention for this session?
                </Label>
                <Textarea
                  id="group-intention"
                  value={intention}
                  onChange={event => {
                    setIntention(event.target.value);
                    writeGroupSessionLocalText(
                      "intention",
                      session.id,
                      event.target.value
                    );
                  }}
                  placeholder="What will you focus on?"
                  className="mt-2 resize-none"
                  rows={2}
                />
              </div>

              <div>
                <Label
                  htmlFor="outcome"
                  className="text-sm font-medium text-slate-700"
                >
                  What did you accomplish?
                </Label>
                <Textarea
                  id="outcome"
                  value={outcome}
                  onChange={event => {
                    setOutcome(event.target.value);
                    writeGroupSessionLocalText(
                      "outcome",
                      session.id,
                      event.target.value
                    );
                  }}
                  placeholder="Describe what you completed or achieved..."
                  className="mt-2 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <Label
                  htmlFor="reflection"
                  className="text-sm font-medium text-slate-700"
                >
                  Reflection (optional)
                </Label>
                <Textarea
                  id="reflection"
                  value={reflection}
                  onChange={event => {
                    setReflection(event.target.value);
                    writeGroupSessionLocalText(
                      "reflection",
                      session.id,
                      event.target.value
                    );
                  }}
                  placeholder="Any thoughts about the session?"
                  className="mt-2 resize-none"
                  rows={3}
                />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-700">
                  Interruptions recorded
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {interruptions.length}
                </p>
              </div>
            </div>

            {interruptions.length > 0 && (
              <div className="border-t pt-6 mt-6">
                <h3 className="font-semibold text-slate-900 mb-3">
                  Your interruptions
                </h3>
                <div className="space-y-2">
                  {interruptions.map(interruption => (
                    <div
                      key={interruption.id}
                      className="text-sm p-3 bg-slate-50 rounded flex items-start gap-3"
                    >
                      <span className="text-xs font-semibold text-teal-700 uppercase">
                        {interruption.category}
                      </span>
                      <span className="text-slate-600 flex-1">
                        {interruption.note || "No note added"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-6 mt-6">
              <h3 className="font-semibold text-slate-900 mb-3">
                Completion Summary
              </h3>
              <textarea
                value={generateCompletionSummary()}
                readOnly
                aria-label="Completion summary"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-sm text-slate-600 font-mono h-32 resize-none"
              />
              <Button
                onClick={() => copyToClipboard(generateCompletionSummary())}
                variant="outline"
                size="sm"
                className="mt-2 gap-2"
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
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
            <Button onClick={() => setLocation("/")} className="flex-1">
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/60 to-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">{session.title}</h1>
          <p className="text-slate-600 mt-2">Group Focus Session</p>
        </div>

        <Card className={`p-6 mb-6 border-2 ${getStatusColor()}`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-slate-600">Time Remaining</p>
              <p
                className="text-4xl font-bold text-slate-900 font-mono"
                aria-live="polite"
              >
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
              <span className="text-slate-600">
                {startTime.toLocaleString()}
              </span>
            </p>
            <p>
              <span className="font-medium text-slate-700">End:</span>{" "}
              <span className="text-slate-600">{endTime.toLocaleString()}</span>
            </p>
            {session.organizerName && (
              <p>
                <span className="font-medium text-slate-700">
                  Organized by:
                </span>{" "}
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
            <strong>Group Session:</strong> This session runs on your device
            based on the scheduled start and end times. Your personal
            intentions, distractions, and outcomes stay private unless you
            manually share them.
          </p>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-3">Your intention</h2>
          <Label htmlFor="group-intention-active" className="sr-only">
            What will you focus on?
          </Label>
          <Textarea
            id="group-intention-active"
            value={intention}
            onChange={event => {
              setIntention(event.target.value);
              writeGroupSessionLocalText(
                "intention",
                session.id,
                event.target.value
              );
            }}
            placeholder="What will you focus on?"
            rows={2}
            className="resize-none"
          />
          <p className="text-xs text-slate-500 mt-2">
            Stored only on this browser.
          </p>
        </Card>

        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                {cloudPresenceActive
                  ? "Participants online"
                  : "Participants on this browser"}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {cloudPresenceActive
                  ? participants.length === 0
                    ? "No one is connected yet."
                    : `${participants.length} ${participants.length === 1 ? "person is" : "people are"} connected.`
                  : participants.length === 0
                    ? "No participants recorded here yet."
                    : `${participants.length} ${participants.length === 1 ? "person" : "people"} joined here.`}
              </p>
            </div>
            <span
              className="text-2xl font-semibold text-teal-700"
              aria-label={`${participants.length} ${cloudPresenceActive ? "online" : "local"} participants`}
            >
              {participants.length}
            </span>
          </div>
          {participants.length > 0 && (
            <div
              className="flex flex-wrap gap-2 mt-4"
              aria-label="Local participant names"
            >
              {participants.map(participant => (
                <span
                  key={participant.id}
                  className="px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-sm"
                >
                  {participant.name}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-500 mt-4">
            {cloudPresenceActive
              ? "Live names disappear when participants leave."
              : "This roster is local to this browser; live cross-device presence is not enabled."}
          </p>
        </Card>

        <Card className="p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-3">Activity</h2>
          <ActivityTimeline events={activityEvents} />
        </Card>

        {interruptions.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="font-semibold text-slate-900 mb-3">
              Your interruptions ({interruptions.length})
            </h2>
            <div className="space-y-2">
              {interruptions.map(interruption => (
                <div
                  key={interruption.id}
                  className="text-sm p-3 bg-slate-50 rounded flex items-start gap-3"
                >
                  <span className="text-xs font-semibold text-teal-700 uppercase">
                    {interruption.category}
                  </span>
                  <span className="text-slate-600 flex-1">
                    {interruption.note || "No note added"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setShowInterruptionDialog(true)}
            variant="outline"
            className="w-full sm:flex-1 gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            Log interruption
          </Button>
          <Button
            onClick={handleCopyInviteLink}
            variant="outline"
            className="w-full sm:flex-1 gap-2"
          >
            {inviteCopied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            {inviteCopied ? "Copied" : "Copy invite link"}
          </Button>
          <Button
            onClick={() => handleExitSession()}
            variant="outline"
            className="w-full sm:flex-1"
          >
            Back to Sessions
          </Button>
          {session.source === "created" && (
            <Button
              onClick={handleCancelSession}
              variant="destructive"
              className="w-full sm:flex-1"
            >
              Cancel Group Session
            </Button>
          )}
          {status === "in-progress" && (
            <Button
              onClick={() => handleExitSession("/")}
              className="w-full sm:flex-1"
            >
              Go to Dashboard
            </Button>
          )}
          <Button
            onClick={() => handleExitSession()}
            variant="outline"
            className="w-full sm:flex-1 gap-2"
          >
            <LogOut className="w-4 h-4" />
            Exit Session
          </Button>
        </div>

        <Dialog
          open={showInterruptionDialog}
          onOpenChange={setShowInterruptionDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log an interruption</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="group-interruption-category">Category</Label>
                <select
                  id="group-interruption-category"
                  value={interruptionForm.category}
                  onChange={event =>
                    setInterruptionForm({
                      ...interruptionForm,
                      category: event.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="social">Social Media</option>
                  <option value="thoughts">Wandering Thoughts</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="group-interruption-note">Note</Label>
                <Input
                  id="group-interruption-note"
                  value={interruptionForm.note}
                  onChange={event =>
                    setInterruptionForm({
                      ...interruptionForm,
                      note: event.target.value,
                    })
                  }
                  placeholder="What interrupted you?"
                />
              </div>
              <Button onClick={handleAddInterruption} className="w-full gap-2">
                <AlertCircle className="w-4 h-4" />
                Log interruption
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
