import Link from "next/link";
import Image from "next/image";
import { Clock, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatPlayerCount, formatPlaytime } from "@/lib/game-utils";

type GroupGameOwner = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
};

interface GroupOwnedGameCardProps {
  game: {
    slug: string;
    title: string;
    minPlayers: number;
    maxPlayers: number;
    minPlaytime: number;
    maxPlaytime: number;
    image?: string | null;
  };
  owners: GroupGameOwner[];
  memberCount: number;
}

export function GroupOwnedGameCard({ game, owners, memberCount }: GroupOwnedGameCardProps) {
  const visibleOwners = owners.slice(0, 5);
  const hiddenOwnersCount = Math.max(0, owners.length - visibleOwners.length);

  return (
    <Link
      href={`/g/${game.slug}`}
      className="pressable group flex items-center gap-3 rounded-xl border bg-card/70 p-3 shadow-sm transition-colors hover:bg-accent/40 active:bg-accent/55"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted/60">
        {game.image ? (
          <Image
            src={game.image}
            alt={`Cover of ${game.title}`}
            fill
            className="object-contain p-1"
            sizes="56px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <DiceIcon className="h-5 w-5 text-muted-foreground/45" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold group-hover:underline">{game.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Users className="h-3 w-3" />
            {formatPlayerCount(game.minPlayers, game.maxPlayers)}
          </span>
          <span className="flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {formatPlaytime(game.minPlaytime, game.maxPlaytime)}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center -space-x-1.5">
            {visibleOwners.map((owner) => {
              const displayName = owner.name ?? owner.username ?? "User";
              const initials = displayName
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <Tooltip key={owner.id}>
                  <TooltipTrigger asChild>
                    <Avatar className="h-7 w-7 border-2 border-background">
                      <AvatarImage src={owner.image ?? undefined} alt={displayName} />
                      <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="top">{displayName}</TooltipContent>
                </Tooltip>
              );
            })}
            {hiddenOwnersCount > 0 && (
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold text-muted-foreground">
                +{hiddenOwnersCount}
              </span>
            )}
          </div>

          <span className="shrink-0 text-[11px] text-muted-foreground">
            {owners.length}/{memberCount} own it
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
