import { afterAll, beforeAll, vi } from "vitest";
import type { Locale } from "@/content/types";
import { resetPortfolioCache } from "@/content/api/fetch";
import { resetSiteContentCache } from "@/content/source";
import frFixture from "../fixtures/portfolio-fr.json";
import enFixture from "../fixtures/portfolio-en.json";

/**
 * The content the API serves, frozen — so that the unit tests exercise the
 * **real** path through `source.ts` without depending on the network.
 *
 * Two ways of testing a remote source existed:
 *
 *   - adapt the fixture by hand in each test. Quick to write, and it leaves
 *     `source.ts` — the memoisation, the chrome selection, the filtering —
 *     entirely untested. Which is to say, precisely the new code;
 *   - **replace the transport**, and let everything else run for real. Chosen:
 *     the only thing stubbed out is the one thing we do not want to reach, the
 *     HTTP request itself.
 *
 * The fixture is **not** a second source of truth: it is a dated snapshot, and
 * a contract test — `npm run test:contract` — checks against the API in
 * production that it still describes the same shape. A snapshot that drifts
 * without us finding out would become a second truth again, and that is exactly
 * what ADR 0002 rules out.
 */

export const FIXTURES: Readonly<Record<Locale, unknown>> = {
  fr: frFixture,
  en: enFixture,
};

let calls = 0;

/** The number of requests served since the stub went in — counted, never assumed. */
export function fixtureRequestCount(): number {
  return calls;
}

/**
 * Starts again from a clean state: caches cleared, counter back to zero.
 *
 * Needed by the memoisation test, which has to observe the **first** read. The
 * other tests, conversely, benefit from the file's shared cache.
 */
export function resetFixtureState(): void {
  resetPortfolioCache();
  resetSiteContentCache();
  calls = 0;
}

/**
 * Serves the fixtures instead of the network, for the duration of one test file.
 *
 * Installed in `beforeAll` — and not `beforeEach` — because a test file must be
 * able to resolve its content exactly once, in its own `beforeAll`: that one
 * runs after ours, and registration order is enough to guarantee it since
 * `withApiFixtures()` is called at the top of the module.
 *
 * Named `with…` and not `use…`: the `use` prefix denotes a React hook, and the
 * `rules-of-hooks` rule refuses — rightly — to let one be called at module
 * level.
 *
 * An unexpected URL **throws** instead of returning anything: a test that
 * unknowingly hits another route should find out straight away.
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
        throw new Error(`Request not covered by the fixtures: ${url.toString()}`);
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
