import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { countUnreadNotifications } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const unreadCount = await countUnreadNotifications(session.user.id);

  return NextResponse.json(
    { unreadCount },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
