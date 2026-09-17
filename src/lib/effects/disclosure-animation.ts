import { animate } from "motion/mini";
import { readEasing } from "./design-runtime";

/**
 * L'animation du dépliage — le point que l'auteur tient le plus.
 *
 * Trois exigences, et chacune décide d'un détail de ce fichier :
 *
 * **1. Pas de saut de hauteur.** On n'anime jamais vers `auto` : ni les Web
 * Animations ni une transition CSS ne savent le faire. On mesure la hauteur
 * réelle du contenu, on anime en pixels, puis on rend la main à `auto` à
 * l'arrivée — sans quoi la carte resterait figée à sa hauteur mesurée et
 * couperait son contenu au premier redimensionnement.
 *
 * **2. Jamais de `linear`.** Les courbes viennent des tokens, lues dans le CSS
 * calculé : `--e-io` pour la hauteur (entrée-sortie, ce qu'on attend d'un
 * dépliage), `--e-soft` pour le contenu (décélération longue).
 *
 * **3. Interruptible.** Refermer une carte en cours d'ouverture doit repartir de
 * la hauteur courante, pas du début. D'où l'arrêt de l'animation précédente et
 * la mesure de la hauteur **réelle** au moment de l'inversion.
 *
 * On utilise `motion/mini` — l'`animate` bâti sur les Web Animations, deux
 * kilo-octets — parce que c'est tout ce dont on a besoin. Le moteur complet de
 * Motion apporterait springs, animations de layout et gestes : de quoi alourdir
 * chaque page pour des fonctionnalités qu'aucune de ces cartes n'utilise.
 */

const HEIGHT_MS = 620;
const CASCADE_MS = 500;
const CASCADE_START_MS = 140;
const CASCADE_STEP_MS = 80;
const CASCADE_TRAVEL_PX = 14;

export interface Animation {
  /** Résolue à la fin, qu'elle soit naturelle ou provoquée par `stop()`. */
  readonly finished: Promise<void>;
  /** Vrai si l'animation a été interrompue — donc si sa cible n'a pas été atteinte. */
  readonly wasStopped: () => boolean;
  stop(): void;
}

/**
 * jsdom n'implémente pas les Web Animations, et un très vieux navigateur non
 * plus. On ne dégrade alors pas l'expérience : on retire l'animation, et le
 * dépliage reste instantané et parfaitement fonctionnel.
 */
export function canAnimate(element: Element | null): element is HTMLElement {
  return element !== null && typeof (element as HTMLElement).animate === "function";
}

const SETTLED: Animation = {
  finished: Promise.resolve(),
  wasStopped: () => false,
  stop: () => {},
};

function run(
  element: HTMLElement,
  keyframes: Parameters<typeof animate>[1],
  options: Parameters<typeof animate>[2],
): Animation {
  const controls = animate(element, keyframes, options);
  let stopped = false;
  return {
    // `stop()` laisse la promesse de Motion en suspens : on la neutralise ici.
    finished: controls.then(
      () => {},
      () => {},
    ),
    wasStopped: () => stopped,
    stop: () => {
      stopped = true;
      controls.stop();
    },
  };
}

/** Déplie `wrap` de sa hauteur courante jusqu'à la hauteur naturelle de `body`. */
export function expandHeight(wrap: HTMLElement, body: HTMLElement): Animation {
  if (!canAnimate(wrap)) return SETTLED;

  const from = wrap.getBoundingClientRect().height;
  const animation = run(
    wrap,
    { height: [`${from}px`, `${body.scrollHeight}px`] },
    { duration: HEIGHT_MS / 1000, ease: readEasing("--e-io") },
  );

  void animation.finished.then(() => {
    /**
     * Uniquement si l'ouverture est allée au bout. Si une fermeture l'a
     * interrompue, rendre la hauteur à `auto` ferait sauter la carte à sa
     * taille pleine au milieu du repli.
     */
    if (!animation.wasStopped()) wrap.style.height = "";
  });

  return animation;
}

/** Replie `wrap` de sa hauteur courante jusqu'à zéro. */
export function collapseHeight(wrap: HTMLElement): Animation {
  if (!canAnimate(wrap)) return SETTLED;
  const from = wrap.getBoundingClientRect().height;
  return run(
    wrap,
    { height: [`${from}px`, "0px"] },
    { duration: HEIGHT_MS / 1000, ease: readEasing("--e-io") },
  );
}

/**
 * Le contenu entre en cascade derrière la hauteur.
 *
 * Le décalage de départ laisse la carte s'ouvrir avant que le texte n'arrive :
 * si les deux partaient ensemble, on lirait un texte qui bouge encore. Le pas
 * est volontairement court — trois colonnes à 80 ms, c'est perceptible sans
 * jamais faire attendre.
 */
export function cascadeIn(items: readonly HTMLElement[]): Animation[] {
  return items.filter(canAnimate).map((item, index) =>
    run(
      item,
      { opacity: [0, 1], transform: [`translateY(${CASCADE_TRAVEL_PX}px)`, "translateY(0px)"] },
      {
        duration: CASCADE_MS / 1000,
        delay: (CASCADE_START_MS + index * CASCADE_STEP_MS) / 1000,
        ease: readEasing("--e-soft"),
      },
    ),
  );
}
