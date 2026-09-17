import { describe, expect, it } from "vitest";
import { adapt, readPayload } from "@/content/api/adapt";
import { frChrome } from "@/content/chrome/fr";
import { enChrome } from "@/content/chrome/en";
import { LOCALES } from "@/lib/site";
import { FIXTURES } from "../support/api-fixture";

/**
 * Le contrat avec `portfolio-api`, vérifié contre l'**API réelle**.
 *
 * Les tests unitaires servent une fixture : c'est ce qui les rend déterministes
 * et hors-ligne. Mais une fixture est une **capture datée**, et une capture
 * qu'on ne confronte jamais redevient une seconde source de vérité — exactement
 * ce que l'ADR 0002 refuse.
 *
 * Ce fichier est la confrontation. Il ne tourne pas dans la suite ordinaire :
 * une suite qui dépend d'un service extérieur devient rouge pour des raisons
 * qui ne regardent pas ce dépôt.
 *
 *   npm run test:contract
 *
 * Il ne compare pas les **valeurs** — le contenu a le droit de changer sans
 * prévenir, c'est même le but de toute la chaîne. Il compare la **forme** : que
 * tout ce que l'adaptateur lit soit encore là, et encore du même type.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.amissan.dev";
const CHROME = { fr: frChrome, en: enChrome };

async function live(locale: (typeof LOCALES)[number]): Promise<unknown> {
  const response = await fetch(`${BASE_URL}/v1/portfolio?lang=${locale}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  expect(response.status, `l'API a répondu ${response.status}`).toBe(200);
  return response.json();
}

describe("le contrat de contenu avec l'API", () => {
  it.each(LOCALES)(
    "sert une charge que l'adaptateur traverse entièrement (%s)",
    async (locale) => {
      const payload = readPayload(await live(locale), locale);

      // `adapt` lit chaque champ dont le site a besoin et lève sur le premier
      // qui manque, avec son chemin. Le faire tourner en entier est donc la
      // vérification de forme la plus complète possible — et la seule qui ne
      // puisse pas dériver de ce que le site lit réellement.
      const content = adapt(payload, CHROME[locale]);

      expect(content.locale).toBe(locale);
      expect(content.cases.length).toBeGreaterThan(0);
      expect(content.background.jobs.length).toBeGreaterThan(0);
    },
    30_000,
  );

  /**
   * La fixture décrit-elle encore la même **forme** que l'API ?
   *
   * On compare les arbres de clés, pas les valeurs : une phrase réécrite ou un
   * réseau ajouté ne doit rien casser ici — c'est du contenu, et il a le droit
   * de bouger. Un champ **renommé, ajouté ou retiré**, en revanche, rend la
   * fixture menteuse : les tests unitaires continueraient de passer sur une
   * forme qui n'existe plus.
   */
  it.each(LOCALES)("garde la fixture alignée sur la forme servie (%s)", async (locale) => {
    const fixture = shapeOf(FIXTURES[locale]);
    const served = shapeOf(await live(locale));

    const missing = [...fixture].filter((path) => !served.has(path));
    const added = [...served].filter((path) => !fixture.has(path));

    expect(
      { missing, added },
      "La fixture a dérivé de l'API. Régénérer :\n" +
        `  curl -s "${BASE_URL}/v1/portfolio?lang=${locale}" | ` +
        `python3 -m json.tool > tests/fixtures/portfolio-${locale}.json`,
    ).toEqual({ missing: [], added: [] });
  }, 30_000);
});

/**
 * L'ensemble des chemins typés d'une valeur, les index de liste effacés.
 *
 * `data.experience[0].start` et `data.experience[2].start` donnent le même
 * chemin : la forme d'une collection est celle de ses éléments, pas son compte.
 * Le type est conservé — renommer un champ *et* changer son type doit se voir
 * comme deux écarts, pas comme un seul.
 */
function shapeOf(value: unknown, path = "", into = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) shapeOf(item, `${path}[]`, into);
    return into;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      shapeOf(child, path === "" ? key : `${path}.${key}`, into);
    }
    return into;
  }
  into.add(`${path}: ${value === null ? "null" : typeof value}`);
  return into;
}
