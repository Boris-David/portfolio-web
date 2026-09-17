import Link from "next/link";
import type { Metadata } from "next";
import { LayoutShell } from "@/app/layout-shell";
import { DEFAULT_LOCALE, pathForLocale } from "@/lib/site";

/**
 * La page 404, servie par Cloudflare pour toute URL inconnue
 * (`not_found_handling: "404-page"` dans `wrangler.jsonc`).
 *
 * Elle vit à la racine de `app/` et non dans un groupe de langue : une adresse
 * inconnue n'appartient à aucune langue, et un `not-found` placé dans un groupe
 * ne répondrait que pour les routes de ce groupe — pas pour les URL qui ne
 * correspondent à rien, qui sont précisément le cas à traiter.
 *
 * Elle porte donc son propre document. Le site a deux racines — une par langue —
 * donc aucune mise en page ne l'enveloppe : `LayoutShell` lui rend `<html>`,
 * les polices et le jeu d'icônes, exactement comme aux deux autres routes.
 *
 * Sans elle, Next livrait sa page par défaut : « This page could not be
 * found. », en anglais, sans mise en page, sur un site soigné jusqu'au chevron.
 */
/**
 * Pas de `robots` ici : Next marque déjà la route « introuvable » en `noindex`.
 * Le redéclarer produisait DEUX balises `robots` dans le même document — une
 * duplication que rien ne rattrape, et que le test ci-contre a attrapée.
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
