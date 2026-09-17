import type { Markup } from "@/content/types";
import { parseRichText, type RichNode } from "@/content/rich-text";
import { ContentShapeError, type Field } from "@/content/api/field";

/**
 * Le texte riche de l'API, ramené au balisage du site.
 *
 * L'API sert des segments typés — `{ text, style }` — là où le site manipule
 * des chaînes `**balisées**`. La conversion est triviale ; ce qui ne l'est pas,
 * c'est qu'elle soit **sans perte**.
 *
 * Le balisage n'a pas d'échappement : c'est un choix assumé de `rich-text.ts`,
 * une grammaire minuscule pour deux emphases. Un segment dont le texte
 * contiendrait lui-même `**` ou une accolade inverse produirait donc un
 * balisage faux — et ce faux passerait inaperçu, parce qu'il resterait une
 * chaîne parfaitement valide.
 *
 * D'où la garde : on sérialise, **on relit avec l'analyseur du site**, et on
 * compare au point de départ. Une conversion qui perdrait quelque chose casse
 * la construction au lieu de publier une phrase déformée.
 */

const STYLES = ["plain", "strong", "code"] as const;
type Style = (typeof STYLES)[number];

interface Span {
  readonly text: string;
  readonly style: Style;
}

/** Une suite de segments — `profile.summary[0]`, le texte d'un paragraphe… */
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
 * Relit le balisage produit et vérifie qu'il redonne exactement les segments
 * de départ. Les segments voisins de même style sont fusionnés des deux côtés :
 * l'analyseur produit un seul nœud de texte là où l'API peut envoyer deux
 * segments `plain` consécutifs, et cette différence-là n'est pas une perte.
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
    "un texte convertible sans perte vers le balisage du site — " +
    `${expected.length} segment(s) à l'aller, ${actual.length} au retour. ` +
    "Un segment contient probablement « ** » ou une accolade inverse, " +
    "que le balisage ne sait pas échapper"
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
