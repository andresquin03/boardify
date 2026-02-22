import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dices, Globe, Handshake, Lock, UserPlus, UsersRound } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markNotificationsSeenByScopes, NOTIFICATION_SCOPE } from "@/lib/notifications";
import { FriendRequestActions, SentFriendRequestActions } from "./friend-request-card";

type VisibilityConfig = Record<
  "PUBLIC" | "FRIENDS" | "PRIVATE",
  { label: string; icon: typeof Globe; className: string }
>;

export default async function FriendsPage() {
  const t = await getTranslations("FriendsPage");
  const tUsers = await getTranslations("UsersPage");
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const userId = session.user.id;

  await markNotificationsSeenByScopes(userId, [NOTIFICATION_SCOPE.FRIENDSHIP]);

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
  const fallbackUser = tUsers("fallbackUser");
  const visibilityConfig: VisibilityConfig = {
    PUBLIC: {
      label: tUsers("visibility.public"),
      icon: Globe,
      className: "border-sky-400/30 bg-sky-500/10 text-sky-500 dark:text-sky-400",
    },
    FRIENDS: {
      label: tUsers("visibility.friends"),
      icon: UsersRound,
      className: "border-amber-400/30 bg-amber-500/10 text-amber-500 dark:text-amber-400",
    },
    PRIVATE: {
      label: tUsers("visibility.private"),
      icon: Lock,
      className: "border-violet-400/30 bg-violet-500/10 text-violet-500 dark:text-violet-400",
    },
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="group flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-emerald-500 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
          <Handshake className="h-4.5 w-4.5 transition-all duration-300 motion-safe:animate-[pulse_2.8s_ease-in-out_infinite] group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95" />
        </span>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>

      {receivedRequests.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">
            {t("sections.receivedRequests")}
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
                <UserRow user={req.requester} fallbackUser={fallbackUser} />
                <FriendRequestActions friendshipId={req.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      {sentRequests.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">
            {t("sections.sentRequests")}
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
                <UserRow user={req.addressee} fallbackUser={fallbackUser} />
                <SentFriendRequestActions friendshipId={req.id} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-lg font-semibold">
          {t("sections.friends")}
          <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {friendUsers.length}
          </span>
        </h2>
        {friendUsers.length === 0 ? (
          <section className="mt-3 rounded-xl border bg-card/70 p-5 shadow-sm">
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <UsersRound className="h-4 w-4" />
              {t("empty.title")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("empty.description")}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/users"
                className="pressable inline-flex items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent/60 active:bg-accent/75"
              >
                <UserPlus className="h-3.5 w-3.5" />
                {t("actions.findUsers")}
              </Link>
              <Link
                href="/games"
                className="pressable inline-flex items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent/60 active:bg-accent/75"
              >
                <Dices className="h-3.5 w-3.5" />
                {t("actions.browseGames")}
              </Link>
            </div>
          </section>
        ) : (
          <div className="mt-3 space-y-2">
            {friendUsers.map((user) => {
              const displayName = user.name ?? user.username ?? fallbackUser;

              return (
                <Link
                  key={user.id}
                  href={user.username ? `/u/${user.username}` : "/onboarding"}
                  className="pressable flex items-center gap-3 rounded-xl border bg-card/70 p-3 shadow-sm transition-colors hover:bg-accent/50 active:bg-accent/65"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.image ?? undefined} alt={displayName} />
                    <AvatarFallback>{getUserInitials(displayName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{displayName}</p>
                    {user.username && (
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    )}
                  </div>
                  <VisibilityBadge visibility={user.visibility} visibilityConfig={visibilityConfig} />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function UserRow({
  user,
  fallbackUser,
}: {
  user: { id: string; name: string | null; username: string | null; image: string | null };
  fallbackUser: string;
}) {
  const displayName = user.name ?? user.username ?? fallbackUser;

  return (
    <Link
      href={user.username ? `/u/${user.username}` : "/onboarding"}
      className="pressable flex min-w-0 flex-1 items-center gap-3 transition-colors hover:opacity-80 active:opacity-70"
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={user.image ?? undefined} alt={displayName} />
        <AvatarFallback>{getUserInitials(displayName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-sm font-medium">{displayName}</p>
        {user.username && (
          <p className="text-xs text-muted-foreground">@{user.username}</p>
        )}
      </div>
    </Link>
  );
}

function VisibilityBadge({
  visibility,
  visibilityConfig,
}: {
  visibility?: "PUBLIC" | "FRIENDS" | "PRIVATE" | null;
  visibilityConfig: VisibilityConfig;
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

function getUserInitials(displayName: string) {
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
