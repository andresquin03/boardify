"use client";

import { useState } from "react";
import { Ellipsis, ShieldCheck, UserMinus } from "lucide-react";
import { promoteGroupMemberToAdmin, removeGroupMember } from "@/lib/actions";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormPendingButton } from "@/components/ui/form-pending-button";

export function MemberActionsMenu({
  groupId,
  memberId,
  memberDisplayName,
}: {
  groupId: string;
  memberId: string;
  memberDisplayName: string;
}) {
  const [isPromoteConfirmOpen, setIsPromoteConfirmOpen] = useState(false);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="cursor-pointer border-border/70 bg-card text-muted-foreground hover:bg-accent/60 hover:text-foreground active:bg-accent/75"
          >
            <Ellipsis className="h-4 w-4" />
            <span className="sr-only">Member actions</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onSelect={(event) => {
              event.preventDefault();
              setIsPromoteConfirmOpen(true);
            }}
          >
            <ShieldCheck className="h-4 w-4" />
            Promote to admin
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer gap-2"
            onSelect={(event) => {
              event.preventDefault();
              setIsRemoveConfirmOpen(true);
            }}
          >
            <UserMinus className="h-4 w-4" />
            Kick from group
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isPromoteConfirmOpen} onOpenChange={setIsPromoteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote {memberDisplayName} to admin?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be able to edit this group, invite members, and manage join requests.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <form action={promoteGroupMemberToAdmin.bind(null, groupId, memberId)}>
              <FormPendingButton
                type="submit"
                variant="outline"
                pendingText="Promoting..."
                className="w-full border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-700 sm:w-auto dark:text-emerald-400 dark:hover:text-emerald-400"
              >
                Yes, promote
              </FormPendingButton>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRemoveConfirmOpen} onOpenChange={setIsRemoveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kick {memberDisplayName} from this group?</AlertDialogTitle>
            <AlertDialogDescription>
              They will lose access to member-only actions and can join again later if allowed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <form action={removeGroupMember.bind(null, groupId, memberId)}>
              <FormPendingButton
                type="submit"
                variant="destructive"
                pendingText="Kicking..."
                className="w-full sm:w-auto"
              >
                Yes, kick
              </FormPendingButton>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
