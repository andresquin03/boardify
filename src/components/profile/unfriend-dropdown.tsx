"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { unfriend } from "@/lib/actions";
import { UserCheck, UserMinus } from "lucide-react";

export function UnfriendDropdown({
  friendshipId,
  profileUsername,
}: {
  friendshipId: string;
  profileUsername: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="mt-0.5 cursor-pointer gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
        >
          <UserCheck className="h-3.5 w-3.5" />
          Friends
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem asChild>
          <form action={unfriend.bind(null, friendshipId, profileUsername)}>
            <button
              type="submit"
              className="flex w-full cursor-pointer items-center gap-2 text-destructive"
            >
              <UserMinus className="h-3.5 w-3.5" />
              Unfriend
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
