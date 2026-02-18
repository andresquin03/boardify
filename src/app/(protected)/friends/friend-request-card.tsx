"use client";

import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { acceptFriendRequest, rejectFriendRequest } from "@/lib/actions";
import { useTransition } from "react";

export function FriendRequestActions({ friendshipId }: { friendshipId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        className="cursor-pointer gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
        onClick={() =>
          startTransition(() => acceptFriendRequest(friendshipId))
        }
      >
        <Check className="h-3.5 w-3.5" />
        Accept
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        className="cursor-pointer gap-1"
        onClick={() =>
          startTransition(() => rejectFriendRequest(friendshipId))
        }
      >
        <X className="h-3.5 w-3.5" />
        Reject
      </Button>
    </div>
  );
}
