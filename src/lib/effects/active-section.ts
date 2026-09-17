/**
 * Le lien de navigation de la section qu'on lit se souligne.
 *
 * `aria-current` plutôt qu'une simple classe : l'information « vous êtes ici »
 * est une information, pas une décoration, et un lecteur d'écran doit pouvoir
 * l'annoncer. La classe suit l'attribut, jamais l'inverse.
 *
 * Cet effet n'est jamais actif en `prefers-reduced-motion` ? Si — et c'est
 * voulu. Il ne bouge rien : il change un état. Une préférence de mouvement ne
 * doit pas retirer une information.
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
     * La bande active est une tranche au milieu de l'écran. Prendre toute la
     * fenêtre ferait clignoter deux liens dès que deux sections s'y croisent.
     */
    { rootMargin: "-45% 0px -50% 0px" },
  );

  sections.forEach((section) => observer.observe(section));
  return () => observer.disconnect();
}
