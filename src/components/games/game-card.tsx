import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Heart, Users } from "lucide-react";
import type { Game } from "@/lib/mock-data";

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  return (
    <Card className="rounded-2xl shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex h-28 items-center justify-center rounded-xl bg-muted">
          <Dice className="h-10 w-10 text-muted-foreground/50" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <CardTitle className="text-base">{game.title}</CardTitle>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {game.playerCount}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {game.playtime}
          </span>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full gap-1.5">
          <Heart className="h-3.5 w-3.5" />
          Add to favorites
        </Button>
      </CardFooter>
    </Card>
  );
}

function Dice({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="0.5" fill="currentColor" />
      <circle cx="15" cy="9" r="0.5" fill="currentColor" />
      <circle cx="9" cy="15" r="0.5" fill="currentColor" />
      <circle cx="15" cy="15" r="0.5" fill="currentColor" />
    </svg>
  );
}
