"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { GameCard } from "@/components/games/game-card";
import { fetchGamesPage } from "@/lib/games-actions";
import type { GameFiltersInput, GameWithUserState } from "@/lib/games-query";

type Props = {
  initialGames: GameWithUserState[];
  initialHasMore: boolean;
  filters: GameFiltersInput;
  isAuthenticated: boolean;
};

export function GamesGrid({ initialGames, initialHasMore, filters, isAuthenticated }: Props) {
  const t = useTranslations("GamesPage");
  const [games, setGames] = useState(initialGames);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(initialGames.length);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    const result = await fetchGamesPage(filters, offsetRef.current);
    offsetRef.current += result.games.length;
    setGames((prev) => [...prev, ...result.games]);
    setHasMore(result.hasMore);
    setLoading(false);
    loadingRef.current = false;
  }, [filters, hasMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            userState={game.userState}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>
      <div ref={sentinelRef} className="h-4" />
      {loading && (
        <p className="mt-4 text-center text-sm text-muted-foreground">{t("loadingMore")}</p>
      )}
    </>
  );
}
