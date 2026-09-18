import type { Locale } from "@/content/types";

/**
 * The site constants: locales, canonical URLs, and the résumé endpoint.
 *
 * Anything that can change from one environment to another goes through an
 * environment variable with a **usable** default: a preview that blows up
 * because three variables were not set is a preview nobody runs.
 */

export const LOCALES = ["fr", "en"] as const satisfies readonly Locale[];

/** French is served at the root: it is the author's language and the primary market. */
export const DEFAULT_LOCALE: Locale = "fr";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * `/` for French, `/en` for English — real routes, rendered on the server. A
 * language switch done in JavaScript would have no shareable URL, no usable
 * `hreflang`, and no page indexable per language.
 */
export function pathForLocale(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "/" : `/${locale}`;
}

export function otherLocale(locale: Locale): Locale {
  return locale === "fr" ? "en" : "fr";
}

/** The public origin, used for the canonical and Open Graph URLs. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://amissan.dev").replace(
  /\/$/,
  "",
);

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}

/**
 * The résumé comes from `portfolio-api`, never from the site.
 *
 * ADR 0004: a single rendering engine produces **a single file**, served as a
 * blob to the web and to the iOS app alike. The site only relays the link — it
 * has no print stylesheet, no résumé template, and it must not have one: two
 * templates mean two résumés that drift apart.
 *
 * ⚠️ The API is being built in parallel. The URL is wired up and configurable;
 * the assumed path is documented in the README and in `.env.example`. The day
 * the API settles on a different path, one environment variable is enough.
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.amissan.dev").replace(
  /\/$/,
  "",
);

export function cvUrl(locale: Locale): string {
  // The last segment of the URL IS the filename: Safari on iOS ignores
  // `Content-Disposition` and names the share sheet after it. Served at
  // `/v1/cv/fr.pdf`, it was called "fr".
  return `${API_BASE_URL}/v1/cv/amissan.ag-cv-${locale}.pdf`;
}
