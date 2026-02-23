"use client";

import { useActionState, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { AlertTriangle, CalendarDays, CheckCircle2, Dices, Plus, UserRound } from "lucide-react";
import { createGroupEvent, type GroupEventFormState } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormPendingButton } from "@/components/ui/form-pending-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Member = {
  userId: string;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
};

type LibraryGame = {
  id: string;
  title: string;
  ownerIds: string[];
};

type CreateEventFormProps = {
  groupId: string;
  groupSlug: string;
  members: Member[];
  libraryGames: LibraryGame[];
  calendarConnected?: boolean;
};

type EventFormDraft = {
  date: string;
  time: string;
  title: string;
  locationUserId: string;
  locationText: string;
  notes: string;
  selectedGameIds: string[];
  carriers: Record<string, string>;
};

const NO_HOST_VALUE = "__none__";
const NO_CARRIER_VALUE = "__none__";

function getDraftKey(groupId: string) {
  return `event_form_draft_${groupId}`;
}

function readDraft(groupId: string): EventFormDraft | null {
  try {
    const raw = sessionStorage.getItem(getDraftKey(groupId));
    return raw ? (JSON.parse(raw) as EventFormDraft) : null;
  } catch {
    return null;
  }
}

export function CreateEventForm({
  groupId,
  groupSlug,
  members,
  libraryGames,
  calendarConnected = false,
}: CreateEventFormProps) {
  const t = useTranslations("CreateEventForm");
  const locale = useLocale();
  const [state, action] = useActionState<GroupEventFormState, FormData>(
    createGroupEvent,
    null,
  );

  // All inputs are controlled so values survive any re-render/re-mount.
  // Initialize with defaults (must match SSR — sessionStorage is client-only).
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [title, setTitle] = useState("");
  const [locationUserId, setLocationUserId] = useState(NO_HOST_VALUE);
  const [locationText, setLocationText] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedGameIds, setSelectedGameIds] = useState<Set<string>>(new Set());
  const [carriers, setCarriers] = useState<Record<string, string>>({});
  const [withCalendar, setWithCalendar] = useState(calendarConnected);

  // Restore draft from sessionStorage after hydration (runs client-only)
  useEffect(() => {
    if (!calendarConnected) return;
    const draft = readDraft(groupId);
    if (draft) {
      setDate(draft.date);
      setTime(draft.time);
      setTitle(draft.title);
      setLocationUserId(draft.locationUserId);
      setLocationText(draft.locationText);
      setNotes(draft.notes);
      setSelectedGameIds(new Set(draft.selectedGameIds));
      setCarriers(draft.carriers);
    }
    sessionStorage.removeItem(getDraftKey(groupId));
  }, []);

  const today = new Date().toISOString().split("T")[0];

  function getUserDisplayName(user: { name: string | null; username: string | null }) {
    return user.name ?? user.username ?? "—";
  }

  function getUserInitials(user: { name: string | null; username: string | null }) {
    const display = user.name ?? user.username ?? "?";
    return display.slice(0, 2).toUpperCase();
  }

  function toggleGame(gameId: string) {
    setSelectedGameIds((prev) => {
      const next = new Set(prev);
      if (next.has(gameId)) {
        next.delete(gameId);
      } else {
        next.add(gameId);
      }
      return next;
    });
    setCarriers((prev) => {
      const next = { ...prev };
      delete next[gameId];
      return next;
    });
  }

  function setCarrier(gameId: string, userId: string) {
    setCarriers((prev) => ({ ...prev, [gameId]: userId }));
  }

  // Save all controlled state to sessionStorage before navigating to OAuth
  function saveDraft() {
    const draftData: EventFormDraft = {
      date,
      time,
      title,
      locationUserId,
      locationText,
      notes,
      selectedGameIds: Array.from(selectedGameIds),
      carriers,
    };
    sessionStorage.setItem(getDraftKey(groupId), JSON.stringify(draftData));
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="groupId" value={groupId} />

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date">{t("date.label")}</Label>
        <Input
          id="date"
          name="date"
          type="date"
          min={today}
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="block cursor-pointer [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
        />
        {state?.errors?.date && (
          <p className="text-sm text-destructive">{state.errors.date}</p>
        )}
      </div>

      {/* Time */}
      <div className="space-y-2">
        <Label htmlFor="time">{t("time.label")}</Label>
        <Input
          id="time"
          name="time"
          type="time"
          required
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="block cursor-pointer [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer"
        />
        {state?.errors?.time && (
          <p className="text-sm text-destructive">{state.errors.time}</p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">{t("title.label")}</Label>
        <Input
          id="title"
          name="title"
          type="text"
          placeholder={t("title.placeholder")}
          maxLength={100}
          autoComplete="off"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {state?.errors?.title ? (
          <p className="text-sm text-destructive">{state.errors.title}</p>
        ) : (
          <p className="text-xs text-muted-foreground">{t("title.helper")}</p>
        )}
      </div>

      {/* Location member */}
      <div className="space-y-2">
        <Label htmlFor="locationUserId">{t("locationMember.label")}</Label>
        <Select name="locationUserId" value={locationUserId} onValueChange={setLocationUserId}>
          <SelectTrigger id="locationUserId" className="w-full">
            <SelectValue placeholder={t("locationMember.placeholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_HOST_VALUE}>{t("locationMember.none")}</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.userId} value={m.userId}>
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    <AvatarImage src={m.user.image ?? undefined} />
                    <AvatarFallback className="text-[9px]">{getUserInitials(m.user)}</AvatarFallback>
                  </Avatar>
                  {getUserDisplayName(m.user)}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location text */}
      <div className="space-y-2">
        <Label htmlFor="locationText">{t("locationText.label")}</Label>
        <Input
          id="locationText"
          name="locationText"
          type="text"
          placeholder={t("locationText.placeholder")}
          maxLength={200}
          autoComplete="off"
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
        />
        {state?.errors?.locationText ? (
          <p className="text-sm text-destructive">{state.errors.locationText}</p>
        ) : (
          <p className="text-xs text-muted-foreground">{t("locationText.helper")}</p>
        )}
      </div>

      {/* Games */}
      <div className="space-y-2">
        <div className="rounded-xl border bg-card/70 p-4 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <Dices className="mt-0.5 h-4.5 w-4.5 text-emerald-500" />
              <div>
                <Label className="text-sm font-semibold">{t("games.label")}</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("games.helper")}</p>
              </div>
            </div>
            {selectedGameIds.size > 0 && (
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-400/35 bg-emerald-500/10 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {selectedGameIds.size}
              </span>
            )}
          </div>

        {libraryGames.length === 0 ? (
            <div className="rounded-lg border border-border/70 bg-background/40 px-3 py-2.5">
              <p className="text-sm text-muted-foreground">{t("games.empty")}</p>
            </div>
        ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-border/70 bg-muted/20 p-2">
              {libraryGames.map((game) => {
                const isChecked = selectedGameIds.has(game.id);
                return (
                  <div
                    key={game.id}
                    className={cn(
                      "rounded-lg border p-2 transition-colors",
                      isChecked
                        ? "border-emerald-500/45 bg-emerald-500/5"
                        : "border-border/60 bg-background/35 hover:border-emerald-500/30 hover:bg-background/50",
                    )}
                  >
                    <div className="flex items-center gap-3 px-1 py-1.5">
                      <label className="flex cursor-pointer items-center gap-3 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          name="gameIds"
                          value={game.id}
                          checked={isChecked}
                          onChange={() => toggleGame(game.id)}
                          className="peer sr-only"
                        />
                        <span
                          aria-hidden
                          className={cn(
                            "grid h-7 w-7 shrink-0 place-items-center rounded-md border transition-all duration-200",
                            "border-border/80 bg-background/80",
                            "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-500/70",
                            isChecked && "border-emerald-500 bg-emerald-500/20 shadow-[0_0_0_3px_rgba(16,185,129,0.16)]",
                          )}
                        >
                          <Plus
                            className={cn(
                              "h-4 w-4 transition-all duration-200",
                              isChecked
                                ? "scale-100 opacity-100 text-emerald-300"
                                : "scale-90 opacity-65 text-muted-foreground",
                            )}
                          />
                        </span>
                        <p className={cn("truncate text-sm", isChecked ? "font-medium" : "font-normal text-muted-foreground")}>
                          {game.title}
                        </p>
                      </label>

                      {isChecked && (
                        <>
                          <input
                            type="hidden"
                            name={`carrierUserId_${game.id}`}
                            value={carriers[game.id] ?? NO_CARRIER_VALUE}
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                title={t("games.carrierLabel")}
                                className="shrink-0 cursor-pointer rounded-full transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500/70"
                              >
                                {carriers[game.id] && carriers[game.id] !== NO_CARRIER_VALUE ? (() => {
                                  const carrier = members.find((m) => m.userId === carriers[game.id]);
                                  return carrier ? (
                                    <Avatar size="default">
                                      <AvatarImage src={carrier.user.image ?? undefined} />
                                      <AvatarFallback className="text-xs">
                                        {getUserInitials(carrier.user)}
                                      </AvatarFallback>
                                    </Avatar>
                                  ) : null;
                                })() : (
                                  <span className="relative grid h-8 w-8 place-items-center rounded-full border border-border/70 bg-background/80">
                                    <UserRound className="h-4 w-4 text-muted-foreground" />
                                    <span className="absolute -right-0.5 -bottom-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-border/60 bg-muted text-[9px] font-bold leading-none text-muted-foreground">?</span>
                                  </span>
                                )}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-44">
                              <DropdownMenuItem
                                onClick={() => setCarrier(game.id, NO_CARRIER_VALUE)}
                                className={cn(carriers[game.id] === NO_CARRIER_VALUE || !carriers[game.id] ? "font-medium" : "")}
                              >
                                {t("games.carrierNone")}
                              </DropdownMenuItem>
                              {members.filter((m) => game.ownerIds.includes(m.userId)).map((m) => (
                                <DropdownMenuItem
                                  key={m.userId}
                                  onClick={() => setCarrier(game.id, m.userId)}
                                  className={cn("gap-2", carriers[game.id] === m.userId ? "font-medium" : "")}
                                >
                                  <Avatar size="sm">
                                    <AvatarImage src={m.user.image ?? undefined} />
                                    <AvatarFallback className="text-[9px]">{getUserInitials(m.user)}</AvatarFallback>
                                  </Avatar>
                                  {getUserDisplayName(m.user)}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
        )}
        {state?.errors?.games && (
            <p className="text-sm text-destructive">{state.errors.games}</p>
        )}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">{t("notes.label")}</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder={t("notes.placeholder")}
          maxLength={500}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        {state?.errors?.notes ? (
          <p className="text-sm text-destructive">{state.errors.notes}</p>
        ) : (
          <p className="text-xs text-muted-foreground">{t("notes.helper")}</p>
        )}
      </div>

      {/* Google Calendar toggle */}
      <div className="space-y-2">
        <label
          className={cn(
            "group flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 shadow-sm transition-colors",
            withCalendar
              ? "border-emerald-500/45 bg-emerald-500/5"
              : "border-border/70 bg-card/70 hover:border-emerald-500/30 hover:bg-card/90",
          )}
        >
          <input
            type="checkbox"
            name="withCalendar"
            value="on"
            checked={withCalendar}
            onChange={(e) => setWithCalendar(e.target.checked)}
            className="peer sr-only"
          />
          <span className="min-w-0 flex-1">
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden
                className={cn(
                  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
                  withCalendar
                    ? "border-emerald-500/45 bg-emerald-500/10 text-emerald-500"
                    : "border-border/70 bg-background/50 text-muted-foreground group-hover:text-emerald-500",
                )}
              >
                <CalendarDays className="h-4.5 w-4.5" />
              </span>
              <span className="min-w-0 truncate text-sm font-medium">{t("calendar.label")}</span>
            </span>
            <span className="mt-1 block pl-[2.625rem] text-xs text-muted-foreground">
              {t("calendar.helper")}
            </span>
          </span>

          <span
            aria-hidden
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-all duration-200",
              "border-border/80 bg-background/80",
              "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-500/70",
              withCalendar &&
                "border-emerald-500 bg-emerald-500/20 shadow-[0_0_0_3px_rgba(16,185,129,0.16)]",
            )}
          >
            <Plus
              className={cn(
                "h-5 w-5 transition-all duration-200",
                withCalendar
                  ? "scale-100 opacity-100 text-emerald-300"
                  : "scale-90 opacity-65 text-muted-foreground",
              )}
            />
          </span>
        </label>

        {calendarConnected && !state?.calendarPermissionRequired && (
          <div className="mt-2 flex items-center gap-2 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p className="text-xs">{t("calendar.connected")}</p>
          </div>
        )}

        {state?.calendarPermissionRequired && (
          <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="space-y-1">
              <p className="text-xs">{t("calendar.permissionRequired")}</p>
              <Link
                href={`/api/auth/calendar-connect?groupSlug=${groupSlug}`}
                className="text-xs font-medium underline"
                onClick={saveDraft}
              >
                {t("calendar.authorizeButton")}
              </Link>
            </div>
          </div>
        )}

        {state?.errors?.calendar && (
          <p className="text-sm text-destructive">{state.errors.calendar}</p>
        )}
      </div>

      {state?.errors?.general && (
        <p className="text-sm text-destructive">{state.errors.general}</p>
      )}

      <FormPendingButton
        type="submit"
        className="w-full cursor-pointer bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700"
        pendingText={t("actions.pendingCreate")}
      >
        {t("actions.create")}
      </FormPendingButton>
    </form>
  );
}
