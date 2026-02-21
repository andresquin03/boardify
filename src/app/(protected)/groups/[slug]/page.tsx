import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CalendarDays,
  Check,
  Globe,
  LibraryBig,
  Lock,
  Mail,
  Network,
  Users,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FormPendingButton } from "@/components/ui/form-pending-button";
import { auth } from "@/lib/auth";
import { GROUP_COLOR_CONFIG } from "@/lib/group-colors";
import { GROUP_ICON_MAP } from "@/lib/group-icons";
import { markGroupNotificationsSeen } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import type { GroupColor, GroupVisibility } from "@/generated/prisma/client";
import { GroupActionsMenu } from "@/components/groups/group-actions-menu";
import { GroupOwnedGameCard } from "@/components/groups/group-owned-game-card";
import { MemberActionsMenu } from "@/components/groups/member-actions-menu";
import { ShareIconButton } from "@/components/ui/share-icon-button";
import { AddMembersPopup } from "@/components/groups/add-members-popup";
import {
  acceptGroupInvitation,
  acceptGroupJoinRequest,
  cancelGroupInvitation,
  cancelGroupJoinRequest,
  joinPublicGroup,
  rejectGroupInvitation,
  rejectGroupJoinRequest,
  requestToJoinGroup,
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

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const viewerId = session.user.id;

  const { slug } = await params;

  const group = await prisma.group.findUnique({
    where: { slug },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      },
      _count: { select: { members: true } },
    },
  });

  if (!group) {
    const legacy = await prisma.groupSlug.findUnique({
      where: { slug },
      select: {
        group: {
          select: { slug: true },
        },
      },
    });

    if (legacy) {
      redirect(`/groups/${legacy.group.slug}`);
    }

    notFound();
  }

  await markGroupNotificationsSeen(viewerId, group.id);

  const IconComponent = GROUP_ICON_MAP[group.icon];
  const colorConfig = GROUP_COLOR_CONFIG[group.color as GroupColor];
  const visibility = visibilityConfig[group.visibility as GroupVisibility];
  const VisibilityIcon = visibility.icon;
  const viewerMembership = group.members.find((member) => member.userId === viewerId);
  const isMember = Boolean(viewerMembership);
  const isAdmin = viewerMembership?.role === "ADMIN";
  const adminCount = group.members.reduce(
    (total, member) => total + (member.role === "ADMIN" ? 1 : 0),
    0,
  );
  const isSoleAdmin = isAdmin && adminCount === 1;
  const memberIds = group.members.map((member) => member.userId);

  const [
    ownedGamesRaw,
    viewerInvitation,
    viewerJoinRequest,
    pendingJoinRequests,
    friendConnections,
    pendingGroupInvitations,
  ] = await Promise.all([
    isMember
      ? prisma.game.findMany({
          where: {
            userGames: {
              some: {
                isOwned: true,
                userId: { in: memberIds },
              },
            },
          },
          include: {
            userGames: {
              where: {
                isOwned: true,
                userId: { in: memberIds },
              },
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    name: true,
                    image: true,
                  },
                },
              },
            },
          },
        })
      : Promise.resolve([]),
    !isMember
      ? prisma.groupInvitation.findUnique({
          where: {
            groupId_inviteeId: {
              groupId: group.id,
              inviteeId: viewerId,
            },
          },
          select: {
            id: true,
            status: true,
          },
        })
      : Promise.resolve(null),
    !isMember
      ? prisma.groupJoinRequest.findUnique({
          where: {
            groupId_requesterId: {
              groupId: group.id,
              requesterId: viewerId,
            },
          },
          select: {
            id: true,
            status: true,
          },
        })
      : Promise.resolve(null),
    isAdmin
      ? prisma.groupJoinRequest.findMany({
          where: {
            groupId: group.id,
            status: "PENDING",
          },
          include: {
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
        })
      : Promise.resolve([]),
    isAdmin
      ? prisma.friendship.findMany({
          where: {
            status: "ACCEPTED",
            OR: [{ requesterId: viewerId }, { addresseeId: viewerId }],
          },
          include: {
            requester: {
              select: { id: true, name: true, username: true, image: true },
            },
            addressee: {
              select: { id: true, name: true, username: true, image: true },
            },
          },
        })
      : Promise.resolve([]),
    isAdmin
      ? prisma.groupInvitation.findMany({
          where: {
            groupId: group.id,
            status: "PENDING",
          },
          include: {
            inviter: {
              select: {
                id: true,
                name: true,
                username: true,
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
        })
      : Promise.resolve([]),
  ]);

  const ownedGames = ownedGamesRaw
    .map((game) => ({
      id: game.id,
      slug: game.slug,
      title: game.title,
      minPlayers: game.minPlayers,
      maxPlayers: game.maxPlayers,
      minPlaytime: game.minPlaytime,
      maxPlaytime: game.maxPlaytime,
      image: game.image,
      owners: game.userGames
        .map((item) => item.user)
        .sort((a, b) =>
          getUserDisplayName(a).localeCompare(getUserDisplayName(b), undefined, {
            sensitivity: "base",
          }),
        ),
    }))
    .sort((a, b) => {
      const ownerDiff = b.owners.length - a.owners.length;
      if (ownerDiff !== 0) return ownerDiff;
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    });

  const pendingInvitation =
    viewerInvitation?.status === "PENDING" ? viewerInvitation : null;
  const pendingOwnJoinRequest =
    viewerJoinRequest?.status === "PENDING" ? viewerJoinRequest : null;
  const hasPendingInvitation = pendingInvitation !== null;
  const pendingJoinRequesterIds = new Set(
    pendingJoinRequests.map((request) => request.requester.id),
  );
  const pendingInvitationInviteeIds = new Set(
    pendingGroupInvitations.map((invitation) => invitation.inviteeId),
  );
  const sentInvitations = pendingGroupInvitations;

  const invitableFriends = isAdmin
    ? friendConnections
        .map((friendship) =>
          friendship.requesterId === viewerId ? friendship.addressee : friendship.requester,
        )
        .filter(
          (friend, index, list) =>
            friend.id !== viewerId &&
            !memberIds.includes(friend.id) &&
            !pendingInvitationInviteeIds.has(friend.id) &&
            !pendingJoinRequesterIds.has(friend.id) &&
            list.findIndex((candidate) => candidate.id === friend.id) === index,
        )
        .sort((a, b) =>
          getUserDisplayName(a).localeCompare(getUserDisplayName(b), undefined, {
            sensitivity: "base",
          }),
        )
    : [];

  const membershipBadgeLabel = isMember ? "Joined" : "Not joined";
  const createdAtLabel = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
    group.createdAt,
  );
  const pendingOwnJoinRequestId = pendingOwnJoinRequest?.id ?? null;
  const showRequestToJoinBubble =
    !isMember &&
    group.visibility === "INVITATION" &&
    !hasPendingInvitation &&
    !pendingOwnJoinRequest;
  const showCancelRequestBubble =
    !isMember &&
    !hasPendingInvitation &&
    pendingOwnJoinRequestId !== null;
  const showJoinGroupBubble = !isMember && group.visibility === "PUBLIC";
  const showPendingInvitationBubble = !isMember && hasPendingInvitation && !showJoinGroupBubble;
  const showBottomInviteActions = hasPendingInvitation && !showJoinGroupBubble;
  const showBottomPrivateNotice =
    group.visibility === "PRIVATE" && !showCancelRequestBubble && !hasPendingInvitation;
  const showBottomNonMemberActions = !isMember && (showBottomInviteActions || showBottomPrivateNotice);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link
        href="/groups"
        className="pressable inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Network className="h-4 w-4" />
        Back to groups
      </Link>

      <div className="mt-4 rounded-2xl border bg-card/70 p-4 shadow-sm sm:p-6">
        <div className="sm:hidden">
          <div className="flex flex-col items-center text-center">
            <span
              className={`inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-muted/50 ${colorConfig.iconClassName}`}
            >
              <IconComponent className="h-9 w-9" />
            </span>
            <h1 className="mt-3 break-words text-4xl font-bold leading-tight">{group.name}</h1>
            {group.description && (
              <p className="mt-1 text-lg text-muted-foreground">{group.description}</p>
            )}
            <span
              className={`mt-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium ${visibility.className}`}
            >
              <VisibilityIcon className="h-4 w-4" />
              {visibility.label}
            </span>
          </div>

          <div className="mt-5 border-t border-border/60 pt-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/30 px-3 py-1.5 text-base text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              {createdAtLabel}
            </span>
            <div className="mt-3 space-y-2">
              <div>
                {showJoinGroupBubble ? (
                  <form action={joinPublicGroup.bind(null, group.id)} className="w-full">
                    <FormPendingButton
                      type="submit"
                      variant="outline"
                      size="sm"
                      pendingText="Joining..."
                      className="h-11 w-full justify-center gap-1.5 rounded-full border-border/70 bg-muted/40 px-4 text-base font-semibold text-foreground hover:bg-muted/55"
                    >
                      <Users className="h-4 w-4" />
                      Join group
                    </FormPendingButton>
                  </form>
                ) : showRequestToJoinBubble ? (
                  <form action={requestToJoinGroup.bind(null, group.id)} className="w-full">
                    <FormPendingButton
                      type="submit"
                      variant="outline"
                      size="sm"
                      pendingText="Sending..."
                      className="h-11 w-full justify-center gap-1.5 rounded-full border-amber-400/40 bg-amber-500/10 px-4 text-base font-semibold text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                    >
                      <Mail className="h-4 w-4" />
                      Request to join
                    </FormPendingButton>
                  </form>
                ) : showCancelRequestBubble ? (
                  <form
                    action={cancelGroupJoinRequest.bind(null, pendingOwnJoinRequestId!)}
                    className="w-full"
                  >
                    <FormPendingButton
                      type="submit"
                      variant="outline"
                      size="sm"
                      pendingText="Cancelling..."
                      className="h-11 w-full justify-center gap-1.5 rounded-full border-border/70 bg-muted/40 px-4 text-base font-semibold text-muted-foreground hover:bg-muted/55"
                    >
                      <X className="h-4 w-4" />
                      Cancel request
                    </FormPendingButton>
                  </form>
                ) : showPendingInvitationBubble ? (
                  <span className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 text-base font-semibold text-amber-600 dark:text-amber-400">
                    <Mail className="h-4 w-4" />
                    Invitation pending
                  </span>
                ) : (
                  <span
                    className={`inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full border px-4 text-base font-semibold ${
                      isMember
                        ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-border/70 bg-muted/40 text-muted-foreground"
                    }`}
                  >
                    {isMember ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    {membershipBadgeLabel}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border border-sky-400/35 bg-sky-500/10 px-4 text-base font-semibold text-sky-600 dark:text-sky-400">
                  <Users className="h-4 w-4" />
                  {group._count.members}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <ShareIconButton
                    path={`/groups/${group.slug}`}
                    message={isMember ? "Join my Boardify group:" : "Check out this Boardify group:"}
                    tooltipLabel="Share group"
                    ariaLabel="Share group"
                    className="size-11 rounded-full"
                  />
                  {isMember && (
                    <GroupActionsMenu
                      groupId={group.id}
                      groupSlug={group.slug}
                      isMember={isMember}
                      isAdmin={isAdmin}
                      isSoleAdmin={isSoleAdmin}
                      triggerClassName="size-11 rounded-full"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hidden sm:block">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/50 ${colorConfig.iconClassName}`}
              >
                <IconComponent className="h-6 w-6" />
              </span>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <h1 className="min-w-0 truncate text-2xl font-bold">{group.name}</h1>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${visibility.className}`}
                  >
                    <VisibilityIcon className="h-3.5 w-3.5" />
                    {visibility.label}
                  </span>
                </div>
                {group.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <ShareIconButton
                path={`/groups/${group.slug}`}
                message={isMember ? "Join my Boardify group:" : "Check out this Boardify group:"}
                tooltipLabel="Share group"
                ariaLabel="Share group"
              />
              <GroupActionsMenu
                groupId={group.id}
                groupSlug={group.slug}
                isMember={isMember}
                isAdmin={isAdmin}
                isSoleAdmin={isSoleAdmin}
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/30 px-3 py-1.5 text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              Created {createdAtLabel}
            </span>
            <div className="flex items-center gap-1.5 sm:ml-auto">
              {showJoinGroupBubble ? (
                <form action={joinPublicGroup.bind(null, group.id)}>
                  <FormPendingButton
                    type="submit"
                    variant="outline"
                    size="sm"
                    pendingText="Joining..."
                    className="h-10 gap-1.5 rounded-full border-border/70 bg-muted/40 px-3.5 text-base font-medium text-foreground hover:bg-muted/55"
                  >
                    <Users className="h-4 w-4" />
                    Join group
                  </FormPendingButton>
                </form>
              ) : showRequestToJoinBubble ? (
                <form action={requestToJoinGroup.bind(null, group.id)}>
                  <FormPendingButton
                    type="submit"
                    variant="outline"
                    size="sm"
                    pendingText="Sending..."
                    className="h-10 gap-1.5 rounded-full border-amber-400/40 bg-amber-500/10 px-3.5 text-base font-medium text-amber-600 hover:bg-amber-500/20 dark:text-amber-400"
                  >
                    <Mail className="h-4 w-4" />
                    Request to join
                  </FormPendingButton>
                </form>
              ) : showCancelRequestBubble ? (
                <form action={cancelGroupJoinRequest.bind(null, pendingOwnJoinRequestId!)}>
                  <FormPendingButton
                    type="submit"
                    variant="outline"
                    size="sm"
                    pendingText="Cancelling..."
                    className="h-10 gap-1.5 rounded-full border-border/70 bg-muted/40 px-3.5 text-base font-medium text-muted-foreground hover:bg-muted/55"
                  >
                    <X className="h-4 w-4" />
                    Cancel request
                  </FormPendingButton>
                </form>
              ) : showPendingInvitationBubble ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-3.5 py-1.5 text-base font-medium text-amber-600 dark:text-amber-400">
                  <Mail className="h-4 w-4" />
                  Invitation pending
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-base font-medium ${
                    isMember
                      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-border/70 bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {isMember ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  {membershipBadgeLabel}
                </span>
              )}
              <span className="inline-flex min-w-9 items-center justify-center gap-1.5 rounded-full border border-sky-400/35 bg-sky-500/10 px-3.5 py-1.5 text-base font-semibold text-sky-600 dark:text-sky-400">
                <Users className="h-4 w-4" />
                {group._count.members}
              </span>
            </div>
          </div>
        </div>

        {showBottomNonMemberActions && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {showBottomInviteActions ? (
              <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:justify-start">
                <form action={acceptGroupInvitation.bind(null, pendingInvitation.id)}>
                  <FormPendingButton
                    type="submit"
                    variant="outline"
                    size="sm"
                    pendingText="Accepting..."
                    className="cursor-pointer gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Accept invitation
                  </FormPendingButton>
                </form>
                <form action={rejectGroupInvitation.bind(null, pendingInvitation.id)}>
                  <FormPendingButton
                    type="submit"
                    variant="outline"
                    size="sm"
                    pendingText="Rejecting..."
                    className="cursor-pointer gap-1 border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive dark:hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                    Reject invitation
                  </FormPendingButton>
                </form>
              </div>
            ) : showBottomPrivateNotice ? (
              <p className="text-sm text-muted-foreground">
                This group is private. Ask an admin for an invitation.
              </p>
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border bg-card/70 p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Members</h2>

        {group.members.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No members yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {group.members.map((member) => {
              const displayName = getUserDisplayName(member.user);
              const canManageMember =
                isAdmin && member.role === "MEMBER" && member.userId !== viewerId;

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/25 px-3 py-2"
                >
                  <Link
                    href={member.user.username ? `/u/${member.user.username}` : "/onboarding"}
                    className="pressable min-w-0 flex items-center gap-2.5 transition-colors hover:opacity-80 active:opacity-70"
                  >
                    <Avatar>
                      <AvatarImage src={member.user.image ?? undefined} alt={displayName} />
                      <AvatarFallback>{getUserInitials(displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{displayName}</p>
                      {member.user.username && (
                        <p className="truncate text-xs text-muted-foreground">
                          @{member.user.username}
                        </p>
                      )}
                    </div>
                  </Link>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                        member.role === "ADMIN"
                          ? "border-amber-400/40 bg-amber-500/10 text-amber-500 dark:text-amber-400"
                          : "border-border/70 bg-background text-muted-foreground"
                      }`}
                    >
                      {member.role === "ADMIN" ? "Admin" : "Member"}
                    </span>
                    {canManageMember && (
                      <MemberActionsMenu
                        groupId={group.id}
                        memberId={member.userId}
                        memberDisplayName={displayName}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {isAdmin && (
          <div className="mt-6 border-t border-border/60 pt-4">
            {pendingJoinRequests.length > 0 && (
              <>
                <h3 className="text-sm font-semibold">Join requests</h3>
                <div className="mt-3 space-y-2.5">
                  {pendingJoinRequests.map((request) => {
                    const displayName = getUserDisplayName(request.requester);
                    return (
                      <div
                        key={request.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/25 px-3 py-2"
                      >
                        <Link
                          href={
                            request.requester.username
                              ? `/u/${request.requester.username}`
                              : "/onboarding"
                          }
                          className="pressable min-w-0 flex items-center gap-2.5 transition-colors hover:opacity-80 active:opacity-70"
                        >
                          <Avatar>
                            <AvatarImage
                              src={request.requester.image ?? undefined}
                              alt={displayName}
                            />
                            <AvatarFallback>{getUserInitials(displayName)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{displayName}</p>
                            {request.requester.username && (
                              <p className="truncate text-xs text-muted-foreground">
                                @{request.requester.username}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Requested {formatTimestamp(request.createdAt)}
                            </p>
                          </div>
                        </Link>

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
                              className="cursor-pointer gap-1 border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive dark:hover:text-destructive"
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
              </>
            )}

            {sentInvitations.length > 0 && (
              <>
                <h3 className={`${pendingJoinRequests.length > 0 ? "mt-6" : ""} text-sm font-semibold`}>
                  Sent invitations
                </h3>
                <div className="mt-3 space-y-2.5">
                  {sentInvitations.map((invitation) => {
                    const displayName = getUserDisplayName(invitation.invitee);
                    const inviterDisplayName = getUserDisplayName(invitation.inviter);
                    const canCancelInvitation = invitation.inviterId === viewerId;
                    return (
                      <div
                        key={invitation.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/25 px-3 py-2"
                      >
                        <Link
                          href={
                            invitation.invitee.username
                              ? `/u/${invitation.invitee.username}`
                              : "/onboarding"
                          }
                          className="pressable min-w-0 flex items-center gap-2.5 transition-colors hover:opacity-80 active:opacity-70"
                        >
                          <Avatar>
                            <AvatarImage
                              src={invitation.invitee.image ?? undefined}
                              alt={displayName}
                            />
                            <AvatarFallback>{getUserInitials(displayName)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{displayName}</p>
                            {invitation.invitee.username && (
                              <p className="truncate text-xs text-muted-foreground">
                                @{invitation.invitee.username}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Sent {formatTimestamp(invitation.createdAt)} by {inviterDisplayName}
                            </p>
                          </div>
                        </Link>

                        <div className="flex w-full justify-center sm:w-auto sm:justify-end">
                          {canCancelInvitation ? (
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
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-border/70 bg-background px-2 py-0.5 text-xs text-muted-foreground">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            <div className={`${pendingJoinRequests.length > 0 || sentInvitations.length > 0 ? "mt-6" : "mt-2"} flex justify-center`}>
              <AddMembersPopup groupId={group.id} friends={invitableFriends} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border bg-card/70 p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <LibraryBig className="h-4.5 w-4.5 text-emerald-500" />
          <h2 className="text-lg font-semibold">Group library</h2>
        </div>

        {!isMember ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Join this group to see which games members own.
          </p>
        ) : ownedGames.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No owned games in this group yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {ownedGames.map((game) => (
              <GroupOwnedGameCard
                key={game.id}
                game={game}
                owners={game.owners}
                memberCount={group._count.members}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function getUserDisplayName(user: { name: string | null; username: string | null }) {
  return user.name ?? user.username ?? "User";
}

function getUserInitials(displayName: string) {
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTimestamp(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}
