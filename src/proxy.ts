import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getPreferredLocaleFromAcceptLanguage,
  LANGUAGE_COOKIE_NAME,
  normalizeLocale,
} from "@/lib/locale";

const isProd = process.env.NODE_ENV === "production";

export function proxy(request: NextRequest) {
  const existingLocale = normalizeLocale(request.cookies.get(LANGUAGE_COOKIE_NAME)?.value);
  if (existingLocale) {
    return NextResponse.next();
  }

  const locale = getPreferredLocaleFromAcceptLanguage(request.headers.get("accept-language"));
  const response = NextResponse.next();
  response.cookies.set({
    name: LANGUAGE_COOKIE_NAME,
    value: locale,
    path: "/",
    sameSite: "lax",
    secure: isProd,
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
  });

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)"],
};
