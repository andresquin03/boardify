import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
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

type LanguageValue = "EN" | "ES";

function getPreferredLanguageFromHeader(acceptLanguage: string | null): LanguageValue {
  if (!acceptLanguage) return "EN";

  for (const rawPart of acceptLanguage.split(",")) {
    const localePart = rawPart.trim().split(";")[0]?.toLowerCase();
    if (!localePart) continue;

    const baseLanguage = localePart.split("-")[0];
    if (baseLanguage === "es") return "ES";
    if (baseLanguage === "en") return "EN";
  }

  return "EN";
}

export default async function OnboardingPage() {
  const session = await auth();
  const requestHeaders = await headers();

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
  const defaultLanguage =
    user.language ?? getPreferredLanguageFromHeader(requestHeaders.get("accept-language"));

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center px-4">
      <div className="w-full space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Welcome to Boardify</h1>
          <p className="text-sm text-muted-foreground">
            Set up your profile to get started.
          </p>
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
