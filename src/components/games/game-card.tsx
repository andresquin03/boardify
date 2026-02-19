"use client";

import { useOptimistic, useTransition } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, Heart, Bookmark, CircleCheckBig, Users } from "lucide-react";
import { toggleFavorite, toggleWishlist, toggleOwned } from "@/lib/actions";
import { formatPlayerCount, formatPlaytime } from "@/lib/game-utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";

interface GameCardProps {
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
  userState?: {
    isFavorite: boolean;
    isWishlist: boolean;
    isOwned: boolean;
  };
  isAuthenticated?: boolean;
}

export function GameCard({ game, userState, isAuthenticated }: GameCardProps) {
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    userState ?? { isFavorite: false, isWishlist: false, isOwned: false },
  );

  function handleToggle(action: "favorite" | "wishlist" | "owned") {
    if (!isAuthenticated) return;

    startTransition(async () => {
      if (action === "favorite") {
        setOptimistic((prev) => ({ ...prev, isFavorite: !prev.isFavorite }));
        await toggleFavorite(game.id);
      } else if (action === "wishlist") {
        if (optimistic.isOwned) return;
        setOptimistic((prev) => ({ ...prev, isWishlist: !prev.isWishlist }));
        await toggleWishlist(game.id);
      } else {
        const newOwned = !optimistic.isOwned;
        setOptimistic((prev) => ({
          ...prev,
          isOwned: newOwned,
          ...(newOwned && { isWishlist: false }),
        }));
        await toggleOwned(game.id);
      }
    });
  }

  return (
    <Card className="group relative rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-1 hover:ring-border/80">
      <Link
        href={`/g/${game.slug}`}
        aria-label={`Open ${game.title}`}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      />
      <CardHeader className="pb-2">
        <div className="relative h-32 overflow-hidden rounded-xl bg-muted transition-colors group-hover:bg-muted/80">
          {game.image ? (
            <Image
              src={game.image}
              alt={`Cover of ${game.title}`}
              fill
              className="object-contain p-2"
              sizes="(max-width: 640px) 100vw, 360px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <DiceIcon className="h-10 w-10 text-muted-foreground/50" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold leading-tight group-hover:underline">{game.title}</h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {formatPlayerCount(game.minPlayers, game.maxPlayers)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatPlaytime(game.minPlaytime, game.maxPlaytime)}
              </span>
            </div>
          </div>
          {isAuthenticated && (
            <div className="relative z-20 flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleToggle("favorite")}
                    className={actionButtonClass({
                      active: optimistic.isFavorite,
                      activeClassName: "border-rose-400/40 bg-rose-500/10 text-rose-500",
                      inactiveClassName: "text-muted-foreground hover:bg-muted hover:text-rose-500",
                    })}
                    aria-label="Favorite"
                    aria-pressed={optimistic.isFavorite}
                  >
                    <Heart className="h-4.5 w-4.5" fill={optimistic.isFavorite ? "currentColor" : "none"} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Favorite</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    disabled={isPending || optimistic.isOwned}
                    onClick={() => handleToggle("wishlist")}
                    className={actionButtonClass({
                      active: optimistic.isWishlist,
                      activeClassName: "border-sky-400/40 bg-sky-500/10 text-sky-500",
                      inactiveClassName: "text-muted-foreground hover:bg-muted hover:text-sky-500",
                      disabled: optimistic.isOwned,
                    })}
                    aria-label="Wishlist"
                    aria-pressed={optimistic.isWishlist}
                  >
                    <Bookmark className="h-4.5 w-4.5" fill={optimistic.isWishlist ? "currentColor" : "none"} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {optimistic.isOwned ? "Owned games can't be wishlisted" : "Wishlist"}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleToggle("owned")}
                    className={actionButtonClass({
                      active: optimistic.isOwned,
                      activeClassName: "border-emerald-400/40 bg-emerald-500/10 text-emerald-500",
                      inactiveClassName: "text-muted-foreground hover:bg-muted hover:text-emerald-500",
                    })}
                    aria-label="Owned"
                    aria-pressed={optimistic.isOwned}
                  >
                    <CircleCheckBig className="h-4.5 w-4.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Owned</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function actionButtonClass({
  active,
  activeClassName,
  inactiveClassName,
  disabled = false,
}: {
  active: boolean;
  activeClassName: string;
  inactiveClassName: string;
  disabled?: boolean;
}) {
  return cn(
    "cursor-pointer rounded-md border transition-all duration-200",
    "p-1.5",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
    active ? "scale-105 shadow-sm" : "scale-100",
    active ? activeClassName : inactiveClassName,
    disabled &&
      "cursor-default border-transparent text-muted-foreground/40 transition-none hover:bg-transparent hover:text-muted-foreground/40",
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
