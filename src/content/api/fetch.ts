import type { Locale } from "@/content/types";
import { API_BASE_URL } from "@/lib/site";
import { readPayload, type PortfolioPayload } from "@/content/api/adapt";

/**
 * Le contenu, récupéré **une fois par construction**.
 *
 * ADR 0002 : la source de vérité est l'API. ADR 0005 : le site reste un export
 * entièrement statique. Les deux tiennent ensemble parce que la requête a lieu
 * au `next build`, jamais chez le visiteur — la page servie est du HTML figé,
 * et le contenu s'y trouve déjà.
 *
 * Trois propriétés valent d'être explicitées.
 *
 * **Une seule requête par langue et par construction.** Sans mémoïsation, chaque
 * page et chaque appel de métadonnées repartirait sur le réseau, et deux appels
 * pourraient tomber de part et d'autre d'un déploiement de l'API — une page du
 * site porterait alors une version du contenu, la suivante une autre. La
 * mémoïsation n'est donc pas une optimisation, c'est ce qui rend la
 * construction **cohérente avec elle-même**.
 *
 * **Un échec arrête la construction.** Pas de contenu de secours, pas de page
 * partielle : `wrangler` publierait sans broncher ce qu'on lui donne, et une
 * section vide sur l'écran d'un recruteur coûte infiniment plus cher qu'un
 * déploiement rouge.
 *
 * **Quelques réessais, pas plus.** Une coupure réseau d'une seconde ne doit pas
 * faire échouer une livraison ; une API réellement en panne doit, elle, la faire
 * échouer tout de suite. D'où un nombre de tentatives petit et borné.
 */

const ATTEMPTS = 3;
const TIMEOUT_MS = 15_000;
const BACKOFF_MS = 700;

const inFlight = new Map<Locale, Promise<PortfolioPayload>>();

export function fetchPortfolio(locale: Locale): Promise<PortfolioPayload> {
  const cached = inFlight.get(locale);
  if (cached !== undefined) return cached;

  const pending = load(locale);
  inFlight.set(locale, pending);
  return pending;
}

/** Vide le cache — réservé aux tests, qui doivent pouvoir repartir d'un état net. */
export function resetPortfolioCache(): void {
  inFlight.clear();
}

async function load(locale: Locale): Promise<PortfolioPayload> {
  const url = `${API_BASE_URL}/v1/portfolio?lang=${locale}`;
  let lastError: unknown;

  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      return readPayload(await response.json(), locale);
    } catch (error) {
      lastError = error;
      // Une charge utile mal formée ne se rejoue pas : la réponse suivante sera
      // la même. Seules les pannes de transport méritent une seconde chance.
      if (error instanceof Error && error.name === "ContentShapeError") break;
      if (attempt < ATTEMPTS) await wait(BACKOFF_MS * attempt);
    }
  }

  throw new Error(
    `Contenu introuvable sur ${url} après ${ATTEMPTS} tentatives : ${reason(lastError)}.\n` +
      "La construction s'arrête : publier le site sans son contenu servirait des " +
      "sections vides. Vérifier que l'API répond, puis relancer.",
    { cause: lastError },
  );
}

function reason(error: unknown): string {
  if (error instanceof Error) return `${error.name} — ${error.message}`;
  return String(error);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
