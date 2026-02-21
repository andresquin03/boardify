"use client";

import { useActionState, useState } from "react";
import { BellRing, Check, Globe, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateLanguageSettings,
  updateNotificationSettings,
  updateVisibilitySettings,
} from "@/lib/actions";
import { cn } from "@/lib/utils";

const languageOptions = {
  EN: "English",
  ES: "Spanish",
} as const;

const visibilityOptions = {
  PUBLIC: "🌐 Public profile",
  FRIENDS: "👥 Friends only",
  PRIVATE: "🔒 Private profile",
} as const;

type LanguageValue = keyof typeof languageOptions;
type VisibilityValue = keyof typeof visibilityOptions;
type NotificationOptionKey = "notifyFriendshipEvents" | "notifyGroupEvents" | "notifySystemEvents";

function NotificationToggle({
  id,
  name,
  title,
  description,
  checked,
  onChange,
}: {
  id: string;
  name: NotificationOptionKey;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        "group flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
        checked
          ? "border-emerald-500/45 bg-emerald-500/5"
          : "border-border/70 bg-background/40 hover:border-emerald-500/35"
      )}
    >
      <input
        id={id}
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md border text-emerald-200 transition-all duration-200 ease-out",
          "border-border/80 bg-background/80",
          "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-500/70",
          checked && "border-emerald-500 bg-emerald-500/20 shadow-[0_0_0_3px_rgba(16,185,129,0.16)]"
        )}
      >
        <Check
          className={cn(
            "h-4 w-4 transition-all duration-200 ease-out",
            checked ? "scale-100 opacity-100" : "scale-75 opacity-0"
          )}
        />
      </span>
      <span>
        <span className="text-sm font-medium">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

