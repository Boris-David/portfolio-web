import type { Locale, ProductionApp, SiteContent } from "@/content/types";
import type { SiteChrome } from "@/content/chrome/types";
import { frChrome } from "@/content/chrome/fr";
import { enChrome } from "@/content/chrome/en";
import { adapt, adaptApps, readVerifiedAt } from "@/content/api/adapt";
import { fetchPortfolio } from "@/content/api/fetch";

/**
 * The boundary between "where the content comes from" and "how it is
 * displayed".
 *
 * It kept its promise: the content now comes from `portfolio-api` (ADR 0002),
 * consumed **at build time** (ADR 0005), and **no component had to be reopened**.
 * The pages already called `getSiteContent(locale)`, these functions were
 * already `async` while nothing awaited anything — that is precisely what the
 * anticipation bought.
 *
 * What is left to the site is the **chrome**: the labels that only exist
 * because there is a page. The dividing line is written down in
 * `chrome/types.ts`; it comes down to: *content is whatever would still be true
 * if the site did not exist.*
 */

const CHROME: Readonly<Record<Locale, SiteChrome>> = { fr: frChrome, en: enChrome };

/**
 * The adapted content is memoised just as the request is.
 *
 * Not for the time saved — adaptation costs a millisecond. For **identity**:
 * every page of a given locale then shares the same object, and two renders
 * cannot diverge. Without this, "the page's content" and "the metadata's
 * content" are two distinct values we would have to take on faith as equal.
 */
const adapted = new Map<Locale, Promise<SiteContent>>();

export async function getSiteContent(locale: Locale): Promise<SiteContent> {
  const cached = adapted.get(locale);
  if (cached !== undefined) return cached;

  const pending = fetchPortfolio(locale).then((payload) => adapt(payload, CHROME[locale]));
  adapted.set(locale, pending);
  return pending;
}

/** Clears the adaptation cache — for tests only, alongside the transport's. */
export function resetSiteContentCache(): void {
  adapted.clear();
}

/**
 * The apps in production, in the order decided by the source.
 *
 * The sort used to live here and no longer does: the API serves an ordered
 * list, and two sorts — one per client — would end up diverging. Localising the
 * territories went the same way: the API already serves all three exonyms, and
 * a second table would have been a second truth.
 */
export async function getProductionApps(locale: Locale): Promise<readonly ProductionApp[]> {
  return adaptApps((await fetchPortfolio(locale)).data);
}

/** The ticketing layer — the apps the grid in section 02 accounts for. */
export async function getTicketingApps(locale: Locale): Promise<readonly ProductionApp[]> {
  const apps = await getProductionApps(locale);
  return apps.filter((app) => app.role === "ticketing");
}

/** The date the App Store ids were verified, published as served. */
export async function getAppsVerifiedAt(locale: Locale): Promise<string> {
  return readVerifiedAt((await fetchPortfolio(locale)).data);
}

/**
 * The fingerprint of the content baked into this build.
 *
 * This is the **freshness witness** required by ADR 0006: the site publishes
 * it, the API serves its own, and comparing the two says in a single request
 * whether the live page was built on the current content. Without this witness,
 * a site frozen on stale content is indistinguishable from an up-to-date one.
 */
export async function getContentVersion(locale: Locale): Promise<string> {
  return (await fetchPortfolio(locale)).contentVersion;
}
