/**
 * The nav link of the section being read gets underlined.
 *
 * `aria-current` rather than a plain class: "you are here" is information, not
 * decoration, and a screen reader must be able to announce it. The class
 * follows the attribute, never the other way round.
 *
 * Is this effect never active under `prefers-reduced-motion`? It is — and
 * deliberately so. It moves nothing: it changes a state. A motion preference
 * must not take information away.
 */

export function setupActiveSection({ root = document }: { root?: Document } = {}): () => void {
  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>("[data-nav-link]"));
  if (links.length === 0 || typeof IntersectionObserver === "undefined") return () => {};

  const sections = links
    .map((link) => {
      const id = link.getAttribute("href")?.replace("#", "");
      return id ? root.getElementById(id) : null;
    })
    .filter((section): section is HTMLElement => section !== null);

  if (sections.length === 0) return () => {};

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of links) link.removeAttribute("aria-current");
        const active = links.find((link) => link.getAttribute("href") === `#${entry.target.id}`);
        active?.setAttribute("aria-current", "true");
      }
    },
    /**
     * The active band is a slice in the middle of the screen. Taking the whole
     * viewport would make two links flicker as soon as two sections overlap in
     * it.
     */
    { rootMargin: "-45% 0px -50% 0px" },
  );

  sections.forEach((section) => observer.observe(section));
  return () => observer.disconnect();
}
