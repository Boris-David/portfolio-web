/**
 * Un balisage volontairement minuscule pour le contenu éditorial.
 *
 * Le contenu a besoin de deux emphases, et de deux seulement : du **gras** pour
 * le fait qu'un recruteur doit voir en trois secondes, et du `code` pour les
 * termes techniques. Trois façons de le porter étaient possibles :
 *
 *   - du HTML injecté via `dangerouslySetInnerHTML` — ce que faisait la maquette.
 *     Écarté : sur un dépôt public, une surface d'injection ouverte pour deux
 *     balises est un signal qu'on ne veut pas envoyer, et elle deviendra
 *     réellement dangereuse le jour où le contenu viendra de l'API ;
 *   - un arbre de nœuds écrit à la main dans les fichiers de contenu. Sûr, mais
 *     illisible à l'écriture — et un contenu pénible à écrire finit mal écrit ;
 *   - **ce balisage**, analysé vers des nœuds typés. Le contenu reste une
 *     chaîne — donc sérialisable tel quel par l'API le jour venu — et le rendu
 *     ne produit jamais que du texte et deux éléments connus.
 *
 * Pas de nesting : `**un `code` en gras**` n'existe pas, parce qu'aucun texte du
 * portfolio n'en a besoin et qu'une grammaire qu'on n'utilise pas est une
 * grammaire qu'on maintient pour rien.
 */

export type RichNode =
  | { readonly kind: "text"; readonly value: string }
  | { readonly kind: "strong"; readonly value: string }
  | { readonly kind: "code"; readonly value: string };

/** `**gras**` ou `` `code` ``, non imbriqués, le reste est du texte. */
const TOKEN = /\*\*([^*]+)\*\*|`([^`]+)`/g;

export function parseRichText(source: string): readonly RichNode[] {
  const nodes: RichNode[] = [];
  let cursor = 0;

  for (const match of source.matchAll(TOKEN)) {
    const start = match.index;
    if (start > cursor) {
      nodes.push({ kind: "text", value: source.slice(cursor, start) });
    }
    const [raw, strong, code] = match;
    nodes.push(
      strong === undefined
        ? { kind: "code", value: code as string }
        : { kind: "strong", value: strong },
    );
    cursor = start + raw.length;
  }

  if (cursor < source.length) {
    nodes.push({ kind: "text", value: source.slice(cursor) });
  }
  return nodes;
}

/**
 * Le même texte, sans balisage — pour les endroits qui n'acceptent pas de
 * balise : `alt`, `aria-label`, `<title>`, Open Graph.
 */
export function plainText(source: string): string {
  return parseRichText(source)
    .map((node) => node.value)
    .join("");
}
