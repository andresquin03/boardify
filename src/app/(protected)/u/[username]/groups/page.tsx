import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Globe, Lock, Mail, Network, Users } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GROUP_ICON_MAP } from "@/lib/group-icons";
import type { GroupVisibility } from "@/generated/prisma/client";

const visibilityConfig = {
  PUBLIC: {
    label: "Public group",
    icon: Globe,
    className: "border-sky-400/30 bg-sky-500/10 text-sky-500 dark:text-sky-400",
  },
  INVITATION: {
    label: "Invitation only",
    icon: Mail,
    className: "border-amber-400/30 bg-amber-500/10 text-amber-500 dark:text-amber-400",
  },
  PRIVATE: {
    label: "Private group",
    icon: Lock,
    className: "border-violet-400/30 bg-violet-500/10 text-violet-500 dark:text-violet-400",
  },
} as const;

export default async function UserGroupsPage({
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
    select: { id: true, name: true, username: true, visibility: true },
  });

  if (!targetUser) notFound();

  const isOwner = viewerId === targetUser.id;

  if (!isOwner) {
    const isFriend = Boolean(
      await prisma.friendship.findFirst({
        where: {
          status: "ACCEPTED",
          OR: [
            { requesterId: viewerId, addresseeId: targetUser.id },
            { requesterId: targetUser.id, addresseeId: viewerId },
          ],
        },
        select: { id: true },
      }),
    );

    if (!isFriend) {
      redirect(`/u/${username}`);
    }
  }

  const groups = await prisma.groupMember.findMany({
    where: { userId: targetUser.id },
    include: {
      group: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const displayName = targetUser.name ?? targetUser.username ?? "User";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-sky-500 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
          <Network className="h-4.5 w-4.5 motion-safe:animate-[pulse_2.8s_ease-in-out_infinite]" />
        </span>
        <h1 className="text-2xl font-bold">
          {isOwner ? "My groups" : `${displayName}\u2019s groups`}
        </h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {groups.length} {groups.length === 1 ? "group" : "groups"}
      </p>

      {groups.length === 0 ? (
        <div className="mt-6 flex flex-col items-start gap-3">
          <p className="text-sm text-muted-foreground">
            {isOwner ? "You haven\u2019t joined any groups yet." : "No groups yet."}
          </p>
          {isOwner && (
            <Link
              href="/groups"
              className="pressable inline-flex items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent/60 active:bg-accent/75"
            >
              <Network className="h-3.5 w-3.5" />
              Browse groups
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map(({ group }) => {
            const IconComponent = GROUP_ICON_MAP[group.icon];
            const vis = visibilityConfig[group.visibility as GroupVisibility];
            const VisibilityIcon = vis.icon;

            return (
              <div
                key={group.id}
                className="flex flex-col gap-3 rounded-xl border bg-card/70 p-4 shadow-sm transition-colors hover:bg-accent/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/50 text-foreground">
                    <IconComponent className="h-5 w-5" />
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${vis.className}`}
                      >
                        <VisibilityIcon className="h-3.5 w-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top">{vis.label}</TooltipContent>
                  </Tooltip>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{group.name}</p>
                  {group.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {group.description}
                    </p>
                  )}
                </div>

                <div className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>
                    {group._count.members}{" "}
                    {group._count.members === 1 ? "member" : "members"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
