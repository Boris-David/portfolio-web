import { prefersReducedMotion } from "./reduced-motion";

/**
 * The scroll reveals, wired up in **a single pass** over the whole document.
 *
 * Why one observer rather than a client component per block: the page's fifteen
 * sections stay server components. None of their markup goes down into the
 * bundle — only this enhancement layer does, and it fits in a few hundred bytes.
 *
 * The `data-reveal` attribute is rendered by the server; the stylesheet only
 * hides it under `html.js`. Without JavaScript, therefore, nothing happens at
 * all — which is the intended behaviour, not a degraded fallback.
 */

/** The maximum delay: beyond it, a reveal holds up reading. */
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
 * @returns the cleanup function, to be called on unmount.
 */
export function setupReveal({ root = document }: RevealOptions = {}): () => void {
  const revealed = root.querySelectorAll<HTMLElement>("[data-reveal]");
  const staggered = root.querySelectorAll<HTMLElement>("[data-stagger]");

  /**
   * Without `IntersectionObserver` — or when motion is declined — everything
   * shows immediately. The absence of an animation must never translate into
   * the absence of content.
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
