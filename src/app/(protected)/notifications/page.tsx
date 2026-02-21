import Link from "next/link";
import { redirect } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  BellOff,
  BellRing,
  CircleCheckBig,
  Dices,
  Network,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { deleteNotification } from "@/lib/actions";
import {
  countUnreadNotifications,
  listNotifications,
  markAllNotificationsSeen,
  NOTIFICATION_EVENT_KEY,
  NOTIFICATION_SCOPE,
} from "@/lib/notifications";

export default async function NotificationsPage() {
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
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="group flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-amber-500 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
          <BellRing className="h-4.5 w-4.5 transition-all duration-300 motion-safe:animate-[pulse_2.8s_ease-in-out_infinite] group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95" />
        </span>
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        {hasNotifications
          ? `${notifications.length} notification${notifications.length === 1 ? "" : "s"}`
          : "You are up to date."}
      </p>

      {!hasNotifications ? (
        <section className="mt-8 rounded-xl border bg-card/70 p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <BellOff className="h-4 w-4" />
            No notifications right now.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/users"
              className="pressable inline-flex items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent/60 active:bg-accent/75"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Find users
            </Link>
            <Link
              href="/friends"
              className="pressable inline-flex items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent/60 active:bg-accent/75"
            >
              <UsersRound className="h-3.5 w-3.5" />
              View friends
            </Link>
            <Link
              href="/games"
              className="pressable inline-flex items-center gap-2 rounded-md border border-border/70 bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent/60 active:bg-accent/75"
            >
              <Dices className="h-3.5 w-3.5" />
              Browse games
            </Link>
          </div>
        </section>
      ) : (
        <section className="mt-8 space-y-2.5">
          {notifications.map((notification) => {
            const details = getNotificationDetails(notification);

            return (
              <article
                key={notification.id}
                className="rounded-xl border bg-card/70 p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={notification.actor?.image ?? undefined}
                        alt={details.actorDisplayName}
                      />
                      <AvatarFallback>{details.actorInitials}</AvatarFallback>
                    </Avatar>

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
                            {details.scope === NOTIFICATION_SCOPE.GROUP ? (
                              <Network className="h-3.5 w-3.5" />
                            ) : (
                              <CircleCheckBig className="h-3.5 w-3.5" />
                            )}
                            Open
                          </Link>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat("en-US", {
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
                      <span className="sr-only">Delete notification</span>
                    </Button>
                  </form>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

type NotificationsList = Awaited<ReturnType<typeof listNotifications>>;
type NotificationItem = NotificationsList[number];

function getNotificationDetails(notification: NotificationItem) {
  const actorName = notification.actor?.name ?? notification.actor?.username ?? "Someone";
  const actorHref = notification.actor?.username ? `/u/${notification.actor.username}` : "/friends";
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
      : "group";

  if (notification.eventKey === NOTIFICATION_EVENT_KEY.FRIEND_REQUEST_RECEIVED) {
    return {
      title: "Friend request received",
      message: `${actorName} sent you a friend request.`,
      href: "/friends",
      actorDisplayName: actorName,
      actorInitials,
      scope: NOTIFICATION_SCOPE.FRIENDSHIP,
    };
  }

  if (notification.eventKey === NOTIFICATION_EVENT_KEY.FRIEND_REQUEST_ACCEPTED) {
    return {
      title: "Friend request accepted",
      message: `${actorName} accepted your friend request.`,
      href: actorHref,
      actorDisplayName: actorName,
      actorInitials,
      scope: NOTIFICATION_SCOPE.FRIENDSHIP,
    };
  }

  if (notification.eventKey === NOTIFICATION_EVENT_KEY.GROUP_INVITE_RECEIVED) {
    return {
      title: "Group invitation received",
      message: `${actorName} invited you to join ${groupName}.`,
      href: groupSlug ? `/groups/${groupSlug}` : "/groups",
      actorDisplayName: actorName,
      actorInitials,
      scope: NOTIFICATION_SCOPE.GROUP,
    };
  }

  if (notification.eventKey === NOTIFICATION_EVENT_KEY.GROUP_INVITE_ACCEPTED) {
    return {
      title: "Group invitation accepted",
      message: `${actorName} accepted your invitation to ${groupName}.`,
      href: groupSlug ? `/groups/${groupSlug}` : "/groups",
      actorDisplayName: actorName,
      actorInitials,
      scope: NOTIFICATION_SCOPE.GROUP,
    };
  }

  return {
    title: "Notification",
    message: `${actorName} triggered ${notification.eventKey}.`,
    href: null,
    actorDisplayName: actorName,
    actorInitials,
    scope: notification.scope,
  };
}
