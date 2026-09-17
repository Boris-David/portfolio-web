import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getContentVersion,
  getProductionApps,
  getSiteContent,
  getTicketingApps,
} from "@/content/source";
import {
  fixtureRequestCount,
  resetFixtureState,
  withApiFixtures,
} from "../support/api-fixture";

/**
 * La frontière vers l'API : ce que le site fait de ce qu'on lui sert.
 *
 * Ces tests ne regardent pas le contenu — `content.test.ts` s'en charge — mais
 * la **mécanique** : l'adaptation, la mémoïsation, et le fait que chaque
 * référence produite pointe sur quelque chose qui existe réellement.
 */

withApiFixtures();

describe("les actifs référencés par le contenu", () => {
  const shots = path.join(process.cwd(), "public", "shots");

  /**
   * Le nom de fichier d'une capture se **déduit** de l'identifiant du média
   * servi par l'API : `jeune` → `jeune.jpg`. C'est ce qui a permis de supprimer
   * la table de correspondance — et ce qui rend ce test indispensable, parce
   * qu'une déduction fausse ne produit pas une erreur, elle produit une image
   * cassée que personne ne regarde.
   */
  it("fait correspondre un fichier à chaque capture publiée", async () => {
    const content = await getSiteContent("fr");
    const files = [
      content.hero.shotFile,
      ...content.cases.flatMap((study) =>
        study.kind === "columns" ? study.gallery.map((shot) => shot.file) : [],
      ),
    ];

    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(existsSync(path.join(shots, file)), `capture absente : ${file}`).toBe(true);
    }
  });

  /**
   * Les icônes sont nommées par **slug public** — jamais par un identifiant de
   * réseau interne — et le site en rend trois familles : la grille des
   * applications de billettique, la pile d'en-tête de l'étude de cas, et
   * l'icône de l'étude en colonnes.
   *
   * Le test porte sur **ce qui est rendu**, pas sur tout ce que la source
   * publie : `mail-orange` figure dans les applications sans jamais paraître en
   * icône, et exiger un fichier pour lui inventerait une contrainte que la page
   * n'a pas.
   */
  it("fait correspondre un fichier à chaque icône réellement rendue", async () => {
    const icons = path.join(process.cwd(), "public", "icons");
    const [content, grid] = await Promise.all([getSiteContent("fr"), getTicketingApps("fr")]);

    const rendered = new Set([
      ...grid.map((app) => app.slug),
      ...content.cases.flatMap((study) =>
        study.kind === "workstreams" ? study.iconStack : [study.iconSlug],
      ),
    ]);

    expect(rendered.size).toBeGreaterThan(30);
    for (const slug of rendered) {
      expect(existsSync(path.join(icons, `${slug}.png`)), `icône absente : ${slug}`).toBe(true);
    }
  });
});

describe("la source de contenu", () => {
  /**
   * Quatre lectures du contenu ne produisent **qu'une** requête.
   *
   * Sans ça, deux d'entre elles pourraient tomber de part et d'autre d'un
   * déploiement de l'API, et une même page porterait deux versions du contenu.
   * Le compte est relevé pour de vrai — une assertion conditionnelle serait un
   * test incapable d'échouer.
   */
  it("ne joint l'API qu'une fois par langue", async () => {
    resetFixtureState();
    await Promise.all([
      getSiteContent("fr"),
      getSiteContent("fr"),
      getProductionApps("fr"),
      getContentVersion("fr"),
    ]);
    expect(fixtureRequestCount()).toBe(1);
  });

  it("publie une empreinte de contenu non vide, la même pour les deux langues", async () => {
    const [fr, en] = await Promise.all([getContentVersion("fr"), getContentVersion("en")]);
    expect(fr).toMatch(/^[A-Za-z0-9_-]{8,}$/);
    // L'empreinte porte sur le contenu, pas sur sa traduction : les deux langues
    // décrivent la même version de la source.
    expect(en).toBe(fr);
  });

  it("refuse une réponse rendue dans une autre langue que celle demandée", async () => {
    const { readPayload } = await import("@/content/api/adapt");
    const { FIXTURES } = await import("../support/api-fixture");

    expect(() => readPayload(FIXTURES.fr, "en")).toThrow(/a répondu en « fr »/);
  });

  it("nomme le chemin exact du champ fautif quand la charge est mal formée", async () => {
    const { readPayload } = await import("@/content/api/adapt");
    const broken = structuredClone(FIXTURE_SHAPE);
    delete (broken.data.profile as Record<string, unknown>).headline;

    const payload = readPayload(broken, "fr");
    const { adapt } = await import("@/content/api/adapt");
    const { frChrome } = await import("@/content/chrome/fr");

    expect(() => adapt(payload, frChrome)).toThrow(/portfolio\.data\.profile\.headline/);
  });
});

/** Une copie profonde de la fixture française, pour les cas de charge dégradée. */
const FIXTURE_SHAPE = structuredClone(
  (await import("../fixtures/portfolio-fr.json")).default,
) as unknown as { data: { profile: unknown } };
