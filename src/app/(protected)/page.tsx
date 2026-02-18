import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, BookOpen, Bookmark, Heart, LibraryBig, Sparkles, Users } from "lucide-react";

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
    title: "Player-friendly planning",
    description:
      "Find games by player count and playtime so each session matches your group.",
  },
  {
    icon: Sparkles,
    iconColor: "text-violet-600/70",
    iconHoverColor: "group-hover:text-violet-600",
    title: "Detailed game pages",
    description:
      "See game info, categories, complexity, and your personal status in one place.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20">
      <section className="flex flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-3">
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
        <p className="text-xl text-muted-foreground sm:text-2xl">
          Boardify your game nights.
        </p>
        <p className="max-w-2xl text-muted-foreground">
          Organize your board games with favorites, wishlist, and owned status. Discover games faster and keep every session planned.
        </p>
      </section>

      <section className="mt-14 grid gap-6 sm:grid-cols-2">
        {quickActions.map((action) => (
          <Card
            key={action.title}
            className="group rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:ring-1 hover:ring-border/80 dark:hover:shadow-black/35"
          >
            <CardHeader>
              <action.icon
                className={`h-8 w-8 transition-all duration-200 group-hover:scale-110 ${action.iconColor} ${action.iconHoverColor}`}
              />
              <CardTitle className="mt-2">{action.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{action.description}</p>
              <Button asChild variant="outline" className="mt-4 cursor-pointer">
                <Link href={action.href}>
                  {action.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="group rounded-2xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:ring-1 hover:ring-border/80 dark:hover:shadow-black/30"
          >
            <CardHeader>
              <feature.icon
                className={`h-7 w-7 transition-all duration-200 group-hover:scale-110 ${feature.iconColor} ${feature.iconHoverColor}`}
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
  );
}
