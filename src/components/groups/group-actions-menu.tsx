"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Ellipsis, LogOut, Pencil, ShieldAlert } from "lucide-react";
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
import { cn } from "@/lib/utils";

export function GroupActionsMenu({
  groupId,
  groupSlug,
  isMember,
  isAdmin,
  isSoleAdmin,
  triggerClassName,
  triggerLabel,
}: {
  groupId: string;
  groupSlug: string;
  isMember: boolean;
  isAdmin: boolean;
  isSoleAdmin: boolean;
  triggerClassName?: string;
  triggerLabel?: string;
}) {
  const t = useTranslations("GroupActionsMenu");
  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);
  const canLeave = isMember && !isSoleAdmin;

  if (!isMember) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={triggerLabel ? "sm" : "icon-sm"}
            className={cn(
              "cursor-pointer border-border/70 bg-card text-muted-foreground hover:bg-accent/60 hover:text-foreground active:bg-accent/75",
              triggerClassName,
            )}
          >
            <Ellipsis className="h-4 w-4" />
            {triggerLabel ? (
              <span>{triggerLabel}</span>
            ) : (
              <span className="sr-only">{t("srOnly")}</span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {isAdmin && (
            <>
              <DropdownMenuItem asChild className="cursor-pointer gap-2">
                <Link href={`/groups/${groupSlug}/edit`}>
                  <Pencil className="h-4 w-4" />
                  {t("editGroup")}
                </Link>
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
              {t("leaveGroup")}
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuItem disabled className="gap-2">
                <ShieldAlert className="h-4 w-4" />
                {t("leaveGroup")}
              </DropdownMenuItem>
              <DropdownMenuLabel className="px-2 pb-1 text-xs leading-snug font-normal text-muted-foreground">
                {t("onlyAdminNotice")}
              </DropdownMenuLabel>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isLeaveConfirmOpen} onOpenChange={setIsLeaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("dialog.cancel")}</AlertDialogCancel>
            <form action={leaveGroup.bind(null, groupId)}>
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
