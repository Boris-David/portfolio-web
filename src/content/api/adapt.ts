import type {
  Background,
  CaseStudy,
  ColumnsCase,
  Contact,
  DepthItem,
  Hero,
  Job,
  Locale,
  Markup,
  MetaItem,
  PdrLabels,
  ProductionApp,
  ProfileLink,
  ProofPoint,
  Screenshot,
  SectionHead,
  SiteContent,
  SkillGroup,
  TimelineRow,
  Workstream,
  WorkstreamCase,
} from "@/content/types";
import { ICON_NAMES } from "@/content/types";
import type { SiteChrome } from "@/content/chrome/types";
import {
  EXPERTISE_ICONS,
  ICON_STACK,
  IDENTITY_ICONS,
} from "@/content/chrome/types";
import { Field } from "@/content/api/field";
import { readMarkup } from "@/content/api/markup";
import {
  formatLong,
  formatRange,
  formatYearSpan,
  parseYearMonth,
} from "@/content/api/dates";

/**
 * The API's domain model, brought back to the site's presentation model.
 *
 * The two models differ, and that is **deliberate**. The API describes facts:
 * `experience[]` with `start: "2023-05"` and `end: null`. The site displays an
 * expandable card headed "mai 2023 → aujourd'hui". Making either one carry the
 * other would mean choosing:
 *
 *   - either an API that knows how a website displays things — and which would
 *     then have to know how a PDF résumé and an iOS app display things too;
 *   - or a site that receives already-formatted strings — and can no longer do
 *     anything else with them.
 *
 * This file is therefore the translating layer, and this is the right place to
 * put it: on the client side, where presentation is decided. It is also what
 * **derives** what the API has no reason to know about — the section numbering,
 * the "+28" count on the icon stack, a screenshot's filename.
 */

export interface PortfolioPayload {
  readonly locale: Locale;
  readonly contentVersion: string;
  readonly data: Field;
}

/** Unwraps the `{ meta, data }` envelope and checks it did answer in the right language. */
export function readPayload(
  body: unknown,
  requested: Locale,
): PortfolioPayload {
  const root = Field.root(body, "portfolio");
  const locale = root
    .child("meta")
    .child("locale")
    .oneOf(["fr", "en"] as const);

  // A response in a language other than the one requested is an error, not a
  // fallback: publishing the English page with French content is exactly the
  // kind of failure you only see once it is live.
  if (locale !== requested) {
    throw new Error(
      `The API responded in “${locale}” when “${requested}” was requested.`,
    );
  }

  return {
    locale,
    contentVersion: root.child("meta").child("contentVersion").text(),
    data: root.child("data"),
  };
}

export function adapt(
  payload: PortfolioPayload,
  chrome: SiteChrome,
): SiteContent {
  const { data, locale } = payload;
  const profile = data.child("profile");
  const sections = readSections(data);
  const apps = adaptApps(data);
  const ticketing = apps.filter((app) => app.role === "ticketing");

  return {
    locale,
    meta: chrome.meta,
    chrome: chrome.chrome,
    fullName: profile.child("name").child("full").text(),
    hero: adaptHero(profile, chrome),
    proof: data.child("metrics").list().map(adaptMetric),
    casesHead: sections.get("case-studies") as SectionHead,
    cases: data
      .child("caseStudies")
      .list()
      .map((study) => adaptCase(study, ticketing.length)),
    appsHead: sections.get("apps") as SectionHead,
    appsNote: sections.note("apps"),
    depthHead: sections.get("depth") as SectionHead,
    depth: data.child("expertise").list().map(adaptExpertise),
    background: adaptBackground(
      data,
      sections.get("background") as SectionHead,
      chrome,
      locale,
    ),
    contact: adaptContact(profile.child("contact"), chrome),
  };
}

/** The apps in production, as the source publishes and orders them. */
export function adaptApps(data: Field): readonly ProductionApp[] {
  return data
    .child("apps")
    .child("items")
    .list()
    .map((app) => ({
      slug: app.child("slug").text(),
      name: app.child("name").text(),
      territory: app.child("territory").text(),
      appStoreUrl: app.child("appStoreUrl").textOrNull(),
      sourceUrl: app.child("sourceUrl").textOrNull(),
      summary: app.child("summary").textOrNull(),
      role: app
        .child("role")
        .oneOf(["ticketing", "features", "end-to-end"] as const),
    }));
}

