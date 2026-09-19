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

  /**
   * Which sections are in the band right now.
   *
   * ⚠️ The first version only ever **added** the mark: it looped over the
   * entries, skipped the ones that had left, and set `aria-current` on the one
   * that had arrived. So nothing ever cleared it — landing on the page
   * underlined the first link before the reader had scrolled anywhere near it,
   * and it stayed underlined until another section took over.
   *
   * "You are here" has to be able to say **nowhere**: at the top of the page,
   * the reader is in the header, which is not a section.
   */
  const inBand = new Set<string>();

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) inBand.add(entry.target.id);
        else inBand.delete(entry.target.id);
      }

      for (const link of links) link.removeAttribute("aria-current");
      // The topmost of them, in document order: two sections can share the
      // band on a short screen, and the one being read is the one above.
      const current = sections.find((section) => inBand.has(section.id));
      if (!current) return;
      links
        .find((link) => link.getAttribute("href") === `#${current.id}`)
        ?.setAttribute("aria-current", "true");
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
