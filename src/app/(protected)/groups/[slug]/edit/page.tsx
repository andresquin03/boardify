import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Pencil } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditGroupForm } from "@/components/groups/edit-group-form";
import { DeleteGroupButton } from "@/components/groups/delete-group-button";

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const t = await getTranslations("EditGroupPage");
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const userId = session.user.id;

  const { slug } = await params;

  const group = await prisma.group.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      icon: true,
      color: true,
      visibility: true,
    },
  });

  if (!group) {
    const legacy = await prisma.groupSlug.findUnique({
      where: { slug },
      select: { group: { select: { slug: true } } },
    });

    if (legacy) {
      redirect(`/groups/${legacy.group.slug}/edit`);
    }

    notFound();
  }

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId: group.id } },
    select: { role: true },
  });

  if (membership?.role !== "ADMIN") {
    redirect(`/groups/${group.slug}`);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link
        href={`/groups/${group.slug}`}
        className="pressable inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToGroup")}
      </Link>

      <div className="group mt-4 flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-sky-500 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
          <Pencil className="h-4.5 w-4.5 transition-all duration-300 motion-safe:animate-[pulse_2.8s_ease-in-out_infinite] group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95" />
        </span>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("description")}
      </p>

      <div className="mt-6 rounded-xl border bg-card/70 p-5 shadow-sm">
        <EditGroupForm
          groupId={group.id}
          defaultName={group.name}
          defaultDescription={group.description ?? ""}
          defaultIcon={group.icon}
          defaultColor={group.color}
          defaultVisibility={group.visibility}
        />
      </div>

      <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 p-5 shadow-sm">
        <h2 className="text-base font-semibold">{t("dangerZone.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("dangerZone.description")}
        </p>
        <div className="mt-4">
          <DeleteGroupButton groupId={group.id} groupName={group.name} />
        </div>
      </div>
    </div>
  );
}
