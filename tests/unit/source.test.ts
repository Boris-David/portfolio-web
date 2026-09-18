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
 * The boundary towards the API: what the site does with what it is served.
 *
 * These tests do not look at the content — `content.test.ts` takes care of that
 * — but at the **mechanics**: the adaptation, the memoisation, and the fact
 * that every reference produced points at something that really exists.
 */

withApiFixtures();

describe("the assets the content references", () => {
  const shots = path.join(process.cwd(), "public", "shots");

  /**
   * A screenshot's filename is **deduced** from the media identifier the API
   * serves: `jeune` → `jeune.jpg`. That is what allowed the lookup table to be
   * removed — and what makes this test indispensable, because a wrong deduction
   * does not produce an error, it produces a broken image nobody looks at.
   */
  it("matches a file to every published screenshot", async () => {
    const content = await getSiteContent("fr");
    const files = [
      content.hero.shotFile,
      ...content.cases.flatMap((study) =>
        study.kind === "columns" ? study.gallery.map((shot) => shot.file) : [],
      ),
    ];

    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      expect(existsSync(path.join(shots, file)), `screenshot missing: ${file}`).toBe(true);
    }
  });

  /**
   * The icons are named by **public slug** — never by an internal network
   * identifier — and the site renders three families of them: the grid of
   * ticketing apps, the case study's header stack, and the columns case study's
   * icon.
   *
   * The test covers **what is rendered**, not everything the source publishes:
   * `mail-orange` appears among the apps without ever showing up as an icon,
   * and requiring a file for it would invent a constraint the page does not
   * have.
   */
  it("matches a file to every icon actually rendered", async () => {
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
      expect(existsSync(path.join(icons, `${slug}.png`)), `icon missing: ${slug}`).toBe(true);
    }
  });
});

describe("the content source", () => {
  /**
   * Four reads of the content produce **one** request.
   *
   * Without that, two of them could land on either side of an API deployment,
   * and a single page would carry two versions of the content. The count is
   * taken for real — a conditional assertion would be a test incapable of
   * failing.
   */
  it("reaches the API only once per locale", async () => {
    resetFixtureState();
    await Promise.all([
      getSiteContent("fr"),
      getSiteContent("fr"),
      getProductionApps("fr"),
      getContentVersion("fr"),
    ]);
    expect(fixtureRequestCount()).toBe(1);
  });

  it("publishes a non-empty content fingerprint, the same one for both locales", async () => {
    const [fr, en] = await Promise.all([getContentVersion("fr"), getContentVersion("en")]);
    expect(fr).toMatch(/^[A-Za-z0-9_-]{8,}$/);
    // The fingerprint covers the content, not its translation: both locales
    // describe the same version of the source.
    expect(en).toBe(fr);
  });

  it("rejects a response rendered in a language other than the one requested", async () => {
    const { readPayload } = await import("@/content/api/adapt");
    const { FIXTURES } = await import("../support/api-fixture");

    expect(() => readPayload(FIXTURES.fr, "en")).toThrow(/responded in “fr”/);
  });

  it("names the exact path of the offending field when the payload is malformed", async () => {
    const { readPayload } = await import("@/content/api/adapt");
    const broken = structuredClone(FIXTURE_SHAPE);
    delete (broken.data.profile as Record<string, unknown>).headline;

    const payload = readPayload(broken, "fr");
    const { adapt } = await import("@/content/api/adapt");
    const { frChrome } = await import("@/content/chrome/fr");

    expect(() => adapt(payload, frChrome)).toThrow(/portfolio\.data\.profile\.headline/);
  });
});

/** A deep copy of the French fixture, for the degraded-payload cases. */
const FIXTURE_SHAPE = structuredClone(
  (await import("../fixtures/portfolio-fr.json")).default,
) as unknown as { data: { profile: unknown } };

/**
 * ADR 0002, stated as a test rather than as an intention.
 *
 * A fact typed into a component is a second place that claims to know it, and
 * the two stop agreeing without anybody noticing. This one had already
 * happened: `SiteFooter` carried the author's full name as a literal while the
 * API served `profile.name.full` -- the same string, in two repositories, one
 * of which nobody would think to update.
 */
describe("no published fact is written in this repository", () => {
  withApiFixtures();

  it("reads the long form of the name from the source, and writes it nowhere", async () => {
    const { readFile, readdir } = await import("node:fs/promises");
    const { join } = await import("node:path");

    const sourceFiles = async (directory: string): Promise<string[]> => {
      const entries = await readdir(directory, { withFileTypes: true });
      const found = await Promise.all(
        entries.map(async (entry) => {
          const path = join(directory, entry.name);
          if (entry.isDirectory()) return sourceFiles(path);
          return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
        }),
      );
      return found.flat();
    };

    const { fullName, hero } = await getSiteContent("fr");

    // Asserted before the search: an empty needle makes `includes` answer true
    // for every file, so the test would either "fail" by reporting the whole
    // source tree or pass for a reason that has nothing to do with the rule.
    expect(fullName.length).toBeGreaterThan(0);
    expect(fullName).not.toBe(hero.name);

    const files = await sourceFiles("src");
    expect(files.length).toBeGreaterThan(20);

    const offenders: string[] = [];
    for (const path of files) {
      if ((await readFile(path, "utf8")).includes(fullName)) offenders.push(path);
    }

    expect(offenders).toEqual([]);
  });
});
