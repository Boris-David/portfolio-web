import type { Metadata } from "next";
import { Fraunces, Instrument_Sans } from "next/font/google";
import { IconSprite } from "@/components/Icon";
import { getSiteContent } from "@/content/source";
import type { Locale } from "@/content/types";
import { absoluteUrl, LOCALES, pathForLocale, SITE_URL } from "@/lib/site";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme";
import "./globals.css";

/**
 * Le squelette commun aux deux racines de langue.
 *
 * Chaque langue a sa propre `layout.tsx` — c'est ce qui donne à chacune un
 * `<html lang>` juste, des métadonnées propres et une URL canonique distincte.
 * Elles délèguent toutes deux ici pour que la structure du document ne soit
 * écrite qu'une fois.
 */

/**
 * Les polices sont **auto-hébergées** par `next/font` : pas de requête vers
 * Google Fonts, donc pas de connexion tierce sur le chemin critique, et pas de
 * décalage de mise en page — Next calcule une police de repli de mêmes métriques.
 *
 * La variable injectée est celle que `tokens.generated.css` attend : la chaîne
 * de polices reste décrite par les tokens, ce chargeur ne fait qu'y brancher la
 * famille réellement téléchargée.
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
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: path,
      /**
       * `hreflang` par langue, plus `x-default` vers la racine : sans lui, un
       * moteur choisit lui-même la version à servir à un visiteur dont la langue
       * n'est ni le français ni l'anglais.
       */
      languages: {
        ...Object.fromEntries(LOCALES.map((code) => [code, pathForLocale(code)])),
        "x-default": pathForLocale("fr"),
      },
    },
    /**
     * L'image Open Graph n'est pas déclarée ici : `opengraph-image.tsx` la
     * fabrique par route, et Next l'injecte lui-même avec ses dimensions. La
     * déclarer aussi à la main produirait deux balises `og:image`, dont une
     * potentiellement fausse.
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
     * Une favicone SVG générée depuis les tokens : 230 octets, nette à toutes
     * les tailles, et qui suit la palette. Le `.ico` du gabarit de départ en
     * pesait 26 000 — pour afficher le logo de Next.js sur un portfolio.
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
        {/* Avant toute peinture : pose `js` et le thème mémorisé. Voir lib/theme.ts. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body>
        <IconSprite />
        {children}
      </body>
    </html>
  );
}
