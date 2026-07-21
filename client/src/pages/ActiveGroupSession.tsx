import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { getGroupSession, initDB } from "@/lib/db";
import { calculateSessionStatus, calculateTimeRemaining, generateGroupSessionLink } from "@/lib/groupSession";
import type { Distraction, GroupSession } from "@/lib/db";
import { getSessionParticipants, type Participant } from "@/lib/participants";
import { AlertCircle, Copy, Check, ExternalLink, Share2 } from "lucide-react";

export default function ActiveGroupSession() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const sessionId = params?.id;

  const [session, setSession] = useState<GroupSession | null>(null);
  const [status, setStatus] = useState<string>("loading");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [outcome, setOutcome] = useState("");
  const [reflection, setReflection] = useState("");
  const [interruptions, setInterruptions] = useState<Distraction[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [interruptionForm, setInterruptionForm] = useState({
    category: "other",
    note: "",
  });
  const [showInterruptionDialog, setShowInterruptionDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  const getInterruptionStorageKey = (id: string) => `focusflow_group_interruptions_${id}`;

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
      try {
        const storedInterruptions = localStorage.getItem(getInterruptionStorageKey(loaded.id));
        setInterruptions(storedInterruptions ? JSON.parse(storedInterruptions) : []);
      } catch {
        setInterruptions([]);
      }
      setParticipants(getSessionParticipants(loaded.id));
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
    if (interruptions.length > 0) {
      summary += `Interruptions recorded: ${interruptions.length}\n`;
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
    localStorage.setItem(getInterruptionStorageKey(session.id), JSON.stringify(nextInterruptions));
    setInterruptionForm({ category: "other", note: "" });
    setShowInterruptionDialog(false);
    toast.success("Interruption logged");
  };

  const getInviteLink = (): string => {
    if (!session) return "";

    return generateGroupSessionLink({
      version: session.payloadVersion,
      sessionId: session.id.startsWith("gs_") ? session.id : `gs_${session.id}`,
      title: session.title,
      sharedObjective: session.sharedObjective,
      startsAt: session.startsAt,
      focusMinutes: session.focusMinutes,
      breakMinutes: session.breakMinutes,
      meetingUrl: session.meetingUrl,
      organizerName: session.organizerName,
      openingMessage: session.openingMessage,
    });
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
                <p className="text-sm font-medium text-slate-700">Interruptions recorded</p>
                <p className="mt-2 text-sm text-slate-600">{interruptions.length}</p>
              </div>
            </div>

            {interruptions.length > 0 && (
              <div className="border-t pt-6 mt-6">
                <h3 className="font-semibold text-slate-900 mb-3">Your interruptions</h3>
                <div className="space-y-2">
                  {interruptions.map((interruption) => (
                    <div key={interruption.id} className="text-sm p-3 bg-slate-50 rounded flex items-start gap-3">
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

        <Card className="p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">Participants on this browser</h2>
              <p className="text-sm text-slate-600 mt-1">
                {participants.length === 0
                  ? "No participants recorded here yet."
                  : `${participants.length} ${participants.length === 1 ? "person" : "people"} joined here.`}
              </p>
            </div>
            <span className="text-2xl font-semibold text-teal-700" aria-label={`${participants.length} local participants`}>
              {participants.length}
            </span>
          </div>
          {participants.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4" aria-label="Local participant names">
              {participants.map((participant) => (
                <span key={participant.id} className="px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-sm">
                  {participant.name}
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-500 mt-4">
            This roster is local to this browser; live cross-device presence is not enabled.
          </p>
        </Card>

        {interruptions.length > 0 && (
          <Card className="p-6 mb-6">
            <h2 className="font-semibold text-slate-900 mb-3">Your interruptions ({interruptions.length})</h2>
            <div className="space-y-2">
              {interruptions.map((interruption) => (
                <div key={interruption.id} className="text-sm p-3 bg-slate-50 rounded flex items-start gap-3">
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
            {inviteCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {inviteCopied ? "Copied" : "Copy invite link"}
          </Button>
          <Button
            onClick={() => setLocation("/group-sessions")}
            variant="outline"
            className="w-full sm:flex-1"
          >
            Back to Sessions
          </Button>
          {status === "in-progress" && (
            <Button
              onClick={() => setLocation("/")}
              className="w-full sm:flex-1"
            >
              Go to Dashboard
            </Button>
          )}
        </div>

        <Dialog open={showInterruptionDialog} onOpenChange={setShowInterruptionDialog}>
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
                  onChange={(event) =>
                    setInterruptionForm({ ...interruptionForm, category: event.target.value })
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
                  onChange={(event) =>
                    setInterruptionForm({ ...interruptionForm, note: event.target.value })
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
