"use client";

import { useTranslations } from "next-intl";
import { FormPendingButton } from "@/components/ui/form-pending-button";
import { Check, X } from "lucide-react";
import { acceptFriendRequest, cancelFriendRequest, rejectFriendRequest } from "@/lib/actions";

export function FriendRequestActions({ friendshipId }: { friendshipId: string }) {
  const t = useTranslations("FriendRequestActions");

  return (
    <div className="flex items-center gap-1.5">
      <form action={acceptFriendRequest.bind(null, friendshipId)}>
        <FormPendingButton
          type="submit"
          variant="outline"
          size="sm"
          pendingText={t("pending.accepting")}
          className="cursor-pointer gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400"
        >
          <Check className="h-3.5 w-3.5" />
          {t("actions.accept")}
        </FormPendingButton>
      </form>
      <form action={rejectFriendRequest.bind(null, friendshipId)}>
        <FormPendingButton
          type="submit"
          variant="outline"
          size="sm"
          pendingText={t("pending.rejecting")}
          className="cursor-pointer gap-1 border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive dark:hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
          {t("actions.reject")}
        </FormPendingButton>
      </form>
    </div>
  );
}

export function SentFriendRequestActions({ friendshipId }: { friendshipId: string }) {
  const t = useTranslations("FriendRequestActions");

  return (
    <form action={cancelFriendRequest.bind(null, friendshipId)}>
      <FormPendingButton
        type="submit"
        variant="outline"
        size="sm"
        pendingText={t("pending.cancelling")}
        className="cursor-pointer gap-1"
      >
        <X className="h-3.5 w-3.5" />
        {t("actions.cancel")}
      </FormPendingButton>
    </form>
  );
}
