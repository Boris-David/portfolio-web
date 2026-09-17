import { describe, expect, it } from "vitest";
import { en } from "@/content/locales/en";
import { fr } from "@/content/locales/fr";
import { getProductionApps, getSiteContent, getTicketingApps } from "@/content/source";
import { parseRichText } from "@/content/rich-text";
import { LOCALES } from "@/lib/site";
import type { SiteContent } from "@/content/types";

/**
 * Ces tests gardent le **contenu**, pas le code.
 *
 * Ils existent parce que les faits publiés sont vérifiés et arbitrés : un
 * chiffre qui dérive de sa source, ou une traduction qui manque, ne doit pas se
 * découvrir en entretien.
 */

const locales: ReadonlyArray<[string, SiteContent]> = [
  ["fr", fr],
  ["en", en],
];

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
   * Le chiffre « 33 » est écrit dans trois phrases éditoriales. Si la source de
   * contenu gagne ou perd un réseau, ces phrases mentent. Ce test est la seule
   * chose qui l'empêche.
   */
  it.each(locales)("annonce dans le contenu %s le nombre réel d'applications", async (_, content) => {
    const apps = await getTicketingApps(content.locale);
    const count = String(apps.length);

    expect(content.appsHead.title).toContain(count);
    expect(content.meta.description).toContain(count);
    expect(content.proof[0].value).toBe(count);

    const ticketingCase = content.cases.find((study) => study.kind === "workstreams");
    expect(ticketingCase?.title).toContain(count);
  });

  /**
   * La pile d'icônes de l'en-tête affiche 5 applications et annonce « +28 ».
   * 5 + 28 doit faire 33, sinon l'en-tête compte faux.
   */
  it.each(locales)("fait tomber juste la pile d'icônes du contenu %s", async (_, content) => {
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

  it.each(locales)("charge le contenu %s par sa langue", async (code, content) => {
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

  it.each(locales)("ne publie aucun autre canal de contact que l'e-mail (%s)", (_, content) => {
    expect(content.contact.email).toBe("amissan.ag@outlook.fr");
    // Aucun numéro de téléphone, sous aucune forme.
    expect(allText(content)).not.toMatch(/\+33[\s.\-]?\d|0\d([\s.\-]?\d{2}){4}/);
  });

  /**
   * Arbitrages explicites de `.claude/rules/contenu-editorial.md`, chacun
   * refusé nommément par l'auteur. Les réintroduire se paie en entretien.
   */
  it.each(locales)("ne réintroduit aucune formulation refusée (%s)", (_, content) => {
    const text = allText(content);
    expect(text).not.toMatch(/41\s?%/);
    expect(text).not.toMatch(/12 ans d'historique|12 years of history/i);
    expect(text).not.toMatch(/développeur confirmé/i);
    expect(text).not.toMatch(/une vingtaine de réseaux/i);
    // Revendication trop large, corrigée par l'auteur le 2026-09-17.
    expect(text).not.toMatch(/à l'initiative des modules d'abstraction/i);
    expect(text).not.toMatch(/initiated the per-vendor/i);
  });

  it.each(locales)("ne décrit jamais le mécanisme de l'anti-fraude (%s)", (_, content) => {
    const text = allText(content).toLowerCase();
    // La bibliothèque se décrit par ce qu'elle fait, jamais par comment.
    expect(text).not.toMatch(/uiscreen|iscaptured|screencapture|detectcapture/);
  });

  it.each(locales)("n'expose aucun identifiant de réseau interne (%s)", (_, content) => {
    const study = content.cases.find((item) => item.kind === "workstreams");
    if (study?.kind !== "workstreams") throw new Error("étude de cas billettique absente");
    // Les icônes sont nommées par slug public, jamais « n57 », « n104 »…
    study.iconStack.forEach((slug) => expect(slug).not.toMatch(/^n\d+$/));
  });

  it.each(locales)("n'emploie pas de balisage non supporté (%s)", (_, content) => {
    const text = allText(content);
    expect(text).not.toMatch(/<\/?(b|i|em|strong|code|span|div|a)\b/i);
  });

  it.each(locales)("referme chaque emphase ouverte (%s)", (_, content) => {
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
