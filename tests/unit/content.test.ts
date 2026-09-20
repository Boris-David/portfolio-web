import { beforeAll, describe, expect, it } from "vitest";
import {
  getProductionApps,
  getSiteContent,
  getTicketingApps,
} from "@/content/source";
import { parseRichText } from "@/content/rich-text";
import { LOCALES } from "@/lib/site";
import type { Locale, SiteContent } from "@/content/types";
import { withApiFixtures } from "../support/api-fixture";

/**
 * These tests guard the **content**, not the code.
 *
 * They exist because the published facts are checked and arbitrated: a figure
 * that has drifted from its source, or a missing translation, must not be
 * discovered in an interview.
 *
 * The content now comes from the API (ADR 0002). These guards therefore did not
 * disappear along with the locale files — they **gained reach**: they no longer
 * check what somebody typed here, they check what the source actually publishes,
 * after adaptation, as the visitor will read it.
 */

withApiFixtures();

/**
 * The adapted content of both locales, resolved once for all the synchronous
 * assertions that follow.
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
 * `it.each` is evaluated when the module **loads**, so before any `beforeAll`:
 * the cases therefore cannot receive the content, only a locale code. They
 * resolve it here, at the moment the test runs.
 */
function bySource(locale: Locale): SiteContent {
  const content = locale === "fr" ? fr : en;
  if (content === undefined)
    throw new Error("content not resolved — beforeAll did not run");
  return content;
}

