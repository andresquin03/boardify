"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { deleteGroupEvent } from "@/lib/actions";
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

export function DeleteEventButton({
  eventId,
  hasCalendarEvent = false,
}: {
  eventId: string;
  hasCalendarEvent?: boolean;
}) {
  const t = useTranslations("DeleteEventButton");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
        {t("button")}
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {hasCalendarEvent
                ? t.rich("dialog.descriptionWithCalendar", {
                    b: (chunks) => <strong className="font-semibold text-foreground">{chunks}</strong>,
                  })
                : t("dialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("dialog.cancel")}</AlertDialogCancel>
            <form action={deleteGroupEvent.bind(null, eventId)}>
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
