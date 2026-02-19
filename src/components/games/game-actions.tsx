"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Heart, Bookmark, CircleCheckBig } from "lucide-react";
import { toggleFavorite, toggleWishlist, toggleOwned } from "@/lib/actions";
import { cn } from "@/lib/utils";

interface GameActionsProps {
  gameId: string;
  userState?: {
    isFavorite: boolean;
    isWishlist: boolean;
    isOwned: boolean;
  };
  className?: string;
}

export function GameActions({ gameId, userState, className }: GameActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<"favorite" | "wishlist" | "owned" | null>(null);
  const [optimistic, setOptimistic] = useOptimistic(
    userState ?? { isFavorite: false, isWishlist: false, isOwned: false },
  );

  function handleToggle(action: "favorite" | "wishlist" | "owned") {
    if (isPending) return;
    if (action === "wishlist" && optimistic.isOwned) return;

    setPendingAction(action);

    startTransition(async () => {
      try {
        if (action === "favorite") {
          setOptimistic((prev) => ({ ...prev, isFavorite: !prev.isFavorite }));
          await toggleFavorite(gameId);
        } else if (action === "wishlist") {
          setOptimistic((prev) => ({ ...prev, isWishlist: !prev.isWishlist }));
          await toggleWishlist(gameId);
        } else {
          const newOwned = !optimistic.isOwned;
          setOptimistic((prev) => ({
            ...prev,
            isOwned: newOwned,
            ...(newOwned && { isWishlist: false }),
          }));
          await toggleOwned(gameId);
        }
      } finally {
        setPendingAction(null);
      }
    });
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
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
                "relative z-10 h-6 w-6 transition-transform duration-200",
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
                "relative z-10 h-6 w-6 transition-transform duration-200",
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
                "relative z-10 h-6 w-6 transition-transform duration-200",
                pendingAction === "owned" && "toggle-bump",
              )}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Owned</TooltipContent>
      </Tooltip>
    </div>
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
    "relative isolate cursor-pointer overflow-hidden rounded-lg border",
    "p-2.5",
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
