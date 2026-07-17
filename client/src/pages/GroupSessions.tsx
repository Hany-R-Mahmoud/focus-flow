import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getGroupSessions, deleteGroupSession, createTemplate, initDB } from "@/lib/db";
import { GroupSession } from "@/lib/db";
import { calculateSessionStatus, calculateTimeUntilStart } from "@/lib/groupSession";
import { formatTime } from "@/lib/time";
import { getSessionParticipants, addParticipant } from "@/lib/participants";
import ParticipantAvatars from "@/components/ParticipantAvatars";
import ParticipantBadge from "@/components/ParticipantBadge";
import { Play, Trash2, Save, Users, Plus } from "lucide-react";

export default function GroupSessions() {
  const [, setLocation] = useLocation();
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<GroupSession | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      // Initialize database if not already done
      await initDB();
      const data = await getGroupSessions();
      setSessions(data);
    } catch (err) {
      console.error("Error loading sessions:", err);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm("Delete this session?")) return;

    try {
      await deleteGroupSession(id);
      setSessions(sessions.filter((s) => s.id !== id));
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
    // Add current user as participant
    const participantName = prompt("Enter your name (optional):");
    if (participantName !== null) {
      addParticipant(session.id, participantName || "Anonymous");
      toast.success("You've joined the session!");
      setLocation(`/active-group/${session.id}`);
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
            Create a group session to coordinate focus time with others, or join one using a shared link.
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Group Sessions</h1>
        <p className="text-muted-foreground">Coordinated focus sessions with others</p>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => {
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
          }

          return (
            <Card key={session.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{session.title}</h3>
                  {session.sharedObjective && (
                    <p className="text-sm text-muted-foreground mt-1">{session.sharedObjective}</p>
                  )}
                </div>
                <div className="text-right flex flex-col gap-2 items-end">
                  <p className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-800">
                    {displayText}
                  </p>
                  {participants.length > 0 && (
                    <ParticipantBadge count={participants.length} />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Start Time</p>
                  <p className="font-medium">{new Date(session.startsAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {session.focusMinutes}m{session.breakMinutes ? ` + ${session.breakMinutes}m break` : ""}
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

                <Dialog open={showTemplateDialog && selectedSession?.id === session.id} onOpenChange={setShowTemplateDialog}>
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
                        <label className="text-sm font-medium">Template Name</label>
                        <Input
                          placeholder="e.g., Weekly Team Focus"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <Button
                        onClick={handleSaveAsTemplate}
                        className="w-full"
                      >
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
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

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
