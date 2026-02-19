import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LogOut, User, Bell, UsersRound } from "lucide-react";
import { auth } from "@/lib/auth";
import { signInWithGoogle, handleSignOut } from "@/lib/actions";
import { prisma } from "@/lib/prisma";

export async function Navbar() {
  const session = await auth();
  const hasCompletedOnboarding = Boolean(session?.user?.username);

  let pendingRequestCount = 0;
  if (session?.user?.id && hasCompletedOnboarding) {
    pendingRequestCount = await prisma.friendship.count({
      where: { addresseeId: session.user.id, status: "PENDING" },
    });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-[var(--navbar-background)] backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="relative h-7 w-7">
              <Image
                src="/boardify-light.png"
                alt="Boardify"
                width={28}
                height={28}
                className="h-7 w-7 rounded-md dark:hidden"
              />
              <Image
                src="/boardify-dark.png"
                alt="Boardify"
                width={28}
                height={28}
                className="hidden h-7 w-7 rounded-md dark:block"
              />
            </span>
            Boardify
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/games"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Games
            </Link>
            {session?.user && hasCompletedOnboarding && (
              <Link
                href="/users"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Users
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Link
                href={hasCompletedOnboarding ? "/friends" : "/onboarding"}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Bell className="h-4.5 w-4.5" />
                {pendingRequestCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {pendingRequestCount > 9 ? "9+" : pendingRequestCount}
                  </span>
                )}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 cursor-pointer rounded-full">
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
                <DropdownMenuContent align="center" sideOffset={10}>
                  <DropdownMenuItem asChild>
                    <Link
                      href={session.user.username ? `/u/${session.user.username}` : "/onboarding"}
                      className="flex w-full items-center justify-center gap-2 text-center"
                    >
                      <User className="h-4 w-4" />
                      My profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href={hasCompletedOnboarding ? "/friends" : "/onboarding"}
                      className="flex w-full items-center justify-center gap-2 text-center"
                    >
                      <UsersRound className="h-4 w-4" />
                      My friends
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <form action={handleSignOut}>
                      <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-2 text-center cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <form action={signInWithGoogle}>
              <Button variant="outline" size="sm" type="submit" className="cursor-pointer">
                Sign in
              </Button>
            </form>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
