"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
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
import { handleSignOut } from "@/lib/actions";

export function SignOutMenuItem() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <DropdownMenuItem
        variant="destructive"
        className="cursor-pointer justify-center gap-2 text-sm font-medium"
        onSelect={(event) => {
          event.preventDefault();
          setOpen(true);
        }}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </DropdownMenuItem>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You can sign back in at any time with your Google account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <form action={handleSignOut}>
              <FormPendingButton
                type="submit"
                variant="destructive"
                pendingText="Signing out..."
                className="w-full sm:w-auto"
              >
                Yes, sign out
              </FormPendingButton>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
