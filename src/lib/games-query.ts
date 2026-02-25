import type { Game, Prisma } from "@/generated/prisma/client";
import type {
  DifficultyFilterValue,
  GameSortValue,
  PlayerFilterValue,
} from "@/lib/game-filters";

export const GAMES_PAGE_SIZE = 18;

export type GameFiltersInput = {
  q: string;
  players: PlayerFilterValue[];
  categories: string[];
  difficulty: DifficultyFilterValue | "";
  sort: GameSortValue;
};

export type GameWithUserState = Game & {
  userState: { isFavorite: boolean; isWishlist: boolean; isOwned: boolean } | undefined;
};

function buildPlayersFilter(selectedPlayers: PlayerFilterValue[]) {
  if (selectedPlayers.length === 0) return undefined;
  return {
    OR: selectedPlayers.map((filter) => {
      if (filter === "2") return { minPlayers: { lte: 2 }, maxPlayers: { gte: 2 } };
      if (filter === "3-4") return { minPlayers: { lte: 4 }, maxPlayers: { gte: 3 } };
      return { maxPlayers: { gte: 5 } };
    }),
  };
}

function buildDifficultyFilter(difficulty: DifficultyFilterValue | "") {
  if (!difficulty) return undefined;
  if (difficulty === "easy") return { difficulty: { lte: 2 } };
  if (difficulty === "medium") return { difficulty: { gt: 2, lte: 3 } };
  return { difficulty: { gt: 3 } };
}

export function buildGamesWhereClause(filters: GameFiltersInput): Prisma.GameWhereInput {
  const whereFilters: Prisma.GameWhereInput[] = [];

  if (filters.q) {
    whereFilters.push({
      OR: [
        { title: { contains: filters.q, mode: "insensitive" } },
        {
          categories: {
            some: {
              category: { name: { contains: filters.q, mode: "insensitive" } },
            },
          },
        },
      ],
    });
  }

  const playersFilter = buildPlayersFilter(filters.players);
  if (playersFilter) whereFilters.push(playersFilter);

  const difficultyFilter = buildDifficultyFilter(filters.difficulty);
  if (difficultyFilter) whereFilters.push(difficultyFilter);

  if (filters.categories.length > 0) {
    whereFilters.push({
      categories: {
        some: { category: { name: { in: filters.categories } } },
      },
    });
  }

  return whereFilters.length > 0 ? { AND: whereFilters } : {};
}

export function buildGamesOrderBy(sort: GameSortValue): Prisma.GameOrderByWithRelationInput[] {
  if (sort === "difficulty") return [{ difficulty: "asc" }, { title: "asc" }];
  if (sort === "rating") return [{ rating: "desc" }, { title: "asc" }];
  return [{ title: "asc" }];
}