export function readVerifiedAt(data: Field): string {
  return data.child("apps").child("verifiedAt").text();
}

// ─────────────────────────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────────────────────────

function adaptHero(profile: Field, chrome: SiteChrome): Hero {
  const showcase = profile.child("showcase").child("media");
  const identity = [
    profile.child("location").text(),
    profile.child("remote").text(),
    profile.child("languages").text(),
  ];

  return {
    availability: profile.child("availability").text(),
    role: profile.child("headline").text(),
    name: profile.child("name").child("display").text(),
    lede: profile.child("summary").list().map(readMarkup),
    meta: identity.map<MetaItem>((label, index) => ({
      icon: IDENTITY_ICONS[index] as MetaItem["icon"],
      label,
    })),
    primaryCta: chrome.heroCtas.primary,
    shotAlt: showcase.child("alt").text(),
    shotTag: showcase.child("caption").text(),
    shotFile: shotFile(showcase.child("id").text()),
  };
}

/**
 * A screenshot's file is **deduced** from the media identifier.
 *
 * The files used to carry an ordering prefix — `03-jeune.jpg` — which encoded a
 * ranking now carried by the order of the list the API serves. With the prefix
 * gone, the name is deduced, and there is no longer a lookup table to keep up to
 * date. A test checks that every media item has its file.
 */
