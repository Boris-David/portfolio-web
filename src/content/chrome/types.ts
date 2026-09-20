import type { Chrome, IconName, Metadata } from "@/content/types";

/**
 * What is left to the site once the content moves to the API.
 *
 * The dividing line is not "whatever the API happens to serve today" — that
 * would be letting the tool decide the architecture. It is:
 *
 *   **content is whatever would still be true if the site did not exist.**
 *
 * A fact about the career, a figure, a sentence from the record: true with or
 * without a site, so it belongs to the API, which serves it just as well to the
 * PDF résumé as to the iOS app. "Skip to content", "Switch theme", the choice of
 * an icon or the order of the anchors: those only exist because there is a web
 * page. They stay here.
 *
 * The test: those labels would make no sense in a PDF or in a native app.
 * Routing them through the API would expose them to clients that have no use
 * for them, and force us to version them as content when they change at the pace
 * of the design.
 */
export interface SiteChrome {
  readonly meta: Metadata;
  readonly chrome: Chrome;
  /** The hero's two calls to action — gestures, not facts. */
  readonly heroCtas: { readonly primary: string };
  /** The headings of the three background blocks that carry no fact. */
  /**
   * The headings of the personality section. Chrome and not content: they would
   * not be true if the site did not exist -- the sentences under them would.
   */
  readonly personality: {
    readonly eyebrow: string;
    readonly title: string;
    readonly interests: string;
  };
  readonly backgroundTitles: {
    readonly education: string;
    readonly certifications: string;
    readonly openProjects: string;
  };
  /** The label of a certification's verification link. */
  readonly verifyCertificate: string;
  /** The label of the link to an open project's source code. */
  readonly sourceCode: string;
  /** The write-an-email button — a gesture, not an address. */
  readonly mailCta: string;
}

/**
 * The icon choices, identical in both languages — an icon has no language. Each
 * key is an identifier **served by the API**, which makes the link checkable: a
 * topic added on the content side without an icon here breaks the build instead
 * of showing a hole.
 */
export const EXPERTISE_ICONS: Readonly<Record<string, IconName>> = {
  concurrency: "flow",
  boundaries: "layers",
  delivery: "gear",
};

/** The hero's three identity lines, in order, with their icon. */
export const IDENTITY_ICONS = [
  "pin",
  "home",
  "globe",
] as const satisfies readonly IconName[];

/**
 * The five apps whose icons make up the case study's stack.
 *
 * This is an editorial showcase choice — the most recognisable networks — and
 * not an order the API could know about. The count shown next to it ("+28") is
 * computed, from the real number of apps.
 */
export const ICON_STACK = [
  "tcl",
  "oura",
  "at-bus",
  "tere-tahiti",
  "twisto",
] as const;
