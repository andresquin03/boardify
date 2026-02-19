import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Globe, Handshake, Lock, UsersRound } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FriendRequestActions } from "./friend-request-card";

const visibilityConfig = {
  PUBLIC: {
    label: "Public profile",
    icon: Globe,
    className: "border-sky-400/30 bg-sky-500/10 text-sky-500 dark:text-sky-400",
  },
  FRIENDS: {
    label: "Friends only",
    icon: UsersRound,
    className: "border-amber-400/30 bg-amber-500/10 text-amber-500 dark:text-amber-400",
  },
  PRIVATE: {
    label: "Private profile",
    icon: Lock,
    className: "border-violet-400/30 bg-violet-500/10 text-violet-500 dark:text-violet-400",
  },
} as const;

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
        requester: { select: { id: true, name: true, username: true, image: true, visibility: true } },
        addressee: { select: { id: true, name: true, username: true, image: true, visibility: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const friendUsers = friends.map((f) =>
    f.requesterId === userId ? f.addressee : f.requester,
  ).filter((user) => user.id !== userId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-emerald-500 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
          <Handshake className="h-4.5 w-4.5 motion-safe:animate-[pulse_2.8s_ease-in-out_infinite]" />
        </span>
        <h1 className="text-2xl font-bold">Friends</h1>
      </div>

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
                href={user.username ? `/u/${user.username}` : "/onboarding"}
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
                <VisibilityBadge visibility={user.visibility} />
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
      href={user.username ? `/u/${user.username}` : "/onboarding"}
      className="flex min-w-0 flex-1 items-center gap-3 transition-colors hover:opacity-80"
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
      <div className="min-w-0">
        <p className="text-sm font-medium">{user.name}</p>
        {user.username && (
          <p className="text-xs text-muted-foreground">@{user.username}</p>
        )}
      </div>
    </Link>
  );
}

function VisibilityBadge({
  visibility,
}: {
  visibility?: "PUBLIC" | "FRIENDS" | "PRIVATE" | null;
}) {
  const key = visibility ?? "PUBLIC";
  const config = visibilityConfig[key];
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`ml-auto inline-flex h-7 w-7 items-center justify-center rounded-full border ${config.className}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">{config.label}</TooltipContent>
    </Tooltip>
  );
}
