/**
 * `prefers-reduced-motion` is not an aesthetic preference: for some users, a
 * parallax animation or an insistent fade triggers real vestibular discomfort.
 *
 * So we do not "reduce" animations, we **remove** them. And we listen for
 * changes: the preference can flip during the session, and a page that never
 * reads it again would keep animating afterwards.
 */

const QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(QUERY).matches;
}

/** Calls `onChange` on every flip, and returns the unsubscribe function. */
export function watchReducedMotion(onChange: (reduced: boolean) => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const media = window.matchMedia(QUERY);
  const handler = (event: MediaQueryListEvent) => onChange(event.matches);
  media.addEventListener("change", handler);
  return () => media.removeEventListener("change", handler);
}
