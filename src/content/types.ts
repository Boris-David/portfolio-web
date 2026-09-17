/**
 * Le modèle de contenu du portfolio.
 *
 * Il est écrit une fois et implémenté par chaque langue. C'est ce qui rend une
 * traduction manquante **impossible** plutôt qu'improbable : la maquette portait
 * un dictionnaire anglais indexé par clé, où un oubli passait inaperçu et
 * laissait du français à l'écran. Ici, un champ absent de `en.ts` ne compile pas.
 *
 * Toutes les chaînes marquées `Markup` acceptent le balisage minimal de
 * `rich-text.ts` (`**gras**`, `` `code` ``) ; les autres sont du texte brut.
 */

/** Texte pouvant porter `**gras**` et `` `code` ``. */
export type Markup = string;

export type Locale = "fr" | "en";

/** Les icônes du jeu embarqué — un nom hors de cette liste ne compile pas. */
export type IconName =
  | "github"
  | "linkedin"
  | "mail"
  | "appstore"
  | "document"
  | "external"
  | "pin"
  | "home"
  | "globe"
  | "chevron"
  | "layers"
  | "flow"
  | "gear"
  | "sun"
  | "moon";

export interface NavLink {
  /** L'ancre de la section, sans `#`. */
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
}

export interface ProofPoint {
  /** La partie qui se compte, animée à l'arrivée à l'écran. */
  readonly value: string;
  /** Le suffixe accentué : « ans », « M », « % ». Absent quand il n'y en a pas. */
  readonly unit?: string;
  /** Le préfixe non compté : « ~ », « > ». */
  readonly prefix?: string;
  readonly label: string;
  /**
   * Le chiffre se compte à l'arrivée à l'écran. C'est une décision éditoriale,
   * pas une déduction de la forme du nombre : « ~1 M » pourrait se compter, on
   * choisit que non parce que l'approximation rend le décompte absurde.
   */
  readonly counts?: boolean;
}

export interface SectionHead {
  readonly eyebrow: string;
  readonly title: string;
  readonly intro?: Markup;
}

/** Les intitulés des trois colonnes d'une étude de cas. */
export interface PdrLabels {
  readonly problem: string;
  readonly decision: string;
  readonly result: string;
}

/** Un chantier dépliable d'une étude de cas. */
export interface Workstream {
  readonly id: string;
  readonly title: Markup;
  readonly summary: string;
  readonly problem: readonly Markup[];
  readonly decision: readonly Markup[];
  readonly result: readonly Markup[];
  /** Puces techniques affichées sous le résultat. */
  readonly chips?: readonly string[];
}

export interface Screenshot {
  readonly file: string;
  readonly alt: string;
  readonly caption: string;
}

/** L'étude de cas « billettique » : une intro puis des chantiers dépliables. */
export interface WorkstreamCase {
  readonly kind: "workstreams";
  readonly id: string;
  readonly title: string;
  readonly subtitle: string;
  readonly intro: Markup;
  /** Les slugs des applications dont l'icône compose la pile d'en-tête. */
  readonly iconStack: readonly string[];
  readonly iconStackMore: string;
  readonly labels: PdrLabels;
  readonly workstreams: readonly Workstream[];
  readonly tags: readonly string[];
}

/** L'étude de cas « KCalories » : trois colonnes et une galerie. */
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
  /** Une seule expérience est dépliée au chargement : la plus récente. */
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

export interface Contact {
  readonly title: string;
  readonly body: Markup;
  readonly email: string;
  readonly mailCta: string;
}

export interface Chrome {
  readonly navLinks: readonly NavLink[];
  readonly navLabel: string;
  readonly cvLabel: string;
  /** Décrit le format, la langue et l'ouverture en nouvel onglet — le lien sort du site. */
  readonly cvAriaLabel: string;
  readonly themeToggleLabel: string;
  readonly skipToContent: string;
  /** Le code de l'AUTRE langue, affiché dans le bouton : « EN » sur la page FR. */
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

/** Une application en production, telle que publiée par la source de contenu. */
export interface ProductionApp {
  readonly slug: string;
  readonly name: string;
  readonly territory: string;
  readonly appStoreUrl: string;
  readonly role: "ticketing" | "features" | "end-to-end";
}
