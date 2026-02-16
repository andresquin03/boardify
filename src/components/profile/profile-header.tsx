import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Pencil, Settings } from "lucide-react";
import type { UserProfile } from "@/lib/mock-data";

interface ProfileHeaderProps {
  user: UserProfile;
  isOwner: boolean;
}

export function ProfileHeader({ user, isOwner }: ProfileHeaderProps) {
  const initials = user.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
      <Avatar className="h-24 w-24 text-2xl">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-1 flex-col items-center gap-2 sm:items-start">
        <div>
          <h1 className="text-2xl font-bold">{user.displayName}</h1>
          <p className="text-muted-foreground">@{user.username}</p>
        </div>
        {isOwner && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Edit profile
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              Manage favorites
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
