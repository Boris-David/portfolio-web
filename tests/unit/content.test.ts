import { beforeAll, describe, expect, it } from "vitest";
import { getProductionApps, getSiteContent, getTicketingApps } from "@/content/source";
import { parseRichText } from "@/content/rich-text";
import { LOCALES } from "@/lib/site";
import type { Locale, SiteContent } from "@/content/types";
import { withApiFixtures } from "../support/api-fixture";

/**
 * Ces tests gardent le **contenu**, pas le code.
 *
 * Ils existent parce que les faits publiés sont vérifiés et arbitrés : un
 * chiffre qui dérive de sa source, ou une traduction qui manque, ne doit pas se
 * découvrir en entretien.
 *
 * Le contenu vient désormais de l'API (ADR 0002). Ces gardes n'ont donc pas
 * disparu avec les fichiers de locale — elles ont **gagné en portée** : elles ne
 * vérifient plus ce que quelqu'un a tapé ici, elles vérifient ce que la source
 * publie réellement, après adaptation, tel que le visiteur le lira.
 */

withApiFixtures();

/**
 * Le contenu adapté des deux langues, résolu une fois pour toutes les
 * assertions synchrones qui suivent.
 */
let fr: SiteContent;
let en: SiteContent;
let locales: ReadonlyArray<[Locale, SiteContent]>;

beforeAll(async () => {
  [fr, en] = await Promise.all([getSiteContent("fr"), getSiteContent("en")]);
  locales = [
    ["fr", fr],
    ["en", en],
  ];
});

/**
 * `it.each` est évalué au **chargement** du module, donc avant tout `beforeAll` :
 * les cas ne peuvent donc pas recevoir le contenu, seulement un code de langue.
 * Ils le résolvent ici, au moment où le test s'exécute.
 */
function bySource(locale: Locale): SiteContent {
  const content = locale === "fr" ? fr : en;
  if (content === undefined) throw new Error("contenu non résolu — beforeAll n'a pas tourné");
  return content;
}

describe("la grille d'applications et les chiffres annoncés", () => {
  it("publie exactement les 33 applications de billettique de la source", async () => {
    const apps = await getTicketingApps("fr");
    expect(apps).toHaveLength(33);
  });

  it("n'affiche dans la grille que des applications de billettique", async () => {
    const apps = await getTicketingApps("fr");
    expect(apps.every((app) => app.role === "ticketing")).toBe(true);
  });

  /**
   * Le « 33 » est écrit dans des phrases éditoriales. Si la source gagne ou perd
   * un réseau, ces phrases mentent — et c'est ce test qui l'empêche.
   *
   * Il ne vérifie plus les **quatre** emplacements d'autrefois. L'auteur a
   * tranché le 2026-09-16 : le chiffre reste vrai, c'est sa répétition qui a été
   * refusée — *« ce 33 là cité à plusieurs endroits, je ne suis pas sûr que ça
   * intéresse fortement les recruteurs »*. La source ne le cite donc plus qu'une
   * fois, là où la grille le démontre, et l'a retiré de la tuile de chiffres
   * comme du titre de l'étude de cas.
   *
   * Ce n'est pas un assouplissement : le test vérifie maintenant les **deux**
   * moitiés de l'arbitrage — qu'il est juste là où il est écrit, et qu'il n'est
   * pas revenu là d'où il a été retiré.
   */
  it.each(LOCALES)("annonce dans le contenu %s le nombre réel d'applications", async (locale) => {
    const content = bySource(locale);
    const count = String((await getTicketingApps(locale)).length);

    // Là où il installe l'échelle : le titre de la section que la grille prouve.
    expect(content.appsHead.title).toContain(count);
    // Et la description de référencement, seul endroit lu hors de la page.
    expect(content.meta.description).toContain(count);
  });

  /** L'autre moitié de l'arbitrage : le chiffre ne revient pas là d'où il a été retiré. */
  it.each(LOCALES)("ne remet pas le compte de réseaux en tuile ni en titre (%s)", async (locale) => {
    const content = bySource(locale);
    const count = String((await getTicketingApps(locale)).length);

    content.proof.forEach((tile) => expect(tile.value).not.toBe(count));
    const ticketingCase = content.cases.find((study) => study.kind === "workstreams");
    expect(ticketingCase?.title).not.toContain(count);
  });

  /**
   * La pile d'icônes de l'en-tête affiche 5 applications et annonce « +28 ».
   * 5 + 28 doit faire 33, sinon l'en-tête compte faux.
   */
  it.each(LOCALES)("fait tomber juste la pile d'icônes du contenu %s", async (locale) => {
    const content = bySource(locale);
    const apps = await getTicketingApps(content.locale);
    const study = content.cases.find((item) => item.kind === "workstreams");
    if (study?.kind !== "workstreams") throw new Error("étude de cas billettique absente");

    const more = Number(study.iconStackMore.replace("+", ""));
    expect(study.iconStack.length + more).toBe(apps.length);
  });

  it("ne référence que des icônes dont le slug existe dans la source", async () => {
    const apps = await getProductionApps("fr");
    const slugs = new Set(apps.map((app) => app.slug));

    for (const [, content] of locales) {
      for (const study of content.cases) {
        if (study.kind === "workstreams") {
          study.iconStack.forEach((slug) => expect(slugs).toContain(slug));
        } else {
          expect(slugs).toContain(study.iconSlug);
        }
      }
    }
  });
});

