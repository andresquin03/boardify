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
import { completeOnboarding } from "@/lib/actions";

const visibilityConfig = {
  PUBLIC: {
    label: "🌐 Public profile",
  },
  FRIENDS: {
    label: "👥 Friends only",
  },
  PRIVATE: {
    label: "🔒 Private profile",
  },
} as const;

export function OnboardingForm({
  defaultUsername,
  defaultName,
  defaultBio,
  defaultVisibility,
}: {
  defaultUsername: string;
  defaultName: string;
  defaultBio: string;
  defaultVisibility: "PUBLIC" | "FRIENDS" | "PRIVATE";
}) {
  const [state, action, isPending] = useActionState(completeOnboarding, null);
  const initialValues = state?.values ?? {
    username: defaultUsername,
    name: defaultName,
    bio: defaultBio,
    visibility: defaultVisibility,
  };
  const formKey = `${initialValues.username}|${initialValues.name}|${initialValues.bio}|${initialValues.visibility}`;

  return (
    <form key={formKey} action={action} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          defaultValue={initialValues.username}
          placeholder="your-username"
          maxLength={30}
        />
        {state?.errors?.username && (
          <p className="text-sm text-destructive">{state.errors.username}</p>
        )}
        {!state?.errors?.username && (
          <p className="text-xs text-muted-foreground">
            3-30 characters. Lowercase letters, numbers, dots, underscores and hyphens.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Display name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={initialValues.name}
          placeholder="Your Name"
          maxLength={50}
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
          defaultValue={initialValues.bio}
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
        <Select name="visibility" defaultValue={initialValues.visibility}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PUBLIC">{visibilityConfig.PUBLIC.label}</SelectItem>
            <SelectItem value="FRIENDS">{visibilityConfig.FRIENDS.label}</SelectItem>
            <SelectItem value="PRIVATE">{visibilityConfig.PRIVATE.label}</SelectItem>
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
        {isPending ? "Saving..." : "Continue"}
      </Button>
    </form>
  );
}
