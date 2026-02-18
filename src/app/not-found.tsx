import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass, Home, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(45%_35%_at_50%_0%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_70%)]" />

      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
        <div className="rounded-2xl border bg-card/70 p-8 shadow-sm backdrop-blur-sm sm:p-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <SearchX className="h-7 w-7" />
          </div>

          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">ERROR 404</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Page Not Found</h1>
          <p className="mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
            The page you requested does not exist or was moved.
          </p>

          <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
            <Button asChild>
              <Link href="/" className="cursor-pointer">
                <Home className="h-4 w-4" />
                Back Home
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/games" className="cursor-pointer">
                <Compass className="h-4 w-4" />
                Browse Games
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
