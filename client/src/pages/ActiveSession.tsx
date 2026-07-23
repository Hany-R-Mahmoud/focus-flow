import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import {
  getSession,
  updateSession,
  getTemplate,
  getTemplates,
  createSession,
  FocusSession,
  SessionTemplate,
} from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play, Pause, Square, AlertCircle } from "lucide-react";
import { formatTime, getElapsedSessionTime } from "@/lib/time";
import { toast } from "sonner";

export default function ActiveSession() {
  const [match, params] = useRoute("/session/:id");
  const sessionId = params?.id;
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<FocusSession | null>(null);
  const [template, setTemplate] = useState<SessionTemplate | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showDistractionDialog, setShowDistractionDialog] = useState(false);
  const [distractionForm, setDistractionForm] = useState({
    category: "other",
    note: "",
  });
  const [taskIntention, setTaskIntention] = useState("");
  const [outcome, setOutcome] = useState("");
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);

  useEffect(() => {
    async function loadSession() {
      if (!match || !sessionId) return;

      const id = sessionId;
      if (id === "new") {
        const templates = await getTemplates();
        if (templates.length === 0) {
          toast.error("No templates available. Create one first.");
          setLocation("/templates");
          return;
        }
        const selectedTemplate = templates[0];
        const newSession = await createSession({
          templateId: selectedTemplate.id,
          templateName: selectedTemplate.name,
          startTime: Date.now(),
          endTime: null,
          pausedTime: 0,
          pausedAt: null,
          taskIntention: "",
          outcome: "",
          distractions: [],
          status: "active",
        });
        setSession(newSession);
        setTemplate(selectedTemplate);
        setIsRunning(true);
      } else {
        const existingSession = await getSession(id);
        if (!existingSession) {
          toast.error("Session not found");
          setLocation("/");
          return;
        }
        setSession(existingSession);
        const sessionTemplate = await getTemplate(existingSession.templateId);
        setTemplate(sessionTemplate);
        setTaskIntention(existingSession.taskIntention);
        setOutcome(existingSession.outcome);
        setElapsedTime(
          getElapsedSessionTime(
            existingSession.startTime,
            existingSession.pausedTime,
            existingSession.status,
            existingSession.endTime,
            existingSession.pausedAt
          )
        );

        if (
          existingSession.status === "active" ||
          existingSession.status === "paused"
        ) {
          setIsRunning(existingSession.status === "active");
        }
      }
    }

    loadSession();
  }, [match, sessionId, setLocation]);

  useEffect(() => {
    if (!session) return;

    const updateElapsed = () => {
      setElapsedTime(
        getElapsedSessionTime(
          session.startTime,
          session.pausedTime,
          session.status,
          session.endTime,
          session.pausedAt
        )
      );
    };
    updateElapsed();
    if (!isRunning) return;

    const interval = setInterval(updateElapsed, 250);
    return () => clearInterval(interval);
  }, [isRunning, session]);

  async function handlePauseResume() {
    if (!session) return;
    if (session.status !== "active" && session.status !== "paused") {
      toast.error("This session is already closed");
      return;
    }

    try {
      if (isRunning) {
        const updatedSession = await updateSession(session.id, {
          status: "paused",
          pausedAt: Date.now(),
        });
        setSession(updatedSession);
        setIsRunning(false);
        toast.success("Session paused");
      } else {
        const now = Date.now();
        const pausedDuration = session.pausedAt
          ? Math.max(0, now - session.pausedAt)
          : 0;
        const updatedSession = await updateSession(session.id, {
          status: "active",
          pausedTime: session.pausedTime + pausedDuration,
          pausedAt: null,
        });
        setSession(updatedSession);
        setIsRunning(true);
        toast.success("Session resumed");
      }
    } catch (err) {
      toast.error("Failed to update session");
    }
  }

  async function handleAddDistraction() {
    if (!session) return;

    try {
      const updatedSession = await updateSession(session.id, {
        distractions: [
          ...session.distractions,
          {
            id: `dist_${Date.now()}`,
            sessionId: session.id,
            time: Date.now(),
            category: distractionForm.category,
            note: distractionForm.note,
          },
        ],
      });
      setSession(updatedSession);
      setDistractionForm({ category: "other", note: "" });
      setShowDistractionDialog(false);
      toast.success("Distraction logged");
    } catch (err) {
      toast.error("Failed to log distraction");
    }
  }

  async function handleComplete() {
    if (!session) return;

    try {
      const now = Date.now();
      const pausedDuration =
        session.status === "paused" && session.pausedAt
          ? Math.max(0, now - session.pausedAt)
          : 0;
      const updatedSession = await updateSession(session.id, {
        endTime: Date.now(),
        status: "completed",
        pausedTime: session.pausedTime + pausedDuration,
        pausedAt: null,
        taskIntention,
        outcome,
      });
      setSession(updatedSession);
      setIsRunning(false);
      setShowOutcomeDialog(false);
      toast.success("Session completed!");
      setTimeout(() => setLocation("/history"), 1000);
    } catch (err) {
      toast.error("Failed to complete session");
    }
  }

  if (!session || !template) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  const totalDuration = template.duration * 60 * 1000;
  const progress = Math.min((elapsedTime / totalDuration) * 100, 100);
  const remainingTime = Math.max(totalDuration - elapsedTime, 0);

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {template.name}
        </h1>
        <p className="text-muted-foreground">{template.description}</p>
      </div>

      <div className="p-8 mb-8 text-center bg-gradient-to-br from-[var(--color-teal-light)] to-background rounded-lg border border-border">
        <div className="mb-6">
          <div className="text-6xl font-bold text-[var(--color-teal)] font-mono mb-2">
            {formatTime(remainingTime)}
          </div>
          <p className="text-sm text-muted-foreground">Remaining</p>
        </div>

        <div className="w-full bg-muted rounded-full h-2 mb-6 overflow-hidden">
          <div
            className="bg-[var(--color-teal)] h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex gap-3 justify-center flex-wrap">
          <Button
            size="lg"
            disabled={
              session.status !== "active" && session.status !== "paused"
            }
            className={`gap-2 ${
              isRunning
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-[var(--color-teal)] hover:bg-[var(--color-teal-dark)]"
            } text-white`}
            onClick={handlePauseResume}
          >
            {session.status === "completed" ? (
              "Completed"
            ) : session.status === "abandoned" ? (
              "Abandoned"
            ) : isRunning ? (
              <>
                <Pause size={20} />
                Pause
              </>
            ) : (
              <>
                <Play size={20} />
                Resume
              </>
            )}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="gap-2"
            onClick={() => setShowDistractionDialog(true)}
          >
            <AlertCircle size={20} />
            Log Distraction
          </Button>
        </div>
      </div>

      {session.distractions.length > 0 && (
        <div className="p-6 mb-8 bg-card border border-border rounded-lg">
          <h3 className="font-bold text-foreground mb-4">
            Distractions ({session.distractions.length})
          </h3>
          <div className="space-y-2">
            {session.distractions.map(d => (
              <div
                key={d.id}
                className="text-sm p-3 bg-muted rounded flex items-start gap-3"
              >
                <span className="text-xs font-semibold text-[var(--color-teal)] uppercase">
                  {d.category}
                </span>
                <span className="text-muted-foreground flex-1">{d.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-6 mb-8 bg-card border border-border rounded-lg">
        <Label htmlFor="intention" className="font-bold mb-2 block">
          What are you focusing on?
        </Label>
        <Textarea
          id="intention"
          value={taskIntention}
          onChange={e => setTaskIntention(e.target.value)}
          placeholder="Describe your task or goal for this session..."
          className="mb-4"
        />
      </div>

      <div className="flex gap-3">
        <Button
          className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
          size="lg"
          onClick={() => setShowOutcomeDialog(true)}
        >
          <Square size={20} />
          Complete Session
        </Button>
      </div>

      <Dialog open={showOutcomeDialog} onOpenChange={setShowOutcomeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session Outcome</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="outcome">What did you accomplish?</Label>
              <Textarea
                id="outcome"
                value={outcome}
                onChange={e => setOutcome(e.target.value)}
                placeholder="Describe what you completed and any notes..."
              />
            </div>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={handleComplete}
            >
              Finish Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDistractionDialog}
        onOpenChange={setShowDistractionDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log a Distraction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={distractionForm.category}
                onChange={e =>
                  setDistractionForm({
                    ...distractionForm,
                    category: e.target.value,
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
              <Label htmlFor="note">Note</Label>
              <Input
                id="note"
                value={distractionForm.note}
                onChange={e =>
                  setDistractionForm({
                    ...distractionForm,
                    note: e.target.value,
                  })
                }
                placeholder="What distracted you?"
              />
            </div>
            <Button
              className="w-full bg-[var(--color-teal)] hover:bg-[var(--color-teal-dark)] text-white"
              onClick={handleAddDistraction}
            >
              Log Distraction
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