export function SettingsForms({
  defaultLanguage,
  defaultVisibility,
  defaultNotifyFriendshipEvents,
  defaultNotifyGroupEvents,
  defaultNotifySystemEvents,
}: {
  defaultLanguage: LanguageValue;
  defaultVisibility: VisibilityValue;
  defaultNotifyFriendshipEvents: boolean;
  defaultNotifyGroupEvents: boolean;
  defaultNotifySystemEvents: boolean;
}) {
  const [languageState, languageAction, isLanguagePending] = useActionState(updateLanguageSettings, null);
  const [visibilityState, visibilityAction, isVisibilityPending] = useActionState(updateVisibilitySettings, null);
  const [notificationState, notificationAction, isNotificationPending] = useActionState(updateNotificationSettings, null);

  const [language, setLanguage] = useState<LanguageValue>(defaultLanguage);
  const [visibility, setVisibility] = useState<VisibilityValue>(defaultVisibility);
  const [notifyFriendshipEvents, setNotifyFriendshipEvents] = useState(defaultNotifyFriendshipEvents);
  const [notifyGroupEvents, setNotifyGroupEvents] = useState(defaultNotifyGroupEvents);
  const [notifySystemEvents, setNotifySystemEvents] = useState(defaultNotifySystemEvents);

  return (
    <div className="mt-6 space-y-4">
      <section className="rounded-xl border bg-card/70 p-5 shadow-sm">
        <div className="mb-4 flex items-start gap-2">
          <Languages className="mt-0.5 h-4.5 w-4.5 text-sky-500" />
          <div>
            <h2 className="text-base font-semibold">Language</h2>
            <p className="text-sm text-muted-foreground">
              Choose your preferred app language.
            </p>
          </div>
        </div>

        <form action={languageAction} className="space-y-3" noValidate>
          <div className="space-y-2">
            <Label htmlFor="language">Preferred language</Label>
            <Select name="language" value={language} onValueChange={(value) => setLanguage(value as LanguageValue)}>
              <SelectTrigger id="language" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EN">{languageOptions.EN}</SelectItem>
                <SelectItem value="ES">{languageOptions.ES}</SelectItem>
              </SelectContent>
            </Select>
            {languageState?.errors?.language && (
              <p className="text-sm text-destructive">{languageState.errors.language}</p>
            )}
            {languageState?.errors?.general && (
              <p className="text-sm text-destructive">{languageState.errors.general}</p>
            )}
          </div>

          {languageState?.success && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{languageState.success}</p>
          )}

          <div className="flex justify-center md:justify-end">
            <Button
              type="submit"
              className="cursor-pointer bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700"
              disabled={isLanguagePending}
            >
              {isLanguagePending ? "Saving..." : "Save language"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border bg-card/70 p-5 shadow-sm">
        <div className="mb-4 flex items-start gap-2">
          <Globe className="mt-0.5 h-4.5 w-4.5 text-violet-500" />
          <div>
            <h2 className="text-base font-semibold">Profile visibility</h2>
            <p className="text-sm text-muted-foreground">
              Control who can access your profile details and collections.
            </p>
          </div>
        </div>

        <form action={visibilityAction} className="space-y-3" noValidate>
          <div className="space-y-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select
              name="visibility"
              value={visibility}
              onValueChange={(value) => setVisibility(value as VisibilityValue)}
            >
              <SelectTrigger id="visibility" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLIC">{visibilityOptions.PUBLIC}</SelectItem>
                <SelectItem value="FRIENDS">{visibilityOptions.FRIENDS}</SelectItem>
                <SelectItem value="PRIVATE">{visibilityOptions.PRIVATE}</SelectItem>
              </SelectContent>
            </Select>
            {visibilityState?.errors?.visibility && (
              <p className="text-sm text-destructive">{visibilityState.errors.visibility}</p>
            )}
            {visibilityState?.errors?.general && (
              <p className="text-sm text-destructive">{visibilityState.errors.general}</p>
            )}
          </div>

          {visibilityState?.success && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{visibilityState.success}</p>
          )}

          <div className="flex justify-center md:justify-end">
            <Button
              type="submit"
              className="cursor-pointer bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700"
              disabled={isVisibilityPending}
            >
              {isVisibilityPending ? "Saving..." : "Save visibility"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border bg-card/70 p-5 shadow-sm">
        <div className="mb-4 flex items-start gap-2">
          <BellRing className="mt-0.5 h-4.5 w-4.5 text-amber-500" />
          <div>
            <h2 className="text-base font-semibold">Notifications</h2>
            <p className="text-sm text-muted-foreground">
              Pick which activity categories can notify you.
            </p>
          </div>
        </div>

        <form action={notificationAction} className="space-y-3" noValidate>
          <NotificationToggle
            id="notify-friendship-events"
            name="notifyFriendshipEvents"
            checked={notifyFriendshipEvents}
            onChange={setNotifyFriendshipEvents}
            title="Friend activity"
            description="Requests received and accepted."
          />

          <NotificationToggle
            id="notify-group-events"
            name="notifyGroupEvents"
            checked={notifyGroupEvents}
            onChange={setNotifyGroupEvents}
            title="Group activity"
            description="Invitations, join requests, members, and admin changes."
          />

          <NotificationToggle
            id="notify-system-events"
            name="notifySystemEvents"
            checked={notifySystemEvents}
            onChange={setNotifySystemEvents}
            title="System activity"
            description="Other product notifications scoped as system messages."
          />

          {notificationState?.errors?.notifications && (
            <p className="text-sm text-destructive">{notificationState.errors.notifications}</p>
          )}
          {notificationState?.errors?.general && (
            <p className="text-sm text-destructive">{notificationState.errors.general}</p>
          )}

          {notificationState?.success && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">{notificationState.success}</p>
          )}

          <div className="flex justify-center md:justify-end">
            <Button
              type="submit"
              className="cursor-pointer bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700"
              disabled={isNotificationPending}
            >
              {isNotificationPending ? "Saving..." : "Save notification preferences"}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
