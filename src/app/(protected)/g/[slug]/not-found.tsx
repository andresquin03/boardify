import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Compass, LibraryBig, SearchX } from "lucide-react";

export default function GameNotFound() {
  return (
    <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col items-center justify-center px-4 py-12 text-center">
      <div className="rounded-2xl border bg-card/70 p-8 shadow-sm backdrop-blur-sm sm:p-10">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <SearchX className="h-7 w-7" />
        </div>

        <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">GAME NOT FOUND</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">This game does not exist</h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
          The game link is invalid or the game was removed from the catalog.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/games" className="cursor-pointer">
              <LibraryBig className="h-4 w-4" />
              Browse Games
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/" className="cursor-pointer">
              <Compass className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
