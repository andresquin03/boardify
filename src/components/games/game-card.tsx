"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, Heart, Bookmark, CircleCheckBig, Users } from "lucide-react";
import { toggleFavorite, toggleWishlist, toggleOwned } from "@/lib/actions";
import { formatPlayerCount, formatPlaytime } from "@/lib/game-utils";
import { cn } from "@/lib/utils";
import { GameImageWithFallback } from "@/components/games/game-image-with-fallback";
import Link from "next/link";

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
  const [pendingAction, setPendingAction] = useState<"favorite" | "wishlist" | "owned" | null>(null);
  const [optimistic, setOptimistic] = useOptimistic(
    userState ?? { isFavorite: false, isWishlist: false, isOwned: false },
  );

  function handleToggle(action: "favorite" | "wishlist" | "owned") {
    if (!isAuthenticated || isPending) return;
    if (action === "wishlist" && optimistic.isOwned) return;

    setPendingAction(action);

    startTransition(async () => {
      try {
        if (action === "favorite") {
          setOptimistic((prev) => ({ ...prev, isFavorite: !prev.isFavorite }));
          await toggleFavorite(game.id);
        } else if (action === "wishlist") {
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
      } finally {
        setPendingAction(null);
      }
    });
  }

  return (
    <Card className="group relative rounded-2xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-1 hover:ring-border/80">
      <Link
        href={`/g/${game.slug}`}
        aria-label={`Open ${game.title}`}
        className="pressable absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 active:bg-foreground/5"
      />
      <CardHeader className="pb-2">
        <div className="relative h-32 overflow-hidden rounded-xl bg-muted transition-colors group-hover:bg-muted/80">
          <GameImageWithFallback
            src={game.image}
            alt={`Cover of ${game.title}`}
            fill
            className="object-contain p-2"
            sizes="(max-width: 640px) 100vw, 360px"
            diceClassName="h-10 w-10 text-muted-foreground/50"
          />
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
                      pending: pendingAction === "favorite",
                      activeClassName: "border-rose-400/40 bg-rose-500/10 text-rose-500",
                      inactiveClassName: "text-muted-foreground hover:bg-muted hover:text-rose-500",
                      glowClassName:
                        "bg-rose-500/35 ring-1 ring-inset ring-rose-300/80 shadow-[0_0_0_1px_rgba(251,113,133,0.45),0_0_22px_rgba(244,63,94,0.5)]",
                    })}
                    aria-label="Favorite"
                    aria-pressed={optimistic.isFavorite}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute inset-0 rounded-md opacity-0",
                        pendingAction === "favorite" && "toggle-glow",
                        "bg-rose-500/35",
                      )}
                    />
                    <Heart
                      className={cn(
                        "relative z-10 h-4.5 w-4.5 transition-transform duration-200",
                        pendingAction === "favorite" && "toggle-bump",
                      )}
                      fill={optimistic.isFavorite ? "currentColor" : "none"}
                    />
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
                      pending: pendingAction === "wishlist",
                      activeClassName: "border-sky-400/40 bg-sky-500/10 text-sky-500",
                      inactiveClassName: "text-muted-foreground hover:bg-muted hover:text-sky-500",
                      glowClassName:
                        "bg-sky-500/35 ring-1 ring-inset ring-sky-300/80 shadow-[0_0_0_1px_rgba(56,189,248,0.45),0_0_22px_rgba(14,165,233,0.45)]",
                      disabled: optimistic.isOwned,
                    })}
                    aria-label="Wishlist"
                    aria-pressed={optimistic.isWishlist}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute inset-0 rounded-md opacity-0",
                        pendingAction === "wishlist" && "toggle-glow",
                        "bg-sky-500/35",
                      )}
                    />
                    <Bookmark
                      className={cn(
                        "relative z-10 h-4.5 w-4.5 transition-transform duration-200",
                        pendingAction === "wishlist" && "toggle-bump",
                      )}
                      fill={optimistic.isWishlist ? "currentColor" : "none"}
                    />
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
                      pending: pendingAction === "owned",
                      activeClassName: "border-emerald-400/40 bg-emerald-500/10 text-emerald-500",
                      inactiveClassName: "text-muted-foreground hover:bg-muted hover:text-emerald-500",
                      glowClassName:
                        "bg-emerald-500/35 ring-1 ring-inset ring-emerald-300/80 shadow-[0_0_0_1px_rgba(52,211,153,0.45),0_0_22px_rgba(16,185,129,0.45)]",
                    })}
                    aria-label="Owned"
                    aria-pressed={optimistic.isOwned}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute inset-0 rounded-md opacity-0",
                        pendingAction === "owned" && "toggle-glow",
                        "bg-emerald-500/35",
                      )}
                    />
                    <CircleCheckBig
                      className={cn(
                        "relative z-10 h-4.5 w-4.5 transition-transform duration-200",
                        pendingAction === "owned" && "toggle-bump",
                      )}
                    />
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
  pending,
  activeClassName,
  inactiveClassName,
  glowClassName,
  disabled = false,
}: {
  active: boolean;
  pending: boolean;
  activeClassName: string;
  inactiveClassName: string;
  glowClassName: string;
  disabled?: boolean;
}) {
  return cn(
    "relative isolate cursor-pointer overflow-hidden rounded-md border",
    "p-1.5",
    "transition-all duration-[260ms] motion-reduce:transition-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60",
    "active:scale-95",
    active ? "scale-105 shadow-sm" : "scale-100",
    pending && cn("toggle-press scale-105 shadow-lg", glowClassName),
    active ? activeClassName : inactiveClassName,
    disabled &&
      "cursor-default border-transparent text-muted-foreground/40 transition-none hover:bg-transparent hover:text-muted-foreground/40",
  );
}
