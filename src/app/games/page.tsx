import { GameCard } from "@/components/games/game-card";
import { GamesFilters } from "@/components/games/games-filters";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isPlayerFilterValue, type PlayerFilterValue } from "@/lib/game-filters";
import type { Prisma } from "@/generated/prisma/client";

interface GamesPageProps {
  searchParams: Promise<{
    q?: string | string[];
    players?: string | string[];
    categories?: string | string[];
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

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const params = await searchParams;
  const session = await auth();
  const userId = session?.user?.id;

  const query = normalizeSingleValue(params.q).trim();
  const selectedPlayers = toArray(params.players).filter(isPlayerFilterValue);
  const selectedCategories = [...new Set(toArray(params.categories).filter(Boolean))];

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
    orderBy: { title: "asc" },
  });

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
      <h1 className="text-3xl font-bold">Games</h1>
      <p className="mt-1 text-muted-foreground">
        Browse our catalog of board games.
      </p>

      <GamesFilters
        initialQuery={query}
        selectedPlayers={selectedPlayers}
        selectedCategories={selectedCategories}
        categoryOptions={categoryOptions}
      />

      {games.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No games found with those filters.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
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
