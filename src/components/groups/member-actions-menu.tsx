"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("MemberActionsMenu");
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
            <span className="sr-only">{t("srOnly")}</span>
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
            {t("promoteToAdmin")}
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
            {t("kickFromGroup")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isPromoteConfirmOpen} onOpenChange={setIsPromoteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("promoteDialog.title", { memberDisplayName })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("promoteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("promoteDialog.cancel")}</AlertDialogCancel>
            <form action={promoteGroupMemberToAdmin.bind(null, groupId, memberId)}>
              <FormPendingButton
                type="submit"
                variant="outline"
                pendingText={t("promoteDialog.pending")}
                className="w-full border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-700 sm:w-auto dark:text-emerald-400 dark:hover:text-emerald-400"
              >
                {t("promoteDialog.confirm")}
              </FormPendingButton>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRemoveConfirmOpen} onOpenChange={setIsRemoveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("kickDialog.title", { memberDisplayName })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("kickDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("kickDialog.cancel")}</AlertDialogCancel>
            <form action={removeGroupMember.bind(null, groupId, memberId)}>
              <FormPendingButton
                type="submit"
                variant="destructive"
                pendingText={t("kickDialog.pending")}
                className="w-full sm:w-auto"
              >
                {t("kickDialog.confirm")}
              </FormPendingButton>
            </form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
