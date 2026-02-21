"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Ellipsis, Pencil, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShareIconButton } from "@/components/ui/share-icon-button";

export function ProfileActionsMenu({
  profileUsername,
  isOwner,
}: {
  profileUsername: string;
  isOwner: boolean;
}) {
  const t = useTranslations("UserProfileActionsMenu");
  const shareMessage = isOwner
    ? t("shareMessageOwner")
    : t("shareMessageOther");

  return (
    <div className="flex items-center gap-2">
      <ShareIconButton
        path={`/u/${profileUsername}`}
        message={shareMessage}
        tooltipLabel={t("shareProfile")}
        ariaLabel={t("shareProfile")}
      />

      {isOwner && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon-sm"
              className="cursor-pointer border-border/70 bg-card text-muted-foreground hover:bg-accent/60 hover:text-foreground active:bg-accent/75"
            >
              <Ellipsis className="h-4 w-4" />
              <span className="sr-only">{t("profileActions")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem asChild className="cursor-pointer gap-2">
              <Link href="/profile/edit">
                <Pencil className="h-4 w-4" />
                {t("editProfile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer gap-2">
              <Link href="/settings">
                <SlidersHorizontal className="h-4 w-4" />
                {t("configureProfile")}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
