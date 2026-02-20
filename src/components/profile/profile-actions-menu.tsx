"use client";

import Link from "next/link";
import { Ellipsis, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  const shareMessage = isOwner
    ? "Let's boardify together:"
    : "Check out this Boardify user:";

  return (
    <div className="flex items-center gap-2">
      <ShareIconButton
        path={`/u/${profileUsername}`}
        message={shareMessage}
        tooltipLabel="Share profile"
        ariaLabel="Share profile"
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
              <span className="sr-only">Profile actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild className="cursor-pointer gap-2">
              <Link href="/settings/profile">
                <Pencil className="h-4 w-4" />
                Edit profile
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
