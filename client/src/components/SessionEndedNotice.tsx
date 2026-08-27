import { CheckCircle2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SessionEndedNoticeProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function SessionEndedNotice({
  title,
  description,
  actionLabel,
  onAction,
}: SessionEndedNoticeProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="mb-8 flex flex-col gap-4 rounded-lg border border-green-600/30 bg-green-50 p-5 dark:bg-green-950/20 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2
          size={22}
          className="mt-0.5 shrink-0 text-green-700 dark:text-green-400"
          aria-hidden="true"
        />
        <div>
          <p className="font-semibold text-green-900 dark:text-green-200">
            {title}
          </p>
          <p className="mt-1 text-sm text-green-800/80 dark:text-green-300/80">
            {description}
          </p>
        </div>
      </div>
      {actionLabel && onAction && (
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-2 border-green-700/30 text-green-900 hover:bg-green-100 dark:text-green-200 dark:hover:bg-green-900/30"
          onClick={onAction}
        >
          <FileText size={16} aria-hidden="true" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
