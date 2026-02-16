import { ProfileHeader } from "@/components/profile/profile-header";
import { GameCard } from "@/components/games/game-card";
import { mockUser } from "@/lib/mock-data";

// Hardcoded to false; flip to true to preview owner view
const IS_OWNER = false;

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  // In a real app you'd fetch the user by username.
  // For now we just override the mock data's username with the route param.
  const user = { ...mockUser, username };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <ProfileHeader user={user} isOwner={IS_OWNER} />

      {/* Favorite Games */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold">Favorite Games</h2>
        {user.favoriteGames.length === 0 ? (
          <p className="mt-4 text-muted-foreground">No favorite games yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {user.favoriteGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
