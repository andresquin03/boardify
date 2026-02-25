import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  BellOff,
  BellRing,
  CalendarDays,
  CircleCheckBig,
  Dices,
  Network,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { deleteNotification } from "@/lib/actions";
import { ClearAllNotificationsButton } from "./clear-all-notifications-button";
import {
  countUnreadNotifications,
  listNotifications,
  markAllNotificationsSeen,
  NOTIFICATION_EVENT_KEY,
  NOTIFICATION_SCOPE,
} from "@/lib/notifications";

export default async function NotificationsPage() {
  const t = await getTranslations("NotificationsPage");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?callbackUrl=%2Fnotifications");
  const userId = session.user.id;

  const unreadBeforeVisit = await countUnreadNotifications(userId);
  if (unreadBeforeVisit > 0) {
    await markAllNotificationsSeen(userId);
  }
  const notifications = await listNotifications(userId);
  const hasNotifications = notifications.length > 0;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-2xl flex-col px-4 py-10">
      <div className="group flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-amber-500 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
          <BellRing className="h-4.5 w-4.5 transition-all duration-300 motion-safe:animate-[pulse_2.8s_ease-in-out_infinite] group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95" />
        </span>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        {hasNotifications
          ? t("summary.withCount", { count: notifications.length })
          : t("summary.upToDate")}
      </p>

      {!hasNotifications ? (
        <section className="mt-8 rounded-xl border bg-card/70 p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <BellOff className="h-4 w-4" />
            {t("empty.title")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/users"
              className="pressable inline-flex items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent/60 active:bg-accent/75"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {t("empty.actions.findUsers")}
            </Link>
            <Link
              href="/friends"
              className="pressable inline-flex items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent/60 active:bg-accent/75"
            >
              <UsersRound className="h-3.5 w-3.5" />
              {t("empty.actions.viewFriends")}
            </Link>
            <Link
              href="/games"
              className="pressable inline-flex items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent/60 active:bg-accent/75"
            >
              <Dices className="h-3.5 w-3.5" />
              {t("empty.actions.browseGames")}
            </Link>
          </div>
        </section>
      ) : (
        <section className="mt-8 space-y-2.5">
          {notifications.map((notification) => {
            const details = getNotificationDetails(notification, t);

            return (
              <article
                key={notification.id}
                className="rounded-xl border bg-card/70 p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    {details.actorProfileHref ? (
                      <Link
                        href={details.actorProfileHref}
                        className="pressable inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        aria-label={t("actions.openActorProfile", { name: details.actorDisplayName })}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={notification.actor?.image ?? undefined}
                            alt={details.actorDisplayName}
                          />
                          <AvatarFallback>{details.actorInitials}</AvatarFallback>
                        </Avatar>
                      </Link>
                    ) : (
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={notification.actor?.image ?? undefined}
                          alt={details.actorDisplayName}
                        />
                        <AvatarFallback>{details.actorInitials}</AvatarFallback>
                      </Avatar>
                    )}

                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{details.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {details.message}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {details.href && (
                          <Link
                            href={details.href}
                            className="pressable inline-flex items-center gap-1 rounded-md border border-border/70 bg-card px-2 py-1 text-xs font-medium transition-colors hover:bg-accent/60 active:bg-accent/75"
                          >
                            {notification.eventKey === NOTIFICATION_EVENT_KEY.GROUP_EVENT_CREATED ||
                            notification.eventKey === NOTIFICATION_EVENT_KEY.GROUP_EVENT_UPDATED ||
                            notification.eventKey === NOTIFICATION_EVENT_KEY.GROUP_EVENT_DELETED ? (
                              <CalendarDays className="h-3.5 w-3.5" />
                            ) : details.scope === NOTIFICATION_SCOPE.GROUP ? (
                              <Network className="h-3.5 w-3.5" />
                            ) : (
                              <CircleCheckBig className="h-3.5 w-3.5" />
                            )}
                            {t("actions.open")}
                          </Link>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat(locale, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <form
                    action={deleteNotification.bind(null, notification.id)}
                    className="my-auto"
                  >
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon-sm"
                      className="cursor-pointer text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4.5 w-4.5" />
                      <span className="sr-only">{t("actions.deleteNotification")}</span>
                    </Button>
                  </form>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {hasNotifications && (
        <div className="mt-auto flex justify-end pt-8">
          <ClearAllNotificationsButton />
        </div>
      )}
    </div>
  );
}

type NotificationsList = Awaited<ReturnType<typeof listNotifications>>;
type NotificationItem = NotificationsList[number];
type NotificationsTranslateFn = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

function getNotificationDetails(notification: NotificationItem, t: NotificationsTranslateFn) {
  const scope = notification.event.scope;
  const actorName =
    notification.actor?.name ?? notification.actor?.username ?? t("fallbacks.someone");
  const actorProfileHref = notification.actor?.username ? `/u/${notification.actor.username}` : null;
  const actorHref = actorProfileHref ?? "/friends";
  const actorInitials = actorName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const payload = notification.payload && typeof notification.payload === "object"
    ? notification.payload
    : null;
  const groupSlug =
    payload &&
    "groupSlug" in payload &&
    typeof payload.groupSlug === "string" &&
    payload.groupSlug.length > 0
      ? payload.groupSlug
      : null;
  const groupName =
    payload &&
    "groupName" in payload &&
    typeof payload.groupName === "string" &&
    payload.groupName.length > 0
      ? payload.groupName
      : t("fallbacks.group");

  if (notification.eventKey === NOTIFICATION_EVENT_KEY.FRIEND_REQUEST_RECEIVED) {
    return {
      title: t("events.friendRequestReceived.title"),
      message: t("events.friendRequestReceived.message", { actorName }),
      href: "/friends",
      actorDisplayName: actorName,
      actorProfileHref,
      actorInitials,
      scope,
    };
  }

  if (notification.eventKey === NOTIFICATION_EVENT_KEY.FRIEND_REQUEST_ACCEPTED) {
    return {
      title: t("events.friendRequestAccepted.title"),
      message: t("events.friendRequestAccepted.message", { actorName }),
      href: actorHref,
      actorDisplayName: actorName,
      actorProfileHref,
      actorInitials,
      scope,
    };
  }

  if (notification.eventKey === NOTIFICATION_EVENT_KEY.GROUP_INVITE_RECEIVED) {
    return {
      title: t("events.groupInviteReceived.title"),
      message: t("events.groupInviteReceived.message", { actorName, groupName }),
      href: groupSlug ? `/groups/${groupSlug}` : "/groups",
      actorDisplayName: actorName,
      actorProfileHref,
      actorInitials,
      scope,
    };
  }

  if (notification.eventKey === NOTIFICATION_EVENT_KEY.GROUP_INVITE_ACCEPTED) {
    return {
      title: t("events.groupInviteAccepted.title"),
      message: t("events.groupInviteAccepted.message", { actorName, groupName }),
      href: groupSlug ? `/groups/${groupSlug}` : "/groups",
      actorDisplayName: actorName,
      actorProfileHref,
      actorInitials,
      scope,
    };
  }

  if (notification.eventKey === NOTIFICATION_EVENT_KEY.GROUP_JOIN_REQUEST_RECEIVED) {
    return {
      title: t("events.groupJoinRequestReceived.title"),
      message: t("events.groupJoinRequestReceived.message", { actorName, groupName }),
      href: groupSlug ? `/groups/${groupSlug}` : "/groups",
      actorDisplayName: actorName,
      actorProfileHref,
      actorInitials,
      scope,
    };
  }

  if (notification.eventKey === NOTIFICATION_EVENT_KEY.GROUP_JOIN_REQUEST_ACCEPTED) {
    return {
      title: t("events.groupJoinRequestAccepted.title"),
      message: t("events.groupJoinRequestAccepted.message", { actorName, groupName }),
      href: groupSlug ? `/groups/${groupSlug}` : "/groups",
      actorDisplayName: actorName,
      actorProfileHref,
      actorInitials,
      scope,
    };
  }

  if (notification.eventKey === NOTIFICATION_EVENT_KEY.GROUP_MEMBER_JOINED) {
    return {
      title: t("events.groupMemberJoined.title"),
      message: t("events.groupMemberJoined.message", { actorName, groupName }),
      href: groupSlug ? `/groups/${groupSlug}` : "/groups",
      actorDisplayName: actorName,
      actorProfileHref,
      actorInitials,
      scope,
    };
  }

  if (notification.eventKey === NOTIFICATION_EVENT_KEY.GROUP_MEMBER_PROMOTED_TO_ADMIN) {
    return {
      title: t("events.groupMemberPromotedToAdmin.title"),
      message: t("events.groupMemberPromotedToAdmin.message", { actorName, groupName }),
      href: groupSlug ? `/groups/${groupSlug}` : "/groups",
      actorDisplayName: actorName,
      actorProfileHref,
      actorInitials,
      scope,
    };
  }

  if (notification.eventKey === NOTIFICATION_EVENT_KEY.GROUP_MEMBER_REMOVED) {
    return {
      title: t("events.groupMemberRemoved.title"),
      message: t("events.groupMemberRemoved.message", { actorName, groupName }),
      href: groupSlug ? `/groups/${groupSlug}` : "/groups",
      actorDisplayName: actorName,
      actorProfileHref,
      actorInitials,
      scope,
    };
  }

  if (notification.eventKey === NOTIFICATION_EVENT_KEY.GROUP_EVENT_CREATED) {
    const eventId =
      payload &&
      "eventId" in payload &&
      typeof payload.eventId === "string" &&
      payload.eventId.length > 0
        ? payload.eventId
        : null;
    const eventTitle =
      payload &&
      "eventTitle" in payload &&
      typeof payload.eventTitle === "string" &&
      payload.eventTitle.length > 0
        ? payload.eventTitle
        : t("fallbacks.event");

    const href =
      groupSlug && eventId
        ? `/groups/${groupSlug}/events/${eventId}`
        : groupSlug
          ? `/groups/${groupSlug}`
          : "/groups";

    return {
      title: t("events.groupEventCreated.title"),
      message: t("events.groupEventCreated.message", { actorName, groupName, eventTitle }),
      href,
      actorDisplayName: actorName,
      actorProfileHref,
      actorInitials,
      scope,
    };
  }

  if (notification.eventKey === NOTIFICATION_EVENT_KEY.GROUP_EVENT_UPDATED) {
    const eventId =
      payload &&
      "eventId" in payload &&
      typeof payload.eventId === "string" &&
      payload.eventId.length > 0
        ? payload.eventId
        : null;
    const eventTitle =
      payload &&
      "eventTitle" in payload &&
      typeof payload.eventTitle === "string" &&
      payload.eventTitle.length > 0
        ? payload.eventTitle
        : t("fallbacks.event");

    const href =
      groupSlug && eventId
        ? `/groups/${groupSlug}/events/${eventId}`
        : groupSlug
          ? `/groups/${groupSlug}/events`
          : "/groups";

    return {
      title: t("events.groupEventUpdated.title"),
      message: t("events.groupEventUpdated.message", { actorName, groupName, eventTitle }),
      href,
      actorDisplayName: actorName,
      actorProfileHref,
      actorInitials,
      scope,
    };
  }

  if (notification.eventKey === NOTIFICATION_EVENT_KEY.GROUP_EVENT_DELETED) {
    const eventTitle =
      payload &&
      "eventTitle" in payload &&
      typeof payload.eventTitle === "string" &&
      payload.eventTitle.length > 0
        ? payload.eventTitle
        : t("fallbacks.event");

    return {
      title: t("events.groupEventDeleted.title"),
      message: t("events.groupEventDeleted.message", { actorName, groupName, eventTitle }),
      href: null,
      actorDisplayName: actorName,
      actorProfileHref,
      actorInitials,
      scope,
    };
  }

  if (notification.eventKey === NOTIFICATION_EVENT_KEY.GROUP_UPDATED) {
    return {
      title: t("events.groupUpdated.title"),
      message: t("events.groupUpdated.message", { actorName, groupName }),
      href: groupSlug ? `/groups/${groupSlug}` : "/groups",
      actorDisplayName: actorName,
      actorProfileHref,
      actorInitials,
      scope,
    };
  }

  if (notification.eventKey === NOTIFICATION_EVENT_KEY.GROUP_DELETED) {
    return {
      title: t("events.groupDeleted.title"),
      message: t("events.groupDeleted.message", { actorName, groupName }),
      href: null,
      actorDisplayName: actorName,
      actorProfileHref,
      actorInitials,
      scope,
    };
  }

  return {
    title: t("events.unknown.title"),
    message: t("events.unknown.message", { actorName, eventKey: notification.eventKey }),
    href: null,
    actorDisplayName: actorName,
    actorProfileHref,
    actorInitials,
    scope,
  };
}
