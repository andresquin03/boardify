import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatPlayerCount, formatPlaytime } from "@/lib/game-utils";
import { GameActions } from "@/components/games/game-actions";
import { GameImageWithFallback } from "@/components/games/game-image-with-fallback";
import { ShareIconButton } from "@/components/ui/share-icon-button";
import { Clock, Users, Star, CalendarDays, Shapes, Pencil, Thermometer } from "lucide-react";

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
      <div className="overflow-hidden rounded-2xl border bg-muted/30">
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/9]">
          <GameImageWithFallback
            src={game.image}
            alt={`Cover of ${game.title}`}
            fill
            className="object-contain p-3 sm:p-6"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 900px"
            priority
            diceClassName="h-16 w-16 text-muted-foreground/30"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h1 className="text-3xl font-bold">{game.title}</h1>
          <div className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground sm:justify-start">
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

        <div className="flex w-full items-center justify-center gap-3 sm:w-auto sm:justify-end">
          {!!userId && (
            <GameActions gameId={game.id} userState={userState} />
          )}
          <ShareIconButton
            path={`/g/${game.slug}`}
            message={`Let's play ${game.title} on Boardify:`}
            tooltipLabel="Share game"
            ariaLabel="Share game"
            size="md"
            className="ml-4"
          />
        </div>
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
        {game.rating !== null && (
          <div className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400">
            <Star className="h-4 w-4" fill="currentColor" />
            <span>{game.rating.toFixed(1)} / 10 rating</span>
          </div>
        )}
        {game.difficulty !== null && (
          <div className={`flex items-center gap-1.5 ${getDifficultyColorClass(game.difficulty)}`}>
            <Thermometer className="h-4 w-4" />
            <span>{game.difficulty.toFixed(1)} / 5 difficulty</span>
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

function getDifficultyColorClass(value: number) {
  if (value <= 1.4) return "text-blue-500 dark:text-blue-400";
  if (value <= 2) return "text-emerald-500 dark:text-emerald-400";
  if (value <= 3) return "text-yellow-400 dark:text-yellow-300";
  if (value <= 4) return "text-orange-500 dark:text-orange-400";
  return "text-red-500 dark:text-red-400";
}
