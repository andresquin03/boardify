import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
  acceptGroupInvitation,
  acceptGroupJoinRequest,
  cancelGroupInvitation,
  cancelGroupJoinRequest,
  rejectGroupInvitation,
  rejectGroupJoinRequest,
} from "@/lib/actions";

export default async function UserGroupsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const t = await getTranslations("UserProfileGroupsPage");
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

  const [sentGroupInvitations, sentJoinRequests, receivedGroupInvitations, adminPendingJoinRequests] =
    isOwner
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
        prisma.groupInvitation.findMany({
          where: {
            inviteeId: viewerId,
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
            inviter: {
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
    : [[], [], [], []];

  const displayName = targetUser.name ?? targetUser.username ?? t("fallbackUser");
  const fallbackUserName = t("fallbackUser");
  const visibilityConfig = {
    PUBLIC: {
      label: t("visibility.public"),
      icon: Globe,
      className: "border-sky-400/30 bg-sky-500/10 text-sky-500 dark:text-sky-400",
    },
    INVITATION: {
      label: t("visibility.invitation"),
      icon: Mail,
      className: "border-amber-400/30 bg-amber-500/10 text-amber-500 dark:text-amber-400",
    },
    PRIVATE: {
      label: t("visibility.private"),
      icon: Lock,
      className: "border-violet-400/30 bg-violet-500/10 text-violet-500 dark:text-violet-400",
    },
  } as const;
  const createGroupCta =
    groups.length === 0 ? t("actions.createFirstGroup") : t("actions.createGroup");
  const hasSentGroupRequests =
    sentGroupInvitations.length > 0 || sentJoinRequests.length > 0;
  const hasIncomingGroupRequests =
    receivedGroupInvitations.length > 0 || adminPendingJoinRequests.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 pb-24">
      <Link
        href={`/u/${targetUser.username}`}
        className="pressable inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToProfile")}
      </Link>

      <div className="group mt-4 flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-sky-500 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
          <Network className="h-4.5 w-4.5 transition-all duration-300 motion-safe:animate-[pulse_2.8s_ease-in-out_infinite] group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95" />
        </span>
        <h1 className="text-2xl font-bold">
          {isOwner ? t("titleOwn") : t("titleOther", { name: displayName })}
        </h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("results", { count: groups.length })}
      </p>

      {isOwner && hasSentGroupRequests && (
        <section className="mt-6 space-y-4">
          <div className="rounded-xl border bg-card/70 p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <SendHorizontal className="h-4 w-4 text-sky-500" />
              {t("sentRequests.title")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("sentRequests.description")}
            </p>

            <div className="mt-3 grid gap-3">
              {sentGroupInvitations.length > 0 && (
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-sm font-medium">
                    {t("sentRequests.invitesTitle")}
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {sentGroupInvitations.length}
                    </span>
                  </p>
                  <div className="mt-2 space-y-2">
                    {sentGroupInvitations.map((invitation) => {
                      const inviteeName = invitation.invitee.name ?? invitation.invitee.username ?? fallbackUserName;
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
                              <span className="text-muted-foreground">{t("sentRequests.forUser", { name: inviteeName })}</span>
                            </p>
                          </div>
                          <div className="flex w-full justify-center sm:w-auto sm:justify-end">
                            <form action={cancelGroupInvitation.bind(null, invitation.id)}>
                              <FormPendingButton
                                type="submit"
                                variant="outline"
                                size="sm"
                                pendingText={t("actions.pendingCancelling")}
                                className="cursor-pointer gap-1"
                              >
                                <X className="h-3.5 w-3.5" />
                                {t("actions.cancel")}
                              </FormPendingButton>
                            </form>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {sentJoinRequests.length > 0 && (
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-sm font-medium">
                    {t("sentRequests.joinRequestsTitle")}
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
                        <div className="flex w-full justify-center sm:w-auto sm:justify-end">
                          <form action={cancelGroupJoinRequest.bind(null, request.id)}>
                            <FormPendingButton
                              type="submit"
                              variant="outline"
                              size="sm"
                              pendingText={t("actions.pendingCancelling")}
                              className="cursor-pointer gap-1"
                            >
                              <X className="h-3.5 w-3.5" />
                              {t("actions.cancel")}
                            </FormPendingButton>
                          </form>
                        </div>
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
        <section className="mt-6 space-y-4">
          <div className="rounded-xl border bg-card/70 p-4 shadow-sm">
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Mail className="h-4 w-4 text-amber-500" />
              {t("receivedRequests.title")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("receivedRequests.description")}
            </p>

            <div className="mt-3 grid gap-3">
              {receivedGroupInvitations.length > 0 && (
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-sm font-medium">
                    {t("receivedRequests.groupInvitationsTitle")}
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {receivedGroupInvitations.length}
                    </span>
                  </p>
                  <div className="mt-2 space-y-2">
                    {receivedGroupInvitations.map((invitation) => {
                      const inviterName = invitation.inviter.name ?? invitation.inviter.username ?? fallbackUserName;

                      return (
                        <div
                          key={invitation.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 bg-background/65 px-2.5 py-2"
                        >
                          <p className="truncate text-sm">
                            <Link href={`/groups/${invitation.group.slug}`} className="font-medium hover:underline">
                              {invitation.group.name}
                            </Link>{" "}
                            <span className="text-muted-foreground">{t("receivedRequests.fromUser", { name: inviterName })}</span>
                          </p>
                          <div className="flex w-full items-center justify-center gap-1.5 sm:w-auto sm:justify-end">
                            <form action={acceptGroupInvitation.bind(null, invitation.id)}>
                              <FormPendingButton
                                type="submit"
                                variant="outline"
                                size="sm"
                                pendingText={t("actions.pendingAccepting")}
                                className="cursor-pointer gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                              >
                                <Check className="h-3.5 w-3.5" />
                                {t("actions.accept")}
                              </FormPendingButton>
                            </form>
                            <form action={rejectGroupInvitation.bind(null, invitation.id)}>
                              <FormPendingButton
                                type="submit"
                                variant="outline"
                                size="sm"
                                pendingText={t("actions.pendingRejecting")}
                                className="cursor-pointer gap-1 border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive dark:hover:text-destructive"
                              >
                                <X className="h-3.5 w-3.5" />
                                {t("actions.reject")}
                              </FormPendingButton>
                            </form>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {adminPendingJoinRequests.length > 0 && (
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-sm font-medium">
                    {t("receivedRequests.requestsToYourGroupsTitle")}
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {adminPendingJoinRequests.length}
                    </span>
                  </p>
                  <div className="mt-2 space-y-2">
                    {adminPendingJoinRequests.map((request) => {
                      const requesterName = request.requester.name ?? request.requester.username ?? fallbackUserName;
                      return (
                        <div
                          key={request.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/60 bg-background/65 px-2.5 py-2"
                        >
                          <div className="min-w-0 flex items-center gap-2.5">
                            <Avatar className="h-8 w-8">
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
                                {t("receivedRequests.wantsToJoin")}{" "}
                                <Link href={`/groups/${request.group.slug}`} className="hover:underline">
                                  {request.group.name}
                                </Link>
                              </p>
                            </div>
                          </div>

                          <div className="flex w-full items-center justify-center gap-1.5 sm:w-auto sm:justify-end">
                            <form action={acceptGroupJoinRequest.bind(null, request.id)}>
                              <FormPendingButton
                                type="submit"
                                variant="outline"
                                size="sm"
                                pendingText={t("actions.pendingAccepting")}
                                className="cursor-pointer gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
                              >
                                <Check className="h-3.5 w-3.5" />
                                {t("actions.accept")}
                              </FormPendingButton>
                            </form>
                            <form action={rejectGroupJoinRequest.bind(null, request.id)}>
                              <FormPendingButton
                                type="submit"
                                variant="outline"
                                size="sm"
                                pendingText={t("actions.pendingRejecting")}
                                className="cursor-pointer gap-1 border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive dark:hover:text-destructive"
                              >
                                <X className="h-3.5 w-3.5" />
                                {t("actions.reject")}
                              </FormPendingButton>
                            </form>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {groups.length === 0 ? (
        <section className="mt-6 rounded-xl border bg-card/70 p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Network className="h-4 w-4" />
            {t("empty.title")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isOwner
              ? t("empty.descriptionOwn")
              : t("empty.descriptionOther", { name: displayName })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/groups"
              className="pressable inline-flex items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent/60 active:bg-accent/75"
            >
              <Network className="h-3.5 w-3.5" />
              {t("actions.browseGroups")}
            </Link>
            {isOwner && (
              <Link
                href="/groups/new"
                className="pressable inline-flex items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent/60 active:bg-accent/75"
              >
                <Plus className="h-3.5 w-3.5" />
                {t("actions.createGroup")}
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
                        <TooltipContent side="top">{t("memberBadge")}</TooltipContent>
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
                    {t("membersCount", { count: group._count.members })}
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
