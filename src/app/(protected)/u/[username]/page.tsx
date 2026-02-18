import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileGameCard } from "@/components/profile/profile-game-card";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Bookmark, CircleCheckBig, Check, UsersRound } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findUserByUsernameWithRetry(username: string) {
  const attempts = 4;
  const delay = 100;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        image: true,
        visibility: true,
      },
    });

    if (user) return user;
    if (attempt < attempts - 1) await sleep(delay);
  }

  return null;
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  const user = await findUserByUsernameWithRetry(username);

  if (!user) notFound();

  const isOwner = viewerId === user.id;
  const visibility = user.visibility ?? "PUBLIC";
  const relation = viewerId && !isOwner
    ? await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: viewerId, addresseeId: user.id },
            { requesterId: user.id, addresseeId: viewerId },
          ],
        },
        select: { id: true, status: true, requesterId: true, addresseeId: true },
      })
    : null;
  const isFriend = relation?.status === "ACCEPTED";
  const hasPendingRequest = relation?.status === "PENDING";

  const canAccessPage = isOwner || visibility !== "PRIVATE";
  const canViewCollections =
    isOwner || visibility === "PUBLIC" || (visibility === "FRIENDS" && isFriend);

  if (!canAccessPage) {
    notFound();
  }

  const userGames = canViewCollections
    ? await prisma.userGame.findMany({
        where: { userId: user.id },
        include: { game: true },
      })
    : [];

  const friendCount = await prisma.friendship.count({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: user.id }, { addresseeId: user.id }],
    },
  });

  const favoriteGames = userGames.filter((ug) => ug.isFavorite).map((ug) => ug.game);
  const wishlistGames = userGames.filter((ug) => ug.isWishlist).map((ug) => ug.game);
  const ownedGames = userGames.filter((ug) => ug.isOwned).map((ug) => ug.game);
  const relationState = isFriend
    ? "FRIEND"
    : hasPendingRequest && relation?.addresseeId === viewerId
      ? "PENDING_RECEIVED"
      : hasPendingRequest
        ? "PENDING_SENT"
        : "NONE" as const;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section
        className={cn(
          "grid gap-5",
          canViewCollections && "lg:grid-cols-[minmax(0,1fr)_auto] lg:items-stretch",
        )}
      >
        <div className="h-full">
          <ProfileHeader
            user={{
              id: user.id,
              name: user.name,
              username: user.username ?? username,
              bio: canViewCollections ? user.bio : null,
              image: user.image,
              visibility: user.visibility ?? "PUBLIC",
            }}
            profilePathUsername={username}
            isOwner={isOwner}
            relationState={relationState}
            friendshipId={relation?.id}
            canSendRequest={Boolean(viewerId) && !hasPendingRequest && !isFriend}
          />
        </div>

        {canViewCollections && (
          <div className="w-full lg:w-auto">
            <div className="flex h-full min-h-full flex-col rounded-2xl border bg-card/70 p-3 shadow-sm backdrop-blur-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="rounded-xl border bg-card/70 p-3 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground">Games</p>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <StatCard
                      icon={Heart}
                      value={favoriteGames.length}
                      tone="text-rose-500"
                    />
                    <StatCard
                      icon={Bookmark}
                      value={wishlistGames.length}
                      tone="text-sky-500"
                    />
                    <StatCard
                      icon={Check}
                      value={ownedGames.length}
                      tone="h-3.5 w-3.5 text-white stroke-[3]"
                      iconWrapClassName="inline-flex h-6.5 w-6.5 items-center justify-center rounded-full bg-emerald-500"
                      filledIcon={false}
                    />
                  </div>
                </div>

                <div className="rounded-xl border bg-card/70 p-3 shadow-sm">
                  <p className="text-xs font-medium text-muted-foreground">Friends</p>
                  <div className="mt-2 grid grid-cols-1 gap-2">
                    <StatCard
                      icon={UsersRound}
                      value={friendCount}
                      tone="text-violet-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {!canViewCollections && visibility === "FRIENDS" && !isOwner && (
        <section className="mt-8 rounded-xl border bg-card/70 p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">
            This profile is visible to friends only. Send a friend request to unlock games and stats.
          </p>
        </section>
      )}

      {canViewCollections && (
        <>
          <CollectionSection
            title="Favorites"
            icon={Heart}
            count={favoriteGames.length}
            emptyText="No favorite games yet."
            games={favoriteGames}
            isOwner={isOwner}
            iconTone="text-rose-500"
          />

          <CollectionSection
            title="Wishlist"
            icon={Bookmark}
            count={wishlistGames.length}
            emptyText="No games in wishlist."
            games={wishlistGames}
            isOwner={isOwner}
            iconTone="text-sky-500"
          />

          <CollectionSection
            title="Owned"
            icon={CircleCheckBig}
            count={ownedGames.length}
            emptyText="No owned games yet."
            games={ownedGames}
            isOwner={isOwner}
            iconTone="text-emerald-500"
          />
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  tone,
  chipClassName,
  iconWrapClassName,
  filledIcon = true,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: number;
  tone: string;
  chipClassName?: string;
  iconWrapClassName?: string;
  filledIcon?: boolean;
}) {
  return (
    <Card className="h-20 w-20 rounded-xl border shadow-sm sm:h-24 sm:w-24">
      <CardContent className="flex h-full flex-col items-center justify-center p-2 text-center">
        <div className={cn("rounded-full bg-muted p-2", chipClassName)}>
          {iconWrapClassName ? (
            <span className={iconWrapClassName}>
              <Icon className={tone} {...(filledIcon ? { fill: "currentColor" } : {})} />
            </span>
          ) : (
            <Icon className={`h-5 w-5 ${tone}`} {...(filledIcon ? { fill: "currentColor" } : {})} />
          )}
        </div>
        <p className="mt-2 text-xl font-semibold leading-none sm:text-2xl">{value}</p>
      </CardContent>
    </Card>
  );
}

function CollectionSection({
  title,
  icon: Icon,
  iconTone,
  count,
  emptyText,
  games,
  isOwner,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconTone: string;
  count: number;
  emptyText: string;
  games: Array<{
    id: string;
    slug: string;
    title: string;
    minPlayers: number;
    maxPlayers: number;
    minPlaytime: number;
    maxPlaytime: number;
    image?: string | null;
  }>;
  isOwner: boolean;
}) {
  return (
    <section className="mt-8 rounded-xl border bg-card/70 p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className={`h-4 w-4 ${iconTone}`} />
          {title}
        </CardTitle>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{count}</span>
      </div>

      {games.length === 0 ? (
        <div className="mt-4 flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">{emptyText}</p>
          {isOwner && (
            <Button asChild size="sm" variant="outline" className="cursor-pointer">
              <Link href="/games">Explore games</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <ProfileGameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </section>
  );
}
