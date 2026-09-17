import { prefersReducedMotion } from "./reduced-motion";

/**
 * Les apparitions au défilement, posées en **une seule passe** sur tout le
 * document.
 *
 * Pourquoi un observateur unique plutôt qu'un composant client par bloc : les
 * quinze sections de la page restent des composants serveur. Rien de leur
 * balisage ne descend dans le bundle — seule cette couche d'amélioration le
 * fait, et elle tient en quelques centaines d'octets.
 *
 * L'attribut `data-reveal` est rendu par le serveur ; la feuille de style ne le
 * cache que sous `html.js`. Sans JavaScript, il ne se passe donc rien du tout —
 * ce qui est le comportement voulu, pas un repli dégradé.
 */

/** Le décalage maximal : au-delà, une apparition retarde la lecture. */
const MAX_REVEAL_DELAY_MS = 280;
const MAX_STAGGER_DELAY_MS = 620;
const STAGGER_STEP_MS = 42;

export interface RevealOptions {
  readonly root?: ParentNode;
}

function markAllVisible(elements: Iterable<Element>, attribute: string) {
  for (const element of elements) element.setAttribute(attribute, "in");
}

/**
 * @returns la fonction de nettoyage, à appeler au démontage.
 */
export function setupReveal({ root = document }: RevealOptions = {}): () => void {
  const revealed = root.querySelectorAll<HTMLElement>("[data-reveal]");
  const staggered = root.querySelectorAll<HTMLElement>("[data-stagger]");

  /**
   * Sans `IntersectionObserver` — ou quand le mouvement est refusé — tout
   * s'affiche immédiatement. L'absence d'animation ne doit jamais se traduire
   * par une absence de contenu.
   */
  if (typeof IntersectionObserver === "undefined" || prefersReducedMotion()) {
    markAllVisible(revealed, "data-reveal");
    markAllVisible(staggered, "data-stagger");
    return () => {};
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry, index) => {
        if (!entry.isIntersecting) return;
        const element = entry.target as HTMLElement;
        element.style.transitionDelay = `${Math.min(index * 70, MAX_REVEAL_DELAY_MS)}ms`;
        element.setAttribute("data-reveal", "in");
        observer.unobserve(element);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
  );

  const staggerObserver = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const container = entry.target as HTMLElement;
        Array.from(container.children).forEach((child, index) => {
          (child as HTMLElement).style.transitionDelay =
            `${Math.min(index * STAGGER_STEP_MS, MAX_STAGGER_DELAY_MS)}ms`;
        });
        container.setAttribute("data-stagger", "in");
        observer.unobserve(container);
      }
    },
    { rootMargin: "0px 0px -6% 0px", threshold: 0.04 },
  );

  revealed.forEach((element) => revealObserver.observe(element));
  staggered.forEach((element) => staggerObserver.observe(element));

  return () => {
    revealObserver.disconnect();
    staggerObserver.disconnect();
  };
}
