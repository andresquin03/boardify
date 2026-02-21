"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("UserMenu");
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
        {t("signOut")}
      </DropdownMenuItem>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("signOutDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("signOutDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("signOutDialog.cancel")}</AlertDialogCancel>
            <form action={handleSignOut}>
              <FormPendingButton
                type="submit"
                variant="destructive"
                pendingText={t("signOutDialog.pending")}
                className="w-full sm:w-auto"
              >
                {t("signOutDialog.confirm")}
              </FormPendingButton>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
