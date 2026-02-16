import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dice5 } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Dice5 className="h-6 w-6" />
            Boardify
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/games"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Games
            </Link>
          </nav>
        </div>
        <Button variant="outline" size="sm">
          Sign in
        </Button>
      </div>
    </header>
  );
}
