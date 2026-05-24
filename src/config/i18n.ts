/**
 * Internationalization configuration (Hebrew-first, RTL-ready).
 * Product copy and full i18n routing can be added later.
 */
export const locales = ["he", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale =
  (process.env.NEXT_PUBLIC_DEFAULT_LOCALE as Locale | undefined) ?? "he";

export const localeDirection: Record<Locale, "rtl" | "ltr"> = {
  he: "rtl",
  en: "ltr",
};

export function getDirection(locale: Locale = defaultLocale): "rtl" | "ltr" {
  return localeDirection[locale] ?? "rtl";
}

export function isRtl(locale: Locale = defaultLocale): boolean {
  return getDirection(locale) === "rtl";
}
