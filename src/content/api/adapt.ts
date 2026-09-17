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
import { EXPERTISE_ICONS, ICON_STACK, IDENTITY_ICONS } from "@/content/chrome/types";
import { Field } from "@/content/api/field";
import { readMarkup } from "@/content/api/markup";
import { formatLong, formatRange, formatYearSpan, parseYearMonth } from "@/content/api/dates";

/**
 * Le modèle de domaine de l'API, ramené au modèle de présentation du site.
 *
 * Les deux modèles diffèrent, et c'est **voulu**. L'API décrit des faits :
 * `experience[]` avec `start: "2023-05"` et `end: null`. Le site affiche une
 * carte dépliante titrée « mai 2023 → aujourd'hui ». Faire porter l'un des deux
 * par l'autre reviendrait à choisir :
 *
 *   - soit une API qui sait comment un site web s'affiche — et qui devrait
 *     alors savoir aussi comment un CV en PDF et une app iOS s'affichent ;
 *   - soit un site qui reçoit des chaînes déjà mises en forme — et qui ne peut
 *     plus rien en faire d'autre.
 *
 * Ce fichier est donc la couche qui traduit, et c'est le bon endroit pour la
 * mettre : côté client, là où la présentation est décidée. C'est aussi lui qui
 * **dérive** ce que l'API n'a aucune raison de connaître — la numérotation des
 * sections, le compte « +28 » de la pile d'icônes, le nom de fichier d'une
 * capture.
 */

export interface PortfolioPayload {
  readonly locale: Locale;
  readonly contentVersion: string;
  readonly data: Field;
}

/** Découpe l'enveloppe `{ meta, data }` et vérifie qu'elle répond bien sur la bonne langue. */
export function readPayload(body: unknown, requested: Locale): PortfolioPayload {
  const root = Field.root(body, "portfolio");
  const locale = root.child("meta").child("locale").oneOf(["fr", "en"] as const);

  // Une réponse dans une autre langue que celle demandée est une erreur, pas un
  // repli : publier la page anglaise avec du contenu français est précisément
  // le genre de panne qu'on ne voit qu'une fois en ligne.
  if (locale !== requested) {
    throw new Error(
      `L'API a répondu en « ${locale} » alors que « ${requested} » était demandé.`,
    );
  }

  return {
    locale,
    contentVersion: root.child("meta").child("contentVersion").text(),
    data: root.child("data"),
  };
}

export function adapt(payload: PortfolioPayload, chrome: SiteChrome): SiteContent {
  const { data, locale } = payload;
  const profile = data.child("profile");
  const sections = readSections(data);
  const apps = adaptApps(data);
  const ticketing = apps.filter((app) => app.role === "ticketing");

  return {
    locale,
    meta: chrome.meta,
    chrome: chrome.chrome,
    hero: adaptHero(profile, chrome),
    proof: data.child("metrics").list().map(adaptMetric),
    casesHead: sections.get("case-studies") as SectionHead,
    cases: data.child("caseStudies").list().map((study) => adaptCase(study, ticketing.length)),
    appsHead: sections.get("apps") as SectionHead,
    appsNote: sections.note("apps"),
    depthHead: sections.get("depth") as SectionHead,
    depth: data.child("expertise").list().map(adaptExpertise),
    background: adaptBackground(data, sections.get("background") as SectionHead, chrome, locale),
    contact: adaptContact(profile.child("contact"), chrome),
  };
}

/** Les applications en production, telles que la source les publie et les ordonne. */
export function adaptApps(data: Field): readonly ProductionApp[] {
  return data
    .child("apps")
    .child("items")
    .list()
    .map((app) => ({
      slug: app.child("slug").text(),
      name: app.child("name").text(),
      territory: app.child("territory").text(),
      appStoreUrl: app.child("appStoreUrl").text(),
      role: app.child("role").oneOf(["ticketing", "features", "end-to-end"] as const),
    }));
}

export function readVerifiedAt(data: Field): string {
  return data.child("apps").child("verifiedAt").text();
}

// ─────────────────────────────────────────────────────────────────────────────
// Accroche
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
    secondaryCta: chrome.heroCtas.secondary,
    shotAlt: showcase.child("alt").text(),
    shotTag: showcase.child("caption").text(),
    shotFile: shotFile(showcase.child("id").text()),
  };
}

/**
 * Le fichier d'une capture se **déduit** de l'identifiant du média.
 *
 * Les fichiers portaient auparavant un préfixe d'ordre — `03-jeune.jpg` — qui
 * encodait un classement désormais porté par l'ordre de la liste servie par
 * l'API. Le préfixe supprimé, le nom se déduit, et il n'y a plus de table de
 * correspondance à tenir à jour. Un test vérifie que chaque média a son fichier.
 */
