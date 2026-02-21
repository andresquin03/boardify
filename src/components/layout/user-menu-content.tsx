"use client";

import Link from "next/link";
import { Network, User, UsersRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { SignOutMenuItem } from "@/components/layout/sign-out-menu-item";

export function UserMenuContent({
  username,
  hasCompletedOnboarding,
}: {
  username?: string | null;
  hasCompletedOnboarding: boolean;
}) {
  const t = useTranslations("UserMenu");

  return (
    <>
      <DropdownMenuItem asChild>
        <Link
          href={username ? `/u/${username}` : "/onboarding"}
          className="pressable flex w-full cursor-pointer items-center justify-center gap-2 text-center"
        >
          <User className="h-4 w-4" />
          {t("profile")}
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link
          href={hasCompletedOnboarding ? "/friends" : "/onboarding"}
          className="pressable flex w-full cursor-pointer items-center justify-center gap-2 text-center"
        >
          <UsersRound className="h-4 w-4" />
          {t("friends")}
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link
          href={hasCompletedOnboarding && username ? `/u/${username}/groups` : "/onboarding"}
          className="pressable flex w-full cursor-pointer items-center justify-center gap-2 text-center"
        >
          <Network className="h-4 w-4" />
          {t("groups")}
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <SignOutMenuItem />
    </>
  );
}
