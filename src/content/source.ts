import type { Locale, ProductionApp, SiteContent } from "@/content/types";
import { fr } from "@/content/locales/fr";
import { en } from "@/content/locales/en";
import { localizeTerritory } from "@/content/locales/territories";
import appsData from "@/content/data/apps.json";

/**
 * La frontière entre « d'où vient le contenu » et « comment il s'affiche ».
 *
 * Aujourd'hui le contenu est local. Demain il viendra de `portfolio-api`,
 * consommé **au build** (ADR 0002 : le web ne fait aucune requête au runtime).
 * Ce port existe pour que cette bascule ne touche aucun composant : les pages
 * appellent `getSiteContent` et `getProductionApps`, jamais un fichier.
 *
 * Les deux fonctions sont `async` alors que rien n'attend ici — volontairement.
 * Une source distante est asynchrone ; rendre la signature asynchrone plus tard
 * obligerait à rouvrir chaque appelant, c'est-à-dire exactement la réécriture
 * qu'on veut éviter.
 */

interface AppsFile {
  readonly verifiedAt: string;
  readonly count: number;
  readonly apps: readonly ProductionApp[];
}

const file = appsData as unknown as AppsFile;

const CONTENT: Record<Locale, SiteContent> = { fr, en };

export async function getSiteContent(locale: Locale): Promise<SiteContent> {
  return CONTENT[locale];
}

/**
 * Les applications en production, territoire déjà rendu dans la langue
 * demandée. Le tri se fait ici et non à l'affichage : un ordre décidé par la
 * source est un ordre stable entre les deux langues, et l'ordre de la grille
 * est une information en soi.
 */
export async function getProductionApps(locale: Locale): Promise<readonly ProductionApp[]> {
  return [...file.apps]
    .map((app) => ({ ...app, territory: localizeTerritory(app.territory, locale) }))
    .sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: "base" }));
}

/** La couche de billettique — celles dont la grille de la section 02 rend compte. */
export async function getTicketingApps(locale: Locale): Promise<readonly ProductionApp[]> {
  const apps = await getProductionApps(locale);
  return apps.filter((app) => app.role === "ticketing");
}

/** La date de vérification des identifiants App Store, publiée telle quelle. */
export function getAppsVerifiedAt(): string {
  return file.verifiedAt;
}
