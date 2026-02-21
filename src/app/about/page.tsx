import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Compass, Lightbulb, ShieldCheck, Users } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("AboutPage.metadata");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function AboutPage() {
  const t = await getTranslations("AboutPage");

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <header className="rounded-2xl border bg-card/70 p-6 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight">{t("header.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("header.description")}</p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border bg-card/70 p-4 shadow-sm">
          <div className="inline-flex rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
            <Compass className="h-4 w-4" />
          </div>
          <h2 className="mt-3 font-semibold">{t("cards.solve.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("cards.solve.description")}</p>
        </article>

        <article className="rounded-xl border bg-card/70 p-4 shadow-sm">
          <div className="inline-flex rounded-lg border border-sky-400/30 bg-sky-500/10 p-2 text-sky-600 dark:text-sky-400">
            <Users className="h-4 w-4" />
          </div>
          <h2 className="mt-3 font-semibold">{t("cards.flow.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("cards.flow.description")}</p>
        </article>

        <article className="rounded-xl border bg-card/70 p-4 shadow-sm">
          <div className="inline-flex rounded-lg border border-violet-400/30 bg-violet-500/10 p-2 text-violet-600 dark:text-violet-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <h2 className="mt-3 font-semibold">{t("cards.privacy.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("cards.privacy.description")}</p>
        </article>

        <article className="rounded-xl border bg-card/70 p-4 shadow-sm sm:col-span-3">
          <div className="inline-flex rounded-lg border border-amber-400/30 bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
            <Lightbulb className="h-4 w-4" />
          </div>
          <h2 className="mt-3 font-semibold">{t("author.title")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t("author.paragraph1")}</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("author.paragraph2")}</p>
        </article>
      </div>
    </section>
  );
}
