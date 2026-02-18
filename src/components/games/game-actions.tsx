"use client";

import { useOptimistic, useTransition } from "react";
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
}

export function GameActions({ gameId, userState }: GameActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    userState ?? { isFavorite: false, isWishlist: false, isOwned: false },
  );

  function handleToggle(action: "favorite" | "wishlist" | "owned") {
    startTransition(async () => {
      if (action === "favorite") {
        setOptimistic((prev) => ({ ...prev, isFavorite: !prev.isFavorite }));
        await toggleFavorite(gameId);
      } else if (action === "wishlist") {
        if (optimistic.isOwned) return;
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
    });
  }

  return (
    <div className="flex items-center gap-1">
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
