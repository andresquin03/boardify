import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CircleHelp,
  Clock3,
  Lock,
  Globe,
  Handshake,
  UserCheck,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export default async function UserFriendsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const viewerId = session.user.id;

  const { username } = await params;
  const targetUser = await prisma.user.findUnique({
    where: { username },
    select: { id: true, name: true, username: true },
  });

  if (!targetUser) notFound();

  if (viewerId === targetUser.id) {
    redirect("/friends");
  }

  const relationWithTarget = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: viewerId, addresseeId: targetUser.id },
        { requesterId: targetUser.id, addresseeId: viewerId },
      ],
    },
    select: { id: true },
  });

  if (!relationWithTarget) {
    redirect(`/u/${username}`);
  }

  const acceptedFriendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: targetUser.id }, { addresseeId: targetUser.id }],
    },
    include: {
      requester: { select: { id: true, name: true, username: true, image: true, visibility: true } },
      addressee: { select: { id: true, name: true, username: true, image: true, visibility: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const friendUsers = acceptedFriendships
    .map((friendship) =>
      friendship.requesterId === targetUser.id ? friendship.addressee : friendship.requester,
    )
    .filter((user) => user.id !== targetUser.id)
    .filter((user) => Boolean(user.username))
    .sort((a, b) => {
      const aName = (a.name ?? a.username ?? "").toLowerCase();
      const bName = (b.name ?? b.username ?? "").toLowerCase();
      return aName.localeCompare(bName);
    });

  const listedOtherUserIds = friendUsers
    .map((friend) => friend.id)
    .filter((id) => id !== viewerId);

  const viewerRelations = listedOtherUserIds.length
    ? await prisma.friendship.findMany({
        where: {
          status: { in: ["ACCEPTED", "PENDING"] },
          OR: [
            { requesterId: viewerId, addresseeId: { in: listedOtherUserIds } },
            { requesterId: { in: listedOtherUserIds }, addresseeId: viewerId },
          ],
        },
        select: { requesterId: true, addresseeId: true, status: true },
      })
    : [];

  const relationStateByUserId = new Map<
    string,
    "FRIEND" | "PENDING_SENT" | "PENDING_RECEIVED"
  >();
  for (const relation of viewerRelations) {
    const otherUserId =
      relation.requesterId === viewerId ? relation.addresseeId : relation.requesterId;

    if (relation.status === "ACCEPTED") {
      relationStateByUserId.set(otherUserId, "FRIEND");
      continue;
    }

    relationStateByUserId.set(
      otherUserId,
      relation.requesterId === viewerId ? "PENDING_SENT" : "PENDING_RECEIVED",
    );
  }

  const displayName = targetUser.name ?? targetUser.username ?? "User";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-amber-500 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
          <Handshake className="h-4.5 w-4.5 motion-safe:animate-[pulse_2.8s_ease-in-out_infinite]" />
        </span>
        <h1 className="text-2xl font-bold">{displayName}&apos;s friends</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {friendUsers.length} {friendUsers.length === 1 ? "friend" : "friends"}
      </p>

      {friendUsers.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No friends yet.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {friendUsers.map((friend) => {
            const isCurrentUser = friend.id === viewerId;
            const relationState = relationStateByUserId.get(friend.id) ?? "NONE";
            const visibilityKey =
              friend.visibility === "FRIENDS"
                ? "FRIENDS"
                : friend.visibility === "PRIVATE"
                  ? "PRIVATE"
                  : "PUBLIC";
            const visibility = visibilityConfig[visibilityKey];
            const VisibilityIcon = visibility.icon;
            const friendDisplayName = friend.name ?? friend.username ?? "User";
            const initials = friendDisplayName
              .split(" ")
              .map((part) => part[0])
              .join("")
              .toUpperCase();

            const relationMeta =
              relationState === "FRIEND"
                ? {
                    icon: UserCheck,
                    tooltip: "Friends",
                    className:
                      "border-emerald-400/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400",
                  }
                : relationState === "PENDING_RECEIVED"
                  ? {
                      icon: CircleHelp,
                      tooltip: "Sent you a request",
                      className:
                        "border-amber-400/30 bg-amber-500/10 text-amber-500 dark:text-amber-400",
                    }
                  : relationState === "PENDING_SENT"
                    ? {
                        icon: Clock3,
                        tooltip: "Request sent",
                        className:
                          "border-sky-400/30 bg-sky-500/10 text-sky-500 dark:text-sky-400",
                      }
                    : {
                        icon: UserPlus,
                        tooltip: "Add friend",
                        className:
                          "border-muted-foreground/25 bg-muted/70 text-muted-foreground",
                      };
            const RelationIcon = relationMeta.icon;

            return (
              <Link
                key={friend.id}
                href={`/u/${friend.username}`}
                className={`pressable flex items-center justify-between gap-3 rounded-xl border bg-card/70 p-3 shadow-sm transition-colors hover:bg-accent/40 active:bg-accent/55 ${
                  isCurrentUser ? "border-primary/40 bg-primary/5 hover:bg-primary/10" : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={friend.image ?? undefined} alt={friendDisplayName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {friendDisplayName}
                      {isCurrentUser && (
                        <span className="ml-2 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          You
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">@{friend.username}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isCurrentUser && (
                    <span className="shrink-0 text-xs font-medium text-primary">My profile</span>
                  )}
                  {!isCurrentUser && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${relationMeta.className}`}
                        >
                          <RelationIcon className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top">{relationMeta.tooltip}</TooltipContent>
                    </Tooltip>
                  )}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${visibility.className}`}
                      >
                        <VisibilityIcon className="h-3.5 w-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">{visibility.label}</TooltipContent>
                  </Tooltip>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
