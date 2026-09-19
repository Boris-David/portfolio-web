import { parseRichText, type RichNode } from "@/content/rich-text";
import type { Markup } from "@/content/types";

/**
 * Renders the minimal editorial markup as React elements.
 *
 * No `dangerouslySetInnerHTML`: rendering never produces anything but text,
 * `<strong>` and `<code>`. Even if the content were one day to come from the
 * API — and it will — it could not inject a tag.
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

/** A paragraph of editorial content.
 *
 * ⚠️ It carries `prose`, and that class is what gets justified — not `p`.
 *
 * Justifying every paragraph was the first version and it caught the wrong
 * ones: a metric's caption is three words in a narrow column, and justified it
 * came out as "d'utilisateurs des applications aux-quelles j'ai contribué",
 * with a hyphen break and stretched spacing, to fill a line nobody asked to be
 * full. Prose is a thing a text **is**, not a tag it uses. */
export function RichParagraph({
  value,
  className,
}: {
  readonly value: Markup;
  readonly className?: string;
}) {
  return (
    <p className={className ? `prose ${className}` : "prose"}>
      <RichText value={value} />
    </p>
  );
}
