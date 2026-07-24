import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { TurnstileChallenge } from "@/components/TurnstileChallenge";
import { toast } from "sonner";
import {
  createGroupSession,
  getGroupSessionByPayloadId,
  getGroupSessions,
  initDB,
  updateGroupSession,
} from "@/lib/db";
import type { GroupSession } from "@/lib/db";
import { addParticipant } from "@/lib/participants";
import {
  getGroupJoinErrorMessage,
  isSupabaseConfigured,
  isTurnstileConfigured,
  normalizeDisplayName,
  saveDisplayName,
} from "@/lib/supabase";
import {
  cloudGroupSessionToLocal,
  getCloudGroupSessionByPayloadId,
  joinCloudGroupSession,
} from "@/lib/cloudGroupSessions";
import {
  claimActiveGroupSession,
  releaseActiveGroupSession,
} from "@/lib/activeGroupSession";
import {
  extractPayloadFromHash,
  calculateSessionStatus,
  calculateTimeUntilStart,
} from "@/lib/groupSession";
import type { GroupSessionPayload } from "@/lib/groupSession";
import { formatTime } from "@/lib/time";
import { AlertCircle, Users, Link as LinkIcon } from "lucide-react";

export default function GroupSessionPreview() {
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<GroupSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("upcoming");
  const [participantName, setParticipantName] = useState("");
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [pendingPayload, setPendingPayload] =
    useState<GroupSessionPayload | null>(null);
  const [joining, setJoining] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      setLoading(true);
      setError(null);
      setSession(null);

      try {
        await initDB();
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("session");
        let loadedSession: GroupSession | null = null;
        let invitePayload: GroupSessionPayload | null = null;

        if (sessionId) {
          const allSessions = await getGroupSessions();
          loadedSession =
            allSessions.find(item => item.id === sessionId) || null;
        } else {
          const extracted = extractPayloadFromHash(window.location.hash);
          if (!extracted) {
            if (!cancelled) setError("Invalid or corrupted session link");
            return;
          }
          invitePayload = extracted;

          if (isSupabaseConfigured) {
            const cloudSession = await getCloudGroupSessionByPayloadId(
              extracted.sessionId
            );
            loadedSession = cloudSession
              ? cloudGroupSessionToLocal(
                  cloudSession,
                  extracted.sessionId,
                  "joined"
                )
              : null;
          } else {
            loadedSession = await getGroupSessionByPayloadId(
              extracted.sessionId
            );
          }
          if (!loadedSession && !isSupabaseConfigured) {
            const allSessions = await getGroupSessions();
            loadedSession =
              allSessions.find(
                item =>
                  item.title === extracted.title &&
                  item.startsAt === extracted.startsAt &&
                  item.focusMinutes === extracted.focusMinutes &&
                  item.breakMinutes === extracted.breakMinutes &&
                  item.sharedObjective === extracted.sharedObjective
              ) || null;
          }

          if (!loadedSession && !isSupabaseConfigured) {
            const now = new Date().toISOString();
            loadedSession = {
              id: extracted.sessionId,
              payloadVersion: extracted.version,
              payloadSessionId: extracted.sessionId,
              title: extracted.title,
              sharedObjective: extracted.sharedObjective,
              startsAt: extracted.startsAt,
              focusMinutes: extracted.focusMinutes,
              breakMinutes: extracted.breakMinutes,
              meetingUrl: extracted.meetingUrl,
              organizerName: extracted.organizerName,
              openingMessage: extracted.openingMessage,
              source: "joined",
              createdAt: now,
              updatedAt: now,
            };
          } else if (loadedSession && !loadedSession.payloadSessionId) {
            loadedSession = await updateGroupSession(loadedSession.id, {
              payloadSessionId: extracted.sessionId,
            });
          }
        }

        if (!loadedSession) {
          if (!cancelled) setError("Session not found");
          return;
        }

        if (!cancelled) {
          setSession(loadedSession);
          setPendingPayload(invitePayload);
          setStatus(
            calculateSessionStatus(
              loadedSession.startsAt,
              loadedSession.focusMinutes,
              loadedSession.breakMinutes
            )
          );
        }
      } catch (err) {
        console.error("Error loading session:", err);
        if (!cancelled) setError("Failed to load session");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadSession();
    window.addEventListener("hashchange", loadSession);
    return () => {
      cancelled = true;
      window.removeEventListener("hashchange", loadSession);
    };
  }, []);

  useEffect(() => {
    if (!session) return;

    const refreshStatus = () => {
      setStatus(
        calculateSessionStatus(
          session.startsAt,
          session.focusMinutes,
          session.breakMinutes
        )
      );
    };
    refreshStatus();
    const interval = window.setInterval(refreshStatus, 1000);
    return () => window.clearInterval(interval);
  }, [session]);

  const handleJoinSession = () => {
    if (!session || status === "ended") return;

    setParticipantName("");
    setShowJoinDialog(true);
  };

  const confirmJoinSession = async () => {
    if (!session || joining) return;

    setJoining(true);
    if (isSupabaseConfigured && !isTurnstileConfigured) {
      toast.error("Configure Turnstile before joining");
      setJoining(false);
      return;
    }
    if (isSupabaseConfigured && !captchaToken) {
      toast.error("Complete the CAPTCHA before joining");
      setJoining(false);
      return;
    }
    const activeSessionKey =
      pendingPayload?.sessionId || session.payloadSessionId || session.id;
    if (!claimActiveGroupSession(activeSessionKey)) {
      toast.error("You already have another group session open.");
      setJoining(false);
      return;
    }

    try {
      const name = normalizeDisplayName(participantName);
      let joinedSession = session;
      if (pendingPayload) {
        await initDB();
        const cloudJoined = isSupabaseConfigured
          ? await joinCloudGroupSession(
              pendingPayload.sessionId,
              name,
              captchaToken ?? undefined
            )
          : null;
        const localSession = await getGroupSessionByPayloadId(
          pendingPayload.sessionId
        );
        joinedSession =
          localSession ||
          (cloudJoined
            ? await createGroupSession({
                payloadVersion: cloudJoined.payloadVersion,
                payloadSessionId: cloudJoined.payloadSessionId,
                title: cloudJoined.title,
                sharedObjective: cloudJoined.sharedObjective,
                startsAt: cloudJoined.startsAt,
                focusMinutes: cloudJoined.focusMinutes,
                breakMinutes: cloudJoined.breakMinutes,
                meetingUrl: cloudJoined.meetingUrl,
                organizerName: cloudJoined.organizerName,
                openingMessage: cloudJoined.openingMessage,
                source: "joined",
                joinedAt: cloudJoined.joinedAt,
              })
            : await createGroupSession({
                payloadVersion: pendingPayload.version,
                payloadSessionId: pendingPayload.sessionId,
                title: pendingPayload.title,
                sharedObjective: pendingPayload.sharedObjective,
                startsAt: pendingPayload.startsAt,
                focusMinutes: pendingPayload.focusMinutes,
                breakMinutes: pendingPayload.breakMinutes,
                meetingUrl: pendingPayload.meetingUrl,
                organizerName: pendingPayload.organizerName,
                openingMessage: pendingPayload.openingMessage,
                source: "joined",
                joinedAt: new Date().toISOString(),
              }));
        if (!isSupabaseConfigured) await saveDisplayName(name);
      }

      if (!isSupabaseConfigured || !pendingPayload) {
        addParticipant(joinedSession.id, name);
      }
      setShowJoinDialog(false);
      setPendingPayload(null);
      toast.success("Session joined!");
      setLocation(`/active-group/${joinedSession.id}`);
    } catch (error) {
      releaseActiveGroupSession(activeSessionKey);
      console.error("Error joining session:", error);
      toast.error(getGroupJoinErrorMessage(error));
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading session...</div>;
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <Card className="p-6 border-red-200 bg-red-50">
          <div className="flex items-start gap-4">
            <AlertCircle className="text-red-600 mt-1" size={24} />
            <div>
              <h2 className="text-lg font-semibold text-red-900">{error}</h2>
              <p className="text-sm text-red-700 mt-2">
                The session link may be invalid or expired. Please ask the
                organizer for a new link.
              </p>
              <Button
                onClick={() => setLocation("/group-sessions")}
                className="mt-4"
              >
                Back to Sessions
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!session) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  let displayText: string = status;
  if (status === "upcoming") {
    const timeUntil = calculateTimeUntilStart(session.startsAt);
    displayText = `Starting in ${formatTime(timeUntil)}`;
  } else if (status === "starting-soon") {
    displayText = "Starting very soon!";
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {session.title}
        </h1>
        <p className="text-muted-foreground">
          You've been invited to join a focus session
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Session Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="text-lg font-semibold" aria-live="polite">
              {displayText}
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-xs font-semibold px-3 py-1 rounded bg-blue-100 text-blue-800"
              aria-label="Session status"
            >
              {status}
            </p>
          </div>
        </div>

        {/* Session Details */}
        <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
          <div>
            <p className="text-sm text-muted-foreground">Start Time</p>
            <p className="font-medium">
              {new Date(session.startsAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="font-medium">
              {session.focusMinutes}m
              {session.breakMinutes ? ` + ${session.breakMinutes}m break` : ""}
            </p>
          </div>
        </div>

        {/* Objective */}
        {session.sharedObjective && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Shared Objective
            </p>
            <p className="text-base">{session.sharedObjective}</p>
          </div>
        )}

        {/* Organizer */}
        {session.organizerName && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Organizer</p>
            <p className="text-base font-medium">{session.organizerName}</p>
          </div>
        )}

        {/* Opening Message */}
        {session.openingMessage && (
          <div className="bg-blue-50 p-4 rounded border border-blue-200">
            <p className="text-sm text-blue-900">{session.openingMessage}</p>
          </div>
        )}

        {/* Meeting Link */}
        {session.meetingUrl && (
          <div>
            <Button
              onClick={() =>
                window.open(session.meetingUrl, "_blank", "noopener,noreferrer")
              }
              className="w-full gap-2 bg-teal-600 hover:bg-teal-700"
            >
              <LinkIcon size={18} />
              Join Video Meeting
            </Button>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="bg-gray-50 p-4 rounded text-sm text-muted-foreground">
          <p className="font-medium mb-2">How it works:</p>
          <ul className="space-y-1 text-xs">
            <li>• You join this session independently on your device</li>
            <li>• Your personal session data stays private</li>
            <li>• Your name is stored locally in this browser</li>
            <li>• Live cross-device participant presence is not enabled</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleJoinSession}
            className="flex-1 gap-2 bg-teal-600 hover:bg-teal-700"
            disabled={loading || status === "ended"}
          >
            <Users size={18} />
            {status === "ended"
              ? "Session Ended"
              : loading
                ? "Joining..."
                : "Join Session"}
          </Button>
          <Button
            onClick={() => setLocation("/group-sessions")}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </Card>

      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="pr-8">
              Join {session.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="preview-participant-name"
                className="text-sm font-medium"
              >
                Your name
              </label>
              <Input
                id="preview-participant-name"
                value={participantName}
                onChange={event => setParticipantName(event.target.value)}
                placeholder="e.g., Hany"
                autoFocus required
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {isSupabaseConfigured
                  ? "This display name is shared with people in this session."
                  : "This name is stored locally in this browser."}
              </p>
            </div>
            {isSupabaseConfigured && (
              <TurnstileChallenge
                action="join_group_session"
                onTokenChange={setCaptchaToken}
              />
            )}
            <Button
              onClick={confirmJoinSession}
              className="w-full"
              disabled={joining}
            >
              {joining ? "Joining…" : "Enter Session"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
