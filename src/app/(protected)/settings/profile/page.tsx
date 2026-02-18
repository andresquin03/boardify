import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditProfileForm } from "./edit-profile-form";

export default async function ProfileSettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      bio: true,
      visibility: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="rounded-2xl border bg-card/70 p-6 shadow-sm backdrop-blur-sm">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Edit profile</h1>
          <p className="text-sm text-muted-foreground">
            Update your public information and profile visibility.
          </p>
        </div>
        <EditProfileForm
          defaultName={user.name ?? ""}
          defaultBio={user.bio ?? ""}
          defaultVisibility={user.visibility ?? "PUBLIC"}
        />
      </div>
    </div>
  );
}
