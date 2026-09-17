import type { Locale } from "@/content/types";

/**
 * Les constantes de site : langues, URLs canoniques, et l'endpoint du CV.
 *
 * Tout ce qui peut changer d'un environnement à l'autre passe par une variable
 * d'environnement avec une valeur par défaut **utilisable** : une prévisualisation
 * qui plante faute d'avoir défini trois variables est une prévisualisation qu'on
 * ne fait pas.
 */

export const LOCALES = ["fr", "en"] as const satisfies readonly Locale[];

/** Le français est servi à la racine : c'est la langue de l'auteur et du marché principal. */
export const DEFAULT_LOCALE: Locale = "fr";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/**
 * `/` pour le français, `/en` pour l'anglais — de vraies routes, rendues côté
 * serveur. Une bascule de langue en JavaScript n'aurait ni URL partageable, ni
 * `hreflang` exploitable, ni page indexable par langue.
 */
export function pathForLocale(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "/" : `/${locale}`;
}

export function otherLocale(locale: Locale): Locale {
  return locale === "fr" ? "en" : "fr";
}

/** L'origine publique, utilisée pour les URLs canoniques et Open Graph. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://amissan.dev").replace(
  /\/$/,
  "",
);

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path === "/" ? "" : path}`;
}

/**
 * Le CV vient de `portfolio-api`, jamais du site.
 *
 * ADR 0004 : un seul moteur de rendu produit **un seul fichier**, servi en blob
 * au web comme à l'app iOS. Le site ne fait que relayer le lien — il n'a ni
 * feuille d'impression, ni gabarit de CV, et il ne doit pas en avoir : deux
 * gabarits, ce sont deux CV qui divergent.
 *
 * ⚠️ L'API est construite en parallèle. L'URL est câblée et configurable ; le
 * chemin assumé est documenté dans le README et dans `.env.example`. Le jour où
 * l'API tranche un autre chemin, une variable d'environnement suffit.
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.amissan.dev").replace(
  /\/$/,
  "",
);

export function cvUrl(locale: Locale): string {
  return `${API_BASE_URL}/v1/cv/${locale}.pdf`;
}
