import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditEventForm } from "@/components/groups/edit-event-form";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ slug: string; eventId: string }>;
}) {
  const t = await getTranslations("EditEventPage");
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
      members: {
        select: {
          userId: true,
          role: true,
          user: {
            select: { id: true, name: true, username: true, image: true },
          },
        },
      },
    },
  });

  if (!group) {
    const legacy = await prisma.groupSlug.findUnique({
      where: { slug },
      select: { group: { select: { slug: true } } },
    });
    if (legacy) redirect(`/groups/${legacy.group.slug}/events/${eventId}/edit`);
    notFound();
  }

  const membership = group.members.find((m) => m.userId === viewerId);
  if (!membership) redirect(`/groups/${slug}`);

  const event = await prisma.groupEvent.findUnique({
    where: { id: eventId, groupId: group.id },
    select: {
      id: true,
      createdByUserId: true,
      title: true,
      date: true,
      timezone: true,
      locationUserId: true,
      locationText: true,
      notes: true,
      googleCalendarEventId: true,
      games: {
        select: {
          gameId: true,
          carriedByUserId: true,
        },
      },
    },
  });

  if (!event) notFound();

  const canManage =
    event.createdByUserId === viewerId || membership.role === "ADMIN";
  if (!canManage) redirect(`/groups/${slug}/events/${eventId}`);

  const memberIds = group.members.map((m) => m.userId);

  const libraryGames = await prisma.game.findMany({
    where: {
      userGames: {
        some: {
          isOwned: true,
          userId: { in: memberIds },
        },
      },
    },
    select: {
      id: true,
      title: true,
      userGames: {
        where: { isOwned: true, userId: { in: memberIds } },
        select: { userId: true },
      },
    },
    orderBy: { title: "asc" },
  });

  // Convert UTC date back to local date+time strings in the event's timezone
  const tz = event.timezone || "UTC";
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(event.date);

  const timeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(event.date);

  // Build carriers map from existing games
  const carriers: Record<string, string> = {};
  for (const g of event.games) {
    if (g.carriedByUserId) {
      carriers[g.gameId] = g.carriedByUserId;
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href={`/groups/${slug}/events/${eventId}`}
        className="pressable inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToEvent")}
      </Link>

      <div className="group mt-4 flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-emerald-500 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
          <CalendarDays className="h-4.5 w-4.5 transition-all duration-300 motion-safe:animate-[pulse_2.8s_ease-in-out_infinite] group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95" />
        </span>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>

      <div className="mt-6 rounded-xl border bg-card/70 p-5 shadow-sm">
        <EditEventForm
          eventId={event.id}
          groupId={group.id}
          groupSlug={group.slug}
          members={group.members.map((m) => ({
            userId: m.userId,
            user: m.user,
          }))}
          libraryGames={libraryGames.map((g) => ({
            id: g.id,
            title: g.title,
            ownerIds: g.userGames.map((ug) => ug.userId),
          }))}
          hasCalendarEvent={Boolean(event.googleCalendarEventId)}
          initialValues={{
            date: dateParts,
            time: timeParts,
            title: event.title ?? "",
            locationUserId: event.locationUserId,
            locationText: event.locationText ?? "",
            notes: event.notes ?? "",
            gameIds: event.games.map((g) => g.gameId),
            carriers,
            timezone: tz,
          }}
        />
      </div>
    </div>
  );
}
