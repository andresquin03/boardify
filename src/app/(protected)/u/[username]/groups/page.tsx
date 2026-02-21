import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Globe,
  Lock,
  Mail,
  Network,
  Plus,
  SendHorizontal,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FormPendingButton } from "@/components/ui/form-pending-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { auth } from "@/lib/auth";
import { GROUP_COLOR_CONFIG } from "@/lib/group-colors";
import { prisma } from "@/lib/prisma";
import { GROUP_ICON_MAP } from "@/lib/group-icons";
import type { GroupColor, GroupVisibility } from "@/generated/prisma/client";
import { cn } from "@/lib/utils";
import { markNotificationsSeenByScopes, NOTIFICATION_SCOPE } from "@/lib/notifications";
import {
  acceptGroupJoinRequest,
  cancelGroupInvitation,
  cancelGroupJoinRequest,
  rejectGroupJoinRequest,
} from "@/lib/actions";

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

  if (isOwner) {
    await markNotificationsSeenByScopes(viewerId, [NOTIFICATION_SCOPE.GROUP]);
  }

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
          members: {
            where: { userId: viewerId },
            select: { id: true },
          },
          _count: { select: { members: true } },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  const [sentGroupInvitations, sentJoinRequests, adminPendingJoinRequests] = isOwner
    ? await Promise.all([
        prisma.groupInvitation.findMany({
          where: {
            inviterId: viewerId,
            status: "PENDING",
          },
          include: {
            group: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
            invitee: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.groupJoinRequest.findMany({
          where: {
            requesterId: viewerId,
            status: "PENDING",
          },
          include: {
            group: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
        prisma.groupJoinRequest.findMany({
          where: {
            status: "PENDING",
            group: {
              members: {
                some: {
                  userId: viewerId,
                  role: "ADMIN",
                },
              },
            },
          },
          include: {
            group: {
              select: {
                id: true,
                slug: true,
                name: true,
              },
            },
            requester: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        }),
      ])
    : [[], [], []];

  const displayName = targetUser.name ?? targetUser.username ?? "User";
  const createGroupCta =
    groups.length === 0 ? "Create your first group!" : "Create group";
  const hasSentGroupRequests =
    sentGroupInvitations.length > 0 || sentJoinRequests.length > 0;
  const hasIncomingGroupRequests = adminPendingJoinRequests.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 pb-24">
      <Link
        href={`/u/${targetUser.username}`}
        className="pressable inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to profile
      </Link>

      <div className="group mt-4 flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-sky-500 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
          <Network className="h-4.5 w-4.5 transition-all duration-300 motion-safe:animate-[pulse_2.8s_ease-in-out_infinite] group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95" />
        </span>
        <h1 className="text-2xl font-bold">
          {isOwner ? "My groups" : `${displayName}\u2019s groups`}
        </h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {groups.length} {groups.length === 1 ? "group" : "groups"}
      </p>

      {isOwner && hasSentGroupRequests && (
        <section className="mt-6 space-y-4">
          <div className="rounded-xl border bg-card/70 p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <SendHorizontal className="h-4 w-4 text-sky-500" />
              Sent requests
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Invitations you sent and join requests you submitted.
            </p>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {sentGroupInvitations.length > 0 && (
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-sm font-medium">
                    Group invitations sent
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {sentGroupInvitations.length}
                    </span>
                  </p>
                  <div className="mt-2 space-y-2">
                    {sentGroupInvitations.map((invitation) => {
                      const inviteeName = invitation.invitee.name ?? invitation.invitee.username ?? "User";
                      return (
                        <div
                          key={invitation.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 bg-background/65 px-2.5 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm">
                              <Link href={`/groups/${invitation.group.slug}`} className="font-medium hover:underline">
                                {invitation.group.name}
                              </Link>{" "}
                              <span className="text-muted-foreground">for {inviteeName}</span>
                            </p>
                          </div>
                          <form action={cancelGroupInvitation.bind(null, invitation.id)}>
                            <FormPendingButton
                              type="submit"
                              variant="outline"
                              size="sm"
                              pendingText="Cancelling..."
                              className="cursor-pointer gap-1"
                            >
                              <X className="h-3.5 w-3.5" />
                              Cancel
                            </FormPendingButton>
                          </form>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {sentJoinRequests.length > 0 && (
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-sm font-medium">
                    Join requests sent
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {sentJoinRequests.length}
                    </span>
                  </p>
                  <div className="mt-2 space-y-2">
                    {sentJoinRequests.map((request) => (
                      <div
                        key={request.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 bg-background/65 px-2.5 py-2"
                      >
                        <p className="truncate text-sm">
                          <Link href={`/groups/${request.group.slug}`} className="font-medium hover:underline">
                            {request.group.name}
                          </Link>
                        </p>
                        <form action={cancelGroupJoinRequest.bind(null, request.id)}>
                          <FormPendingButton
                            type="submit"
                            variant="outline"
                            size="sm"
                            pendingText="Cancelling..."
                            className="cursor-pointer gap-1"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </FormPendingButton>
                        </form>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {isOwner && hasIncomingGroupRequests && (
        <section className="mt-6 rounded-xl border bg-card/70 p-4 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Mail className="h-4 w-4 text-amber-500" />
            Requests to your groups
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {adminPendingJoinRequests.length}
            </span>
          </h2>
          <div className="mt-3 space-y-2">
            {adminPendingJoinRequests.map((request) => {
              const requesterName = request.requester.name ?? request.requester.username ?? "User";
              return (
                <div
                  key={request.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={request.requester.image ?? undefined} alt={requesterName} />
                      <AvatarFallback>
                        {requesterName
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{requesterName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        wants to join{" "}
                        <Link href={`/groups/${request.group.slug}`} className="hover:underline">
                          {request.group.name}
                        </Link>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <form action={acceptGroupJoinRequest.bind(null, request.id)}>
                      <FormPendingButton
                        type="submit"
                        variant="outline"
                        size="sm"
                        pendingText="Accepting..."
                        className="cursor-pointer gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Accept
                      </FormPendingButton>
                    </form>
                    <form action={rejectGroupJoinRequest.bind(null, request.id)}>
                      <FormPendingButton
                        type="submit"
                        variant="outline"
                        size="sm"
                        pendingText="Rejecting..."
                        className="cursor-pointer gap-1"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </FormPendingButton>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {groups.length === 0 ? (
        <section className="mt-6 rounded-xl border bg-card/70 p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Network className="h-4 w-4" />
            No groups yet.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isOwner
              ? "Browse groups to join one, or create your own."
              : `${displayName} hasn\u2019t joined any groups yet.`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/groups"
              className="pressable inline-flex items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent/60 active:bg-accent/75"
            >
              <Network className="h-3.5 w-3.5" />
              Browse groups
            </Link>
            {isOwner && (
              <Link
                href="/groups/new"
                className="pressable inline-flex items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent/60 active:bg-accent/75"
              >
                <Plus className="h-3.5 w-3.5" />
                Create group
              </Link>
            )}
          </div>
        </section>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map(({ group }) => {
            const IconComponent = GROUP_ICON_MAP[group.icon];
            const vis = visibilityConfig[group.visibility as GroupVisibility];
            const colorConfig = GROUP_COLOR_CONFIG[group.color as GroupColor];
            const VisibilityIcon = vis.icon;
            const isViewerMember = group.members.length > 0;

            return (
              <Link
                key={group.id}
                href={`/groups/${group.slug}`}
                className={cn(
                  "pressable flex flex-col gap-3 rounded-xl p-4 shadow-sm transition-colors",
                  isViewerMember
                    ? "border border-emerald-400/30 bg-emerald-500/[0.06] hover:border-emerald-400/45 hover:bg-emerald-500/[0.11]"
                    : "border bg-card/70 hover:bg-accent/40",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/50 ${colorConfig.iconClassName}`}
                  >
                    <IconComponent className="h-5 w-5" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isViewerMember && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                            <UserCheck className="h-3.5 w-3.5" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">You are a member</TooltipContent>
                      </Tooltip>
                    )}
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
              </Link>
            );
          })}
        </div>
      )}

      {isOwner && (
        <Link
          href="/groups/new"
          className="pressable fixed right-6 bottom-[max(2rem,calc(env(safe-area-inset-bottom)+4.75rem))] z-50 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/35 transition-colors hover:bg-emerald-500 active:bg-emerald-700 sm:right-8"
        >
          <Plus className="h-4 w-4" />
          {createGroupCta}
        </Link>
      )}
    </div>
  );
}
