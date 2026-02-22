import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, Plus } from "lucide-react";
import { CreateGroupForm } from "@/components/groups/create-group-form";
import { auth } from "@/lib/auth";

export default async function CreateGroupPage() {
  const t = await getTranslations("CreateGroupPage");
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link
        href="/groups"
        className="pressable inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToGroups")}
      </Link>

      <div className="group mt-4 flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-sky-500 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
          <Plus className="h-4.5 w-4.5 transition-all duration-300 motion-safe:animate-[pulse_2.8s_ease-in-out_infinite] group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95" />
        </span>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("description")}
      </p>

      <div className="mt-6 rounded-xl border bg-card/70 p-5 shadow-sm">
        <CreateGroupForm />
      </div>
    </div>
  );
}
