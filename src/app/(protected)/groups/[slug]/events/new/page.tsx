import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateEventForm } from "@/components/groups/create-event-form";

export default async function CreateEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ calendarConnected?: string }>;
}) {
  const t = await getTranslations("CreateEventPage");
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const viewerId = session.user.id;

  const { slug } = await params;
  const { calendarConnected } = await searchParams;

  const group = await prisma.group.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      members: {
        select: {
          userId: true,
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
    if (legacy) redirect(`/groups/${legacy.group.slug}/events/new`);
    notFound();
  }

  const isMember = group.members.some((m) => m.userId === viewerId);
  if (!isMember) redirect(`/groups/${slug}`);

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Link
        href={`/groups/${slug}/events`}
        className="pressable inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToEvents")}
      </Link>

      <div className="group mt-4 flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-emerald-500 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
          <CalendarDays className="h-4.5 w-4.5 transition-all duration-300 motion-safe:animate-[pulse_2.8s_ease-in-out_infinite] group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95" />
        </span>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>

      <div className="mt-6 rounded-xl border bg-card/70 p-5 shadow-sm">
        <CreateEventForm
          groupId={group.id}
          groupSlug={group.slug}
          members={group.members}
          calendarConnected={calendarConnected === "1"}
          libraryGames={libraryGames.map((g) => ({
            id: g.id,
            title: g.title,
            ownerIds: g.userGames.map((ug) => ug.userId),
          }))}
        />
      </div>
    </div>
  );
}
