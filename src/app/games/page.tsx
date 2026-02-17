import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GameCard } from "@/components/games/game-card";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Search } from "lucide-react";

export default async function GamesPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const games = await prisma.game.findMany({
    orderBy: { title: "asc" },
  });

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

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search games..." className="pl-9" />
        </div>
        <Select>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Player count" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any</SelectItem>
            <SelectItem value="2">2 players</SelectItem>
            <SelectItem value="3-4">3-4 players</SelectItem>
            <SelectItem value="5+">5+ players</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Game grid */}
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
    </div>
  );
}
