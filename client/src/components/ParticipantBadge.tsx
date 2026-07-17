import { Users } from "lucide-react";

interface ParticipantBadgeProps {
  count: number;
  maxDisplay?: number;
}

export default function ParticipantBadge({ count, maxDisplay = 99 }: ParticipantBadgeProps) {
  const displayCount = count > maxDisplay ? `${maxDisplay}+` : count;
  
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-teal-100 text-teal-800 text-sm font-medium">
      <Users size={14} />
      <span>{displayCount} joined</span>
    </div>
  );
}
