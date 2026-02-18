"use client";

import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { acceptFriendRequest, rejectFriendRequest } from "@/lib/actions";

export function FriendRequestActions({ friendshipId }: { friendshipId: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <form action={acceptFriendRequest.bind(null, friendshipId)}>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="cursor-pointer gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
        >
          <Check className="h-3.5 w-3.5" />
          Accept
        </Button>
      </form>
      <form action={rejectFriendRequest.bind(null, friendshipId)}>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="cursor-pointer gap-1"
        >
          <X className="h-3.5 w-3.5" />
          Reject
        </Button>
      </form>
    </div>
  );
}