describe("the app grid and the figures announced", () => {
  it("publishes exactly the source's 33 ticketing apps", async () => {
    const apps = await getTicketingApps("fr");
    expect(apps).toHaveLength(33);
  });

  it("shows nothing but ticketing apps in the grid", async () => {
    const apps = await getTicketingApps("fr");
    expect(apps.every((app) => app.role === "ticketing")).toBe(true);
  });

  /**
   * The "33" is written into editorial sentences. If the source gains or loses a
   * network, those sentences lie — and this test is what prevents it.
   *
   * It no longer checks the **four** places of old. The author settled it on
   * 2026-09-16: the figure is still true, it is its repetition that was refused
   * — *"ce 33 là cité à plusieurs endroits, je ne suis pas sûr que ça intéresse
   * fortement les recruteurs"*. The source therefore quotes it only once, where
   * the grid proves it, and has removed it from the figures tile and from the
   * case study's title.
   *
   * This is not a relaxation: the test now checks **both** halves of the
   * arbitration — that it is correct where it is written, and that it has not
   * come back where it was removed from.
   */
  it.each(LOCALES)(
    "announces the real number of apps in the %s content",
    async (locale) => {
      const content = bySource(locale);
      const count = String((await getTicketingApps(locale)).length);

      // Where it sets the scale: the title of the section the grid proves.
      expect(content.appsHead.title).toContain(count);
      // And the search description, the only place read outside the page.
      expect(content.meta.description).toContain(count);
    },
  );

  /** The other half of the arbitration: the figure does not come back where it was removed from. */
  it.each(LOCALES)(
    "does not put the network count back in a tile or a title (%s)",
    async (locale) => {
      const content = bySource(locale);
      const count = String((await getTicketingApps(locale)).length);

      content.proof.forEach((tile) => expect(tile.value).not.toBe(count));
      const ticketingCase = content.cases.find(
        (study) => study.kind === "workstreams",
      );
      expect(ticketingCase?.title).not.toContain(count);
    },
  );

  /**
   * The header's icon stack shows 5 apps and announces "+28". 5 + 28 has to make
   * 33, otherwise the header counts wrong.
   */
  it.each(LOCALES)(
    "makes the %s content's icon stack add up",
    async (locale) => {
      const content = bySource(locale);
      const apps = await getTicketingApps(content.locale);
      const study = content.cases.find((item) => item.kind === "workstreams");
      if (study?.kind !== "workstreams")
        throw new Error("ticketing case study missing");

      const more = Number(study.iconStackMore.replace("+", ""));
      expect(study.iconStack.length + more).toBe(apps.length);
    },
  );

  it("only references icons whose slug exists in the source", async () => {
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

describe("parity between the two locales", () => {
  it("exposes the two expected locales", () => {
    expect(LOCALES).toEqual(["fr", "en"]);
  });

  it.each(LOCALES)("loads the %s content by its locale", async (code) => {
    const content = bySource(code);
    // `toBe` and not `toEqual`: the adapted content is memoised per locale, so
    // two calls must return **the same object**. A structural equality would let
    // a broken memoisation through.
    await expect(getSiteContent(content.locale)).resolves.toBe(content);
    expect(content.locale).toBe(code);
  });

  it("describes the same number of workstreams, experiences and skills", () => {
    const study = (content: SiteContent) =>
      content.cases.find((item) => item.kind === "workstreams");
    const frCase = study(fr);
    const enCase = study(en);
    if (frCase?.kind !== "workstreams" || enCase?.kind !== "workstreams") {
      throw new Error("ticketing case study missing");
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
    expect(en.depth.map((item) => item.icon)).toEqual(
      fr.depth.map((item) => item.icon),
    );
  });

  it("keeps the outbound links identical from one locale to the other", () => {
    const links = (content: SiteContent) =>
      [...content.background.certifications, ...content.background.openProjects]
        .map((row) => row.link?.href)
        .filter(Boolean);

    expect(links(en)).toEqual(links(fr));
  });

  it("opens exactly one experience on load", () => {
    for (const [, content] of locales) {
      const opened = content.background.jobs.filter((job) => job.openByDefault);
      expect(opened).toHaveLength(1);
      expect(opened[0].id).toBe(content.background.jobs[0].id);
    }
  });
});

describe("who he is away from the code", () => {
  it.each(LOCALES)(
    "carries the sentences from the source and the labels from the chrome (%s)",
    (locale) => {
      const { personality } = bySource(locale);

      expect(personality.summary.length).toBeGreaterThan(0);
      expect(personality.interests.length).toBeGreaterThan(0);
      // The headings only exist because there is a page: they come from the
      // chrome, never from the API. The sentences under them are the opposite.
      expect(personality.title.length).toBeGreaterThan(0);
      expect(personality.interestsLabel.length).toBeGreaterThan(0);
    },
  );

  it("says the same thing in both languages, in the same number of parts", () => {
    expect(en.personality.summary).toHaveLength(fr.personality.summary.length);
    expect(en.personality.interests).toHaveLength(
      fr.personality.interests.length,
    );
    expect(en.personality.title).not.toBe(fr.personality.title);
  });
});

describe("the editorial rules held by a guard", () => {
  const allText = (content: SiteContent) => JSON.stringify(content);

  it.each(LOCALES)(
    "publishes no contact channel other than email (%s)",
    (locale) => {
      const content = bySource(locale);
      expect(content.contact.email).toBe("amissan.ag@outlook.fr");
      // No phone number, in any form.
      expect(allText(content)).not.toMatch(
        /\+33[\s.\-]?\d|0\d([\s.\-]?\d{2}){4}/,
      );
    },
  );

  /**
   * Explicit arbitrations from `.claude/rules/contenu-editorial.md`, each one
   * refused by name by the author. Reintroducing them is paid for in an
   * interview.
   */
  it.each(LOCALES)("reintroduces no refused wording (%s)", (locale) => {
    const content = bySource(locale);
    const text = allText(content);
    expect(text).not.toMatch(/41\s?%/);
    expect(text).not.toMatch(/12 ans d'historique|12 years of history/i);
    expect(text).not.toMatch(/développeur confirmé/i);
    expect(text).not.toMatch(/une vingtaine de réseaux/i);
    // Claim too broad, corrected by the author on 2026-09-17.
    expect(text).not.toMatch(/à l'initiative des modules d'abstraction/i);
    expect(text).not.toMatch(/initiated the per-vendor/i);
  });

  /**
   * The reach figure describes **the whole set** of apps he contributed to. The
   * previous version — "~1 M d'utilisateurs sur Mail Orange" — attributed a
   * portfolio-wide figure to a single product; withdrawn by the author on
   * 2026-09-16.
   *
   * The "~" and the statement of scope are not cosmetic: without them, the tile
   * invites a spoken question whose answer is not yet backed by a citable
   * source.
   */
  it.each(LOCALES)(
    "bounds the reach figure to the whole set of apps (%s)",
    (locale) => {
      const content = bySource(locale);
      const reach = content.proof.find((tile) => tile.unit === "M");
      if (!reach) throw new Error("the reach tile has disappeared");

      expect(reach.prefix).toBe("~");
      expect(reach.label).toMatch(
        locale === "fr"
          ? /applications auxquelles j'ai contribué/
          : /apps I have contributed to/,
      );
      // No tile ties a user count to a named product.
      content.proof.forEach((tile) =>
        expect(tile.label).not.toMatch(/Mail Orange/i),
      );
    },
  );

  it.each(LOCALES)(
    "never describes the anti-fraud mechanism (%s)",
    (locale) => {
      const content = bySource(locale);
      const text = allText(content).toLowerCase();
      // The library is described by what it does, never by how.
      expect(text).not.toMatch(
        /uiscreen|iscaptured|screencapture|detectcapture/,
      );
    },
  );

  it.each(LOCALES)("exposes no internal network identifier (%s)", (locale) => {
    const content = bySource(locale);
    const study = content.cases.find((item) => item.kind === "workstreams");
    if (study?.kind !== "workstreams")
      throw new Error("ticketing case study missing");
    // The icons are named by public slug, never "n57", "n104"…
    study.iconStack.forEach((slug) => expect(slug).not.toMatch(/^n\d+$/));
  });

  it.each(LOCALES)("uses no unsupported markup (%s)", (locale) => {
    const content = bySource(locale);
    const text = allText(content);
    expect(text).not.toMatch(/<\/?(b|i|em|strong|code|span|div|a)\b/i);
  });

  it.each(LOCALES)("closes every emphasis it opens (%s)", (locale) => {
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
      expect(
        (field.match(/\*\*/g) ?? []).length % 2,
        `unclosed bold: ${field}`,
      ).toBe(0);
      expect(
        (field.match(/`/g) ?? []).length % 2,
        `unclosed code: ${field}`,
      ).toBe(0);
      // The markup must produce at least one node: no empty string published.
      expect(parseRichText(field).length).toBeGreaterThan(0);
    }
  });
});
