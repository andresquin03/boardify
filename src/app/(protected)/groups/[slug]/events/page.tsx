import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ArrowLeft, CalendarDays, ChevronRight, Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEventDisplayTitle } from "@/components/groups/group-events-preview-card";

export default async function GroupEventsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const t = await getTranslations("GroupEventsPage");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const viewerId = session.user.id;

  const { slug } = await params;

  const group = await prisma.group.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      members: { select: { userId: true } },
    },
  });

  if (!group) {
    const legacy = await prisma.groupSlug.findUnique({
      where: { slug },
      select: { group: { select: { slug: true } } },
    });
    if (legacy) redirect(`/groups/${legacy.group.slug}/events`);
    notFound();
  }

  const isMember = group.members.some((m) => m.userId === viewerId);
  if (!isMember) redirect(`/groups/${slug}`);

  const allEvents = await prisma.groupEvent.findMany({
    where: { groupId: group.id },
    orderBy: { date: "asc" },
    select: {
      id: true,
      title: true,
      date: true,
      locationUser: { select: { id: true, name: true, username: true } },
    },
  });

  const now = new Date();
  const upcoming = allEvents.filter((e) => e.date >= now);
  const past = allEvents.filter((e) => e.date < now).reverse();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href={`/groups/${slug}`}
        className="pressable inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToGroup")}
      </Link>

      <div className="group mt-4 flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-emerald-500 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
          <CalendarDays className="h-4.5 w-4.5 transition-all duration-300 motion-safe:animate-[pulse_2.8s_ease-in-out_infinite] group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95" />
        </span>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>

      <div className="mt-6 space-y-6">
        <section className="rounded-xl border bg-card/70 p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("upcoming")}
          </h2>
          {upcoming.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("upcomingEmpty")}</p>
          ) : (
            <div className="mt-3 space-y-2">
              {upcoming.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  groupSlug={slug}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border bg-card/70 p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("past")}
          </h2>
          {past.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">{t("pastEmpty")}</p>
          ) : (
            <div className="mt-3 space-y-2">
              {past.map((event) => (
                <EventRow
                  key={event.id}
                  event={event}
                  groupSlug={slug}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <Link
        href={`/groups/${slug}/events/new`}
        className="pressable fixed right-6 bottom-[max(2.5rem,calc(env(safe-area-inset-bottom)+4.2rem))] z-50 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/35 transition-colors hover:bg-emerald-500 active:bg-emerald-700 sm:right-8"
      >
        <Plus className="h-4 w-4" />
        {t("createEvent")}
      </Link>
    </div>
  );
}

function EventRow({
  event,
  groupSlug,
  locale,
}: {
  event: {
    id: string;
    title: string | null;
    date: Date;
    locationUser: { id: string; name: string | null; username: string | null } | null;
  };
  groupSlug: string;
  locale: string;
}) {
  const displayTitle = getEventDisplayTitle(event, locale);
  const locationName = event.locationUser
    ? (event.locationUser.name ?? event.locationUser.username)
    : null;

  return (
    <Link
      href={`/groups/${groupSlug}/events/${event.id}`}
      className="flex items-center gap-3 rounded-lg border bg-card/70 px-3 py-2.5 transition-colors hover:bg-muted/40"
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{displayTitle}</span>
        {locationName && (
          <span className="truncate text-xs text-muted-foreground">
            {locationName}
          </span>
        )}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
