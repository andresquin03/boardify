import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { mapLocaleToUserLanguage } from "@/lib/locale";
import { prisma } from "@/lib/prisma";
import { OnboardingForm } from "./onboarding-form";

function getSuggestedUsernameFromEmail(email: string | null | undefined) {
  if (!email) return "";

  return (
    email
      .split("@")[0]
      ?.toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "")
      .slice(0, 30) ?? ""
  );
}

export default async function OnboardingPage() {
  const session = await auth();
  const locale = await getLocale();
  const t = await getTranslations("OnboardingPage");

  if (!session?.user) redirect("/");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      username: true,
      name: true,
      bio: true,
      language: true,
      visibility: true,
    },
  });

  if (!user) redirect("/api/auth/signout?callbackUrl=/");
  if (user.username) redirect(`/u/${user.username}`);
  const suggestedUsername = getSuggestedUsernameFromEmail(session.user.email);
  const defaultLanguage = user.language ?? mapLocaleToUserLanguage(locale);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4">
      <div className="w-full space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <OnboardingForm
          defaultUsername={user.username ?? suggestedUsername}
          defaultName={user.name ?? session.user.name ?? ""}
          defaultBio={user.bio ?? ""}
          defaultLanguage={defaultLanguage}
          defaultVisibility={user.visibility ?? "PUBLIC"}
        />
      </div>
    </div>
  );
}