describe("la parité des deux langues", () => {
  it("expose les deux langues attendues", () => {
    expect(LOCALES).toEqual(["fr", "en"]);
  });

  it.each(LOCALES)("charge le contenu %s par sa langue", async (code) => {
    const content = bySource(code);
    // `toBe` et non `toEqual` : le contenu adapté est mémoïsé par langue, donc
    // deux appels doivent rendre **le même objet**. Une égalité structurelle
    // laisserait passer une mémoïsation cassée.
    await expect(getSiteContent(content.locale)).resolves.toBe(content);
    expect(content.locale).toBe(code);
  });

  it("décrit le même nombre de chantiers, d'expériences et de compétences", () => {
    const study = (content: SiteContent) => content.cases.find((item) => item.kind === "workstreams");
    const frCase = study(fr);
    const enCase = study(en);
    if (frCase?.kind !== "workstreams" || enCase?.kind !== "workstreams") {
      throw new Error("étude de cas billettique absente");
    }

    expect(enCase.workstreams).toHaveLength(frCase.workstreams.length);
    expect(enCase.workstreams.map((item) => item.id)).toEqual(
      frCase.workstreams.map((item) => item.id),
    );
    expect(en.background.jobs.map((job) => job.id)).toEqual(
      fr.background.jobs.map((job) => job.id),
    );
    expect(en.background.skills).toHaveLength(fr.background.skills.length);
    expect(en.proof).toHaveLength(fr.proof.length);
    expect(en.depth.map((item) => item.icon)).toEqual(fr.depth.map((item) => item.icon));
  });

  it("garde des liens sortants identiques d'une langue à l'autre", () => {
    const links = (content: SiteContent) =>
      [
        ...content.background.certifications,
        ...content.background.openProjects,
      ]
        .map((row) => row.link?.href)
        .filter(Boolean);

    expect(links(en)).toEqual(links(fr));
  });

  it("n'ouvre qu'une seule expérience au chargement", () => {
    for (const [, content] of locales) {
      const opened = content.background.jobs.filter((job) => job.openByDefault);
      expect(opened).toHaveLength(1);
      expect(opened[0].id).toBe(content.background.jobs[0].id);
    }
  });
});

