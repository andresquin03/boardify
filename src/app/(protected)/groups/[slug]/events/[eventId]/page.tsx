import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  MapPin,
  NotebookPen,
  Gamepad2,
  Pencil,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEventDisplayTitle } from "@/components/groups/group-events-preview-card";
import { DeleteEventButton } from "@/components/groups/delete-event-button";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const t = await getTranslations("EventDetailPage");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const viewerId = session.user.id;

  const { slug, eventId } = await params;

  const group = await prisma.group.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      members: { select: { userId: true, role: true } },
    },
  });

  if (!group) {
    const legacy = await prisma.groupSlug.findUnique({
      where: { slug },
      select: { group: { select: { slug: true } } },
    });
    if (legacy) redirect(`/groups/${legacy.group.slug}/events/${eventId}`);
    notFound();
  }

  const membership = group.members.find((m) => m.userId === viewerId);
  if (!membership) redirect(`/groups/${slug}`);

  const event = await prisma.groupEvent.findUnique({
    where: { id: eventId, groupId: group.id },
    include: {
      createdBy: { select: { id: true, name: true, username: true, image: true } },
      locationUser: { select: { id: true, name: true, username: true, image: true } },
      games: {
        include: {
          game: { select: { id: true, title: true, slug: true, image: true } },
          carriedBy: { select: { id: true, name: true, username: true, image: true } },
        },
      },
    },
  });

  if (!event) notFound();

  const canManageEvent =
    event.createdByUserId === viewerId || membership.role === "ADMIN";

  const displayTitle = getEventDisplayTitle(event, locale);
  const fallbackUser = t("fallbackUser");

  const formattedDate = new Intl.DateTimeFormat(locale === "es" ? "es-AR" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: event.timezone,
  }).format(event.date);

  const formattedTime = new Intl.DateTimeFormat(locale === "es" ? "es-AR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: event.timezone,
  }).format(event.date);

  function getUserInitials(user: { name: string | null; username: string | null }) {
    const display = user.name ?? user.username ?? fallbackUser;
    return display.slice(0, 2).toUpperCase();
  }

  function getUserDisplayName(user: { name: string | null; username: string | null }) {
    return user.name ?? user.username ?? fallbackUser;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href={`/groups/${slug}/events`}
        className="pressable inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToGroup")}
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-emerald-500 shadow-sm">
            <CalendarDays className="h-4.5 w-4.5" />
          </span>
          <h1 className="truncate text-2xl font-bold">{displayTitle}</h1>
        </div>

        {canManageEvent && (
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/groups/${slug}/events/${eventId}/edit`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/70 px-3 py-1.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/60"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t("editEvent")}
            </Link>
            <DeleteEventButton eventId={event.id} hasCalendarEvent={Boolean(event.googleCalendarEventId)} />
          </div>
        )}
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        {t("createdBy", {
          name: getUserDisplayName(event.createdBy),
        })}
      </p>

      {/* Date & Time */}
      <div className="mt-6 rounded-xl border bg-card/70 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t("date")}</span>
        </div>
        <p className="mt-1.5 pl-6 text-sm capitalize">{formattedDate}</p>
        <p className="pl-6 text-sm text-muted-foreground">{formattedTime}</p>
      </div>

      {/* Location */}
      <div className="mt-3 rounded-xl border bg-card/70 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t("location")}</span>
        </div>
        <div className="mt-2 pl-6">
          {event.locationUser ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={event.locationUser.image ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {getUserInitials(event.locationUser)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{getUserDisplayName(event.locationUser)}</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("locationNoHost")}</p>
          )}
          {event.locationText ? (
            <p className="mt-1 text-sm text-muted-foreground">{event.locationText}</p>
          ) : !event.locationUser ? null : (
            <p className="mt-1 text-sm text-muted-foreground">{t("locationNoText")}</p>
          )}
        </div>
      </div>

      {/* Games */}
      {event.games.length > 0 && (
        <div className="mt-3 rounded-xl border bg-card/70 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t("games")}</span>
          </div>
          <div className="mt-2 space-y-2 pl-6">
            {event.games.map(({ game, carriedBy }) => (
              <div key={game.id} className="flex items-center justify-between gap-2">
                <Link
                  href={`/g/${game.slug}`}
                  className="truncate text-sm hover:underline"
                >
                  {game.title}
                </Link>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {carriedBy
                    ? t("carriedBy", { name: getUserDisplayName(carriedBy) })
                    : t("carrierUndefined")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {event.notes && (
        <div className="mt-3 rounded-xl border bg-card/70 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <NotebookPen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t("notes")}</span>
          </div>
          <p className="mt-1.5 pl-6 text-sm text-muted-foreground">{event.notes}</p>
        </div>
      )}

      {/* Google Calendar link */}
      {event.googleCalendarEventLink && (
        <div className="mt-4">
          <a
            href={event.googleCalendarEventLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-500/50 bg-background px-4 py-2 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-500/5 dark:text-emerald-400"
          >
            <ExternalLink className="h-4 w-4" />
            {t("calendarLink")}
          </a>
        </div>
      )}
    </div>
  );
}
