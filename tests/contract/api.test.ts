import { describe, expect, it } from "vitest";
import { adapt, readPayload } from "@/content/api/adapt";
import { frChrome } from "@/content/chrome/fr";
import { enChrome } from "@/content/chrome/en";
import { LOCALES } from "@/lib/site";
import { FIXTURES } from "../support/api-fixture";

/**
 * The contract with `portfolio-api`, checked against the **real API**.
 *
 * The unit tests serve a fixture: that is what makes them deterministic and
 * offline. But a fixture is a **dated snapshot**, and a snapshot that is never
 * confronted becomes a second source of truth again — exactly what ADR 0002
 * rules out.
 *
 * This file is the confrontation. It does not run in the ordinary suite: a suite
 * that depends on an outside service goes red for reasons that have nothing to
 * do with this repository.
 *
 *   npm run test:contract
 *
 * It does not compare **values** — the content is allowed to change without
 * warning, that is the whole point of the chain. It compares the **shape**: that
 * everything the adapter reads is still there, and still of the same type.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.amissan.dev";
const CHROME = { fr: frChrome, en: enChrome };

async function live(locale: (typeof LOCALES)[number]): Promise<unknown> {
  const response = await fetch(`${BASE_URL}/v1/portfolio?lang=${locale}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  });
  expect(response.status, `the API responded ${response.status}`).toBe(200);
  return response.json();
}

describe("the content contract with the API", () => {
  it.each(LOCALES)(
    "serves a payload the adapter traverses in full (%s)",
    async (locale) => {
      const payload = readPayload(await live(locale), locale);

      // `adapt` reads every field the site needs and throws on the first one
      // that is missing, with its path. Running it in full is therefore the most
      // complete shape check possible — and the only one that cannot drift from
      // what the site actually reads.
      const content = adapt(payload, CHROME[locale]);

      expect(content.locale).toBe(locale);
      expect(content.cases.length).toBeGreaterThan(0);
      expect(content.background.jobs.length).toBeGreaterThan(0);
    },
    30_000,
  );

  /**
   * Does the fixture still describe the same **shape** as the API?
   *
   * We compare the key trees, not the values: a rewritten sentence or an added
   * network must break nothing here — that is content, and it is allowed to
   * move. A field **renamed, added or removed**, on the other hand, makes the
   * fixture a liar: the unit tests would keep passing against a shape that no
   * longer exists.
   */
  it.each(LOCALES)("keeps the fixture aligned with the shape served (%s)", async (locale) => {
    const fixture = shapeOf(FIXTURES[locale]);
    const served = shapeOf(await live(locale));

    const missing = [...fixture].filter((path) => !served.has(path));
    const added = [...served].filter((path) => !fixture.has(path));

    expect(
      { missing, added },
      "The fixture has drifted from the API. Regenerate it:\n" +
        `  curl -s "${BASE_URL}/v1/portfolio?lang=${locale}" | ` +
        `python3 -m json.tool > tests/fixtures/portfolio-${locale}.json`,
    ).toEqual({ missing: [], added: [] });
  }, 30_000);
});

/**
 * The set of typed paths within a value, with list indices erased.
 *
 * `data.experience[0].start` and `data.experience[2].start` give the same path:
 * a collection's shape is the shape of its items, not its count. The type is
 * kept — renaming a field *and* changing its type must show up as two
 * discrepancies, not one.
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
