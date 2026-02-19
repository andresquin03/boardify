"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteGroup } from "@/lib/actions";
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
import { FormPendingButton } from "@/components/ui/form-pending-button";

export function DeleteGroupButton({
  groupId,
  groupName,
}: {
  groupId: string;
  groupName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        className="w-full sm:w-auto"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
        Delete group
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {groupName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the group, members, and invitations.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <form action={deleteGroup.bind(null, groupId)}>
              <FormPendingButton
                type="submit"
                variant="destructive"
                pendingText="Deleting..."
                className="w-full sm:w-auto"
              >
                Yes, delete group
              </FormPendingButton>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
