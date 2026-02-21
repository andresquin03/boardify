import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditProfileForm } from "@/components/profile/edit-profile-form";

export default async function ProfileEditPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const profileHref = session.user.username ? `/u/${session.user.username}` : "/";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      bio: true,
    },
  });

  if (!user) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link
        href={profileHref}
        className="pressable inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to profile
      </Link>

      <div className="group mt-4 flex items-center gap-2.5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-card/70 text-sky-500 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
          <Pencil className="h-4.5 w-4.5 transition-all duration-300 motion-safe:animate-[pulse_2.8s_ease-in-out_infinite] group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95" />
        </span>
        <h1 className="text-2xl font-bold">Edit profile</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Update your public profile information.
      </p>

      <div className="mt-6 rounded-xl border bg-card/70 p-5 shadow-sm">
        <EditProfileForm
          defaultName={user.name ?? ""}
          defaultBio={user.bio ?? ""}
        />
      </div>
    </div>
  );
}
