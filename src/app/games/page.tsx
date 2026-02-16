import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GameCard } from "@/components/games/game-card";
import { games } from "@/lib/mock-data";
import { Search } from "lucide-react";

export default function GamesPage() {
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
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
}
