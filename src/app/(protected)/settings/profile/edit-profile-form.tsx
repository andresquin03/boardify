"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateProfileSettings } from "@/lib/actions";

export function EditProfileForm({
  defaultName,
  defaultBio,
  defaultVisibility,
}: {
  defaultName: string;
  defaultBio: string;
  defaultVisibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
}) {
  const [state, action, isPending] = useActionState(updateProfileSettings, null);

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Display name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={defaultName}
          placeholder="Your Name"
          maxLength={50}
          required
        />
        {state?.errors?.name && (
          <p className="text-sm text-destructive">{state.errors.name}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={defaultBio}
          placeholder="Tell us about yourself..."
          maxLength={160}
          rows={3}
        />
        {state?.errors?.bio && (
          <p className="text-sm text-destructive">{state.errors.bio}</p>
        )}
        <p className="text-xs text-muted-foreground">Optional. Max 160 characters.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="visibility">Profile visibility</Label>
        <Select name="visibility" defaultValue={defaultVisibility}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PUBLIC">Public</SelectItem>
            <SelectItem value="FRIENDS">Friends only</SelectItem>
            <SelectItem value="PRIVATE">Private</SelectItem>
          </SelectContent>
        </Select>
        {state?.errors?.visibility && (
          <p className="text-sm text-destructive">{state.errors.visibility}</p>
        )}
      </div>

      {state?.errors?.general && (
        <p className="text-sm text-destructive">{state.errors.general}</p>
      )}

      <Button type="submit" className="w-full cursor-pointer" disabled={isPending}>
        {isPending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
