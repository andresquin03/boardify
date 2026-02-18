import Link from "next/link";
import { notFound } from "next/navigation";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileGameCard } from "@/components/profile/profile-game-card";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Bookmark, CircleCheckBig, Check } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await auth();

  // Look up user by username, or fall back to email prefix match.
  let user = await prisma.user.findUnique({
    where: { username },
    include: {
      userGames: {
        include: { game: true },
      },
    },
  });

  // Fallback: /u/johndoe may refer to johndoe@gmail.com.
  if (!user) {
    user = await prisma.user.findFirst({
      where: { email: { startsWith: username + "@" } },
      include: {
        userGames: {
          include: { game: true },
        },
      },
    });
  }

  if (!user) notFound();

  const isOwner = session?.user?.id === user.id;

  const favoriteGames = user.userGames.filter((ug) => ug.isFavorite).map((ug) => ug.game);
  const wishlistGames = user.userGames.filter((ug) => ug.isWishlist).map((ug) => ug.game);
  const ownedGames = user.userGames.filter((ug) => ug.isOwned).map((ug) => ug.game);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="lg:flex-1">
          <ProfileHeader
            user={{
              name: user.name,
              username: user.username ?? username,
              image: user.image,
            }}
            isOwner={isOwner}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 self-start">
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
      </section>

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
    <Card className="h-28 w-28 rounded-xl border shadow-sm">
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
        <p className="mt-2 text-2xl font-semibold leading-none">{value}</p>
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
