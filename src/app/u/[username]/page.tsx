import { notFound } from "next/navigation";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileGameCard } from "@/components/profile/profile-game-card";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await auth();

  // Look up user by username, or fall back to email prefix match
  let user = await prisma.user.findUnique({
    where: { username },
    include: {
      userGames: {
        include: { game: true },
      },
    },
  });

  // Fallback: match by email prefix (e.g. /u/johndoe matches johndoe@gmail.com)
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

  const favoriteGames = user.userGames
    .filter((ug) => ug.isFavorite)
    .map((ug) => ({
      game: ug.game,
      userState: { isFavorite: ug.isFavorite, isWishlist: ug.isWishlist, isOwned: ug.isOwned },
    }));

  const wishlistGames = user.userGames
    .filter((ug) => ug.isWishlist)
    .map((ug) => ({
      game: ug.game,
      userState: { isFavorite: ug.isFavorite, isWishlist: ug.isWishlist, isOwned: ug.isOwned },
    }));

  const ownedGames = user.userGames
    .filter((ug) => ug.isOwned)
    .map((ug) => ({
      game: ug.game,
      userState: { isFavorite: ug.isFavorite, isWishlist: ug.isWishlist, isOwned: ug.isOwned },
    }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <ProfileHeader
        user={{
          name: user.name,
          username: user.username ?? username,
          image: user.image,
        }}
        isOwner={isOwner}
      />

      {/* Favorite Games */}
      <section className="mt-10">
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-semibold">Favorites</h2>
          <span className="text-sm text-muted-foreground">{favoriteGames.length}</span>
        </div>
        {favoriteGames.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No favorite games yet.</p>
        ) : (
          <div className="mt-3 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteGames.map(({ game }) => (
              <ProfileGameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </section>

      {/* Wishlist */}
      <section className="mt-10">
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-semibold">Wishlist</h2>
          <span className="text-sm text-muted-foreground">{wishlistGames.length}</span>
        </div>
        {wishlistGames.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No games in wishlist.</p>
        ) : (
          <div className="mt-3 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {wishlistGames.map(({ game }) => (
              <ProfileGameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </section>

      {/* Owned Games */}
      <section className="mt-10">
        <div className="flex items-baseline gap-2">
          <h2 className="text-lg font-semibold">Owned</h2>
          <span className="text-sm text-muted-foreground">{ownedGames.length}</span>
        </div>
        {ownedGames.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No owned games yet.</p>
        ) : (
          <div className="mt-3 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
            {ownedGames.map(({ game }) => (
              <ProfileGameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
