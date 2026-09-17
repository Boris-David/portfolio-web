import type { Chrome, IconName, Metadata } from "@/content/types";

/**
 * Ce qui reste au site quand le contenu part à l'API.
 *
 * La ligne de partage n'est pas « ce que l'API sert aujourd'hui » — ce serait
 * laisser l'outil décider de l'architecture. Elle est :
 *
 *   **est du contenu ce qui resterait vrai si le site n'existait pas.**
 *
 * Un fait sur le parcours, un chiffre, une phrase du dossier : vrai avec ou
 * sans site, donc à l'API, qui le sert aussi bien au CV en PDF qu'à l'app iOS.
 * « Aller au contenu », « Changer de thème », le choix d'une icône ou l'ordre
 * des ancres : ça n'existe que parce qu'il y a une page web. Ça reste ici.
 *
 * Le test : ces libellés-là n'auraient aucun sens dans un PDF ni dans une app
 * native. Les faire transiter par l'API les rendrait visibles depuis des
 * clients qui n'en ont pas l'usage, et obligerait à les versionner comme du
 * contenu alors qu'ils changent au rythme du design.
 */
export interface SiteChrome {
  readonly meta: Metadata;
  readonly chrome: Chrome;
  /** Les deux appels à l'action de l'accroche — des gestes, pas des faits. */
  readonly heroCtas: { readonly primary: string; readonly secondary: string };
  /** Les intitulés des trois blocs du parcours qui ne portent aucun fait. */
  readonly backgroundTitles: {
    readonly education: string;
    readonly certifications: string;
    readonly openProjects: string;
  };
  /** Le libellé du lien de vérification d'une certification. */
  readonly verifyCertificate: string;
  /** Le libellé du lien vers le code source d'un projet ouvert. */
  readonly sourceCode: string;
  /** Le bouton d'écriture d'un courriel — un geste, pas une adresse. */
  readonly mailCta: string;
}

/**
 * Les choix d'icônes, identiques dans les deux langues — une icône n'a pas de
 * langue. Chaque clé est un identifiant **servi par l'API**, ce qui rend le
 * lien vérifiable : un sujet ajouté côté contenu sans icône ici casse la
 * construction plutôt que d'afficher un trou.
 */
export const EXPERTISE_ICONS: Readonly<Record<string, IconName>> = {
  concurrency: "flow",
  boundaries: "layers",
  delivery: "gear",
};

/** Les trois lignes d'identité de l'accroche, dans l'ordre, avec leur icône. */
export const IDENTITY_ICONS = ["pin", "home", "globe"] as const satisfies readonly IconName[];

/**
 * Les cinq applications dont l'icône compose la pile de l'étude de cas.
 *
 * C'est un choix éditorial de vitrine — les réseaux les plus reconnaissables —
 * et non un ordre que l'API pourrait connaître. Le compte affiché à côté
 * (« +28 ») se calcule, lui, sur le nombre réel d'applications.
 */
export const ICON_STACK = ["tcl", "oura", "at-bus", "tere-tahiti", "twisto"] as const;
