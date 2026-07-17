import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Participant } from "@/lib/participants";

interface ParticipantAvatarsProps {
  participants: Participant[];
  maxDisplay?: number;
}

const COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-green-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-teal-500",
  "bg-indigo-500",
];

function getAvatarDisplay(participant: Participant) {
  const initials = participant.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colorIndex = participant.id.charCodeAt(0) % COLORS.length;
  const color = COLORS[colorIndex];

  return { initials, color };
}

export default function ParticipantAvatars({
  participants,
  maxDisplay = 5,
}: ParticipantAvatarsProps) {
  const displayed = participants.slice(0, maxDisplay);
  const remaining = Math.max(0, participants.length - maxDisplay);

  return (
    <div className="flex items-center gap-1">
      {displayed.map((participant) => {
        const { initials, color } = getAvatarDisplay(participant);
        return (
          <Tooltip key={participant.id}>
            <TooltipTrigger asChild>
              <div
                className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-semibold cursor-pointer hover:ring-2 ring-offset-2 ring-offset-background transition-all`}
              >
                {initials}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{participant.name}</p>
              <p className="text-xs text-muted-foreground">
                Joined {new Date(participant.joinedAt).toLocaleTimeString()}
              </p>
            </TooltipContent>
          </Tooltip>
        );
      })}
      {remaining > 0 && (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-xs font-semibold">
          +{remaining}
        </div>
      )}
    </div>
  );
}
