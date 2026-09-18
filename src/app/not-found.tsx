import Link from "next/link";
import type { Metadata } from "next";
import { LayoutShell } from "@/app/layout-shell";
import { DEFAULT_LOCALE, pathForLocale } from "@/lib/site";

/**
 * The 404 page, served by Cloudflare for any unknown URL
 * (`not_found_handling: "404-page"` in `wrangler.jsonc`).
 *
 * It lives at the root of `app/` rather than in a language group: an unknown
 * address belongs to no language, and a `not-found` placed inside a group would
 * only answer for that group's routes — not for URLs that match nothing, which
 * is precisely the case to handle.
 *
 * It therefore carries its own document. The site has two roots — one per
 * language — so no layout wraps it: `LayoutShell` gives it `<html>`, the fonts
 * and the icon sprite, exactly as it does for the other two routes.
 *
 * Without it, Next would ship its default page: "This page could not be found.",
 * in English, with no layout, on a site polished down to the chevron.
 */
/**
 * No `robots` here: Next already marks the "not found" route as `noindex`.
 * Redeclaring it produced TWO `robots` tags in the same document — a
 * duplication nothing catches, and that the test alongside did catch.
 */
export const metadata: Metadata = {
  title: "Page introuvable — Amissan Amoussou-G.",
};

export default function NotFound() {
  return (
    <LayoutShell locale={DEFAULT_LOCALE}>
      <main className="wrap not-found">
        <p className="sec-head__eyebrow">Erreur 404</p>
        <h1 className="not-found__title">Cette page n&apos;existe pas.</h1>
        <p className="hero__lede">
          Le lien est peut-être périmé, ou l&apos;adresse comporte une faute. Le portfolio, lui,
          est toujours là.
        </p>
        <div className="cta-row">
          <Link className="btn btn--primary lift press" href={pathForLocale(DEFAULT_LOCALE)}>
            Retour au portfolio
          </Link>
          <Link className="btn lift press" href={pathForLocale("en")} hrefLang="en">
            English version
          </Link>
        </div>
      </main>
    </LayoutShell>
  );
}
