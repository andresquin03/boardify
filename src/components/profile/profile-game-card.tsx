import { Clock, Users } from "lucide-react";
import { formatPlayerCount, formatPlaytime } from "@/lib/game-utils";
import Link from "next/link";

interface ProfileGameCardProps {
  game: {
    id: string;
    slug: string;
    title: string;
    minPlayers: number;
    maxPlayers: number;
    minPlaytime: number;
    maxPlaytime: number;
    image?: string | null;
  };
}

export function ProfileGameCard({ game }: ProfileGameCardProps) {
  return (
    <Link href={`/g/${game.slug}`} className="group flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/50">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
        <DiceIcon className="h-5 w-5 text-muted-foreground/40" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{game.title}</p>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Users className="h-3 w-3" />
            {formatPlayerCount(game.minPlayers, game.maxPlayers)}
          </span>
          <span className="flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {formatPlaytime(game.minPlaytime, game.maxPlaytime)}
          </span>
        </div>
      </div>
    </Link>
  );
}

function DiceIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="0.5" fill="currentColor" />
      <circle cx="15" cy="9" r="0.5" fill="currentColor" />
      <circle cx="9" cy="15" r="0.5" fill="currentColor" />
      <circle cx="15" cy="15" r="0.5" fill="currentColor" />
    </svg>
  );
}
