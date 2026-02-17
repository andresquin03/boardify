import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dice5, LogOut, User } from "lucide-react";
import { auth } from "@/lib/auth";
import { signInWithGoogle, handleSignOut } from "@/lib/actions";

export async function Navbar() {
  const session = await auth();

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

        {session?.user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage
                    src={session.user.image ?? undefined}
                    alt={session.user.name ?? ""}
                  />
                  <AvatarFallback>
                    {session.user.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/u/${session.user.email?.split("@")[0]}`}>
                  <User className="mr-2 h-4 w-4" />
                  My profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <form action={handleSignOut}>
                  <button type="submit" className="flex w-full items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </button>
                </form>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <form action={signInWithGoogle}>
            <Button variant="outline" size="sm" type="submit">
              Sign in
            </Button>
          </form>
        )}
      </div>
    </header>
  );
}
