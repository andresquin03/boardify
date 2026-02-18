import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";

interface ProfileHeaderProps {
  user: {
    name: string | null;
    username: string | null;
    image: string | null;
  };
  isOwner: boolean;
}

export function ProfileHeader({ user, isOwner }: ProfileHeaderProps) {
  const displayName = user.name ?? user.username ?? "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
      <Avatar className="h-24 w-24 text-2xl">
        <AvatarImage src={user.image ?? undefined} alt={displayName} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-1 flex-col items-center gap-2 sm:items-start">
        <div>
          <h1 className="text-2xl font-bold">{displayName}</h1>
          {user.username && (
            <p className="text-muted-foreground">@{user.username}</p>
          )}
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer gap-1.5 transition-all hover:-translate-y-0.5 hover:shadow-sm"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit profile
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
