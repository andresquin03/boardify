"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  buildGamesOrderBy,
  buildGamesWhereClause,
  GAMES_PAGE_SIZE,
  type GameFiltersInput,
  type GameWithUserState,
} from "@/lib/games-query";

export async function fetchGamesPage(
  filters: GameFiltersInput,
  offset: number,
): Promise<{ games: GameWithUserState[]; hasMore: boolean }> {
  const session = await auth();
  const userId = session?.user?.id;

  const games = await prisma.game.findMany({
    where: buildGamesWhereClause(filters),
    orderBy: buildGamesOrderBy(filters.sort),
    take: GAMES_PAGE_SIZE,
    skip: offset,
  });

  const userStateMap = new Map<
    string,
    { isFavorite: boolean; isWishlist: boolean; isOwned: boolean }
  >();

  if (userId && games.length > 0) {
    const userGames = await prisma.userGame.findMany({
      where: { userId, gameId: { in: games.map((g) => g.id) } },
      select: { gameId: true, isFavorite: true, isWishlist: true, isOwned: true },
    });
    for (const ug of userGames) {
      userStateMap.set(ug.gameId, {
        isFavorite: ug.isFavorite,
        isWishlist: ug.isWishlist,
        isOwned: ug.isOwned,
      });
    }
  }

  return {
    games: games.map((g) => ({ ...g, userState: userStateMap.get(g.id) })),
    hasMore: games.length === GAMES_PAGE_SIZE,
  };
}
