import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TurnstileChallenge } from "@/components/TurnstileChallenge";
import { toast } from "sonner";
import { createGroupSession } from "@/lib/db";
import { saveDisplayName } from "@/lib/supabase";
import { syncGroupSessionToCloud } from "@/lib/cloudGroupSessions";
import {
  isSupabaseConfigured,
  isTurnstileConfigured,
} from "@/lib/supabase";
import {
  generateSessionId,
  generateGroupSessionLink,
  GroupSessionPayload,
  validatePayload,
} from "@/lib/groupSession";
import { AlertCircle, Check, Copy, Eye, Share2 } from "lucide-react";

export default function CreateGroupSession() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [payload, setPayload] = useState<GroupSessionPayload | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    sharedObjective: "",
    startDate: "",
    startTime: "",
    focusMinutes: 50,
    breakMinutes: 10,
    meetingUrl: "",
    organizerName: "",
    openingMessage: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]:
        name === "focusMinutes" || name === "breakMinutes"
          ? parseInt(value)
          : value,
    }));
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate form
      if (!formData.title.trim()) {
        toast.error("Session title is required");
        setLoading(false);
        return;
      }

      if (!formData.startDate || !formData.startTime) {
        toast.error("Start date and time are required");
        setLoading(false);
        return;
      }

      if (formData.focusMinutes < 5 || formData.focusMinutes > 240) {
        toast.error("Focus duration must be between 5 and 240 minutes");
        setLoading(false);
        return;
      }

      if (
        !Number.isInteger(formData.breakMinutes) ||
        formData.breakMinutes < 0 ||
        formData.breakMinutes > 120
      ) {
        toast.error("Break duration must be between 0 and 120 minutes");
        setLoading(false);
        return;
      }

      // Create ISO timestamp
      const startDateTime = new Date(
        `${formData.startDate}T${formData.startTime}`
      );
      if (isNaN(startDateTime.getTime())) {
        toast.error("Invalid date or time");
        setLoading(false);
        return;
      }

      // Create payload
      const newPayload: GroupSessionPayload = {
        version: 1,
        sessionId: generateSessionId(),
        title: formData.title.trim(),
        sharedObjective: formData.sharedObjective.trim() || undefined,
        startsAt: startDateTime.toISOString(),
        focusMinutes: formData.focusMinutes,
        breakMinutes:
          formData.breakMinutes > 0 ? formData.breakMinutes : undefined,
        meetingUrl: formData.meetingUrl.trim() || undefined,
        organizerName: formData.organizerName.trim() || undefined,
        openingMessage: formData.openingMessage.trim() || undefined,
      };

      // Validate payload
      const validation = validatePayload(newPayload);
      if (!validation.valid) {
        toast.error(validation.errors[0] || "Invalid session data");
        setLoading(false);
        return;
      }

      const link = generateGroupSessionLink(newPayload);
      if (isSupabaseConfigured && !isTurnstileConfigured) {
        toast.error("Configure Turnstile before creating a cloud session");
        return;
      }
      if (isSupabaseConfigured && !captchaToken) {
        toast.error("Complete the CAPTCHA before creating a cloud session");
        return;
      }
      const savedSession = await createGroupSession({
        payloadVersion: newPayload.version,
        title: newPayload.title,
        sharedObjective: newPayload.sharedObjective,
        startsAt: newPayload.startsAt,
        focusMinutes: newPayload.focusMinutes,
        breakMinutes: newPayload.breakMinutes,
        meetingUrl: newPayload.meetingUrl,
        organizerName: newPayload.organizerName,
        openingMessage: newPayload.openingMessage,
        payloadSessionId: newPayload.sessionId,
        source: "created",
      });

      try {
        if (newPayload.organizerName) {
          await saveDisplayName(
            newPayload.organizerName,
            captchaToken ?? undefined
          );
        }
        await syncGroupSessionToCloud(newPayload, captchaToken ?? undefined);
      } catch (cloudError) {
        const message =
          cloudError instanceof Error ? cloudError.message : "Unknown error";
        console.warn(`Cloud group-session sync unavailable. ${message}`);
        if (isSupabaseConfigured) {
          toast.error(
            "Could not publish the session to Supabase. No invite link was created."
          );
          return;
        }
        toast.warning("Saved locally; cloud sync is unavailable.");
      }

      setSessionId(savedSession.id);
      setGeneratedLink(link);
      setPayload(newPayload);

      toast.success("Group session created!");
    } catch (error) {
      console.error("Error creating group session:", error);
      toast.error("Failed to create group session");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!generatedLink) return;

    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      toast.success("Invite link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };

  const handleCopyInvitationText = async () => {
    if (!payload) return;

    const invitationText = `Join my focus session: "${payload.title}"
Time: ${new Date(payload.startsAt).toLocaleString()}
Duration: ${payload.focusMinutes} minutes${payload.breakMinutes ? ` + ${payload.breakMinutes}m break` : ""}
${payload.sharedObjective ? `Goal: ${payload.sharedObjective}\n` : ""}
${payload.openingMessage ? `Message: ${payload.openingMessage}\n` : ""}
Join here: ${generatedLink}`;

    try {
      await navigator.clipboard.writeText(invitationText);
      toast.success("Invitation text copied!");
    } catch (err) {
      toast.error("Failed to copy invitation");
    }
  };

  const handleGoToSession = () => {
    if (sessionId) {
      setLocation(`/active-group/${sessionId}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Plan Group Session
        </h1>
        <p className="text-muted-foreground">
          Create a scheduled focus session to share with others
        </p>
      </div>

      <Card className="mb-6 border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div className="text-sm text-amber-950">
            <p className="font-medium">Keep shared details general</p>
            <p className="mt-1">
              The title, objective, name, opening message, and meeting link can
              be seen by anyone with the invite link. Do not add passwords,
              private notes, or sensitive information.
            </p>
          </div>
        </div>
      </Card>

      <form onSubmit={handleCreateSession} className="space-y-6">
        <Card className="p-6 space-y-4">
          <div>
            <Label htmlFor="title">Session Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Product Design Focus Room"
              value={formData.title}
              onChange={handleInputChange}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.title.length}/100
            </p>
          </div>

          <div>
            <Label htmlFor="objective">Shared Objective</Label>
            <Textarea
              id="objective"
              name="sharedObjective"
              placeholder="What's the goal for this session?"
              value={formData.sharedObjective}
              onChange={handleInputChange}
              maxLength={300}
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.sharedObjective.length}/300
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                value={formData.startTime}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="focusMinutes">Focus Duration (minutes) *</Label>
              <Input
                id="focusMinutes"
                name="focusMinutes"
                type="number"
                min="5"
                max="240"
                value={formData.focusMinutes}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <Label htmlFor="breakMinutes">Break Duration (minutes)</Label>
              <Input
                id="breakMinutes"
                name="breakMinutes"
                type="number"
                min="0"
                max="60"
                value={formData.breakMinutes}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="meetingUrl">Meeting URL (HTTPS only)</Label>
            <Input
              id="meetingUrl"
              name="meetingUrl"
              placeholder="https://meet.google.com/..."
              value={formData.meetingUrl}
              onChange={handleInputChange}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional: Link to your video meeting
            </p>
          </div>

          <div>
            <Label htmlFor="organizerName">Your Name</Label>
            <Input
              id="organizerName"
              name="organizerName"
              placeholder="e.g., Alex"
              value={formData.organizerName}
              onChange={handleInputChange}
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional: Displayed to participants
            </p>
          </div>

          <div>
            <Label htmlFor="openingMessage">Opening Message</Label>
            <Textarea
              id="openingMessage"
              name="openingMessage"
              placeholder="e.g., Join five minutes early and mute during focus time."
              value={formData.openingMessage}
              onChange={handleInputChange}
              maxLength={500}
              rows={2}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.openingMessage.length}/500
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Session"}
          </Button>
          {isSupabaseConfigured && (
            <TurnstileChallenge
              action="create_group_session"
              onTokenChange={setCaptchaToken}
            />
          )}
        </Card>
      </form>

      {generatedLink && (
        <Card className="p-6 mt-6 space-y-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <Share2 size={20} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-blue-900">
              Share Your Session
            </h2>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-blue-800">Invite Link</Label>
            <div className="flex gap-2">
              <Input
                value={generatedLink}
                readOnly
                className="bg-white text-sm"
              />
              <Button
                onClick={handleCopyLink}
                size="sm"
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-blue-800">Share as Text</Label>
            <Button
              onClick={handleCopyInvitationText}
              variant="outline"
              className="w-full gap-2"
            >
              <Copy size={18} />
              Copy Invitation Text
            </Button>
          </div>

          <div className="pt-4 border-t border-blue-200">
            <p className="text-xs text-blue-700">
              💡 Share the link via email, chat, or messaging app. Each
              participant joins independently on their device.
            </p>
          </div>

          <Button
            onClick={handleGoToSession}
            className="w-full gap-2 bg-teal-600 hover:bg-teal-700"
          >
            <Eye size={18} />
            Open Session
          </Button>

          <Button
            onClick={() => setLocation("/group-sessions")}
            variant="ghost"
            className="w-full"
          >
            View All Sessions
          </Button>
        </Card>
      )}
    </div>
  );
}
