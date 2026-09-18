import type { Markup } from "@/content/types";
import { parseRichText, type RichNode } from "@/content/rich-text";
import { ContentShapeError, type Field } from "@/content/api/field";

/**
 * The API's rich text, brought back to the site's markup.
 *
 * The API serves typed spans — `{ text, style }` — where the site handles
 * `**marked-up**` strings. The conversion is trivial; what is not trivial is
 * that it be **lossless**.
 *
 * The markup has no escaping: that is a deliberate choice in `rich-text.ts`, a
 * tiny grammar for two emphases. A span whose text itself contained `**` or a
 * backtick would therefore produce wrong markup — and that wrongness would go
 * unnoticed, because it would still be a perfectly valid string.
 *
 * Hence the guard: we serialise, **we read it back with the site's parser**, and
 * we compare against the starting point. A conversion that would lose something
 * breaks the build instead of publishing a mangled sentence.
 */

const STYLES = ["plain", "strong", "code"] as const;
type Style = (typeof STYLES)[number];

interface Span {
  readonly text: string;
  readonly style: Style;
}

/** A run of spans — `profile.summary[0]`, a paragraph's text… */
export function readMarkup(field: Field): Markup {
  const spans = field.list().map(readSpan);
  const markup = spans.map(serialize).join("");
  assertLossless(markup, spans, field.path);
  return markup;
}

function readSpan(field: Field): Span {
  return {
    text: field.child("text").text(),
    style: field.child("style").oneOf(STYLES),
  };
}

function serialize({ text, style }: Span): string {
  switch (style) {
    case "strong":
      return `**${text}**`;
    case "code":
      return `\`${text}\``;
    case "plain":
      return text;
  }
}

/**
 * Reads the produced markup back and checks that it yields exactly the spans we
 * started from. Adjacent spans of the same style are merged on both sides: the
 * parser produces a single text node where the API may send two consecutive
 * `plain` spans, and that particular difference is not a loss.
 */
function assertLossless(markup: Markup, spans: readonly Span[], path: string): void {
  const expected = merge(spans);
  const actual = merge(parseRichText(markup).map(fromNode));

  if (expected.length !== actual.length) {
    throw new ContentShapeError(path, roundTripMessage(expected, actual), markup);
  }
  for (const [index, span] of expected.entries()) {
    const other = actual[index] as Span;
    if (span.text !== other.text || span.style !== other.style) {
      throw new ContentShapeError(path, roundTripMessage(expected, actual), markup);
    }
  }
}

function roundTripMessage(expected: readonly Span[], actual: readonly Span[]): string {
  return (
    "text convertible to the site's markup without loss — " +
    `${expected.length} span(s) on the way out, ${actual.length} on the way back. ` +
    "A span probably contains “**” or a backtick, " +
    "which the markup cannot escape"
  );
}

function fromNode(node: RichNode): Span {
  return { text: node.value, style: node.kind === "text" ? "plain" : node.kind };
}

function merge(spans: readonly Span[]): readonly Span[] {
  const merged: Span[] = [];
  for (const span of spans) {
    if (span.text === "") continue;
    const last = merged.at(-1);
    if (last !== undefined && last.style === span.style) {
      merged[merged.length - 1] = { style: last.style, text: last.text + span.text };
      continue;
    }
    merged.push(span);
  }
  return merged;
}
