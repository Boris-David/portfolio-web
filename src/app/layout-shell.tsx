import type { Metadata } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { IconSprite } from "@/components/Icon";
import { getContentVersion, getSiteContent } from "@/content/source";
import type { Locale } from "@/content/types";
import { absoluteUrl, LOCALES, pathForLocale, SITE_URL } from "@/lib/site";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme";
import "./globals.css";

/**
 * The skeleton shared by the two language roots.
 *
 * Each language has its own `layout.tsx` — that is what gives each one a
 * correct `<html lang>`, its own metadata and a distinct canonical URL. Both
 * delegate here so that the document structure is written only once.
 */

/**
 * The fonts are **self-hosted** by `next/font`: no request to Google Fonts, so
 * no third-party connection on the critical path, and no layout shift — Next
 * computes a fallback font with matching metrics.
 *
 * The injected variable is the one `tokens.generated.css` expects: the font
 * stack is still described by the tokens, and this loader only plugs the
 * actually-downloaded family into it.
 */
const display = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
  variable: "--font-loaded-display",
});

const text = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-loaded-text",
});

export async function buildMetadata(locale: Locale): Promise<Metadata> {
  const { meta } = await getSiteContent(locale);
  const path = pathForLocale(locale);

  return {
    metadataBase: new URL(SITE_URL),
    /**
     * The **freshness witness** required by ADR 0006.
     *
     * The fingerprint of the content this page was built on, published in the
     * page itself. The API serves its own in `meta.contentVersion`: comparing
     * the two answers, in a single request, the one question we could not ask
     * until now — *was the live site built on the current content?*
     *
     * Without it, a site frozen on stale content is **indistinguishable** from
     * an up-to-date one: everything answers 200, everything renders, and the
     * page lies.
     *
     * It travels with the page rather than in a separate file because a route
     * handler would put a Worker back on the hot path of every page view, which
     * the free hosting does not support (ADR 0005).
     */
    other: { "content-version": await getContentVersion(locale) },
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: path,
      /**
       * One `hreflang` per language, plus `x-default` pointing at the root:
       * without it, a search engine picks for itself which version to serve to
       * a visitor whose language is neither French nor English.
       */
      languages: {
        ...Object.fromEntries(LOCALES.map((code) => [code, pathForLocale(code)])),
        "x-default": pathForLocale("fr"),
      },
    },
    /**
     * The Open Graph image is not declared here: `opengraph-image.tsx` builds
     * it per route, and Next injects it itself along with its dimensions.
     * Declaring it by hand as well would produce two `og:image` tags, one of
     * them potentially wrong.
     */
    openGraph: {
      type: "profile",
      locale: locale === "fr" ? "fr_FR" : "en_GB",
      alternateLocale: locale === "fr" ? "en_GB" : "fr_FR",
      url: absoluteUrl(path),
      title: meta.title,
      description: meta.description,
      siteName: meta.title,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
    robots: { index: true, follow: true },
    /**
     * An SVG favicon generated from the tokens: 230 bytes, sharp at every size,
     * and it follows the palette. The starting template's `.ico` weighed 26,000
     * — to display the Next.js logo on a portfolio.
     */
    icons: { icon: [{ url: "/icon.svg", type: "image/svg+xml" }] },
  };
}

export function LayoutShell({
  locale,
  children,
}: {
  readonly locale: Locale;
  readonly children: React.ReactNode;
}) {
  return (
    <html lang={locale} className={`${display.variable} ${text.variable}`} suppressHydrationWarning>
      <head>
        {/* Before any paint: sets `js` and the remembered theme. See lib/theme.ts. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body>
        <IconSprite />
        {children}
      </body>
    </html>
  );
}
