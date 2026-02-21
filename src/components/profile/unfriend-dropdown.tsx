"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  profileDisplayName,
}: {
  friendshipId: string;
  profileUsername: string;
  profileDisplayName?: string;
}) {
  const t = useTranslations("UserProfileUnfriend");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const targetName = profileDisplayName ?? `@${profileUsername}`;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="mt-0.5 cursor-pointer gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-500 transition-all hover:-translate-y-0.5 hover:bg-emerald-500/20 hover:text-emerald-500 hover:shadow-sm"
          >
            <UserCheck className="h-3.5 w-3.5" />
            {t("friends")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer justify-center gap-2 text-sm font-medium"
            onSelect={(event) => {
              event.preventDefault();
              setIsConfirmOpen(true);
            }}
          >
            <UserMinus className="h-3.5 w-3.5" />
            {t("unfriend")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialog.title", { targetName })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("dialog.cancel")}</AlertDialogCancel>
            <form action={unfriend.bind(null, friendshipId, profileUsername)}>
              <FormPendingButton
                type="submit"
                variant="destructive"
                pendingText={t("dialog.pending")}
                className="w-full sm:w-auto"
              >
                {t("dialog.confirm")}
              </FormPendingButton>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
