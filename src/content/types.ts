/**
 * The portfolio's content model.
 *
 * It is written once and implemented by every locale. That is what makes a
 * missing translation **impossible** rather than unlikely: the mockup carried an
 * English dictionary indexed by key, where an omission went unnoticed and left
 * French on screen. Here, a field missing from `en.ts` does not compile.
 *
 * Every string typed `Markup` accepts the minimal markup from `rich-text.ts`
 * (`**bold**`, `` `code` ``); the others are plain text.
 */

/** Text that may carry `**bold**` and `` `code` ``. */
export type Markup = string;

export type Locale = "fr" | "en";

/**
 * The icons in the bundled set — a name outside this list does not compile.
 *
 * Written as an array rather than as a union: the content now comes from the
 * API, and an identifier received over the wire has to be **checkable at
 * runtime** before it can serve as an icon name. A type on its own checks
 * nothing against a network input.
 */
export const ICON_NAMES = [
  "github",
  "linkedin",
  "mail",
  "appstore",
  "document",
  "external",
  "pin",
  "home",
  "globe",
  "chevron",
  "layers",
  "flow",
  "gear",
  "sun",
  "moon",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export interface NavLink {
  /** The section anchor, without the `#`. */
  readonly target: string;
  readonly label: string;
}

export interface MetaItem {
  readonly icon: IconName;
  readonly label: string;
}

export interface Hero {
  readonly availability: string;
  readonly role: string;
  readonly name: string;
  readonly lede: readonly Markup[];
  readonly meta: readonly MetaItem[];
  readonly primaryCta: string;
  readonly secondaryCta: string;
  readonly shotAlt: string;
  readonly shotTag: string;
  /** The screenshot file, in `public/shots/`. Named after the media item. */
  readonly shotFile: string;
}

export interface ProofPoint {
  /** The part that counts up, animated when it comes into view. */
  readonly value: string;
  /** The accented suffix: "years", "M", "%". Absent when there is none. */
  readonly unit?: string;
  /** The prefix that is not counted: "~", ">". */
  readonly prefix?: string;
  readonly label: string;
  /**
   * The figure counts up when it comes into view. This is an editorial
   * decision, not something deduced from the shape of the number: "~1 M" could
   * count up, and we choose that it does not because the approximation makes
   * counting absurd.
   */
  readonly counts?: boolean;
}

export interface SectionHead {
  readonly eyebrow: string;
  readonly title: string;
  readonly intro?: Markup;
}

/** The headings of a case study's three columns. */
export interface PdrLabels {
  readonly problem: string;
  readonly decision: string;
  readonly result: string;
}

/** An expandable workstream within a case study. */
export interface Workstream {
  readonly id: string;
  readonly title: Markup;
  readonly summary: string;
  readonly problem: readonly Markup[];
  readonly decision: readonly Markup[];
  readonly result: readonly Markup[];
  /** Technical chips shown underneath the result. */
  readonly chips?: readonly string[];
}

export interface Screenshot {
  readonly file: string;
  readonly alt: string;
  readonly caption: string;
}

/** The "ticketing" case study: an intro, then expandable workstreams. */
export interface WorkstreamCase {
  readonly kind: "workstreams";
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly intro: Markup;
  /** The slugs of the apps whose icons make up the header stack. */
  readonly iconStack: readonly string[];
  readonly iconStackMore: string;
  readonly labels: PdrLabels;
  readonly workstreams: readonly Workstream[];
  readonly tags: readonly string[];
}

/** The "KCalories" case study: three columns and a gallery. */
export interface ColumnsCase {
  readonly kind: "columns";
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly iconSlug: string;
  readonly link: { readonly href: string; readonly label: string };
  readonly labels: PdrLabels;
  readonly problem: readonly Markup[];
  readonly decisions: readonly Markup[];
  readonly results: readonly Markup[];
  readonly gallery: readonly Screenshot[];
  readonly tags: readonly string[];
}

export type CaseStudy = WorkstreamCase | ColumnsCase;

export interface DepthItem {
  readonly icon: IconName;
  readonly title: string;
  readonly body: Markup;
}

export interface Job {
  readonly id: string;
  readonly title: string;
  readonly company: string;
  readonly dates: string;
  readonly roles?: readonly string[];
  readonly bullets: readonly Markup[];
  readonly stack: string;
  /** Exactly one experience is expanded on load: the most recent one. */
  readonly openByDefault?: boolean;
}

export interface TimelineRow {
  readonly when?: string;
  readonly what: string;
  readonly where: Markup;
  readonly link?: { readonly href: string; readonly label: string };
}

export interface SkillGroup {
  readonly title: string;
  readonly items: readonly string[];
}

export interface Background {
  readonly head: SectionHead;
  readonly jobs: readonly Job[];
  readonly educationTitle: string;
  readonly education: readonly TimelineRow[];
  readonly certificationsTitle: string;
  readonly certifications: readonly TimelineRow[];
  readonly openProjectsTitle: string;
  readonly openProjects: readonly TimelineRow[];
  readonly skills: readonly SkillGroup[];
}

/** A public profile, served by the content source — never written twice. */
export interface ProfileLink {
  /** The id doubles as the icon name: it is validated, never assumed. */
  readonly id: IconName;
  readonly label: string;
  readonly href: string;
}

export interface Contact {
  readonly title: string;
  readonly body: Markup;
  readonly email: string;
  readonly mailCta: string;
  /** GitHub, LinkedIn — the header and the footer read the same list. */
  readonly links: readonly ProfileLink[];
}

export interface Chrome {
  readonly navLinks: readonly NavLink[];
  readonly navLabel: string;
  readonly cvLabel: string;
  /** States the format, the language and that it opens in a new tab — the link leaves the site. */
  readonly cvAriaLabel: string;
  readonly themeToggleLabel: string;
  readonly skipToContent: string;
  /** The code of the OTHER language, shown in the button: "EN" on the FR page. */
  readonly otherLocaleCode: string;
  readonly otherLocaleLabel: string;
  readonly footerRole: string;
  readonly footerLocation: string;
}

export interface Metadata {
  readonly title: string;
  readonly description: string;
  readonly ogImageAlt: string;
}

export interface SiteContent {
  readonly locale: Locale;
  readonly meta: Metadata;
  readonly chrome: Chrome;
  /**
   * The long form of the name, used in the footer and nowhere else.
   *
   * It is a **fact**, so it comes from the source like every other one. It used
   * to be typed into `SiteFooter`, which made this repository the second place
   * that knew how the author spells their own name -- and the one that would
   * quietly stop agreeing with the resume.
   */
  readonly fullName: string;
  readonly hero: Hero;
  readonly proof: readonly ProofPoint[];
  readonly casesHead: SectionHead;
  readonly cases: readonly CaseStudy[];
  readonly appsHead: SectionHead;
  readonly appsNote: string;
  readonly depthHead: SectionHead;
  readonly depth: readonly DepthItem[];
  readonly background: Background;
  readonly contact: Contact;
}

/** An app in production, as published by the content source. */
export interface ProductionApp {
  readonly slug: string;
  readonly name: string;
  readonly territory: string;
  readonly appStoreUrl: string;
  readonly role: "ticketing" | "features" | "end-to-end";
}
