import { useEffect, useState } from "react";
import { getReviews, getSessions, DailyReview as DailyReviewType, createReview, updateReview } from "@/lib/db";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getTodayString, getDateString, calculateSessionDuration } from "@/lib/time";
import { toast } from "sonner";

export default function DailyReview() {
  const [review, setReview] = useState<DailyReviewType | null>(null);
  const [notes, setNotes] = useState("");
  const [todayStats, setTodayStats] = useState({
    sessionsCompleted: 0,
    totalFocusTime: 0,
  });

  useEffect(() => {
    loadReview();
  }, []);

  async function loadReview() {
    const today = getTodayString();
    const reviews = await getReviews();
    const todayReview = reviews.find((r) => r.date === today);
    setReview(todayReview || null);
    setNotes(todayReview?.notes || "");

    // Calculate today's stats
    const sessions = await getSessions();
    const todayStart = new Date(today).getTime();
    const todaySessions = sessions.filter(
      (s) => s.startTime >= todayStart && s.status === "completed"
    );

    const totalFocusTime = todaySessions.reduce(
      (acc, s) => acc + calculateSessionDuration(s.startTime, s.endTime, s.pausedTime),
      0
    );

    setTodayStats({
      sessionsCompleted: todaySessions.length,
      totalFocusTime,
    });
  }

  async function handleSave() {
    const today = getTodayString();
    try {
      if (review) {
        await updateReview(today, { notes });
        toast.success("Review updated");
      } else {
        await createReview({
          date: today,
          sessionsCompleted: todayStats.sessionsCompleted,
          totalFocusTime: todayStats.totalFocusTime,
          notes,
        });
        toast.success("Review created");
      }
      loadReview();
    } catch (err) {
      toast.error("Failed to save review");
    }
  }

  return (
    <div className="p-6 md:p-8 pb-24 md:pb-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-8">Today's Review</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Sessions Completed</p>
          <p className="text-3xl font-bold text-[var(--color-teal)]">
            {todayStats.sessionsCompleted}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Focus Time</p>
          <p className="text-3xl font-bold text-[var(--color-teal)]">
            {todayStats.totalFocusTime}m
          </p>
        </Card>
      </div>

      <Card className="p-6 mb-8">
        <Label htmlFor="notes" className="font-bold mb-2 block">
          Reflection
        </Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="How was your focus today? What went well? What could improve?"
          className="mb-4"
        />
        <Button
          className="w-full bg-[var(--color-teal)] hover:bg-[var(--color-teal-dark)] text-white"
          onClick={handleSave}
        >
          Save Review
        </Button>
      </Card>
    </div>
  );
}
