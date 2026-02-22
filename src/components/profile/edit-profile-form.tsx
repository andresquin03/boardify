"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfileSettings } from "@/lib/actions";

export function EditProfileForm({
  defaultName,
  defaultBio,
}: {
  defaultName: string;
  defaultBio: string;
}) {
  const t = useTranslations("EditProfileForm");
  const locale = useLocale();
  const [state, action, isPending] = useActionState(updateProfileSettings, null);

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <div className="space-y-2">
        <Label htmlFor="name">{t("name.label")}</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultName}
          placeholder={t("name.placeholder")}
          maxLength={50}
        />
        {state?.errors?.name && (
          <p className="text-sm text-destructive">{state.errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">{t("bio.label")}</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={defaultBio}
          placeholder={t("bio.placeholder")}
          maxLength={160}
          rows={3}
        />
        {state?.errors?.bio && (
          <p className="text-sm text-destructive">{state.errors.bio}</p>
        )}
        <p className="text-xs text-muted-foreground">{t("bio.helper")}</p>
      </div>

      {state?.errors?.general && (
        <p className="text-sm text-destructive">{state.errors.general}</p>
      )}

      <Button
        type="submit"
        className="w-full cursor-pointer bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700"
        disabled={isPending}
      >
        {isPending ? t("actions.pendingSave") : t("actions.save")}
      </Button>
    </form>
  );
}
