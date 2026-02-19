import { GameCard } from "@/components/games/game-card";
import { GamesFilters } from "@/components/games/games-filters";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  isDifficultyFilterValue,
  isGameSortValue,
  isPlayerFilterValue,
  type DifficultyFilterValue,
  type GameSortValue,
  type PlayerFilterValue,
} from "@/lib/game-filters";
import { Dice5 } from "lucide-react";
import type { Prisma } from "@/generated/prisma/client";

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

function buildPlayersFilter(selectedPlayers: PlayerFilterValue[]) {
  if (selectedPlayers.length === 0) return undefined;

  return {
    OR: selectedPlayers.map((filter) => {
      if (filter === "2") {
        return {
          minPlayers: { lte: 2 },
          maxPlayers: { gte: 2 },
        };
      }

      if (filter === "3-4") {
        return {
          minPlayers: { lte: 4 },
          maxPlayers: { gte: 3 },
        };
      }

      return {
        maxPlayers: { gte: 5 },
      };
    }),
  };
}

function buildDifficultyFilter(selectedDifficulty: DifficultyFilterValue | "") {
  if (!selectedDifficulty) return undefined;

  if (selectedDifficulty === "easy") {
    return { difficulty: { lte: 2 } };
  }

  if (selectedDifficulty === "medium") {
    return {
      difficulty: {
        gt: 2,
        lte: 3,
      },
    };
  }

  return { difficulty: { gt: 3 } };
}

function compareNullableNumberDesc(a: number | null, b: number | null) {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b - a;
}

function sortGamesByOption<
  T extends { title: string; difficulty: number | null; rating: number | null },
>(games: T[], sortBy: GameSortValue) {
  const sorted = [...games];

  if (sortBy === "abc") {
    return sorted.sort((a, b) =>
      a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
    );
  }

  if (sortBy === "difficulty") {
    return sorted.sort((a, b) => {
      const numberDiff = compareNullableNumberDesc(a.difficulty, b.difficulty);
      if (numberDiff !== 0) return numberDiff;
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    });
  }

  return sorted.sort((a, b) => {
    const numberDiff = compareNullableNumberDesc(a.rating, b.rating);
    if (numberDiff !== 0) return numberDiff;
    return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
  });
}

export default async function GamesPage({ searchParams }: GamesPageProps) {
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
  const selectedSort: GameSortValue = isGameSortValue(selectedSortRaw)
    ? selectedSortRaw
    : "abc";

  const whereFilters: Prisma.GameWhereInput[] = [];

  if (query) {
    whereFilters.push({
      OR: [
        { title: { contains: query, mode: "insensitive" as const } },
        {
          categories: {
            some: {
              category: {
                name: { contains: query, mode: "insensitive" as const },
              },
            },
          },
        },
      ],
    });
  }

  const playersFilter = buildPlayersFilter(selectedPlayers);
  if (playersFilter) {
    whereFilters.push(playersFilter);
  }

  const difficultyFilter = buildDifficultyFilter(selectedDifficulty);
  if (difficultyFilter) {
    whereFilters.push(difficultyFilter);
  }

  if (selectedCategories.length > 0) {
    whereFilters.push({
      categories: {
        some: {
          category: {
            name: { in: selectedCategories },
          },
        },
      },
    });
  }

  const games = await prisma.game.findMany({
    where: whereFilters.length > 0 ? { AND: whereFilters } : undefined,
  });
  const sortedGames = sortGamesByOption(games, selectedSort);

  const categories = await prisma.category.findMany({
    select: { name: true },
    orderBy: { name: "asc" },
  });

  const categoryOptions = categories.map((item) => item.name);

  const userGamesMap = new Map<string, { isFavorite: boolean; isWishlist: boolean; isOwned: boolean }>();
  if (userId) {
    const userGames = await prisma.userGame.findMany({
      where: { userId },
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-sky-500 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
          <Dice5 className="h-5 w-5 motion-safe:animate-[pulse_2.8s_ease-in-out_infinite]" />
        </span>
        <h1 className="text-3xl font-bold">Games</h1>
      </div>
      <p className="mt-1 text-muted-foreground">
        Browse our catalog of board games.
      </p>

      <GamesFilters
        initialQuery={query}
        selectedPlayers={selectedPlayers}
        selectedCategories={selectedCategories}
        selectedDifficulty={selectedDifficulty}
        selectedSort={selectedSort}
        categoryOptions={categoryOptions}
      />

      {sortedGames.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No games found with those filters.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              userState={userGamesMap.get(game.id)}
              isAuthenticated={!!userId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
