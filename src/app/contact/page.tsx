import type { Metadata } from "next";
import { Bug, Lightbulb, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Contact | Boardify",
  description: "Get in touch with the Boardify team for support, bugs, or feature ideas.",
};

const CONTACT_EMAIL = "hello@boardify.app";

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <header className="rounded-2xl border bg-card/70 p-6 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight">Contact</h1>
        <p className="mt-2 text-muted-foreground">
          Need help, found a bug, or want to suggest a feature? Reach out and include as much
          context as possible.
        </p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <article className="flex h-full flex-col rounded-xl border bg-card/70 p-4 text-center shadow-sm">
          <div className="inline-flex w-fit self-center rounded-lg border border-cyan-400/30 bg-cyan-500/10 p-2 text-cyan-600 dark:text-cyan-400">
            <Mail className="h-4 w-4" />
          </div>
          <h2 className="mt-3 font-semibold">General Support</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Account issues, onboarding, or questions about how Boardify works.
          </p>
          <div className="mt-auto flex justify-center pt-4">
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${CONTACT_EMAIL}?subject=Boardify%20support`}>Email support</a>
            </Button>
          </div>
        </article>

        <article className="flex h-full flex-col rounded-xl border bg-card/70 p-4 text-center shadow-sm">
          <div className="inline-flex w-fit self-center rounded-lg border border-rose-400/30 bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
            <Bug className="h-4 w-4" />
          </div>
          <h2 className="mt-3 font-semibold">Bug Reports</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Share steps, expected result, and actual result so we can reproduce quickly.
          </p>
          <div className="mt-auto flex justify-center pt-4">
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${CONTACT_EMAIL}?subject=Boardify%20bug%20report`}>Report a bug</a>
            </Button>
          </div>
        </article>

        <article className="flex h-full flex-col rounded-xl border bg-card/70 p-4 text-center shadow-sm">
          <div className="inline-flex w-fit self-center rounded-lg border border-amber-400/30 bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
            <Lightbulb className="h-4 w-4" />
          </div>
          <h2 className="mt-3 font-semibold">Feature Requests</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us the problem you want solved and how you currently work around it.
          </p>
          <div className="mt-auto flex justify-center pt-4">
            <Button asChild variant="outline" size="sm">
              <a href={`mailto:${CONTACT_EMAIL}?subject=Boardify%20feature%20request`}>
                Suggest a feature
              </a>
            </Button>
          </div>
        </article>
      </div>
    </section>
  );
}
