export const APP_LOCALES = ["en", "es"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";
export const LANGUAGE_COOKIE_NAME = "boardify_lang";

export function normalizeLocale(value: string | null | undefined): AppLocale | null {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === "es" || normalized.startsWith("es-")) return "es";
  if (normalized === "en" || normalized.startsWith("en-")) return "en";

  return null;
}

export function getPreferredLocaleFromAcceptLanguage(
  acceptLanguage: string | null | undefined,
): AppLocale {
  if (!acceptLanguage) return DEFAULT_LOCALE;

  for (const rawPart of acceptLanguage.split(",")) {
    const localePart = rawPart.trim().split(";")[0];
    const locale = normalizeLocale(localePart);
    if (locale) return locale;
  }

  return DEFAULT_LOCALE;
}

export function mapUserLanguageToLocale(language: "EN" | "ES" | null | undefined): AppLocale | null {
  if (!language) return null;
  return language === "ES" ? "es" : "en";
}

export function mapLocaleToUserLanguage(locale: string | null | undefined): "EN" | "ES" {
  const normalized = normalizeLocale(locale);
  return normalized === "es" ? "ES" : "EN";
}
