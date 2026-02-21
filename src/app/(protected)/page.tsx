import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  CalendarDays,
  Heart,
  LibraryBig,
  Network,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type QuickActionKey = "browseGames" | "connectFriends" | "joinGroups";
type FeatureKey = "collection" | "favorites" | "planning" | "wishlist" | "details";

type QuickAction = {
  key: QuickActionKey;
  icon: LucideIcon;
  iconColor: string;
  iconHoverColor: string;
  href: string;
  secondaryHref?: string;
};

const quickActions: QuickAction[] = [
  {
    key: "browseGames",
    icon: LibraryBig,
    iconColor: "text-sky-600/70",
    iconHoverColor: "group-hover:text-sky-600",
    href: "/games",
  },
  {
    key: "connectFriends",
    icon: Users,
    iconColor: "text-amber-600/70",
    iconHoverColor: "group-hover:text-amber-600",
    href: "/users",
  },
  {
    key: "joinGroups",
    icon: Network,
    iconColor: "text-cyan-600/70",
    iconHoverColor: "group-hover:text-cyan-600",
    href: "/groups",
  },
];

type Feature = {
  key: FeatureKey;
  icon: LucideIcon;
  iconColor: string;
  iconHoverColor: string;
};

const features: Feature[] = [
  {
    key: "collection",
    icon: BookOpen,
    iconColor: "text-emerald-600/70",
    iconHoverColor: "group-hover:text-emerald-600",
  },
  {
    key: "favorites",
    icon: Heart,
    iconColor: "text-rose-600/70",
    iconHoverColor: "group-hover:text-rose-600",
  },
  {
    key: "planning",
    icon: CalendarDays,
    iconColor: "text-cyan-600/70",
    iconHoverColor: "group-hover:text-cyan-600",
  },
  {
    key: "wishlist",
    icon: Bookmark,
    iconColor: "text-indigo-600/70",
    iconHoverColor: "group-hover:text-indigo-600",
  },
  {
    key: "details",
    icon: Sparkles,
    iconColor: "text-violet-600/70",
    iconHoverColor: "group-hover:text-violet-600",
  },
];

export default async function HomePage() {
  const t = await getTranslations("HomePage");

  return (
    <section className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_14%_18%,rgba(16,185,129,0.28),transparent_40%),radial-gradient(circle_at_86%_12%,rgba(56,189,248,0.26),transparent_40%),radial-gradient(circle_at_50%_92%,rgba(245,158,11,0.16),transparent_48%)] dark:bg-[radial-gradient(circle_at_14%_18%,rgba(16,185,129,0.32),transparent_42%),radial-gradient(circle_at_86%_12%,rgba(56,189,248,0.28),transparent_42%),radial-gradient(circle_at_50%_92%,rgba(245,158,11,0.18),transparent_50%)]" />

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-14">
        <section className="flex flex-col items-center gap-6 text-center">
          <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 flex items-center gap-3 duration-500">
            <span className="relative h-12 w-12">
              <Image
                src="/boardify-light.png"
                alt="Boardify"
                width={48}
                height={48}
                className="h-12 w-12 rounded-xl dark:hidden"
                priority
              />
              <Image
                src="/boardify-dark.png"
                alt="Boardify"
                width={48}
                height={48}
                className="hidden h-12 w-12 rounded-xl dark:block"
                priority
              />
            </span>
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">Boardify</h1>
          </div>
          <p className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 text-xl text-muted-foreground duration-500 delay-150 fill-mode-both sm:text-2xl">
            {t("hero.tagline")}
          </p>
        </section>

        <section className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, i) => {
            const isOddLastCard = quickActions.length % 2 !== 0 && i === quickActions.length - 1;
            return (
              <Card
                key={action.key}
                className={`motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 group rounded-2xl border shadow-sm transition-all duration-300 fill-mode-both hover:-translate-y-1.5 hover:shadow-lg hover:ring-1 hover:ring-border/80 active:translate-y-0 dark:hover:shadow-black/35 ${
                  isOddLastCard
                    ? "sm:col-span-2 sm:mx-auto sm:w-[calc((100%-1.5rem)/2)] lg:col-span-1 lg:w-auto"
                    : ""
                }`}
                style={{ animationDelay: `${450 + i * 100}ms` }}
              >
                <CardHeader>
                  <action.icon
                    className={`h-8 w-8 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 ${action.iconColor} ${action.iconHoverColor}`}
                  />
                  <CardTitle className="mt-2">{t(`quickActions.${action.key}.title`)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t(`quickActions.${action.key}.description`)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild variant="outline" className="cursor-pointer group/btn">
                      <Link href={action.href}>
                        {t(`quickActions.${action.key}.cta`)}
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                      </Link>
                    </Button>
                    {action.secondaryHref && (
                      <Button asChild variant="ghost" className="cursor-pointer">
                        <Link href={action.secondaryHref}>{t(`quickActions.${action.key}.secondaryCta`)}</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((feature, i) => {
            const isOddLastCard = features.length % 2 !== 0 && i === features.length - 1;
            return (
              <Card
                key={feature.key}
                className={`motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 group rounded-2xl border shadow-sm transition-all duration-300 fill-mode-both hover:-translate-y-1 hover:shadow-lg hover:ring-1 hover:ring-border/80 active:translate-y-0 dark:hover:shadow-black/30 ${
                  isOddLastCard
                    ? "sm:col-span-2 sm:mx-auto sm:w-[calc((100%-1.5rem)/2)] lg:col-span-1 lg:w-auto"
                    : ""
                }`}
                style={{ animationDelay: `${750 + i * 80}ms` }}
              >
                <CardHeader>
                  <feature.icon
                    className={`h-7 w-7 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 ${feature.iconColor} ${feature.iconHoverColor}`}
                  />
                  <CardTitle className="mt-2 text-base">{t(`features.${feature.key}.title`)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{t(`features.${feature.key}.description`)}</p>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </section>
  );
}
