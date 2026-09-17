import type { Locale, ProductionApp, SiteContent } from "@/content/types";
import type { SiteChrome } from "@/content/chrome/types";
import { frChrome } from "@/content/chrome/fr";
import { enChrome } from "@/content/chrome/en";
import { adapt, adaptApps, readVerifiedAt } from "@/content/api/adapt";
import { fetchPortfolio } from "@/content/api/fetch";

/**
 * La frontière entre « d'où vient le contenu » et « comment il s'affiche ».
 *
 * Elle a tenu sa promesse : le contenu vient désormais de `portfolio-api`
 * (ADR 0002), consommé **au build** (ADR 0005), et **aucun composant n'a été
 * rouvert**. Les pages appelaient déjà `getSiteContent(locale)`, ces fonctions
 * étaient déjà `async` alors que rien n'attendait — c'est précisément ce que
 * cette anticipation achetait.
 *
 * Ce qui reste au site, c'est le **chrome** : les libellés qui n'existent que
 * parce qu'il y a une page. La ligne de partage est écrite dans
 * `chrome/types.ts` ; elle se résume à : *est du contenu ce qui resterait vrai
 * si le site n'existait pas.*
 */

const CHROME: Readonly<Record<Locale, SiteChrome>> = { fr: frChrome, en: enChrome };

/**
 * Le contenu adapté est mémoïsé comme la requête l'est.
 *
 * Pas pour le temps gagné — l'adaptation coûte une milliseconde. Pour
 * l'**identité** : toutes les pages d'une même langue partagent alors le même
 * objet, et deux rendus ne peuvent pas diverger. Sans ça, « le contenu de la
 * page » et « le contenu des métadonnées » sont deux valeurs distinctes qu'il
 * faudrait croire égales.
 */
const adapted = new Map<Locale, Promise<SiteContent>>();

export async function getSiteContent(locale: Locale): Promise<SiteContent> {
  const cached = adapted.get(locale);
  if (cached !== undefined) return cached;

  const pending = fetchPortfolio(locale).then((payload) => adapt(payload, CHROME[locale]));
  adapted.set(locale, pending);
  return pending;
}

/** Vide le cache d'adaptation — réservé aux tests, avec celui du transport. */
export function resetSiteContentCache(): void {
  adapted.clear();
}

/**
 * Les applications en production, dans l'ordre décidé par la source.
 *
 * Le tri vivait ici et n'y est plus : l'API sert une liste ordonnée, et deux
 * tris — un par client — finiraient par diverger. La localisation des
 * territoires a disparu pour la même raison : l'API sert déjà les trois
 * exonymes, et une seconde table aurait été une seconde vérité.
 */
export async function getProductionApps(locale: Locale): Promise<readonly ProductionApp[]> {
  return adaptApps((await fetchPortfolio(locale)).data);
}

/** La couche de billettique — celles dont la grille de la section 02 rend compte. */
export async function getTicketingApps(locale: Locale): Promise<readonly ProductionApp[]> {
  const apps = await getProductionApps(locale);
  return apps.filter((app) => app.role === "ticketing");
}

/** La date de vérification des identifiants App Store, publiée telle quelle. */
export async function getAppsVerifiedAt(locale: Locale): Promise<string> {
  return readVerifiedAt((await fetchPortfolio(locale)).data);
}

/**
 * L'empreinte du contenu embarqué dans cette construction.
 *
 * C'est le **témoin de fraîcheur** exigé par l'ADR 0006 : le site la publie,
 * l'API sert la sienne, et les comparer dit en une requête si la page en ligne
 * a été construite sur le contenu courant. Sans ce témoin, un site figé sur du
 * contenu périmé est indiscernable d'un site à jour.
 */
export async function getContentVersion(locale: Locale): Promise<string> {
  return (await fetchPortfolio(locale)).contentVersion;
}
