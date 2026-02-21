"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { completeOnboarding } from "@/lib/actions";
import { LANGUAGE_COOKIE_NAME, mapUserLanguageToLocale } from "@/lib/locale";

const ONBOARDING_DRAFT_STORAGE_KEY = "boardify_onboarding_draft_v1";

type LanguageValue = "EN" | "ES";
type VisibilityValue = "PUBLIC" | "FRIENDS" | "PRIVATE";
type OnboardingDraft = {
  username: string;
  name: string;
  bio: string;
  language: LanguageValue;
  visibility: VisibilityValue;
};

function isLanguageValue(value: string): value is LanguageValue {
  return value === "EN" || value === "ES";
}

function isVisibilityValue(value: string): value is VisibilityValue {
  return value === "PUBLIC" || value === "FRIENDS" || value === "PRIVATE";
}

function parseStoredDraft(value: string | null): OnboardingDraft | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<OnboardingDraft>;
    if (
      typeof parsed.username !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.bio !== "string" ||
      !parsed.language ||
      !isLanguageValue(parsed.language) ||
      !parsed.visibility ||
      !isVisibilityValue(parsed.visibility)
    ) {
      return null;
    }

    return {
      username: parsed.username,
      name: parsed.name,
      bio: parsed.bio,
      language: parsed.language,
      visibility: parsed.visibility,
    };
  } catch {
    return null;
  }
}

export function OnboardingForm({
  defaultUsername,
  defaultName,
  defaultBio,
  defaultLanguage,
  defaultVisibility,
}: {
  defaultUsername: string;
  defaultName: string;
  defaultBio: string;
  defaultLanguage: "EN" | "ES";
  defaultVisibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
}) {
  const t = useTranslations("OnboardingForm");
  const locale = useLocale();
  const router = useRouter();
  const [state, action, isPending] = useActionState(completeOnboarding, null);
  const initialValues: OnboardingDraft = state?.values ?? {
    username: defaultUsername,
    name: defaultName,
    bio: defaultBio,
    language: defaultLanguage,
    visibility: defaultVisibility,
  };
  const [draft, setDraft] = useState<OnboardingDraft>(() => {
    if (typeof window === "undefined") {
      return initialValues;
    }

    return parseStoredDraft(sessionStorage.getItem(ONBOARDING_DRAFT_STORAGE_KEY)) ?? initialValues;
  });

  useEffect(() => {
    sessionStorage.setItem(ONBOARDING_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  function handleLanguagePreviewChange(value: string) {
    if (!isLanguageValue(value)) {
      return;
    }

    setDraft((previous) => ({
      ...previous,
      language: value,
    }));

    const nextLocale = mapUserLanguageToLocale(value) ?? "en";
    if (nextLocale === locale) {
      return;
    }

    document.cookie = `${LANGUAGE_COOKIE_NAME}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.refresh();
  }

  return (
    <form action={action} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="username">{t("username.label")}</Label>
        <Input
          id="username"
          name="username"
          value={draft.username}
          onChange={(event) =>
            setDraft((previous) => ({
              ...previous,
              username: event.target.value,
            }))}
          placeholder={t("username.placeholder")}
          maxLength={30}
        />
        {state?.errors?.username && (
          <p className="text-sm text-destructive">{state.errors.username}</p>
        )}
        {!state?.errors?.username && (
          <p className="text-xs text-muted-foreground">{t("username.helper")}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{t("name.label")}</Label>
        <Input
          id="name"
          name="name"
          value={draft.name}
          onChange={(event) =>
            setDraft((previous) => ({
              ...previous,
              name: event.target.value,
            }))}
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
          value={draft.bio}
          onChange={(event) =>
            setDraft((previous) => ({
              ...previous,
              bio: event.target.value,
            }))}
          placeholder={t("bio.placeholder")}
          maxLength={160}
          rows={3}
        />
        {state?.errors?.bio && (
          <p className="text-sm text-destructive">{state.errors.bio}</p>
        )}
        <p className="text-xs text-muted-foreground">{t("bio.helper")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="language">{t("language.label")}</Label>
        <Select
          name="language"
          value={draft.language}
          onValueChange={handleLanguagePreviewChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="EN">{t("language.english")}</SelectItem>
            <SelectItem value="ES">{t("language.spanish")}</SelectItem>
          </SelectContent>
        </Select>
        {state?.errors?.language && (
          <p className="text-sm text-destructive">{state.errors.language}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="visibility">{t("visibility.label")}</Label>
        <Select
          name="visibility"
          value={draft.visibility}
          onValueChange={(value) => {
            if (!isVisibilityValue(value)) return;
            setDraft((previous) => ({
              ...previous,
              visibility: value,
            }));
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PUBLIC">{t("visibility.public")}</SelectItem>
            <SelectItem value="FRIENDS">{t("visibility.friends")}</SelectItem>
            <SelectItem value="PRIVATE">{t("visibility.private")}</SelectItem>
          </SelectContent>
        </Select>
        {state?.errors?.visibility && (
          <p className="text-sm text-destructive">{state.errors.visibility}</p>
        )}
      </div>

      {state?.errors?.general && (
        <p className="text-sm text-destructive">{state.errors.general}</p>
      )}

      <Button type="submit" className="w-full cursor-pointer" disabled={isPending}>
        {isPending ? t("actions.saving") : t("actions.continue")}
      </Button>
    </form>
  );
}
