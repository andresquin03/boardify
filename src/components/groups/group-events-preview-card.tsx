import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { getTranslations, getLocale } from "next-intl/server";

type PreviewEvent = {
  id: string;
  title: string | null;
  date: Date;
  locationUser: {
    id: string;
    name: string | null;
    username: string | null;
  } | null;
};

type GroupEventsPreviewCardProps = {
  groupSlug: string;
  isMember: boolean;
  previewEvent: PreviewEvent | null;
};

export function getEventDisplayTitle(
  event: { title: string | null; date: Date },
  locale: string,
): string {
  if (event.title) return event.title;
  return new Intl.DateTimeFormat(locale === "es" ? "es-AR" : "en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(event.date);
}

function getUserDisplayName(
  user: { name: string | null; username: string | null },
  fallback: string,
): string {
  return user.name ?? user.username ?? fallback;
}

export async function GroupEventsPreviewCard({
  groupSlug,
  isMember,
  previewEvent,
}: GroupEventsPreviewCardProps) {
  const t = await getTranslations("GroupDetailPage");
  const tEvents = await getTranslations("GroupEventsPage");
  const locale = await getLocale();

  return (
    <div className="mt-6 rounded-xl border bg-card/70 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-4.5 w-4.5 text-emerald-500" />
        <h2 className="text-lg font-semibold">{t("sections.events.title")}</h2>
      </div>

      {!isMember ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {t("sections.events.notMember")}
        </p>
      ) : previewEvent ? (
        <div className="mt-3">
          <Link
            href={`/groups/${groupSlug}/events/${previewEvent.id}`}
            className="flex items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2.5 transition-colors hover:bg-muted/40"
          >
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium">
                {getEventDisplayTitle(previewEvent, locale)}
              </span>
              {previewEvent.locationUser && (
                <span className="truncate text-xs text-muted-foreground">
                  {tEvents("hostedBy", {
                    name: getUserDisplayName(previewEvent.locationUser, ""),
                  })}
                </span>
              )}
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          {t("sections.events.empty")}
        </p>
      )}

      {isMember && (
        <div className="mt-4 flex justify-center">
          <Link
            href={`/groups/${groupSlug}/events`}
            className="pressable inline-flex min-h-10 min-w-44 items-center justify-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-600 transition-colors hover:bg-emerald-500/20 hover:text-emerald-500 active:bg-emerald-500/25 dark:text-emerald-400"
          >
            {t("sections.events.viewAll")}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
