import { useEffect, useState } from "react";
import { getSessions, FocusSession, deleteSession } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate, calculateSessionDuration } from "@/lib/time";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function SessionHistory() {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [filter, setFilter] = useState<"all" | "completed" | "abandoned">("all");

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    const data = await getSessions();
    setSessions(data);
  }

  async function handleDelete(id: string) {
    try {
      await deleteSession(id);
      toast.success("Session deleted");
      loadSessions();
    } catch (err) {
      toast.error("Failed to delete session");
    }
  }

  const filteredSessions = sessions.filter((s) => {
    if (filter === "all") return true;
    return s.status === filter;
  });

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">Session History</h1>

      <div className="flex gap-2 mb-8">
        {(["all", "completed", "abandoned"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className={filter === f ? "bg-[var(--color-teal)] hover:bg-[var(--color-teal-dark)] text-white" : ""}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((session) => (
            <Card key={session.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-foreground text-lg">
                      {session.templateName}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground">
                      {session.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {formatDate(session.startTime)}
                  </p>
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Task: {session.taskIntention || "No task recorded"}
                  </p>
                  {session.outcome && (
                    <p className="text-sm text-muted-foreground">
                      Outcome: {session.outcome}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[var(--color-teal)]">
                    {calculateSessionDuration(
                      session.startTime,
                      session.endTime,
                      session.pausedTime
                    )}
                    m
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {session.distractions.length} distractions
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(session.id)}
                  >
                    <Trash2 size={16} className="text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No sessions found</p>
          </Card>
        )}
      </div>
    </div>
  );
}
