import { afterAll, beforeAll, vi } from "vitest";
import type { Locale } from "@/content/types";
import { resetPortfolioCache } from "@/content/api/fetch";
import { resetSiteContentCache } from "@/content/source";
import frFixture from "../fixtures/portfolio-fr.json";
import enFixture from "../fixtures/portfolio-en.json";

/**
 * Le contenu servi par l'API, figé — pour que les tests unitaires exercent le
 * **vrai** chemin de `source.ts` sans dépendre du réseau.
 *
 * Deux façons de tester une source distante existaient :
 *
 *   - adapter la fixture à la main dans chaque test. Rapide à écrire, et ça
 *     laisse `source.ts` — la mémoïsation, le choix du chrome, le filtrage —
 *     entièrement non testé. C'est-à-dire précisément le code nouveau ;
 *   - **remplacer le transport**, et laisser tout le reste s'exécuter pour de
 *     vrai. Retenu : le seul élément simulé est celui qu'on ne veut pas
 *     joindre, la requête HTTP elle-même.
 *
 * La fixture n'est **pas** une seconde source de vérité : c'est une capture
 * datée, et un test de contrat — `npm run test:contract` — vérifie contre l'API
 * en production qu'elle décrit toujours la même forme. Une capture qui dérive
 * sans qu'on l'apprenne redeviendrait une seconde vérité, et c'est exactement
 * ce que l'ADR 0002 refuse.
 */

export const FIXTURES: Readonly<Record<Locale, unknown>> = {
  fr: frFixture,
  en: enFixture,
};

let calls = 0;

/** Le nombre de requêtes servies depuis la pose du stub — compté, jamais supposé. */
export function fixtureRequestCount(): number {
  return calls;
}

/**
 * Repart d'un état net : caches vidés, compteur remis à zéro.
 *
 * Nécessaire au test de mémoïsation, qui doit observer la **première** lecture.
 * Les autres tests profitent au contraire du cache partagé du fichier.
 */
export function resetFixtureState(): void {
  resetPortfolioCache();
  resetSiteContentCache();
  calls = 0;
}

/**
 * Sert les fixtures à la place du réseau, pour la durée d'un fichier de tests.
 *
 * Posé en `beforeAll` — et non `beforeEach` — parce qu'un fichier de tests doit
 * pouvoir résoudre son contenu une seule fois, dans son propre `beforeAll` :
 * celui-ci s'exécute après le nôtre, l'ordre d'enregistrement suffisant à le
 * garantir puisque `withApiFixtures()` est appelée en tête de module.
 *
 * Nommée `with…` et non `use…` : le préfixe `use` désigne un hook React, et la
 * règle `rules-of-hooks` refuse — à juste titre — qu'on en appelle un au niveau
 * d'un module.
 *
 * Une URL inattendue **échoue** au lieu de renvoyer quoi que ce soit : un test
 * qui tape sans le savoir une autre route doit le découvrir tout de suite.
 */
export function withApiFixtures(): void {
  beforeAll(() => {
    resetPortfolioCache();
    resetSiteContentCache();
    calls = 0;
    vi.stubGlobal("fetch", async (input: string | URL | Request) => {
      calls += 1;
      const url = new URL(typeof input === "string" ? input : input.toString());
      const lang = url.searchParams.get("lang");

      if (!url.pathname.endsWith("/v1/portfolio") || (lang !== "fr" && lang !== "en")) {
        throw new Error(`Requête non prévue par les fixtures : ${url.toString()}`);
      }
      return new Response(JSON.stringify(FIXTURES[lang]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
  });

  afterAll(() => {
    vi.unstubAllGlobals();
    resetPortfolioCache();
    resetSiteContentCache();
  });
}
