"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import {
  cascadeIn,
  canAnimate,
  collapseHeight,
  expandHeight,
  type Animation,
} from "@/lib/effects/disclosure-animation";
import { prefersReducedMotion } from "@/lib/effects/reduced-motion";

/**
 * Une carte dépliante, bâtie **sur** `<details>` plutôt qu'à la place.
 *
 * Le problème classique : `<details>` coupe net: le navigateur masque son
 * contenu à l'instant où `open` passe à `false`, ce qui interdit toute
 * animation de fermeture. La solution est de dissocier deux choses que le
 * navigateur confond :
 *
 *   - `open` — le contenu est-il dans le flux ? Il doit rester vrai **pendant**
 *     la fermeture, jusqu'à ce que la hauteur atteigne zéro ;
 *   - l'état visuel — chevron, fond, numéro — qui bascule immédiatement, parce
 *     qu'un contrôle qui ne réagit pas au clic paraît cassé.
 *
 * D'où la petite machine à états ci-dessous. Elle a aussi le mérite de rendre
 * les états impossibles inatteignables : il n'existe pas de « fermé mais en
 * train de s'ouvrir ».
 *
 * Ce qui reste natif, et qu'on n'a donc pas à réécrire : le rôle ARIA,
 * `aria-expanded`, Entrée et Espace au clavier, la recherche dans la page sur
 * du contenu replié, et l'ouverture complète avant impression.
 */

type State = "closed" | "opening" | "open" | "closing";

const isVisuallyOpen = (state: State) => state === "opening" || state === "open";

export interface DisclosureProps {
  /** Le contenu du `<summary>` : titre, sous-titre, chevron. */
  readonly summary: ReactNode;
  readonly children: ReactNode;
  readonly defaultOpen?: boolean;
  readonly className?: string;
  readonly summaryClassName?: string;
  /** Rendu sur l'élément `<details>`, pour cibler un test. */
  readonly testId?: string;
}

export function Disclosure({
  summary,
  children,
  defaultOpen = false,
  className,
  summaryClassName,
  testId,
}: DisclosureProps) {
  const [state, setState] = useState<State>(defaultOpen ? "open" : "closed");

  const wrapRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const heightAnimation = useRef<Animation | null>(null);
  const cascadeAnimations = useRef<Animation[]>([]);
  /** Le premier rendu ne doit rien animer : `defaultOpen` est déjà à l'écran. */
  const mounted = useRef(false);
  /** L'état précédent décide d'où repart la hauteur — voir plus bas. */
  const previousState = useRef<State>(state);

  const stopAll = useCallback(() => {
    heightAnimation.current?.stop();
    heightAnimation.current = null;
    cascadeAnimations.current.forEach((animation) => animation.stop());
    cascadeAnimations.current = [];
    /**
     * Motion applique la valeur courante au style au moment de l'arrêt. Pour la
     * hauteur c'est exactement ce qu'on veut — c'est de là que repart
     * l'animation inverse. Pour la cascade, non : une opacité figée à 0,4
     * laisserait le texte à moitié effacé. On la rend au CSS.
     */
    bodyRef.current?.querySelectorAll<HTMLElement>("[data-cascade]").forEach((item) => {
      item.style.opacity = "";
      item.style.transform = "";
    });
  }, []);

  useLayoutEffect(() => {
    const previous = previousState.current;
    previousState.current = state;

    if (!mounted.current) {
      mounted.current = true;
      return;
    }

    const wrap = wrapRef.current;
    const body = bodyRef.current;
    if (!wrap || !body) return;

    const reduced = prefersReducedMotion() || !canAnimate(wrap);

    if (state === "opening") {
      stopAll();
      if (reduced) {
        wrap.style.height = "";
        setState("open");
        return;
      }
      /**
       * `<details>` vient de s'ouvrir : le contenu occupe déjà toute sa hauteur.
       * On la ramène à zéro avant de mesurer, dans un effet de *layout* — donc
       * avant le premier rendu à l'écran, sans clignotement.
       *
       * Si on interrompt une fermeture, en revanche, il ne faut surtout pas
       * repartir de zéro : l'arrêt de l'animation précédente a laissé la hauteur
       * courante en ligne, et c'est de là que le dépliage doit reprendre.
       */
      if (previous === "closed") wrap.style.height = "0px";
      const animation = expandHeight(wrap, body);
      heightAnimation.current = animation;
      cascadeAnimations.current = cascadeIn(
        Array.from(body.querySelectorAll<HTMLElement>("[data-cascade]")),
      );
      void animation.finished.then(() => {
        if (!animation.wasStopped()) setState("open");
      });
      return;
    }

    if (state === "closing") {
      stopAll();
      if (reduced) {
        wrap.style.height = "";
        setState("closed");
        return;
      }
      const animation = collapseHeight(wrap);
      heightAnimation.current = animation;
      void animation.finished.then(() => {
        if (animation.wasStopped()) return;
        // La hauteur en ligne disparaît : `<details>` reprend la main sur l'affichage.
        wrap.style.height = "";
        setState("closed");
      });
    }
  }, [state, stopAll]);

  useEffect(() => stopAll, [stopAll]);

  /**
   * On empêche la bascule native pour la piloter nous-mêmes. `<summary>`
   * transforme Entrée et Espace en `click`, donc le clavier passe par ici aussi
   * — sans un seul gestionnaire de touche à écrire.
   */
  const onSummaryClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setState((current) => (isVisuallyOpen(current) ? "closing" : "opening"));
  };

  return (
    <details
      className={className}
      data-open={isVisuallyOpen(state)}
      data-testid={testId}
      /**
       * Ouvert dès que l'état n'est pas « fermé » : c'est ce qui laisse le
       * contenu à l'écran pendant toute l'animation de fermeture.
       */
      open={state !== "closed"}
      /** Contrôlé par le clic : React exige un gestionnaire, le nôtre est ailleurs. */
      onToggle={() => {}}
    >
      <summary className={summaryClassName} onClick={onSummaryClick}>
        {summary}
      </summary>
      <div className="disclosure__wrap" ref={wrapRef}>
        <div ref={bodyRef}>{children}</div>
      </div>
    </details>
  );
}
