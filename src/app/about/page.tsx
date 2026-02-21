import type { Metadata } from "next";
import { Compass, Lightbulb, ShieldCheck, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About | Boardify",
  description: "Learn what Boardify is and how it helps you organize game nights.",
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <header className="rounded-2xl border bg-card/70 p-6 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight">About Boardify</h1>
        <p className="mt-2 text-muted-foreground">
          Boardify helps you decide what to play faster by organizing your games,
          friends, and groups in one place.
        </p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border bg-card/70 p-4 shadow-sm">
          <div className="inline-flex rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
            <Compass className="h-4 w-4" />
          </div>
          <h2 className="mt-3 font-semibold">What It Solves</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Stop guessing what everyone can play. Boardify surfaces shared options quickly.
          </p>
        </article>

        <article className="rounded-xl border bg-card/70 p-4 shadow-sm">
          <div className="inline-flex rounded-lg border border-sky-400/30 bg-sky-500/10 p-2 text-sky-600 dark:text-sky-400">
            <Users className="h-4 w-4" />
          </div>
          <h2 className="mt-3 font-semibold">How It Works</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Build your library, connect with friends, and join groups to compare collections.
          </p>
        </article>

        <article className="rounded-xl border bg-card/70 p-4 shadow-sm">
          <div className="inline-flex rounded-lg border border-violet-400/30 bg-violet-500/10 p-2 text-violet-600 dark:text-violet-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <h2 className="mt-3 font-semibold">Privacy First</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Profile visibility and invitation flows are designed so you control who sees what.
          </p>
        </article>

        <article className="rounded-xl border bg-card/70 p-4 shadow-sm sm:col-span-3">
          <div className="inline-flex rounded-lg border border-amber-400/30 bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
            <Lightbulb className="h-4 w-4" />
          </div>
          <h2 className="mt-3 font-semibold">From The Author</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            I built Boardify after repeating the same pre-game ritual every week:
            endless chat messages, unclear player counts, and lots of
            last-minute what can we actually play moments.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The goal was not just to list games, but to reduce friction before
            meeting friends. Boardify brings collections, availability, and
            group context together so choosing a game feels quick, fair, and
            collaborative instead of chaotic.
          </p>
        </article>
      </div>
    </section>
  );
}
