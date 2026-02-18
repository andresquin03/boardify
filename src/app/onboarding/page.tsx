import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const session = await auth();

  if (!session?.user) redirect("/");
  if (session.user.username) redirect("/");

  const emailPrefix = session.user.email
    ?.split("@")[0]
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") ?? "";

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
          defaultUsername={emailPrefix}
          defaultName={session.user.name ?? ""}
        />
      </div>
    </div>
  );
}
