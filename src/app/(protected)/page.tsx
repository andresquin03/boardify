import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BookOpen, Bookmark, Heart, LibraryBig, Network, Sparkles, Users } from "lucide-react";

const quickActions = [
  {
    icon: LibraryBig,
    iconColor: "text-sky-600/70",
    iconHoverColor: "group-hover:text-sky-600",
    title: "Browse games",
    description: "Explore the catalog, open game details, and filter by players or category.",
    href: "/games",
    cta: "Open catalog",
  },
  {
    icon: Bookmark,
    iconColor: "text-indigo-600/70",
    iconHoverColor: "group-hover:text-indigo-600",
    title: "Build your wishlist",
    description: "Save the games you want to play next and keep your picks organized.",
    href: "/games",
    cta: "Start wishlisting",
  },
  {
    icon: Network,
    iconColor: "text-cyan-600/70",
    iconHoverColor: "group-hover:text-cyan-600",
    title: "Join groups",
    description: "Find or create groups to organize game nights with friends and new players.",
    href: "/groups",
    cta: "Browse groups",
  },
];

const features = [
  {
    icon: BookOpen,
    iconColor: "text-emerald-600/70",
    iconHoverColor: "group-hover:text-emerald-600",
    title: "Track your collection",
    description:
      "Keep your list of owned games up to date and know what is ready for game night.",
  },
  {
    icon: Heart,
    iconColor: "text-rose-600/70",
    iconHoverColor: "group-hover:text-rose-600",
    title: "Manage favorites",
    description:
      "Highlight your all-time picks and quickly revisit the games you love most.",
  },
  {
    icon: Users,
    iconColor: "text-amber-600/70",
    iconHoverColor: "group-hover:text-amber-600",
    title: "Connect with friends",
    description:
      "Add friends, see their collections, and discover what games you have in common.",
  },
  {
    icon: Sparkles,
    iconColor: "text-violet-600/70",
    iconHoverColor: "group-hover:text-violet-600",
    title: "Detailed game pages",
    description:
      "See game info, categories, rating, difficulty, and your personal status in one place.",
  },
];

export default function HomePage() {
  return (
    <section className="relative isolate min-h-[calc(100vh-4rem)] overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_14%_18%,rgba(16,185,129,0.28),transparent_40%),radial-gradient(circle_at_86%_12%,rgba(56,189,248,0.26),transparent_40%),radial-gradient(circle_at_50%_92%,rgba(245,158,11,0.16),transparent_48%)] dark:bg-[radial-gradient(circle_at_14%_18%,rgba(16,185,129,0.32),transparent_42%),radial-gradient(circle_at_86%_12%,rgba(56,189,248,0.28),transparent_42%),radial-gradient(circle_at_50%_92%,rgba(245,158,11,0.18),transparent_50%)]" />

      <div className="mx-auto max-w-6xl px-4 py-20">
        {/* Hero */}
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
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            Boardify
          </h1>
        </div>
        <p className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 text-xl text-muted-foreground duration-500 delay-150 fill-mode-both sm:text-2xl">
          Boardify your game nights.
        </p>
        <p className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 max-w-2xl text-muted-foreground duration-500 delay-300 fill-mode-both">
          Organize your board games, connect with friends, and join groups. Track favorites, wishlists, and collections all in one place.
        </p>
        </section>

        {/* Quick actions */}
        <section className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action, i) => (
          <Card
            key={action.title}
            className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 group rounded-2xl border shadow-sm transition-all duration-300 fill-mode-both hover:-translate-y-1.5 hover:shadow-lg hover:ring-1 hover:ring-border/80 active:translate-y-0 dark:hover:shadow-black/35"
            style={{ animationDelay: `${450 + i * 100}ms` }}
          >
            <CardHeader>
              <action.icon
                className={`h-8 w-8 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 ${action.iconColor} ${action.iconHoverColor}`}
              />
              <CardTitle className="mt-2">{action.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{action.description}</p>
              <Button asChild variant="outline" className="mt-4 cursor-pointer group/btn">
                <Link href={action.href}>
                  {action.cta}
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
        </section>

        {/* Features */}
        <section className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, i) => (
          <Card
            key={feature.title}
            className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 group rounded-2xl border shadow-sm transition-all duration-300 fill-mode-both hover:-translate-y-1 hover:shadow-lg hover:ring-1 hover:ring-border/80 active:translate-y-0 dark:hover:shadow-black/30"
            style={{ animationDelay: `${750 + i * 80}ms` }}
          >
            <CardHeader>
              <feature.icon
                className={`h-7 w-7 transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6 ${feature.iconColor} ${feature.iconHoverColor}`}
              />
              <CardTitle className="mt-2 text-base">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
        </section>
      </div>
    </section>
  );
}
