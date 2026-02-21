import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { signInWithGoogleRedirect } from "@/lib/actions";
import { getSafeRedirectPath } from "@/lib/safe-redirect";
import { ArrowRight, Chrome, LibraryBig, LockKeyhole, Network, UsersRound } from "lucide-react";

interface SignInPageProps {
  searchParams: Promise<{
    callbackUrl?: string | string[];
  }>;
}

function normalizeSingleValue(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function getDestinationLabelKey(path: string) {
  if (path.startsWith("/users")) return "usersProfiles";
  if (path.startsWith("/groups")) return "groupsCommunities";
  return "allFeatures";
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const t = await getTranslations("SignInPage");
  const session = await auth();
  const params = await searchParams;

  const rawCallbackUrl = normalizeSingleValue(params.callbackUrl);
  const safeCallbackUrl = getSafeRedirectPath(rawCallbackUrl, "/");
  const redirectTo = safeCallbackUrl.startsWith("/signin") ? "/" : safeCallbackUrl;

  if (session?.user?.id) {
    redirect(redirectTo);
  }

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.18),transparent_42%),radial-gradient(circle_at_82%_12%,rgba(56,189,248,0.16),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(245,158,11,0.1),transparent_46%)]" />

      <div className="mx-auto w-full max-w-6xl">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-border/70 bg-card/75 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <div className="group flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/35 bg-emerald-500/12 text-emerald-500 shadow-sm motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
              <LockKeyhole className="h-5 w-5 transition-all duration-300 motion-safe:animate-[pulse_2.8s_ease-in-out_infinite] group-hover:scale-110 group-hover:-rotate-6 group-active:scale-95" />
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("title")}</h1>
          </div>

          <p className="mt-3 text-base text-muted-foreground">
            {t("subtitle", { destination: t(`destinations.${getDestinationLabelKey(redirectTo)}`) })}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-border/70 bg-background/45 p-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-1.5 font-medium text-foreground">
                <UsersRound className="h-4 w-4 text-violet-500" />
                {t("cards.players.title")}
              </p>
              <p className="mt-1 text-xs">{t("cards.players.description")}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/45 p-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-1.5 font-medium text-foreground">
                <Network className="h-4 w-4 text-sky-500" />
                {t("cards.groups.title")}
              </p>
              <p className="mt-1 text-xs">{t("cards.groups.description")}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/45 p-3 text-sm text-muted-foreground sm:col-span-2 lg:col-span-1">
              <p className="flex items-center gap-1.5 font-medium text-foreground">
                <LibraryBig className="h-4 w-4 text-emerald-500" />
                {t("cards.collections.title")}
              </p>
              <p className="mt-1 text-xs">{t("cards.collections.description")}</p>
            </div>
          </div>

          <form action={signInWithGoogleRedirect} className="mt-7">
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <Button
              type="submit"
              className="group w-full cursor-pointer gap-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700"
            >
              <Chrome className="h-4.5 w-4.5 transition-transform duration-200 group-hover:scale-110 group-active:scale-95" />
              {t("actions.continueWithGoogle")}
            </Button>
          </form>

          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <p>{t("footer.note")}</p>
            <Link
              href="/"
              className="pressable inline-flex items-center gap-1 font-medium text-foreground/90 hover:text-foreground"
            >
              {t("footer.backHome")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
