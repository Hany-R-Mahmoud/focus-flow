import { ActivityEvent, formatActivityTime } from "@/lib/activityLog";
import { Users, LogIn, LogOut, Play, Square } from "lucide-react";

interface ActivityTimelineProps {
  events: ActivityEvent[];
  compact?: boolean;
}

export default function ActivityTimeline({ events, compact = false }: ActivityTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No activity yet</p>
      </div>
    );
  }

  const getIcon = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "join":
        return <LogIn size={16} className="text-green-600" />;
      case "leave":
        return <LogOut size={16} className="text-red-600" />;
      case "session-start":
        return <Play size={16} className="text-blue-600" />;
      case "session-end":
        return <Square size={16} className="text-gray-600" />;
      default:
        return <Users size={16} className="text-gray-600" />;
    }
  };

  const getColor = (type: ActivityEvent["type"]) => {
    switch (type) {
      case "join":
        return "bg-green-50 border-green-200";
      case "leave":
        return "bg-red-50 border-red-200";
      case "session-start":
        return "bg-blue-50 border-blue-200";
      case "session-end":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {events.slice(-5).map((event) => (
          <div key={event.id} className="flex items-center gap-2 text-xs">
            {getIcon(event.type)}
            <span className="text-muted-foreground">{event.message}</span>
            <span className="text-xs text-muted-foreground ml-auto">{formatActivityTime(event.timestamp)}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event, index) => (
        <div key={event.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className={`p-2 rounded-full ${getColor(event.type)}`}>
              {getIcon(event.type)}
            </div>
            {index < events.length - 1 && (
              <div className="w-0.5 h-8 bg-border mt-2" />
            )}
          </div>
          <div className="flex-1 pt-2">
            <p className="text-sm font-medium text-foreground">{event.message}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatActivityTime(event.timestamp)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
