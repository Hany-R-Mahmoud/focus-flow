import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  getGroupSessions,
  deleteGroupSession,
  createTemplate,
  initDB,
} from "@/lib/db";
import { GroupSession } from "@/lib/db";
import {
  calculateSessionStatus,
  calculateTimeRemaining,
  calculateTimeUntilStart,
} from "@/lib/groupSession";
import { formatTime } from "@/lib/time";
import { getSessionParticipants, addParticipant } from "@/lib/participants";
import { isSupabaseConfigured, saveDisplayName } from "@/lib/supabase";
import { joinCloudGroupSession } from "@/lib/cloudGroupSessions";
import {
  claimActiveGroupSession,
  releaseActiveGroupSession,
} from "@/lib/activeGroupSession";
import ParticipantAvatars from "@/components/ParticipantAvatars";
import ParticipantBadge from "@/components/ParticipantBadge";
import { Play, Trash2, Save, Users, Plus } from "lucide-react";

export default function GroupSessions() {
  const [, setLocation] = useLocation();
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<GroupSession | null>(
    null
  );
  const [joinSession, setJoinSession] = useState<GroupSession | null>(null);
  const [participantName, setParticipantName] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;

    const refreshSessions = async () => {
      try {
        await initDB();
        const data = await getGroupSessions();
        if (!cancelled) setSessions(data);
      } catch (err) {
        console.error("Error loading sessions:", err);
        if (!cancelled) toast.error("Failed to load sessions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void refreshSessions();
    window.addEventListener("focus", refreshSessions);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", refreshSessions);
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Delete this session?")) return;

    try {
      await deleteGroupSession(id);
      setSessions(current => current.filter(s => s.id !== id));
      toast.success("Session deleted");
    } catch (err) {
      toast.error("Failed to delete session");
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!selectedSession || !templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    try {
      await createTemplate({
        name: templateName.trim(),
        duration: selectedSession.focusMinutes,
        description: selectedSession.sharedObjective || "",
        color: "#06b6d4",
      });

      toast.success(`Template "${templateName}" created!`);
      setTemplateName("");
      setShowTemplateDialog(false);
      setSelectedSession(null);
    } catch (err) {
      console.error("Error saving template:", err);
      toast.error("Failed to save template");
    }
  };

  const handleJoinSession = (session: GroupSession) => {
    setJoinSession(session);
    setParticipantName("");
    setShowJoinDialog(true);
  };

  const confirmJoinSession = async () => {
    if (!joinSession) return;

    const activeSessionKey = joinSession.payloadSessionId || joinSession.id;
    if (!claimActiveGroupSession(activeSessionKey)) {
      toast.error("You already have another group session open.");
      return;
    }

    try {
      const name = participantName.trim() || "Anonymous";
      if (isSupabaseConfigured && joinSession.payloadSessionId) {
        await joinCloudGroupSession(joinSession.payloadSessionId, name);
      }
      await saveDisplayName(name);
      addParticipant(joinSession.id, name);
      toast.success("You've joined the session!");
      setShowJoinDialog(false);
      setJoinSession(null);
      setLocation(`/active-group/${joinSession.id}`);
    } catch (error) {
      releaseActiveGroupSession(activeSessionKey);
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`Error joining session. ${message}`);
      toast.error("Failed to join session");
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading sessions...</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="text-center space-y-4">
          <Users size={48} className="mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">No group sessions yet</h1>
          <p className="text-muted-foreground">
            Create a group session to coordinate focus time with others, or join
            one using a shared link.
          </p>
          <Button
            onClick={() => setLocation("/create-group-session")}
            className="gap-2"
          >
            <Plus size={18} />
            Plan Your First Group Session
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Group Sessions
        </h1>
        <p className="text-muted-foreground">
          Coordinated focus sessions with others
        </p>
      </div>

      <div className="space-y-4">
        {sessions.map(session => {
          const status = calculateSessionStatus(
            session.startsAt,
            session.focusMinutes,
            session.breakMinutes
          );
          const participants = getSessionParticipants(session.id);

          let displayText: string = status;
          if (status === "upcoming") {
            const timeUntil = calculateTimeUntilStart(session.startsAt);
            displayText = `Starting in ${formatTime(timeUntil)}`;
          } else if (status === "starting-soon") {
            displayText = "Starting very soon!";
          } else if (status === "in-progress") {
            displayText = `Focus ends in ${formatTime(calculateTimeRemaining(session.startsAt, session.focusMinutes))}`;
          } else if (status === "break") {
            const breakEnd =
              new Date(session.startsAt).getTime() +
              (session.focusMinutes + (session.breakMinutes || 0)) * 60 * 1000;
            displayText = `Break ends in ${formatTime(Math.max(0, breakEnd - now))}`;
          }

          return (
            <Card
              key={session.id}
              className="p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    {session.title}
                  </h3>
                  {session.sharedObjective && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {session.sharedObjective}
                    </p>
                  )}
                </div>
                <div className="text-right flex flex-col gap-2 items-end">
                  <p className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-800">
                    <span aria-live="polite">{displayText}</span>
                  </p>
                  {participants.length > 0 && (
                    <ParticipantBadge count={participants.length} />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Start Time</p>
                  <p className="font-medium">
                    {new Date(session.startsAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {session.focusMinutes}m
                    {session.breakMinutes
                      ? ` + ${session.breakMinutes}m break`
                      : ""}
                  </p>
                </div>
              </div>

              {session.organizerName && (
                <div className="mb-4 text-sm">
                  <p className="text-muted-foreground">Organizer</p>
                  <p className="font-medium">{session.organizerName}</p>
                </div>
              )}

              {participants.length > 0 && (
                <div className="mb-4 flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Participants:</p>
                  <ParticipantAvatars participants={participants} />
                </div>
              )}

              <div className="flex gap-2">
                {status !== "ended" && (
                  <Button
                    onClick={() => handleJoinSession(session)}
                    className="flex-1 gap-2 bg-teal-600 hover:bg-teal-700"
                  >
                    <Play size={18} />
                    Join Session
                  </Button>
                )}

                <Dialog
                  open={
                    showTemplateDialog && selectedSession?.id === session.id
                  }
                  onOpenChange={setShowTemplateDialog}
                >
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => setSelectedSession(session)}
                      variant="outline"
                      className="gap-2"
                    >
                      <Save size={18} />
                      Save as Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save as Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor={`template-name-${session.id}`}
                          className="text-sm font-medium"
                        >
                          Template Name
                        </label>
                        <Input
                          id={`template-name-${session.id}`}
                          placeholder="e.g., Weekly Team Focus"
                          value={templateName}
                          onChange={e => setTemplateName(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <Button onClick={handleSaveAsTemplate} className="w-full">
                        Save Template
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  onClick={() => handleDeleteSession(session.id)}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  aria-label={`Delete ${session.title}`}
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join {joinSession?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="participant-name" className="text-sm font-medium">
                Your name
              </label>
              <Input
                id="participant-name"
                value={participantName}
                onChange={event => setParticipantName(event.target.value)}
                placeholder="e.g., Hany"
                autoFocus
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This name is stored locally in this browser.
              </p>
            </div>
            <Button onClick={confirmJoinSession} className="w-full">
              Join Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Button
        onClick={() => setLocation("/create-group-session")}
        className="w-full mt-8 gap-2"
      >
        <Plus size={18} />
        Create New Session
      </Button>
    </div>
  );
}