function shotFile(mediaId: string): string {
  return `${mediaId}.jpg`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chiffres
// ─────────────────────────────────────────────────────────────────────────────

function adaptMetric(metric: Field): ProofPoint {
  const raw = metric.child("value").text();
  // Le « ~ » et le « > » ne se comptent pas : ils qualifient le nombre.
  const match = /^([~>]\s?)?(.+)$/.exec(raw) as RegExpExecArray;
  const prefix = match[1];
  const unit = metric.child("unit");

  return {
    value: match[2] as string,
    ...(prefix === undefined ? {} : { prefix }),
    ...(unit.isPresent ? { unit: unit.text() } : {}),
    label: metric.child("caption").text(),
    // `countTo` non nul est la décision éditoriale « ce nombre s'anime » ;
    // elle est prise à la source, pas déduite de la forme du nombre.
    ...(metric.child("countTo").isPresent ? { counts: true } : {}),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// En-têtes de section
// ─────────────────────────────────────────────────────────────────────────────

interface Sections {
  get(id: string): SectionHead;
  note(id: string): string;
}

/**
 * Les en-têtes, numérotés à partir de leur **rang**.
 *
 * « 01 · Études de cas » : le numéro est de la présentation pure — il dit au
 * lecteur où il en est dans la page. L'API sert l'ordre ; le site en fait un
 * repère visuel. Le jour où une section s'insère, la numérotation suit sans
 * qu'on touche au contenu.
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
        `Section « ${id} » absente du contenu servi. Sections reçues : ` +
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
// Études de cas
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
 * Le site connaît deux mises en page d'étude de cas ; l'API n'en connaît
 * qu'une, plus générale : des chapitres faits de panneaux.
 *
 * Le discriminant est **sémantique, pas structurel** : un chapitre qui porte un
 * titre est un chantier qu'on peut déplier et nommer ; un chapitre sans titre
 * est le corps unique d'un récit, qui se rend en trois colonnes. Compter les
 * chapitres aurait marché aujourd'hui et cassé au premier récit à deux
 * chapitres anonymes.
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
    tags: study.child("tags").list().map((tag) => tag.text()),
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
      switch (block.child("type").oneOf(["paragraph", "list", "tags"] as const)) {
        case "paragraph":
          blocks.push(readMarkup(block.child("text")));
          break;
        // Une liste de l'API et une suite de paragraphes se rendent de la même
        // façon dans une colonne : la distinction est un détail d'écriture, pas
        // une différence de sens.
        case "list":
          for (const item of block.child("items").list()) blocks.push(readMarkup(item));
          break;
        case "tags":
          chips = block.child("items").list().map((tag) => tag.text());
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
    throw new Error(`Panneau « ${kind} » absent du chapitre « ${chapter.slug} ».`);
  }
  return found;
}

/** Les trois intitulés de colonnes viennent des panneaux eux-mêmes. */
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
// Profondeur technique
// ─────────────────────────────────────────────────────────────────────────────

function adaptExpertise(item: Field): DepthItem {
  const id = item.child("id").text();
  const icon = EXPERTISE_ICONS[id];
  if (icon === undefined) {
    throw new Error(
      `Aucune icône déclarée pour le sujet « ${id} ». ` +
        "Ajouter l'entrée dans EXPERTISE_ICONS — un sujet sans icône laisserait un trou.",
    );
  }
  return {
    icon,
    title: item.child("title").text(),
    body: readMarkup(item.child("body")),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Parcours
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
    jobs: data.child("experience").list().map((job, index) => adaptJob(job, locale, index === 0)),
    educationTitle: chrome.backgroundTitles.education,
    education: background.child("education").list().map(adaptEducation),
    certificationsTitle: chrome.backgroundTitles.certifications,
    certifications: background
      .child("certifications")
      .list()
      .map((certification) => adaptCertification(certification, chrome, locale)),
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
  // Une seule expérience porte des rôles annexes ; les autres servent une liste
  // vide, qui est une absence légitime et non une donnée manquante.
  const roles = job.child("roles").list({ allowEmpty: true });

  return {
    id: job.child("slug").text(),
    title: job.child("role").text(),
    // « organisation · lieu » : une seule ligne à l'écran, deux faits à la source.
    company: `${job.child("organisation").text()} · ${job.child("location").text()}`,
    dates: formatRange(
      parseYearMonth(job.child("start").text(), job.child("start").path),
      end.isPresent ? parseYearMonth(end.text(), end.path) : null,
      locale,
    ),
    ...(roles.length > 0 ? { roles: roles.map((role) => role.text()) } : {}),
    bullets: job.child("highlights").list().map(readMarkup),
    stack: job.child("stack").list().map((item) => item.text()).join(" · "),
    // Une seule expérience est dépliée au chargement : la plus récente. Le rang
    // le dit déjà, l'API n'a pas à porter un drapeau d'affichage.
    ...(isMostRecent ? { openByDefault: true } : {}),
  };
}

function adaptEducation(entry: Field): TimelineRow {
  const detail = entry.child("detail");
  const school = entry.child("school").text();

  return {
    when: formatYearSpan(entry.child("startYear").integer(), entry.child("endYear").integer()),
    what: entry.child("degree").text(),
    where: detail.isPresent ? `${school} — ${detail.text()}` : school,
  };
}

function adaptCertification(certification: Field, chrome: SiteChrome, locale: Locale): TimelineRow {
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
    // L'API sert une URL nue ; « Code source » est un libellé, donc du chrome.
    ...(sourceUrl.isPresent
      ? { link: { href: sourceUrl.text(), label: chrome.sourceCode } }
      : {}),
  };
}

function adaptSkillGroup(group: Field): SkillGroup {
  return {
    title: group.child("title").text(),
    items: group.child("items").list().map((item) => item.text()),
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
    // L'identifiant du lien sert de nom d'icône. Le contraindre au jeu embarqué
    // fait qu'un profil ajouté à la source sans icône casse la construction,
    // au lieu d'afficher un bouton vide.
    links: contact.child("links").list().map<ProfileLink>((link) => ({
      id: link.child("id").oneOf(ICON_NAMES),
      label: link.child("label").text(),
      href: link.child("url").text(),
    })),
  };
}
