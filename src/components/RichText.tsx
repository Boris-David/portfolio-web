import { parseRichText, type RichNode } from "@/content/rich-text";
import type { Markup } from "@/content/types";

/**
 * Rend le balisage éditorial minimal en éléments React.
 *
 * Aucun `dangerouslySetInnerHTML` : le rendu ne produit jamais que du texte,
 * `<strong>` et `<code>`. Même si le contenu venait un jour de l'API — et il
 * viendra — il ne pourrait pas injecter de balise.
 */

function renderNode(node: RichNode, index: number) {
  switch (node.kind) {
    case "strong":
      return <strong key={index}>{node.value}</strong>;
    case "code":
      return <code key={index}>{node.value}</code>;
    default:
      return node.value;
  }
}

export function RichText({ value }: { readonly value: Markup }) {
  return <>{parseRichText(value).map(renderNode)}</>;
}

/** Un paragraphe de contenu éditorial. */
export function RichParagraph({
  value,
  className,
}: {
  readonly value: Markup;
  readonly className?: string;
}) {
  return (
    <p className={className}>
      <RichText value={value} />
    </p>
  );
}
