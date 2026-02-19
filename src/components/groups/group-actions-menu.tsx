"use client";

import Link from "next/link";
import { useState } from "react";
import { Ellipsis, LogOut, Pencil, ShieldAlert, UserPlus } from "lucide-react";
import { leaveGroup } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormPendingButton } from "@/components/ui/form-pending-button";

export function GroupActionsMenu({
  groupId,
  groupSlug,
  isMember,
  isAdmin,
  isSoleAdmin,
}: {
  groupId: string;
  groupSlug: string;
  isMember: boolean;
  isAdmin: boolean;
  isSoleAdmin: boolean;
}) {
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const canLeave = isMember && !isSoleAdmin;

  if (!isMember) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon-sm"
            className="cursor-pointer border-border/70 bg-card text-muted-foreground hover:bg-accent/60 hover:text-foreground active:bg-accent/75"
          >
            <Ellipsis className="h-4 w-4" />
            <span className="sr-only">Group actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {isAdmin && (
            <>
              <DropdownMenuItem asChild className="cursor-pointer gap-2">
                <Link href={`/groups/${groupSlug}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Edit group
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled className="gap-2">
                <UserPlus className="h-4 w-4" />
                Add members (Soon)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {canLeave ? (
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer gap-2"
              onSelect={(event) => {
                event.preventDefault();
                setIsLeaveConfirmOpen(true);
              }}
            >
              <LogOut className="h-4 w-4" />
              Leave group
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem disabled className="gap-2">
                <ShieldAlert className="h-4 w-4" />
                Leave group
              </DropdownMenuItem>
              <DropdownMenuLabel className="px-2 pb-1 text-xs leading-snug font-normal text-muted-foreground">
                You are the only admin. Assign another admin first.
              </DropdownMenuLabel>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isLeaveConfirmOpen} onOpenChange={setIsLeaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this group?</AlertDialogTitle>
            <AlertDialogDescription>
              You will leave this group and lose access to member-only actions.
              You can join again later if allowed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <form action={leaveGroup.bind(null, groupId)}>
              <FormPendingButton
                type="submit"
                variant="destructive"
                pendingText="Leaving..."
                className="w-full sm:w-auto"
              >
                Yes, leave group
              </FormPendingButton>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
