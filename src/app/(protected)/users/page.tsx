import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CircleHelp,
  Clock3,
  Globe,
  Lock,
  Search,
  UserCheck,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface UsersPageProps {
  searchParams: Promise<{
    q?: string | string[];
  }>;
}

function normalizeSingleValue(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

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

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=%2Fusers");
  const viewerId = session.user.id;

  const params = await searchParams;
  const query = normalizeSingleValue(params.q).trim();

  const acceptedFriendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: viewerId }, { addresseeId: viewerId }],
    },
    select: { requesterId: true, addresseeId: true },
  });

  const friendIds = new Set<string>();
  for (const friendship of acceptedFriendships) {
    friendIds.add(
      friendship.requesterId === viewerId ? friendship.addresseeId : friendship.requesterId,
    );
  }
  const friendIdsList = [...friendIds];

  const relations = await prisma.friendship.findMany({
    where: {
      status: { in: ["ACCEPTED", "PENDING"] },
      OR: [{ requesterId: viewerId }, { addresseeId: viewerId }],
    },
    select: {
      requesterId: true,
      addresseeId: true,
      status: true,
    },
  });

  const relationStateByUserId = new Map<
    string,
    "FRIEND" | "PENDING_SENT" | "PENDING_RECEIVED"
  >();
  for (const relation of relations) {
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

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { username: { not: null } },
        {
          OR: [
            { id: viewerId },
            { visibility: { not: "PRIVATE" } },
            { id: { in: friendIdsList } },
          ],
        },
        ...(query
          ? [
              {
                OR: [
                  { username: { contains: query, mode: "insensitive" as const } },
                  { name: { contains: query, mode: "insensitive" as const } },
                ],
              },
            ]
          : []),
      ],
    },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      visibility: true,
    },
    orderBy: [{ username: "asc" }],
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="group flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-violet-500 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
          <Users className="h-4.5 w-4.5 transition-all duration-300 motion-safe:animate-[pulse_2.8s_ease-in-out_infinite] group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95" />
        </span>
        <h1 className="text-2xl font-bold">Users</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Find players by name or username.
      </p>

      <form className="mt-5 flex flex-col gap-2 sm:flex-row" method="get">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={query}
            placeholder="Search users..."
            className="pl-9"
            maxLength={50}
          />
        </div>
        <Button type="submit" className="cursor-pointer">
          Search
        </Button>
        {query && (
          <Button asChild type="button" variant="ghost" className="cursor-pointer">
            <Link href="/users">Clear</Link>
          </Button>
        )}
      </form>

      <p className="mt-4 text-sm text-muted-foreground">
        {users.length} {users.length === 1 ? "user" : "users"} found
      </p>

      {users.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No users match your search.</p>
      ) : (
        <div className="mt-4 grid gap-2">
          {users.map((user) => {
            const isCurrentUser = user.id === viewerId;
            const relationState = relationStateByUserId.get(user.id) ?? "NONE";
            const displayName = user.name ?? user.username ?? "User";
            const initials = displayName
              .split(" ")
              .map((part) => part[0])
              .join("")
              .toUpperCase();
            const visibilityKey =
              user.visibility === "FRIENDS"
                ? "FRIENDS"
                : user.visibility === "PRIVATE"
                  ? "PRIVATE"
                  : "PUBLIC";
            const visibility = visibilityConfig[visibilityKey];
            const VisibilityIcon = visibility.icon;

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
                key={user.id}
                href={`/u/${user.username}`}
                className={`pressable flex items-center justify-between gap-3 rounded-xl border bg-card/70 p-3 shadow-sm transition-colors hover:bg-accent/40 active:bg-accent/55 ${
                  isCurrentUser ? "border-primary/40 bg-primary/5 hover:bg-primary/10" : ""
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.image ?? undefined} alt={displayName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {displayName}
                      {isCurrentUser && (
                        <span className="ml-2 rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                          You
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
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
