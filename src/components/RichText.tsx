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

/** A paragraph of editorial content. */
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
