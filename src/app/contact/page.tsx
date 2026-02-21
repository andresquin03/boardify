import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Bug, Lightbulb, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const CONTACT_EMAIL = "hello@boardify.app";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ContactPage.metadata");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ContactPage() {
  const t = await getTranslations("ContactPage");

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <header className="rounded-2xl border bg-card/70 p-6 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight">{t("header.title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("header.description")}</p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <article className="flex h-full flex-col rounded-xl border bg-card/70 p-4 text-center shadow-sm">
          <div className="inline-flex w-fit self-center rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-2 text-cyan-600 dark:text-cyan-400">
            <Mail className="h-4 w-4" />
          </div>
          <h2 className="mt-3 font-semibold">{t("cards.support.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("cards.support.description")}</p>
          <div className="mt-auto flex justify-center pt-4">
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${CONTACT_EMAIL}?subject=Boardify%20support`}>
                {t("cards.support.cta")}
              </a>
            </Button>
          </div>
        </article>

        <article className="flex h-full flex-col rounded-xl border bg-card/70 p-4 text-center shadow-sm">
          <div className="inline-flex w-fit self-center rounded-lg border border-rose-400/30 bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
            <Bug className="h-4 w-4" />
          </div>
          <h2 className="mt-3 font-semibold">{t("cards.bugs.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("cards.bugs.description")}</p>
          <div className="mt-auto flex justify-center pt-4">
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${CONTACT_EMAIL}?subject=Boardify%20bug%20report`}>
                {t("cards.bugs.cta")}
              </a>
            </Button>
          </div>
        </article>

        <article className="flex h-full flex-col rounded-xl border bg-card/70 p-4 text-center shadow-sm">
          <div className="inline-flex w-fit self-center rounded-lg border border-amber-400/30 bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
            <Lightbulb className="h-4 w-4" />
          </div>
          <h2 className="mt-3 font-semibold">{t("cards.features.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t("cards.features.description")}</p>
          <div className="mt-auto flex justify-center pt-4">
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${CONTACT_EMAIL}?subject=Boardify%20feature%20request`}>
                {t("cards.features.cta")}
              </a>
            </Button>
          </div>
        </article>
      </div>
    </section>
  );
}
