import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Bell } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserMenuContent } from "@/components/layout/user-menu-content";

export async function Navbar() {
  const session = await auth();
  const hasCompletedOnboarding = Boolean(session?.user?.username);

  let pendingRequestCount = 0;
  if (session?.user?.id && hasCompletedOnboarding) {
    pendingRequestCount = await prisma.friendship.count({
      where: { addresseeId: session.user.id, status: "PENDING" },
    });
  }

  const usersHref = session?.user
    ? hasCompletedOnboarding
      ? "/users"
      : "/onboarding"
    : "/signin?callbackUrl=%2Fusers";
  const groupsHref = session?.user
    ? hasCompletedOnboarding
      ? "/groups"
      : "/onboarding"
    : "/signin?callbackUrl=%2Fgroups";

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
            <span className="hidden sm:inline">Boardify</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/games"
              className="pressable text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Games
            </Link>
            <Link
              href={usersHref}
              className="pressable text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Users
            </Link>
            <Link
              href={groupsHref}
              className="pressable text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Groups
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <Link
                href={hasCompletedOnboarding ? "/friends" : "/onboarding"}
                className="group pressable relative inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent hover:text-foreground active:translate-y-0 active:scale-95 active:bg-amber-500/20 active:text-amber-400"
              >
                <Bell
                  className={`h-4.5 w-4.5 transition-all duration-400 ease-out group-hover:-rotate-12 group-hover:scale-110 group-active:scale-95 group-active:text-amber-400 ${
                    pendingRequestCount > 0 ? "text-foreground" : ""
                  }`}
                />
                {pendingRequestCount > 0 && (
                  <>
                    <span className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 rounded-full bg-destructive/35 motion-safe:animate-ping" />
                    <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {pendingRequestCount > 9 ? "9+" : pendingRequestCount}
                    </span>
                  </>
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
                  <UserMenuContent
                    username={session.user.username}
                    hasCompletedOnboarding={hasCompletedOnboarding}
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild variant="outline" size="sm" className="cursor-pointer">
              <Link href="/signin">
                Sign in
              </Link>
            </Button>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
