import { notFound } from "next/navigation";
import { ProfileHeader } from "@/components/profile/profile-header";
import { GameCard } from "@/components/games/game-card";
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
      favorites: {
        include: { game: true },
      },
    },
  });

  // Fallback: match by email prefix (e.g. /u/johndoe matches johndoe@gmail.com)
  if (!user) {
    user = await prisma.user.findFirst({
      where: { email: { startsWith: username + "@" } },
      include: {
        favorites: {
          include: { game: true },
        },
      },
    });
  }

  if (!user) notFound();

  const isOwner = session?.user?.id === user.id;
  const favoriteGames = user.favorites.map((f) => f.game);

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
        <h2 className="text-xl font-semibold">Favorite Games</h2>
        {favoriteGames.length === 0 ? (
          <p className="mt-4 text-muted-foreground">No favorite games yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
