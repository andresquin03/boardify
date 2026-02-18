import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { sendFriendRequest } from "@/lib/actions";
import { Globe, Lock, UsersRound, Pencil, UserCheck, UserPlus, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileHeaderProps {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    bio: string | null;
    image: string | null;
    visibility?: "PUBLIC" | "FRIENDS" | "PRIVATE" | null;
  };
  profilePathUsername: string;
  isOwner: boolean;
  relationState?: "FRIEND" | "PENDING" | "NONE";
  canSendRequest?: boolean;
}

const visibilityConfig = {
  PUBLIC: {
    label: "Public profile",
    icon: Globe,
    className: "border-sky-400/30 bg-sky-500/10 text-sky-400",
  },
  FRIENDS: {
    label: "Friends only",
    icon: UsersRound,
    className: "border-amber-400/30 bg-amber-500/10 text-amber-400",
  },
  PRIVATE: {
    label: "Private profile",
    icon: Lock,
    className: "border-violet-400/30 bg-violet-500/10 text-violet-400",
  },
} as const;

export function ProfileHeader({
  user,
  profilePathUsername,
  isOwner,
  relationState = "NONE",
  canSendRequest = false,
}: ProfileHeaderProps) {
  const displayName = user.name ?? user.username ?? "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const visibilityKey = user.visibility ?? "PUBLIC";
  const visibility = visibilityConfig[visibilityKey];
  const VisibilityIcon = visibility.icon;

  return (
    <div className="rounded-2xl border bg-card/70 p-4 shadow-sm backdrop-blur-sm sm:p-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-5">
        <Avatar className="h-24 w-24 border-2 border-background text-2xl shadow-sm sm:h-28 sm:w-28">
          <AvatarImage src={user.image ?? undefined} alt={displayName} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex flex-1 flex-col items-center gap-3 sm:items-start">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold tracking-tight">{displayName}</h1>
            {user.username && (
              <p className="text-muted-foreground">@{user.username}</p>
            )}
            {user.bio && (
              <p className="mt-1 text-sm text-muted-foreground">{user.bio}</p>
            )}
          </div>

          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
              visibility.className,
            )}
          >
            <VisibilityIcon className="h-3.5 w-3.5" />
            {visibility.label}
          </div>

          {isOwner && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="mt-0.5 cursor-pointer gap-1.5 transition-all hover:-translate-y-0.5 hover:shadow-sm"
            >
              <Link href="/settings/profile">
                <Pencil className="h-3.5 w-3.5" />
                Edit profile
              </Link>
            </Button>
          )}

          {!isOwner && relationState === "FRIEND" && (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="mt-0.5 gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-500"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Friends
            </Button>
          )}

          {!isOwner && relationState === "PENDING" && (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="mt-0.5 gap-1.5"
            >
              <Clock3 className="h-3.5 w-3.5" />
              Request sent
            </Button>
          )}

          {!isOwner && relationState === "NONE" && canSendRequest && (
            <form action={sendFriendRequest.bind(null, user.id, profilePathUsername)}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="mt-0.5 cursor-pointer gap-1.5 transition-all hover:-translate-y-0.5 hover:shadow-sm"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Send request
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
