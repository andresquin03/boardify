import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FriendRequestActions } from "./friend-request-card";

export default async function FriendsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const userId = session.user.id;

  const [receivedRequests, sentRequests, friends] = await Promise.all([
    prisma.friendship.findMany({
      where: { addresseeId: userId, status: "PENDING" },
      include: { requester: { select: { id: true, name: true, username: true, image: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendship.findMany({
      where: { requesterId: userId, status: "PENDING" },
      include: { addressee: { select: { id: true, name: true, username: true, image: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: { select: { id: true, name: true, username: true, image: true } },
        addressee: { select: { id: true, name: true, username: true, image: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const friendUsers = friends.map((f) =>
    f.requesterId === userId ? f.addressee : f.requester,
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold">Friends</h1>

      {receivedRequests.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">
            Received requests
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {receivedRequests.length}
            </span>
          </h2>
          <div className="mt-3 space-y-2">
            {receivedRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between rounded-xl border bg-card/70 p-3 shadow-sm"
              >
                <UserRow user={req.requester} />
                <FriendRequestActions friendshipId={req.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      {sentRequests.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">
            Sent requests
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {sentRequests.length}
            </span>
          </h2>
          <div className="mt-3 space-y-2">
            {sentRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between rounded-xl border bg-card/70 p-3 shadow-sm"
              >
                <UserRow user={req.addressee} />
                <span className="text-xs text-muted-foreground">Pending</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          Friends
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {friendUsers.length}
          </span>
        </h2>
        {friendUsers.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No friends yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {friendUsers.map((user) => (
              <Link
                key={user.id}
                href={`/u/${user.username ?? user.id}`}
                className="flex items-center gap-3 rounded-xl border bg-card/70 p-3 shadow-sm transition-colors hover:bg-accent/50"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
                  <AvatarFallback>
                    {user.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  {user.username && (
                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function UserRow({
  user,
}: {
  user: { id: string; name: string | null; username: string | null; image: string | null };
}) {
  return (
    <Link
      href={`/u/${user.username ?? user.id}`}
      className="flex items-center gap-3 transition-colors hover:opacity-80"
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
        <AvatarFallback>
          {user.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase() ?? "U"}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium">{user.name}</p>
        {user.username && (
          <p className="text-xs text-muted-foreground">@{user.username}</p>
        )}
      </div>
    </Link>
  );
}
