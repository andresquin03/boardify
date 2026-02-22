import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { formatPlayerCount, formatPlaytime } from "@/lib/game-utils";
import { GameActions } from "@/components/games/game-actions";
import { GameImageWithFallback } from "@/components/games/game-image-with-fallback";
import { ShareIconButton } from "@/components/ui/share-icon-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Users, Star, CalendarDays, Shapes, Pencil, Thermometer } from "lucide-react";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const locale = await getLocale();
  const t = await getTranslations("GameDetailPage");
  const { slug } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  const fallbackUser = t("friendsOwned.fallbackUser");

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
  let friendsWhoOwn: Array<{ id: string; name: string | null; username: string | null; image: string | null }> = [];

  if (userId) {
    const [ug, acceptedFriendships] = await Promise.all([
      prisma.userGame.findUnique({
        where: { userId_gameId: { userId, gameId: game.id } },
        select: { isFavorite: true, isWishlist: true, isOwned: true },
      }),
      prisma.friendship.findMany({
        where: {
          status: "ACCEPTED",
          OR: [{ requesterId: userId }, { addresseeId: userId }],
        },
        select: {
          requesterId: true,
          addresseeId: true,
        },
      }),
    ]);

    if (ug) userState = ug;

    const friendIds = acceptedFriendships.map((friendship) =>
      friendship.requesterId === userId ? friendship.addresseeId : friendship.requesterId,
    );

    if (friendIds.length > 0) {
      const ownedByFriends = await prisma.userGame.findMany({
        where: {
          gameId: game.id,
          isOwned: true,
          userId: { in: friendIds },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      });

      friendsWhoOwn = ownedByFriends
        .map((entry) => entry.user)
        .sort((a, b) =>
          getUserDisplayName(a, fallbackUser).localeCompare(getUserDisplayName(b, fallbackUser), locale, {
            sensitivity: "base",
          }),
        );
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border bg-muted/30">
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/9]">
          <GameImageWithFallback
            src={game.image}
            alt={t("imageAlt", { title: game.title })}
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
            message={t("share.message", { title: game.title })}
            tooltipLabel={t("share.tooltip")}
            ariaLabel={t("share.aria")}
            size="md"
            className="ml-4"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 flex gap-6 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {t("stats.players", { players: formatPlayerCount(game.minPlayers, game.maxPlayers) })}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{formatPlaytime(game.minPlaytime, game.maxPlaytime)}</span>
        </div>
        {game.rating !== null && (
          <div className="flex items-center gap-1.5 text-amber-500 dark:text-amber-400">
            <Star className="h-4 w-4" fill="currentColor" />
            <span>{t("stats.rating", { rating: game.rating.toFixed(1) })}</span>
          </div>
        )}
        {game.difficulty !== null && (
          <div className={`flex items-center gap-1.5 ${getDifficultyColorClass(game.difficulty)}`}>
            <Thermometer className="h-4 w-4" />
            <span>{t("stats.difficulty", { difficulty: game.difficulty.toFixed(1) })}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {game.description && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold">{t("about")}</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            {game.description}
          </p>
        </div>
      )}

      {/* Friends ownership */}
      {!!userId && (
        <section className="mt-8 rounded-xl border bg-card/70 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Users className="h-4.5 w-4.5 text-emerald-500" />
              {t("friendsOwned.title")}
            </h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {friendsWhoOwn.length}
            </span>
          </div>

          {friendsWhoOwn.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              {t("friendsOwned.empty")}
            </p>
          ) : (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {friendsWhoOwn.map((friend) => {
                const displayName = getUserDisplayName(friend, fallbackUser);
                const profileHref = friend.username ? `/u/${friend.username}` : "/onboarding";

                return (
                  <Link
                    key={friend.id}
                    href={profileHref}
                    className="pressable flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/25 px-3 py-2 transition-colors hover:bg-accent/40 active:bg-accent/55"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={friend.image ?? undefined} alt={displayName} />
                        <AvatarFallback>{getUserInitials(displayName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{displayName}</p>
                        {friend.username && (
                          <p className="truncate text-xs text-muted-foreground">@{friend.username}</p>
                        )}
                      </div>
                    </div>
                    <span className="inline-flex shrink-0 items-center rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      {t("friendsOwned.badge")}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
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

function getUserDisplayName(
  user: { name: string | null; username: string | null },
  fallbackUser: string,
) {
  return user.name ?? user.username ?? fallbackUser;
}

function getUserInitials(displayName: string) {
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
