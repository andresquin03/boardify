import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { auth } from "@/lib/auth";
import {
  DEFAULT_LOCALE,
  getPreferredLocaleFromAcceptLanguage,
  LANGUAGE_COOKIE_NAME,
  mapUserLanguageToLocale,
  normalizeLocale,
} from "@/lib/locale";

export default getRequestConfig(async () => {
  const session = await auth();
  const userLocale = mapUserLanguageToLocale(session?.user?.language);

  const cookieStore = await cookies();
  const cookieLocale = normalizeLocale(cookieStore.get(LANGUAGE_COOKIE_NAME)?.value);

  const requestHeaders = await headers();
  const headerLocale = getPreferredLocaleFromAcceptLanguage(
    requestHeaders.get("accept-language"),
  );

  const locale = userLocale ?? cookieLocale ?? headerLocale ?? DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
