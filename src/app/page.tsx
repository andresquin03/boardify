import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Dice5, Heart, Users } from "lucide-react";
import { signInWithGoogle } from "@/lib/actions";

const features = [
  {
    icon: BookOpen,
    title: "Track your collection",
    description:
      "Keep a detailed catalog of every board game you own. Never forget what's on your shelf.",
  },
  {
    icon: Users,
    title: "Discover players",
    description:
      "Find other board game enthusiasts near you and connect for your next game night.",
  },
  {
    icon: Heart,
    title: "Manage favorites",
    description:
      "Curate a list of your all-time favorites and share your taste with the community.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-20">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 text-center">
        <div className="flex items-center gap-3">
          <Dice5 className="h-12 w-12" />
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            Boardify
          </h1>
        </div>
        <p className="text-xl text-muted-foreground sm:text-2xl">
          Boardify your game nights.
        </p>
        <p className="max-w-xl text-muted-foreground">
          The modern way to track your board game collection, discover fellow
          players, and organize unforgettable game nights.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <form action={signInWithGoogle}>
            <Button size="lg" className="gap-2" type="submit">
              Sign in with Google
            </Button>
          </form>
          <Button variant="outline" size="lg" asChild>
            <Link href="/games">Browse games</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="mt-24 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="rounded-2xl shadow-sm transition-shadow hover:shadow-md"
          >
            <CardHeader>
              <feature.icon className="h-8 w-8 text-primary" />
              <CardTitle className="mt-2">{feature.title}</CardTitle>
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
