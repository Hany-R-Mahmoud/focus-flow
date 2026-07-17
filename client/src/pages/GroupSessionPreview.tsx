import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { getGroupSessions, createGroupSession, initDB } from "@/lib/db";
import { GroupSession } from "@/lib/db";
import {
  extractPayloadFromHash,
  calculateSessionStatus,
  calculateTimeUntilStart,
} from "@/lib/groupSession";
import { formatTime } from "@/lib/time";
import { AlertCircle, Users, Link as LinkIcon } from "lucide-react";

export default function GroupSessionPreview() {
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<GroupSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("upcoming");

  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      await initDB();

      // Try to get session ID from query parameter
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("session");

      if (sessionId) {
        // Load session from database
        const allSessions = await getGroupSessions();
        const dbSession = allSessions.find((s) => s.id === sessionId);
        
        if (!dbSession) {
          setError("Session not found");
          return;
        }
        setSession(dbSession);

        const sessionStatus = calculateSessionStatus(
          dbSession.startsAt,
          dbSession.focusMinutes,
          dbSession.breakMinutes
        );
        setStatus(sessionStatus);
      } else {
        // Fallback: Try to extract from hash (backward compatibility)
        const hash = window.location.hash;
        const extracted = extractPayloadFromHash(hash);

        if (!extracted) {
          setError("Invalid or corrupted session link");
          return;
        }

        // Create a temporary session from payload
        const tempSession = await createGroupSession({
          payloadVersion: extracted.version,
          title: extracted.title,
          sharedObjective: extracted.sharedObjective,
          startsAt: extracted.startsAt,
          focusMinutes: extracted.focusMinutes,
          breakMinutes: extracted.breakMinutes,
          meetingUrl: extracted.meetingUrl,
          organizerName: extracted.organizerName,
          openingMessage: extracted.openingMessage,
          source: "joined",
        });

        setSession(tempSession);

        const sessionStatus = calculateSessionStatus(
          extracted.startsAt,
          extracted.focusMinutes,
          extracted.breakMinutes
        );
        setStatus(sessionStatus);
      }
    } catch (err) {
      console.error("Error loading session:", err);
      setError("Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!session) return;

    setLoading(true);
    try {
      // Session already exists in database, just redirect to it
      toast.success("Session joined! Redirecting...");
      setTimeout(() => setLocation("/group-sessions"), 1000);
    } catch (err) {
      console.error("Error joining session:", err);
      toast.error("Failed to join session");
    } finally {
      setLoading(false);
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
                The session link may be invalid or expired. Please ask the organizer for a new link.
              </p>
              <Button onClick={() => setLocation("/group-sessions")} className="mt-4">
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
        <h1 className="text-3xl font-bold text-foreground mb-2">{session.title}</h1>
        <p className="text-muted-foreground">You've been invited to join a focus session</p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Session Status */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <p className="text-lg font-semibold">{displayText}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold px-3 py-1 rounded bg-blue-100 text-blue-800">
              {status}
            </p>
          </div>
        </div>

        {/* Session Details */}
        <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
          <div>
            <p className="text-sm text-muted-foreground">Start Time</p>
            <p className="font-medium">{new Date(session.startsAt).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="font-medium">
              {session.focusMinutes}m{session.breakMinutes ? ` + ${session.breakMinutes}m break` : ""}
            </p>
          </div>
        </div>

        {/* Objective */}
        {session.sharedObjective && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Shared Objective</p>
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
              onClick={() => window.open(session.meetingUrl, "_blank")}
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
            <li>• Only your name is shared with other participants</li>
            <li>• All data is stored locally in your browser</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleJoinSession}
            className="flex-1 gap-2 bg-teal-600 hover:bg-teal-700"
            disabled={loading}
          >
            <Users size={18} />
            {loading ? "Joining..." : "Join Session"}
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
    </div>
  );
}
