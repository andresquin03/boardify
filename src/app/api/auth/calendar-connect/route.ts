import { signIn } from "@/lib/auth";
import { type NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const groupSlug = req.nextUrl.searchParams.get("groupSlug");
  const callbackUrl = groupSlug
    ? `/groups/${groupSlug}/events/new?calendarConnected=1`
    : "/groups";

  return signIn(
    "google",
    { redirectTo: callbackUrl },
    {
      scope:
        "openid email profile https://www.googleapis.com/auth/calendar.events",
      access_type: "offline",
      prompt: "consent",
    },
  );
}
