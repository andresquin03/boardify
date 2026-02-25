import { GamesFilters } from "@/components/games/games-filters";
import { GamesGrid } from "@/components/games/games-grid";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { getTranslations } from "next-intl/server";
import {
  isDifficultyFilterValue,
  isGameSortValue,
  isPlayerFilterValue,
} from "@/lib/game-filters";
import {
  buildGamesOrderBy,
  buildGamesWhereClause,
  GAMES_PAGE_SIZE,
  type GameFiltersInput,
  type GameWithUserState,
} from "@/lib/games-query";
import { Dice5 } from "lucide-react";

interface GamesPageProps {
  searchParams: Promise<{
    q?: string | string[];
    players?: string | string[];
    categories?: string | string[];
    difficulty?: string | string[];
    sort?: string | string[];
  }>;
}

function toArray(value?: string | string[]) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeSingleValue(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const t = await getTranslations("GamesPage");
  const params = await searchParams;
  const session = await auth();
  const userId = session?.user?.id;

  const query = normalizeSingleValue(params.q).trim();
  const selectedPlayers = toArray(params.players).filter(isPlayerFilterValue);
  const selectedCategories = [...new Set(toArray(params.categories).filter(Boolean))];
  const selectedDifficultyRaw = normalizeSingleValue(params.difficulty).trim().toLowerCase();
  const selectedDifficulty = isDifficultyFilterValue(selectedDifficultyRaw)
    ? selectedDifficultyRaw
    : "";
  const selectedSortRaw = normalizeSingleValue(params.sort).trim().toLowerCase();
  const selectedSort = isGameSortValue(selectedSortRaw) ? selectedSortRaw : "abc";

  const filters: GameFiltersInput = {
    q: query,
    players: selectedPlayers,
    categories: selectedCategories,
    difficulty: selectedDifficulty,
    sort: selectedSort,
  };

  const [games, categories] = await Promise.all([
    prisma.game.findMany({
      where: buildGamesWhereClause(filters),
      orderBy: buildGamesOrderBy(selectedSort),
      take: GAMES_PAGE_SIZE,
      skip: 0,
    }),
    prisma.category.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const hasMore = games.length === GAMES_PAGE_SIZE;
  const categoryOptions = categories.map((c) => c.name);

  const userGamesMap = new Map<
    string,
    { isFavorite: boolean; isWishlist: boolean; isOwned: boolean }
  >();
  if (userId && games.length > 0) {
    const userGames = await prisma.userGame.findMany({
      where: { userId, gameId: { in: games.map((g) => g.id) } },
      select: { gameId: true, isFavorite: true, isWishlist: true, isOwned: true },
    });
    for (const ug of userGames) {
      userGamesMap.set(ug.gameId, {
        isFavorite: ug.isFavorite,
        isWishlist: ug.isWishlist,
        isOwned: ug.isOwned,
      });
    }
  }

  const initialGames: GameWithUserState[] = games.map((g) => ({
    ...g,
    userState: userGamesMap.get(g.id),
  }));

  const filterKey = JSON.stringify(filters);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="group flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-sky-500 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
          <Dice5 className="h-5 w-5 transition-all duration-300 motion-safe:animate-[pulse_2.8s_ease-in-out_infinite] group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95" />
        </span>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
      </div>
      <p className="mt-1 text-muted-foreground">{t("description")}</p>

      <GamesFilters
        initialQuery={query}
        selectedPlayers={selectedPlayers}
        selectedCategories={selectedCategories}
        selectedDifficulty={selectedDifficulty}
        selectedSort={selectedSort}
        categoryOptions={categoryOptions}
      />

      {initialGames.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <GamesGrid
          key={filterKey}
          initialGames={initialGames}
          initialHasMore={hasMore}
          filters={filters}
          isAuthenticated={!!userId}
        />
      )}
    </div>
  );
}
