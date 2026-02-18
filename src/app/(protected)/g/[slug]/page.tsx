import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatPlayerCount, formatPlaytime } from "@/lib/game-utils";
import { GameActions } from "@/components/games/game-actions";
import { Clock, Users, Star, CalendarDays, Shapes, Pencil } from "lucide-react";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const userId = session?.user?.id;

  const game = await prisma.game.findUnique({
    where: { slug },
    include: {
      categories: {
        include: { category: true },
        orderBy: { category: { name: "asc" } },
      },
    },
  });

  if (!game) notFound();

  let userState: { isFavorite: boolean; isWishlist: boolean; isOwned: boolean } | undefined;
  if (userId) {
    const ug = await prisma.userGame.findUnique({
      where: { userId_gameId: { userId, gameId: game.id } },
      select: { isFavorite: true, isWishlist: true, isOwned: true },
    });
    if (ug) userState = ug;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="flex h-48 items-center justify-center rounded-2xl bg-muted">
        <DiceIcon className="h-16 w-16 text-muted-foreground/30" />
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{game.title}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {game.designer && (
              <span className="flex items-center gap-1">
                <Pencil className="h-3.5 w-3.5" />
                {game.designer}
              </span>
            )}
            {game.yearPublished && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                {game.yearPublished}
              </span>
            )}
            {game.categories.length > 0 && (
              <span className="flex items-center gap-1">
                <Shapes className="h-3.5 w-3.5" />
                {game.categories.map((item) => item.category.name).join(", ")}
              </span>
            )}
          </div>
        </div>

        {!!userId && (
          <GameActions gameId={game.id} userState={userState} />
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 flex gap-6 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{formatPlayerCount(game.minPlayers, game.maxPlayers)} players</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{formatPlaytime(game.minPlaytime, game.maxPlaytime)}</span>
        </div>
        {game.complexity && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Star className="h-4 w-4" />
            <span>{game.complexity.toFixed(1)} / 5</span>
          </div>
        )}
      </div>

      {/* Description */}
      {game.description && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">About</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            {game.description}
          </p>
        </div>
      )}
    </div>
  );
}

function DiceIcon({ className }: { className?: string }) {
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