function shotFile(mediaId: string): string {
  return `${mediaId}.jpg`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Figures
// ─────────────────────────────────────────────────────────────────────────────

function adaptMetric(metric: Field): ProofPoint {
  const raw = metric.child("value").text();
  // The "~" and the ">" are not counted: they qualify the number.
  const match = /^([~>]\s?)?(.+)$/.exec(raw) as RegExpExecArray;
  const prefix = match[1];
  const unit = metric.child("unit");

  return {
    value: match[2] as string,
    ...(prefix === undefined ? {} : { prefix }),
    ...(unit.isPresent ? { unit: unit.text() } : {}),
    label: metric.child("caption").text(),
    // A non-null `countTo` is the editorial decision "this number animates";
    // it is taken at the source, not deduced from the shape of the number.
    ...(metric.child("countTo").isPresent ? { counts: true } : {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Section headings
// ─────────────────────────────────────────────────────────────────────────────

interface Sections {
  get(id: string): SectionHead;
  note(id: string): string;
}

/**
 * The headings, numbered from their **rank**.
 *
 * "01 · Études de cas": the number is pure presentation — it tells the reader
 * where they are in the page. The API serves the order; the site turns it into
 * a visual landmark. The day a section is inserted, the numbering follows
 * without anybody touching the content.
 */
function readSections(data: Field): Sections {
  const entries = new Map<string, { head: SectionHead; note: Field }>();

  for (const [index, section] of data.child("sections").list().entries()) {
    const intro = section.child("intro");
    entries.set(section.child("id").text(), {
      head: {
        eyebrow: `${String(index + 1).padStart(2, "0")} · ${section.child("eyebrow").text()}`,
        title: section.child("title").text(),
        ...(intro.isPresent ? { intro: readMarkup(intro) } : {}),
      },
      note: section.child("note"),
    });
  }

  const require = (id: string) => {
    const entry = entries.get(id);
    if (entry === undefined) {
      throw new Error(
        `Section “${id}” missing from the content served. Sections received: ` +
          `${[...entries.keys()].join(", ")}.`,
      );
    }
    return entry;
  };

  return {
    get: (id) => require(id).head,
    note: (id) => readMarkup(require(id).note),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Case studies
// ─────────────────────────────────────────────────────────────────────────────

const PANEL_KINDS = ["problem", "decision", "result"] as const;
type PanelKind = (typeof PANEL_KINDS)[number];

interface Panel {
  readonly heading: string;
  readonly blocks: readonly Markup[];
  readonly chips?: readonly string[];
}

type Chapter = {
  readonly slug: string;
  readonly title: string | null;
  readonly subtitle: string | null;
  readonly panels: ReadonlyMap<PanelKind, Panel>;
};

/**
 * The site knows two case-study layouts; the API knows only one, more general:
 * chapters made of panels.
 *
 * The discriminator is **semantic, not structural**: a chapter that carries a
 * title is a workstream that can be expanded and named; a chapter without a
 * title is the single body of a narrative, rendered as three columns. Counting
 * the chapters would have worked today and broken on the first narrative with
 * two untitled chapters.
 */
function adaptCase(study: Field, ticketingCount: number): CaseStudy {
  const chapters = study.child("chapters").list().map(readChapter);
  const first = chapters[0] as Chapter;
  const labels = readLabels(first);
  const common = {
    id: study.child("slug").text(),
    title: study.child("title").text(),
    subtitle: study.child("subtitle").text(),
    labels,
    tags: study
      .child("tags")
      .list()
      .map((tag) => tag.text()),
  };

  if (first.title !== null) {
    const workstreamCase: WorkstreamCase = {
      ...common,
      kind: "workstreams",
      intro: readMarkup(study.child("intro")),
      iconStack: ICON_STACK,
      iconStackMore: `+${ticketingCount - ICON_STACK.length}`,
      workstreams: chapters.map(toWorkstream),
    };
    return workstreamCase;
  }

  const link = study.child("link");
  const columnsCase: ColumnsCase = {
    ...common,
    kind: "columns",
    iconSlug: common.id,
    link: { href: link.child("url").text(), label: link.child("label").text() },
    problem: panel(first, "problem").blocks,
    decisions: panel(first, "decision").blocks,
    results: panel(first, "result").blocks,
    gallery: study.child("media").list().map(toScreenshot),
  };
  return columnsCase;
}

function readChapter(chapter: Field): Chapter {
  const panels = new Map<PanelKind, Panel>();

  for (const entry of chapter.child("panels").list()) {
    const blocks: Markup[] = [];
    let chips: readonly string[] | undefined;

    for (const block of entry.child("blocks").list()) {
      switch (
        block.child("type").oneOf(["paragraph", "list", "tags"] as const)
      ) {
        case "paragraph":
          blocks.push(readMarkup(block.child("text")));
          break;
        // A list from the API and a run of paragraphs render the same way in a
        // column: the distinction is a detail of how it was written, not a
        // difference in meaning.
        case "list":
          for (const item of block.child("items").list())
            blocks.push(readMarkup(item));
          break;
        case "tags":
          chips = block
            .child("items")
            .list()
            .map((tag) => tag.text());
          break;
      }
    }

    panels.set(entry.child("kind").oneOf(PANEL_KINDS), {
      heading: entry.child("heading").text(),
      blocks,
      ...(chips === undefined ? {} : { chips }),
    });
  }

  return {
    slug: chapter.child("slug").text(),
    title: chapter.child("title").textOrNull(),
    subtitle: chapter.child("subtitle").textOrNull(),
    panels,
  };
}

function panel(chapter: Chapter, kind: PanelKind): Panel {
  const found = chapter.panels.get(kind);
  if (found === undefined) {
    throw new Error(`Panel “${kind}” missing from chapter “${chapter.slug}”.`);
  }
  return found;
}

/** The three column headings come from the panels themselves. */
function readLabels(chapter: Chapter): PdrLabels {
  return {
    problem: panel(chapter, "problem").heading,
    decision: panel(chapter, "decision").heading,
    result: panel(chapter, "result").heading,
  };
}

function toWorkstream(chapter: Chapter): Workstream {
  const result = panel(chapter, "result");
  return {
    id: chapter.slug,
    title: chapter.title as string,
    summary: chapter.subtitle as string,
    problem: panel(chapter, "problem").blocks,
    decision: panel(chapter, "decision").blocks,
    result: result.blocks,
    ...(result.chips === undefined ? {} : { chips: result.chips }),
  };
}

function toScreenshot(media: Field): Screenshot {
  return {
    file: shotFile(media.child("id").text()),
    alt: media.child("alt").text(),
    caption: media.child("caption").text(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Technical depth
// ─────────────────────────────────────────────────────────────────────────────

function adaptExpertise(item: Field): DepthItem {
  const id = item.child("id").text();
  const icon = EXPERTISE_ICONS[id];
  if (icon === undefined) {
    throw new Error(
      `No icon declared for topic “${id}”. ` +
        "Add the entry to EXPERTISE_ICONS — a topic without an icon would leave a hole.",
    );
  }
  return {
    icon,
    title: item.child("title").text(),
    body: readMarkup(item.child("body")),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Background
// ─────────────────────────────────────────────────────────────────────────────

function adaptBackground(
  data: Field,
  head: SectionHead,
  chrome: SiteChrome,
  locale: Locale,
): Background {
  const background = data.child("background");

  return {
    head,
    jobs: data
      .child("experience")
      .list()
      .map((job, index) => adaptJob(job, locale, index === 0)),
    educationTitle: chrome.backgroundTitles.education,
    education: background.child("education").list().map(adaptEducation),
    certificationsTitle: chrome.backgroundTitles.certifications,
    certifications: background
      .child("certifications")
      .list()
      .map((certification) =>
        adaptCertification(certification, chrome, locale),
      ),
    openProjectsTitle: chrome.backgroundTitles.openProjects,
    openProjects: background
      .child("openProjects")
      .list()
      .map((project) => adaptOpenProject(project, chrome)),
    skills: data.child("skills").list().map(adaptSkillGroup),
  };
}

function adaptJob(job: Field, locale: Locale, isMostRecent: boolean): Job {
  const end = job.child("end");
  // Only one experience carries secondary roles; the others serve an empty
  // list, which is a legitimate absence and not a missing value.
  const roles = job.child("roles").list({ allowEmpty: true });

  return {
    id: job.child("slug").text(),
    title: job.child("role").text(),
    // "organisation · location": a single line on screen, two facts at the source.
    company: `${job.child("organisation").text()} · ${job.child("location").text()}`,
    dates: formatRange(
      parseYearMonth(job.child("start").text(), job.child("start").path),
      end.isPresent ? parseYearMonth(end.text(), end.path) : null,
      locale,
    ),
    ...(roles.length > 0 ? { roles: roles.map((role) => role.text()) } : {}),
    bullets: job.child("highlights").list().map(readMarkup),
    stack: job
      .child("stack")
      .list()
      .map((item) => item.text())
      .join(" · "),
    // Exactly one experience is expanded on load: the most recent one. Its rank
    // already says so; the API has no business carrying a display flag.
    ...(isMostRecent ? { openByDefault: true } : {}),
  };
}

function adaptEducation(entry: Field): TimelineRow {
  const detail = entry.child("detail");
  const school = entry.child("school").text();

  return {
    when: formatYearSpan(
      entry.child("startYear").integer(),
      entry.child("endYear").integer(),
    ),
    what: entry.child("degree").text(),
    where: detail.isPresent ? `${school} — ${detail.text()}` : school,
  };
}

function adaptCertification(
  certification: Field,
  chrome: SiteChrome,
  locale: Locale,
): TimelineRow {
  const verifyUrl = certification.child("verifyUrl");
  const awarded = certification.child("awardedOn");

  return {
    when: formatLong(parseYearMonth(awarded.text(), awarded.path), locale),
    what: certification.child("name").text(),
    where: certification.child("issuer").text(),
    ...(verifyUrl.isPresent
      ? { link: { href: verifyUrl.text(), label: chrome.verifyCertificate } }
      : {}),
  };
}

function adaptOpenProject(project: Field, chrome: SiteChrome): TimelineRow {
  const sourceUrl = project.child("sourceUrl");
  return {
    what: project.child("name").text(),
    where: readMarkup(project.child("description")),
    // The API serves a bare URL; "Source code" is a label, so it is chrome.
    ...(sourceUrl.isPresent
      ? { link: { href: sourceUrl.text(), label: chrome.sourceCode } }
      : {}),
  };
}

function adaptSkillGroup(group: Field): SkillGroup {
  return {
    title: group.child("title").text(),
    items: group
      .child("items")
      .list()
      .map((item) => item.text()),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Contact
// ─────────────────────────────────────────────────────────────────────────────

function adaptContact(contact: Field, chrome: SiteChrome): Contact {
  return {
    title: contact.child("title").text(),
    body: contact.child("body").text(),
    email: contact.child("email").text(),
    mailCta: chrome.mailCta,
    // The link's id doubles as the icon name. Constraining it to the bundled set
    // means a profile added at the source without an icon breaks the build,
    // instead of showing an empty button.
    links: contact
      .child("links")
      .list()
      .map<ProfileLink>((link) => ({
        id: link.child("id").oneOf(ICON_NAMES),
        label: link.child("label").text(),
        href: link.child("url").text(),
      })),
  };
}
