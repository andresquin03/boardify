"use client";

import Link from "next/link";
import { Plus, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FormPendingButton } from "@/components/ui/form-pending-button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { sendGroupInvitation } from "@/lib/actions";

type InvitableFriend = {
  id: string;
  name: string | null;
  username: string | null;
  image: string | null;
};

export function AddMembersPopup({
  groupId,
  friends,
}: {
  groupId: string;
  friends: InvitableFriend[];
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="inline-flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-border/70 bg-card text-foreground shadow-sm transition-colors hover:bg-accent/60 active:bg-accent/75"
          aria-label="Add members"
          title="Add members"
        >
          <Plus className="h-7 w-7" />
        </button>
      </AlertDialogTrigger>

      <AlertDialogContent className="max-h-[85vh] overflow-hidden p-0 sm:max-w-xl">
        <AlertDialogHeader className="border-b border-border/60 px-6 pt-6 pb-4">
          <AlertDialogTitle>Add members</AlertDialogTitle>
          <AlertDialogDescription>
            Invite friends to join this group.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-[55vh] overflow-y-auto px-6 py-4">
          {friends.length === 0 ? (
            <p className="text-sm text-muted-foreground">No friends to invite.</p>
          ) : (
            <div className="space-y-2.5">
              {friends.map((friend) => {
                const displayName = getUserDisplayName(friend);
                return (
                  <div
                    key={friend.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/25 px-3 py-2"
                  >
                    <Link
                      href={friend.username ? `/u/${friend.username}` : "/onboarding"}
                      className="pressable min-w-0 flex items-center gap-2.5 transition-colors hover:opacity-80 active:opacity-70"
                    >
                      <Avatar>
                        <AvatarImage src={friend.image ?? undefined} alt={displayName} />
                        <AvatarFallback>{getUserInitials(displayName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{displayName}</p>
                        {friend.username && (
                          <p className="truncate text-xs text-muted-foreground">
                            @{friend.username}
                          </p>
                        )}
                      </div>
                    </Link>

                    <form action={sendGroupInvitation.bind(null, groupId, friend.id)}>
                      <FormPendingButton
                        type="submit"
                        variant="outline"
                        size="sm"
                        pendingText="Inviting..."
                        className="cursor-pointer gap-1"
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        Invite
                      </FormPendingButton>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <AlertDialogFooter className="border-t border-border/60 px-6 py-4">
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function getUserDisplayName(user: { name: string | null; username: string | null }) {
  return user.name ?? user.username ?? "User";
}

function getUserInitials(displayName: string) {
  return displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
