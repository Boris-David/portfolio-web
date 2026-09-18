/**
 * A deliberately tiny markup for the editorial content.
 *
 * The content needs two emphases, and two only: **bold** for the fact a
 * recruiter has to see in three seconds, and `code` for technical terms. Three
 * ways of carrying that were possible:
 *
 *   - HTML injected through `dangerouslySetInnerHTML` — what the mockup did.
 *     Ruled out: on a public repository, an injection surface left open for two
 *     tags is a signal we do not want to send, and it would become genuinely
 *     dangerous the day the content came from the API;
 *   - a node tree written by hand in the content files. Safe, but unreadable to
 *     write — and content that is painful to write ends up badly written;
 *   - **this markup**, parsed into typed nodes. The content stays a string — so
 *     serialisable as is by the API when the day comes — and rendering never
 *     produces anything but text and two known elements.
 *
 * No nesting: ``**some `code` in bold**`` does not exist, because no text in the
 * portfolio needs it and a grammar we do not use is a grammar we maintain for
 * nothing.
 */

export type RichNode =
  | { readonly kind: "text"; readonly value: string }
  | { readonly kind: "strong"; readonly value: string }
  | { readonly kind: "code"; readonly value: string };

/** `**bold**` or `` `code` ``, not nested; everything else is text. */
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
 * The same text with the markup removed — for the places that accept no tag:
 * `alt`, `aria-label`, `<title>`, Open Graph.
 */
export function plainText(source: string): string {
  return parseRichText(source)
    .map((node) => node.value)
    .join("");
}
