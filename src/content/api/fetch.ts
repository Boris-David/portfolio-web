import type { Locale } from "@/content/types";
import { API_BASE_URL } from "@/lib/site";
import { readPayload, type PortfolioPayload } from "@/content/api/adapt";

/**
 * The content, fetched **once per build**.
 *
 * ADR 0002: the source of truth is the API. ADR 0005: the site stays a fully
 * static export. The two hold together because the request happens at
 * `next build`, never on the visitor's machine — the page served is frozen
 * HTML, and the content is already in it.
 *
 * Three properties are worth spelling out.
 *
 * **One request per locale per build.** Without memoisation, every page and
 * every metadata call would go back to the network, and two calls could land on
 * either side of an API deployment — one page of the site would then carry one
 * version of the content, the next another. Memoisation is therefore not an
 * optimisation, it is what makes the build **consistent with itself**.
 *
 * **A failure stops the build.** No fallback content, no partial page:
 * `wrangler` would happily publish whatever it is handed, and an empty section
 * on a recruiter's screen costs infinitely more than a red deployment.
 *
 * **A few retries, no more.** A one-second network blip must not fail a
 * release; an API that is genuinely down must fail it straight away. Hence a
 * small, bounded number of attempts.
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

/** Clears the cache — for tests only, which must be able to start from a clean state. */
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
      // A malformed payload is not worth replaying: the next response will be
      // the same. Only transport failures deserve a second chance.
      if (error instanceof Error && error.name === "ContentShapeError") break;
      if (attempt < ATTEMPTS) await wait(BACKOFF_MS * attempt);
    }
  }

  throw new Error(
    `Content not found at ${url} after ${ATTEMPTS} attempts: ${reason(lastError)}.\n` +
      "The build stops here: publishing the site without its content would serve " +
      "empty sections. Check that the API responds, then run it again.",
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