describe("les règles éditoriales tenues par une garde", () => {
  const allText = (content: SiteContent) => JSON.stringify(content);

  it.each(LOCALES)("ne publie aucun autre canal de contact que l'e-mail (%s)", (locale) => {
    const content = bySource(locale);
    expect(content.contact.email).toBe("amissan.ag@outlook.fr");
    // Aucun numéro de téléphone, sous aucune forme.
    expect(allText(content)).not.toMatch(/\+33[\s.\-]?\d|0\d([\s.\-]?\d{2}){4}/);
  });

  /**
   * Arbitrages explicites de `.claude/rules/contenu-editorial.md`, chacun
   * refusé nommément par l'auteur. Les réintroduire se paie en entretien.
   */
  it.each(LOCALES)("ne réintroduit aucune formulation refusée (%s)", (locale) => {
    const content = bySource(locale);
    const text = allText(content);
    expect(text).not.toMatch(/41\s?%/);
    expect(text).not.toMatch(/12 ans d'historique|12 years of history/i);
    expect(text).not.toMatch(/développeur confirmé/i);
    expect(text).not.toMatch(/une vingtaine de réseaux/i);
    // Revendication trop large, corrigée par l'auteur le 2026-09-17.
    expect(text).not.toMatch(/à l'initiative des modules d'abstraction/i);
    expect(text).not.toMatch(/initiated the per-vendor/i);
  });

  /**
   * Le chiffre de portée décrit **l'ensemble** des applications auxquelles il a
   * contribué. La version précédente — « ~1 M d'utilisateurs sur Mail Orange » —
   * attribuait à un seul produit un chiffre de portefeuille ; retirée par
   * l'auteur le 2026-09-16.
   *
   * Le « ~ » et la mention de portée ne sont pas cosmétiques : sans eux, la
   * tuile invite à l'oral une question dont la réponse n'est pas encore adossée
   * à une source citable.
   */
  it.each(LOCALES)("borne le chiffre de portée à l'ensemble des applications (%s)", (locale) => {
    const content = bySource(locale);
    const reach = content.proof.find((tile) => tile.unit === "M");
    if (!reach) throw new Error("la tuile de portée a disparu");

    expect(reach.prefix).toBe("~");
    expect(reach.label).toMatch(
      locale === "fr" ? /applications auxquelles j'ai contribué/ : /apps I have contributed to/,
    );
    // Aucune tuile n'adosse un compte d'utilisateurs à un produit nommé.
    content.proof.forEach((tile) => expect(tile.label).not.toMatch(/Mail Orange/i));
  });

  it.each(LOCALES)("ne décrit jamais le mécanisme de l'anti-fraude (%s)", (locale) => {
    const content = bySource(locale);
    const text = allText(content).toLowerCase();
    // La bibliothèque se décrit par ce qu'elle fait, jamais par comment.
    expect(text).not.toMatch(/uiscreen|iscaptured|screencapture|detectcapture/);
  });

  it.each(LOCALES)("n'expose aucun identifiant de réseau interne (%s)", (locale) => {
    const content = bySource(locale);
    const study = content.cases.find((item) => item.kind === "workstreams");
    if (study?.kind !== "workstreams") throw new Error("étude de cas billettique absente");
    // Les icônes sont nommées par slug public, jamais « n57 », « n104 »…
    study.iconStack.forEach((slug) => expect(slug).not.toMatch(/^n\d+$/));
  });

  it.each(LOCALES)("n'emploie pas de balisage non supporté (%s)", (locale) => {
    const content = bySource(locale);
    const text = allText(content);
    expect(text).not.toMatch(/<\/?(b|i|em|strong|code|span|div|a)\b/i);
  });

  it.each(LOCALES)("referme chaque emphase ouverte (%s)", (locale) => {
    const content = bySource(locale);
    const markupFields = [
      ...content.hero.lede,
      content.appsHead.intro ?? "",
      content.casesHead.intro ?? "",
      ...content.depth.map((item) => item.body),
      ...content.background.jobs.flatMap((job) => job.bullets),
      content.contact.body,
    ];

    for (const field of markupFields) {
      expect((field.match(/\*\*/g) ?? []).length % 2, `gras non refermé : ${field}`).toBe(0);
      expect((field.match(/`/g) ?? []).length % 2, `code non refermé : ${field}`).toBe(0);
      // Le balisage doit produire au moins un nœud : aucune chaîne vide publiée.
      expect(parseRichText(field).length).toBeGreaterThan(0);
    }
  });
});
