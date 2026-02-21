import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { auth } from "@/lib/auth";
import { UserMenuContent } from "@/components/layout/user-menu-content";
import { countUnreadNotifications } from "@/lib/notifications";
import { NotificationBell } from "@/components/layout/notification-bell";

export async function Navbar() {
  const t = await getTranslations("Navbar");
  const session = await auth();
  const hasCompletedOnboarding = Boolean(session?.user?.username);

  let unreadNotificationCount = 0;
  if (session?.user?.id) {
    unreadNotificationCount = await countUnreadNotifications(session.user.id);
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
              {t("links.games")}
            </Link>
            <Link
              href={usersHref}
              className="pressable text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("links.users")}
            </Link>
            <Link
              href={groupsHref}
              className="pressable text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("links.groups")}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {session?.user ? (
            <>
              <NotificationBell
                href={hasCompletedOnboarding ? "/notifications" : "/onboarding"}
                initialUnreadCount={unreadNotificationCount}
                ariaLabel={t("actions.openNotifications")}
              />
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
                {t("actions.signIn")}
              </Link>
            </Button>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
