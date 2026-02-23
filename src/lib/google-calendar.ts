type CalendarEventInput = {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  attendees?: Array<{ email: string }>;
};

type CalendarEventResult = {
  id: string;
  htmlLink: string;
};

type TokenRefreshResult = {
  access_token: string;
  expires_in: number;
};

export async function refreshGoogleToken(
  refreshToken: string,
): Promise<TokenRefreshResult> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID!,
      client_secret: process.env.AUTH_GOOGLE_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Google token refresh failed: ${JSON.stringify(err)}`,
    );
  }

  return res.json() as Promise<TokenRefreshResult>;
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  event: CalendarEventInput,
): Promise<CalendarEventResult> {
  const res = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Google Calendar API error: ${JSON.stringify(err)}`,
    );
  }

  return res.json() as Promise<CalendarEventResult>;
}
