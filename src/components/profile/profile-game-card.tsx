import { Clock, Users } from "lucide-react";
import { formatPlayerCount, formatPlaytime } from "@/lib/game-utils";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type SharedType = "favorite" | "wishlist" | "owned";

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
  sharedType?: SharedType;
}

const sharedStyles: Record<
  SharedType,
  { link: string; imageWrap: string; badge: string; tooltip: string }
> = {
  favorite: {
    link: "border-rose-400/35 bg-rose-500/[0.07] hover:bg-rose-500/[0.12] active:bg-rose-500/[0.16]",
    imageWrap: "bg-rose-500/12",
    badge: "border-rose-400/40 bg-rose-500/12 text-rose-500 dark:text-rose-300",
    tooltip: "text-rose-200 dark:text-rose-700",
  },
  wishlist: {
    link: "border-sky-400/35 bg-sky-500/[0.07] hover:bg-sky-500/[0.12] active:bg-sky-500/[0.16]",
    imageWrap: "bg-sky-500/12",
    badge: "border-sky-400/40 bg-sky-500/12 text-sky-500 dark:text-sky-300",
    tooltip: "text-sky-200 dark:text-sky-700",
  },
  owned: {
    link: "border-emerald-400/35 bg-emerald-500/[0.07] hover:bg-emerald-500/[0.12] active:bg-emerald-500/[0.16]",
    imageWrap: "bg-emerald-500/12",
    badge: "border-emerald-400/40 bg-emerald-500/12 text-emerald-500 dark:text-emerald-300",
    tooltip: "text-emerald-200 dark:text-emerald-700",
  },
};

export function ProfileGameCard({ game, sharedType }: ProfileGameCardProps) {
  const sharedStyle = sharedType ? sharedStyles[sharedType] : null;

  return (
    <Link
      href={`/g/${game.slug}`}
      className={cn(
        "pressable group flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/50 active:bg-muted/70",
        sharedStyle?.link,
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted",
          sharedStyle?.imageWrap,
        )}
      >
        {game.image ? (
          <Image
            src={game.image}
            alt={`Cover of ${game.title}`}
            width={40}
            height={40}
            className="h-full w-full rounded-md object-contain p-0.5"
            sizes="40px"
          />
        ) : (
          <DiceIcon className="h-5 w-5 text-muted-foreground/40" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-medium leading-tight">{game.title}</p>
          {sharedStyle && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide",
                    sharedStyle.badge,
                  )}
                >
                  In common
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className={sharedStyle.tooltip}>
                Exact category match.
              </TooltipContent>
            </Tooltip>
          )}
        </div>
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
