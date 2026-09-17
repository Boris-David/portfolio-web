/**
 * `prefers-reduced-motion` n'est pas une préférence esthétique : pour une partie
 * des utilisateurs, une animation de parallaxe ou un fondu insistant déclenche
 * un vrai malaise vestibulaire.
 *
 * On ne « réduit » donc pas les animations, on les **supprime**. Et on écoute le
 * changement : la préférence peut basculer pendant la session, et une page qui
 * ne la relit jamais continuerait d'animer après coup.
 */

const QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(QUERY).matches;
}

/** Appelle `onChange` à chaque bascule, et rend la fonction de désabonnement. */
export function watchReducedMotion(onChange: (reduced: boolean) => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const media = window.matchMedia(QUERY);
  const handler = (event: MediaQueryListEvent) => onChange(event.matches);
  media.addEventListener("change", handler);
  return () => media.removeEventListener("change", handler);
}
