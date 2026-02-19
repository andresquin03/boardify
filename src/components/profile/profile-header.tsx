import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FormPendingButton } from "@/components/ui/form-pending-button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { sendFriendRequest } from "@/lib/actions";
import {
  Globe,
  Lock,
  UsersRound,
  Pencil,
  UserPlus,
  Clock3,
  CircleHelp,
  UserRound,
  PartyPopper,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UnfriendDropdown } from "./unfriend-dropdown";
import { FriendRequestActions } from "@/app/(protected)/friends/friend-request-card";

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
  relationState?: "FRIEND" | "PENDING_SENT" | "PENDING_RECEIVED" | "NONE";
  friendshipId?: string | null;
  canSendRequest?: boolean;
  generalMatchPercent?: number;
  generalMatchUnavailable?: boolean;
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

function getMatchMeta(percent: number) {
  if (percent <= 25) {
    return {
      icon: CircleHelp,
      label: "Incompatible",
      tooltip: "For now...",
      className: "border-zinc-400/35 bg-zinc-500/10 text-zinc-500 dark:text-zinc-300",
      iconWrapClassName: "bg-zinc-500/15",
      tooltipClassName: "text-zinc-200 dark:text-zinc-700",
    };
  }

  if (percent <= 50) {
    return {
      icon: UserRound,
      label: "Compatible",
      tooltip: "You will find common ground.",
      className: "border-sky-400/35 bg-sky-500/10 text-sky-500 dark:text-sky-300",
      iconWrapClassName: "bg-sky-500/15",
      tooltipClassName: "text-sky-200 dark:text-sky-700",
    };
  }

  if (percent <= 75) {
    return {
      icon: PartyPopper,
      label: "Very compatible",
      tooltip: "Amazing chemistry!",
      className: "border-violet-400/35 bg-violet-500/10 text-violet-500 dark:text-violet-300",
      iconWrapClassName: "bg-violet-500/15",
      tooltipClassName: "text-violet-200 dark:text-violet-700",
    };
  }

  return {
    icon: Heart,
    label: "Best match",
    tooltip: "You're made for each other!",
    className: "border-rose-400/35 bg-rose-500/10 text-rose-500 dark:text-rose-300",
    iconWrapClassName: "bg-rose-500/15",
    tooltipClassName: "text-rose-200 dark:text-rose-700",
  };
}

export function ProfileHeader({
  user,
  profilePathUsername,
  isOwner,
  relationState = "NONE",
  friendshipId,
  canSendRequest = false,
  generalMatchPercent,
  generalMatchUnavailable = false,
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
  const matchMeta = typeof generalMatchPercent === "number" ? getMatchMeta(generalMatchPercent) : null;

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

          {!isOwner && relationState === "FRIEND" && friendshipId && (
            <div className="mt-0.5 flex items-center gap-2">
              <UnfriendDropdown
                friendshipId={friendshipId}
                profileUsername={profilePathUsername}
                profileDisplayName={displayName}
              />
              {(typeof generalMatchPercent === "number" && matchMeta) || generalMatchUnavailable ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    {generalMatchUnavailable ? (
                      <div className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-400/35 bg-zinc-500/10 px-2 py-1.5 text-zinc-500 dark:text-zinc-300">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-zinc-500/15">
                          <CircleHelp className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-xs font-semibold">-%</span>
                      </div>
                    ) : (
                      <div className={cn("inline-flex items-center gap-1.5 rounded-lg border px-2 py-1.5", matchMeta.className)}>
                        <span className={cn("inline-flex h-5 w-5 items-center justify-center rounded-full", matchMeta.iconWrapClassName)}>
                          <matchMeta.icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-xs font-semibold">{generalMatchPercent}%</span>
                      </div>
                    )}
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className={
                      generalMatchUnavailable
                        ? "text-zinc-200 dark:text-zinc-700"
                        : matchMeta.tooltipClassName
                    }
                  >
                    {generalMatchUnavailable
                      ? "Start adding games to your profile to track compatibility."
                      : `${matchMeta.label}: ${matchMeta.tooltip}`}
                  </TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          )}

          {!isOwner && relationState === "PENDING_SENT" && (
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

          {!isOwner && relationState === "PENDING_RECEIVED" && friendshipId && (
            <FriendRequestActions friendshipId={friendshipId} />
          )}

          {!isOwner && relationState === "NONE" && canSendRequest && (
            <form action={sendFriendRequest.bind(null, user.id, profilePathUsername)}>
              <FormPendingButton
                type="submit"
                variant="outline"
                size="sm"
                pendingText="Sending..."
                className="mt-0.5 cursor-pointer gap-1.5 transition-all hover:-translate-y-0.5 hover:shadow-sm"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Send request
              </FormPendingButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
